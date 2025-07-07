import os
import boto3
import json
import re
import requests

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(os.environ['ROOM_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])
YOUTUBE_API_KEY = os.environ['YOUTUBE_API_KEY']

# YouTube playlistId抽出
PLAYLIST_ID_REGEX = re.compile(r'(?:list=)([a-zA-Z0-9_-]+)')


def extract_playlist_id(url):
    m = PLAYLIST_ID_REGEX.search(url)
    return m.group(1) if m else None


def fetch_video_ids(playlist_id):
    video_ids = []
    page_token = ''
    while True:
        params = {
            'part': 'contentDetails',
            'playlistId': playlist_id,
            'maxResults': 50,
            'key': YOUTUBE_API_KEY,
        }
        if page_token:
            params['pageToken'] = page_token
        resp = requests.get('https://www.googleapis.com/youtube/v3/playlistItems', params=params)
        data = resp.json()
        for item in data.get('items', []):
            vid = item['contentDetails']['videoId']
            video_ids.append(vid)
        page_token = data.get('nextPageToken')
        if not page_token:
            break
    return video_ids


def handler(event, context):
    body = event.get('body')
    data = json.loads(body) if isinstance(body, str) else body
    playlist_url = data.get('playlistUrl')
    room_id = data.get('roomId')
    connection_id = event['requestContext']['connectionId']

    playlist_id = extract_playlist_id(playlist_url)
    if not playlist_id:
        res = {'type': 'setPlaylistResult', 'status': 'error', 'message': 'Invalid playlist URL'}
        apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
        return {'statusCode': 400, 'body': 'Invalid playlist URL'}

    video_ids = fetch_video_ids(playlist_id)
    if not video_ids:
        res = {'type': 'setPlaylistResult', 'status': 'error', 'message': 'No videos found'}
        apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
        return {'statusCode': 400, 'body': 'No videos found'}

    # RoomTableに保存
    room_table.update_item(
        Key={'roomId': room_id},
        UpdateExpression='SET playlistId = :pid, videoIds = :vids',
        ExpressionAttributeValues={
            ':pid': playlist_id,
            ':vids': video_ids,
        }
    )

    res = {'type': 'setPlaylistResult', 'status': 'ok', 'videoIds': video_ids}
    apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
    return {'statusCode': 200, 'body': 'ok'}
