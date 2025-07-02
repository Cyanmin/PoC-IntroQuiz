import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
player_table = dynamodb.Table(os.environ["PLAYER_TABLE"])


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    resp = player_table.query(
        IndexName="connectionId-index",
        KeyConditionExpression=Key("connectionId").eq(connection_id),
    )
    items = resp.get("Items", [])
    if not items:
        return {"statusCode": 200, "body": "Player not found"}

    item = items[0]
    player_table.delete_item(
        Key={"roomId": item["roomId"], "playerId": item["playerId"]}
    )
    # Future: update state instead of delete for reconnection support
    return {"statusCode": 200, "body": "Disconnected"}
