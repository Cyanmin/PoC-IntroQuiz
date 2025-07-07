import os
import json
import boto3
from boto3.dynamodb.conditions import Key

# テーブルとクライアントの初期化
player_table = boto3.resource('dynamodb').Table(os.environ['PLAYER_TABLE'])
apigw = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url=os.environ['WS_ENDPOINT']
)

def broadcast_player_list(room_id: str) -> None:
    """
    指定ルームの全プレイヤーに最新のプレイヤー一覧を送信する
    """
    # DynamoDB からプレイヤーを取得
    response = player_table.query(
        KeyConditionExpression=Key('roomId').eq(room_id)
    )
    items = response.get('Items', [])

    # プレイヤー名リストを作成
    players = [item.get('playerName') for item in items]

    # WebSocket メッセージのペイロード
    data = {
        'type': 'playerListUpdate',
        'players': players
    }
    payload = json.dumps(data).encode('utf-8')

    # 各接続にブロードキャスト
    for item in items:
        connection_id = item.get('connectionId')
        try:
            apigw.post_to_connection(
                ConnectionId=connection_id,
                Data=payload
            )
        except apigw.exceptions.GoneException:
            # 接続切れの場合はテーブルから削除
            player_table.delete_item(
                Key={'roomId': room_id, 'playerId': item.get('playerId')}
            )
