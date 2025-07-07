import os
import boto3
import json
import requests
from boto3.dynamodb.conditions import Key

# 簡易な正誤判定（完全一致 or 部分一致）
def is_correct(answer, correct):
    if not answer or not correct:
        return False
    answer = answer.strip().lower()
    correct = correct.strip().lower()
    return answer == correct or answer in correct or correct in answer

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(os.environ['ROOM_TABLE'])
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])
YOUTUBE_API_KEY = os.environ['YOUTUBE_API_KEY']


def fetch_video_title(video_id: str) -> str:
    """Fetch a single video's title via YouTube Data API."""
    params = {
        'part': 'snippet',
        'id': video_id,
        'key': YOUTUBE_API_KEY,
    }
    try:
        resp = requests.get('https://www.googleapis.com/youtube/v3/videos', params=params)
        data = resp.json()
        return data.get('items', [{}])[0].get('snippet', {}).get('title', '')
    except Exception:
        return ''

def handler(event, context):
    body = event.get('body')
    data = json.loads(body) if isinstance(body, str) else body
    room_id = data.get('roomId')
    player_id = data.get('playerId')
    answer_text = data.get('answer')
    question_index = data.get('questionIndex', 0)
    connection_id = event['requestContext']['connectionId']

    # RoomTableから正解情報取得
    room_resp = room_table.get_item(Key={'roomId': room_id})
    room = room_resp.get('Item')
    video_ids = room.get('videoIds', [])
    video_titles = room.get('videoTitles', [])  # 事前にvideoTitlesを保存しておく想定
    if question_index >= len(video_ids):
        return {'statusCode': 400, 'body': 'Invalid question index'}

    if question_index < len(video_titles):
        correct_title = video_titles[question_index]
    else:
        # Fallback when titles were not stored
        correct_title = fetch_video_title(video_ids[question_index])

    # 正誤判定
    correct = is_correct(answer_text, correct_title)

    # スコア加算（正解時）
    if correct:
        player_table.update_item(
            Key={'roomId': room_id, 'playerId': player_id},
            UpdateExpression='ADD score :s',
            ExpressionAttributeValues={':s': 1}
        )

    # 全員取得
    resp = player_table.query(KeyConditionExpression=Key('roomId').eq(room_id))
    players = resp.get('Items', [])

    # 全員にanswerResult通知
    result_msg = {
        'type': 'answerResult',
        'result': 'correct' if correct else 'incorrect',
        'playerId': player_id,
        'answerText': answer_text,
        'videoTitle': correct_title,
    }
    for p in players:
        if 'connectionId' in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p['connectionId'],
                    Data=json.dumps(result_msg).encode('utf-8')
                )
            except Exception:
                pass

    # 不正解時、他buzz済みプレイヤーにbuzzAccepted
    if not correct:
        buzzed = [p for p in players if p['playerId'] != player_id and p.get('elapsed') is not None]
        if buzzed:
            next_buzzer = min(buzzed, key=lambda p: p['elapsed'])
            try:
                apigw.post_to_connection(
                    ConnectionId=next_buzzer['connectionId'],
                    Data=json.dumps({'type': 'buzzAccepted', 'questionIndex': question_index}).encode('utf-8')
                )
            except Exception:
                pass

    return {'statusCode': 200, 'body': 'ok'}
