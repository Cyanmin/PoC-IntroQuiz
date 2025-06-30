import boto3
import os
import json

dynamodb = boto3.resource('dynamodb')
player_table = dynamodb.Table(os.environ['PLAYER_TABLE'])

def handler(event, context):
	"""
	Lambda function handler for joining a room.
	Args:
		event (dict): Event data passed by Lambda.
		context (LambdaContext): Runtime information.

	Returns:
		dict: Response object.
	"""
	# Example: Extract room_id and user_id from event
	connection_id = event['requestContext']['connectionId']
	body = json.loads(event['body'])

	room_id = body.get('roomId')
	player_id = body.get('playerId')

	if not room_id or not player_id:
		return {
			'statusCode': 400,
			'body': 'Missing roomId or playerId'
		}

	player_table.update_item(
		Key={'connectionId': connection_id},
		UpdateExpression="SET roomId = :r, playerId = :p",
		ExpressionAttributeValues={
			':r': room_id,
			':p': player_id
		}
	)

	return {
		'statusCode': 200,
		'body': 'Joined room'
	}