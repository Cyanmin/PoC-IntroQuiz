import boto3
import os
import uuid

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])

def handler(event, context):
    connection_id = event['requestContext']['connectionId']

    # 仮の roomId/playerId を生成（あとで joinRoom で更新される前提）
    temp_room_id = f"pending-{str(uuid.uuid4())}"
    temp_player_id = f"conn-{connection_id[:8]}"

    player_table.put_item(
        Item={
            'connectionId': connection_id,
            'roomId': temp_room_id,
            'playerId': temp_player_id,
            'elapsed': None,
            'score': 0,
        }
    )

    return {
        "statusCode": 200,
        "body": "Connected"
    }
