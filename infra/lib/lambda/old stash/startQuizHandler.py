import boto3
import os
import json
import time
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
room_table = dynamodb.Table(os.environ["ROOM_TABLE"])
player_table = dynamodb.Table(os.environ["PLAYER_TABLE"])


def handler(event, context):
    """Handle startQuiz WebSocket event."""

    body = json.loads(event.get("body", "{}"))
    room_id = body.get("roomId")

    if not room_id:
        return {"statusCode": 400, "body": "Missing roomId"}

    start_ts = int(time.time() * 1000)

    # Update the room with start timestamp and state
    room_table.update_item(
        Key={"roomId": room_id},
        UpdateExpression="SET #st = :st, #state = :state",
        ExpressionAttributeNames={"#st": "startTimestamp", "#state": "state"},
        ExpressionAttributeValues={":st": start_ts, ":state": "playing"},
    )

    # Retrieve connectionIds of all players in the room
    resp = player_table.query(KeyConditionExpression=Key("roomId").eq(room_id))
    connection_ids = [item["connectionId"] for item in resp.get("Items", [])]

    endpoint = f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}"
    apigw = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)

    message = json.dumps({"type": "quizStarted", "startTimestamp": start_ts}).encode("utf-8")

    for cid in connection_ids:
        try:
            apigw.post_to_connection(ConnectionId=cid, Data=message)
        except Exception:
            # Ignore errors from stale connections
            pass

    return {"statusCode": 200, "body": ""}

