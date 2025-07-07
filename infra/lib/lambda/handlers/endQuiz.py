import os
import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])

def handler(event, context):
    body = event.get('body')
    data = json.loads(body) if isinstance(body, str) else body
    room_id = data.get('roomId')

    # 全プレイヤー取得
    resp = player_table.query(KeyConditionExpression=Key('roomId').eq(room_id))
    players = resp.get('Items', [])
    rankings = [
        {'playerName': p.get('playerName', ''), 'score': int(p.get('score', 0))}
        for p in players
    ]
    rankings.sort(key=lambda x: x['score'], reverse=True)

    # 全員にquizEnded送信
    for p in players:
        if 'connectionId' in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p['connectionId'],
                    Data=json.dumps({'type': 'quizEnded', 'rankings': rankings}).encode('utf-8')
                )
            except Exception:
                pass

    return {'statusCode': 200, 'body': 'ok'}
