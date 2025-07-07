import os
import boto3
import json
from boto3.dynamodb.conditions import Key
from handlers.broadcast_player_list import broadcast_player_list

dynamodb = boto3.resource("dynamodb")
player_table = dynamodb.Table(os.environ["PLAYER_TABLE"])
apigw = boto3.client("apigatewaymanagementapi", endpoint_url=os.environ["WS_ENDPOINT"])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']

    # connectionId から player を検索
    resp = player_table.query(
        IndexName='connectionId-index',
        KeyConditionExpression=Key('connectionId').eq(connection_id)
    )
    items = resp.get('Items', [])
    if not items:
        return {'statusCode': 200, 'body': 'Player not found'}

    item = items[0]
    room_id = item['roomId']

    # プレイヤー削除
    player_table.delete_item(
        Key={'roomId': room_id, 'playerId': item['playerId']}
    )

    # 全員へ最新のプレイヤー一覧を通知
    broadcast_player_list(room_id)

    return {"statusCode": 200, "body": "Disconnected"}
