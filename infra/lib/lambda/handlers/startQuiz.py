import os
import boto3
import json
from boto3.dynamodb.conditions import Key

# DynamoDB, API Gateway管理クライアント

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(os.environ['ROOM_TABLE'])
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])

def handler(event, context):
    body = event.get('body')
    data = json.loads(body) if isinstance(body, str) else body
    room_id = data.get('roomId')
    connection_id = event['requestContext']['connectionId']

    # RoomTableからvideoIds取得
    room_resp = room_table.get_item(Key={'roomId': room_id})
    room = room_resp.get('Item')
    if not room or 'videoIds' not in room:
        res = {'type': 'startQuizResult', 'status': 'error', 'message': 'No playlist set'}
        apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
        return {'statusCode': 400, 'body': 'No playlist set'}

    video_ids = room['videoIds']
    if not video_ids:
        res = {'type': 'startQuizResult', 'status': 'error', 'message': 'No videos found'}
        apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
        return {'statusCode': 400, 'body': 'No videos found'}

    # currentIndex（未指定なら0）
    current_index = room.get('currentIndex', 0)
    if current_index >= len(video_ids):
        current_index = 0
    video_id = video_ids[current_index]

    # 全プレイヤー取得
    resp = player_table.query(KeyConditionExpression=Key('roomId').eq(room_id))
    players = resp.get('Items', [])

    # 各プレイヤーのelapsedをリセットしstartQuiz送信
    for p in players:
        player_table.update_item(
            Key={'roomId': room_id, 'playerId': p['playerId']},
            UpdateExpression='SET elapsed = :e',
            ExpressionAttributeValues={':e': None}
        )
        if 'connectionId' in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p['connectionId'],
                    Data=json.dumps({
                        'type': 'startQuiz',
                        'videoId': video_id,
                        'questionIndex': current_index
                    }).encode('utf-8')
                )
            except Exception:
                pass

    # RoomTableにcurrentIndex保存（次の問題を指すよう+1）
    next_index = current_index + 1
    if next_index >= len(video_ids):
        next_index = 0
    room_table.update_item(
        Key={'roomId': room_id},
        UpdateExpression='SET currentIndex = :idx',
        ExpressionAttributeValues={':idx': next_index}
    )

    return {'statusCode': 200, 'body': 'ok'}
