import os
import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key
from handlers.broadcast_player_list import broadcast_player_list

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])
apigw = boto3.client(
'apigatewaymanagementapi',
endpoint_url=os.environ['WS_ENDPOINT']
)

def handler(event, context):
	body = event.get('body')
	data = json.loads(body) if isinstance(body, str) else bodyF
	room_id = data.get('roomId')
	player_id = data.get('playerId') or str(uuid.uuid4())
	player_name = data.get('playerName')
	connection_id = event['requestContext']['connectionId']

	print(f"[joinRoom] room_id={room_id} player_id={player_id} player_name={player_name} connection_id={connection_id}")

	# PlayerTableに登録
	player_table.put_item(
		Item={
			'roomId': room_id,
			'playerId': player_id,
			'playerName': player_name,
			'connectionId': connection_id,
			'score': 0,
		}
	)
	print(f"[joinRoom] Player registered: {player_id}")

	# 送信元にjoinRoomResult返却（プレイヤー一覧も含める）
	resp = player_table.query(
		KeyConditionExpression=Key('roomId').eq(room_id),
		ProjectionExpression="playerName"
	)
	player_list = [item['playerName'] for item in resp.get('Items', [])]
	res = {
		'type': 'joinRoomResult',
		'status': 'ok',
		'playerList': player_list,
	}
	apigw.post_to_connection(
		ConnectionId=connection_id,
		Data=json.dumps(res).encode('utf-8')
	)
	print(f"[joinRoom] joinRoomResult sent to {connection_id}")

	# 登録後に全員へ最新のプレイヤー一覧を送信
	broadcast_player_list(room_id)

	return {'statusCode': 200, 'body': 'ok'}
