import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")
player_table = dynamodb.Table(os.environ["PLAYER_TABLE"])


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    body = json.loads(event.get("body", "{}"))
    elapsed = body.get("elapsed")

    if elapsed is None:
        return {"statusCode": 400, "body": "Missing elapsed"}

    resp = player_table.query(
        IndexName="connectionId-index",
        KeyConditionExpression=Key("connectionId").eq(connection_id),
    )
    items = resp.get("Items", [])
    if not items:
        return {"statusCode": 404, "body": "Player not found"}

    player = items[0]
    key = {"roomId": player["roomId"], "playerId": player["playerId"]}

    try:
        player_table.update_item(
            Key=key,
            UpdateExpression="SET #el = :el",
            ConditionExpression="attribute_not_exists(#el)",
            ExpressionAttributeNames={"#el": "elapsed"},
            ExpressionAttributeValues={":el": elapsed},
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise
        # already recorded
    return {"statusCode": 200, "body": ""}
