import boto3
import os
import json
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']
    body = json.loads(event['body'])

    room_id = body.get('roomId')
    player_id = body.get('playerId')

    if not room_id or not player_id:
        return {
            'statusCode': 400,
            'body': 'Missing roomId or playerId'
        }

    # connectionId に対応する既存レコード取得
    resp = player_table.scan(
        FilterExpression=Attr('connectionId').eq(connection_id)
    )
    items = resp.get('Items', [])

    if not items:
        return {
            'statusCode': 404,
            'body': 'connectionId not found'
        }

    old_item = items[0]
    old_room_id = old_item['roomId']
    old_player_id = old_item['playerId']

    # 元のレコード削除
    player_table.delete_item(
        Key={
            'roomId': old_room_id,
            'playerId': old_player_id
        }
    )

    # 新しい主キーで再登録
    player_table.put_item(
        Item={
            'roomId': room_id,
            'playerId': player_id,
            'connectionId': connection_id,
            'elapsed': None,
            'score': 0,
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'type': 'joinRoomAck',
            'roomId': room_id,
            'playerId': player_id
        })
    }
