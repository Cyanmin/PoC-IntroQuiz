import os
import boto3
import json
import re
import time
import requests

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(os.environ['ROOM_TABLE'])
cache_table = dynamodb.Table(os.environ['PLAYLIST_CACHE_TABLE'])
apigw = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ['WS_ENDPOINT'])
YOUTUBE_API_KEY = os.environ['YOUTUBE_API_KEY']
CACHE_TTL_SECONDS = 600

# YouTube playlistId抽出
PLAYLIST_ID_REGEX = re.compile(r'(?:list=)([a-zA-Z0-9_-]+)')


def extract_playlist_id(url):
    m = PLAYLIST_ID_REGEX.search(url)
    return m.group(1) if m else None


def fetch_video_data(playlist_id):
    """Fetch video IDs and titles from a YouTube playlist."""
    video_ids = []
    video_titles = []
    page_token = ""
    while True:
        params = {
            "part": "snippet",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": YOUTUBE_API_KEY,
        }
        if page_token:
            params["pageToken"] = page_token
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/playlistItems", params=params
        )
        data = resp.json()
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            vid = snippet.get("resourceId", {}).get("videoId")
            title = snippet.get("title")
            if vid:
                video_ids.append(vid)
                video_titles.append(title or "")
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return video_ids, video_titles


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

    cached = {}
    try:
        resp = cache_table.get_item(Key={'playlistId': playlist_id})
        cached = resp.get('Item', {})
    except Exception:
        cached = {}

    if cached.get('videoIds') and cached.get('videoTitles'):
        video_ids = cached['videoIds']
        video_titles = cached['videoTitles']
    else:
        video_ids, video_titles = fetch_video_data(playlist_id)
        if not video_ids:
            res = {'type': 'setPlaylistResult', 'status': 'error', 'message': 'No videos found'}
            apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
            return {'statusCode': 400, 'body': 'No videos found'}
        expires_at = int(time.time()) + CACHE_TTL_SECONDS
        try:
            cache_table.put_item(Item={
                'playlistId': playlist_id,
                'videoIds': video_ids,
                'videoTitles': video_titles,
                'expiresAt': expires_at
            })
        except Exception:
            pass

    if not video_ids:
        res = {'type': 'setPlaylistResult', 'status': 'error', 'message': 'No videos found'}
        apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
        return {'statusCode': 400, 'body': 'No videos found'}

    # RoomTableに保存
    room_table.update_item(
        Key={'roomId': room_id},
        UpdateExpression='SET playlistId = :pid, videoIds = :vids, videoTitles = :titles',
        ExpressionAttributeValues={
            ':pid': playlist_id,
            ':vids': video_ids,
            ':titles': video_titles,
        }
    )

    res = {'type': 'setPlaylistResult', 'status': 'ok', 'videoIds': video_ids}
    apigw.post_to_connection(ConnectionId=connection_id, Data=json.dumps(res).encode('utf-8'))
    return {'statusCode': 200, 'body': 'ok'}
