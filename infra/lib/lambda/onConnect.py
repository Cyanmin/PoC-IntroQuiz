import boto3
import os

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])

def handler(event, context):
    # 必要であれば、接続 ID をログ出力
    connection_id = event['requestContext']['connectionId']

    # DynamoDB にプレイヤー仮登録
    player_table.put_item(
        Item={
            'connectionId': connection_id,
            'roomId' : '', # 未設定状態で仮登録
            'playerId': '',
            'elapsed': None,
            'score': 0,
        }
    )

    return {
        "statusCode": 200,
        "body": "Connected"
    }
