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
    player_id = data.get('playerId')
    elapsed = data.get('elapsed')
    question_index = data.get('questionIndex', 0)
    connection_id = event['requestContext']['connectionId']

    # すでにbuzz済みかチェック
    resp = player_table.query(KeyConditionExpression=Key('roomId').eq(room_id))
    players = resp.get('Items', [])
    already_buzzed = any('elapsed' in p and p['elapsed'] is not None for p in players)
    if already_buzzed:
        # 既にbuzz済みなら何もしない
        return {'statusCode': 200, 'body': 'Already buzzed'}

    # buzz記録
    player_table.update_item(
        Key={'roomId': room_id, 'playerId': player_id},
        UpdateExpression='SET elapsed = :e',
        ExpressionAttributeValues={':e': elapsed}
    )

    # 再取得して最小elapsedを決定
    resp = player_table.query(KeyConditionExpression=Key('roomId').eq(room_id))
    players = resp.get('Items', [])
    buzzed = [p for p in players if 'elapsed' in p and p['elapsed'] is not None]
    if not buzzed:
        return {'statusCode': 200, 'body': 'No buzzed players'}
    winner = min(buzzed, key=lambda p: p['elapsed'])

    # 通過者にbuzzAccepted
    try:
        apigw.post_to_connection(
            ConnectionId=winner['connectionId'],
            Data=json.dumps({'type': 'buzzAccepted', 'questionIndex': question_index}).encode('utf-8')
        )
    except Exception:
        pass

    # 他のプレイヤーにbuzzResult
    for p in players:
        if p['playerId'] != winner['playerId'] and 'connectionId' in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p['connectionId'],
                    Data=json.dumps({'type': 'buzzResult', 'playerId': winner['playerId']}).encode('utf-8')
                )
            except Exception:
                pass

    return {'statusCode': 200, 'body': 'ok'}
