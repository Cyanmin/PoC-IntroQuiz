import os
import boto3
import json

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(os.environ['ROOM_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])

def handler(event, context):
    body = event.get('body')
    data = json.loads(body) if isinstance(body, str) else body
    room_id = data.get('roomId')
    room_name = data.get('roomName')
    connection_id = event['requestContext']['connectionId']

    # RoomTableに新規作成
    room_table.put_item(
        Item={
            'roomId': room_id,
            'roomName': room_name,
            'state': 'waiting',
        }
    )

    # 結果を送信元に返す
    res = {
        'type': 'createRoomResult',
        'status': 'ok',
        'roomId': room_id,
        'roomName': room_name,
    }
    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(res).encode('utf-8')
    )
    return {'statusCode': 200, 'body': 'ok'}
