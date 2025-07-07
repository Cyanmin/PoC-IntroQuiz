import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
player_table = dynamodb.Table(os.environ["PLAYER_TABLE"])
apigw = boto3.client("apigatewaymanagementapi", endpoint_url=os.environ["WS_ENDPOINT"])

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
    # プレイヤー削除
    player_table.delete_item(
        Key={"roomId": item["roomId"], "playerId": item["playerId"]}
    )

    # 残存プレイヤー取得
    resp = player_table.query(
        KeyConditionExpression=Key("roomId").eq(item["roomId"])
    )
    players = [p["playerName"] for p in resp.get("Items", []) if "playerName" in p]
    # 各connectionIdにplayerListUpdate送信
    for p in resp.get("Items", []):
        if "connectionId" in p:
            try:
                apigw.post_to_connection(
                    ConnectionId=p["connectionId"],
                    Data=json.dumps({"type": "playerListUpdate", "players": players}).encode("utf-8")
                )
            except Exception as e:
                # 切断済みなどで送信失敗した場合は無視
                pass

    return {"statusCode": 200, "body": "Disconnected"}
