import json
import os
import time
import boto3
from youtube_utils import fetch_valid_videos

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")

dynamodb = boto3.resource("dynamodb")
cache_table = dynamodb.Table(os.environ["PLAYLIST_CACHE_TABLE"])


def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    playlist_id = body.get("playlistId")
    if not playlist_id:
        return {"statusCode": 400, "body": "Missing playlistId"}

    # Cache lookup
    try:
        resp = cache_table.get_item(Key={"playlistId": playlist_id})
    except Exception:
        resp = {}
    item = resp.get("Item") if resp else None
    if item and item.get("videos"):
        return {"statusCode": 200, "body": json.dumps({"playlistId": playlist_id, "videos": item["videos"]})}

    try:
        videos = fetch_valid_videos(YOUTUBE_API_KEY, playlist_id)
    except Exception:
        return {"statusCode": 500, "body": "Failed to fetch playlist"}

    expires_at = int(time.time()) + 600
    try:
        cache_table.put_item(Item={"playlistId": playlist_id, "videos": videos, "expiresAt": expires_at})
    except Exception:
        pass

    return {"statusCode": 200, "body": json.dumps({"playlistId": playlist_id, "videos": videos})}
