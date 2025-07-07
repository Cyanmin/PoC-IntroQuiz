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
    player_name = data.get('playerName')
    connection_id = event['requestContext']['connectionId']

    # PlayerTableに登録
    player_table.put_item(
        Item={
            'roomId': room_id,
            'playerId': player_id,
            'playerName': player_name,
            'connectionId': connection_id,
            'score': 0,
        }
    )

    # ルーム内全プレイヤー取得
    resp = player_table.query(
        KeyConditionExpression=Key('roomId').eq(room_id)
    )
    players = resp.get('Items', [])
    player_list = [p['playerName'] for p in players if 'playerName' in p]

    # 全員にplayerListUpdate送信
    for p in players:
        if 'connectionId' in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p['connectionId'],
                    Data=json.dumps({'type': 'playerListUpdate', 'players': player_list}).encode('utf-8')
                )
            except Exception:
                pass

    # 送信元にjoinRoomResult返却
    res = {
        'type': 'joinRoomResult',
        'status': 'ok',
        'playerList': player_list,
    }
    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(res).encode('utf-8')
    )
    return {'statusCode': 200, 'body': 'ok'}
