import json
import urllib.parse
import urllib.request
from typing import List

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


def _get_json(url: str) -> dict:
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())


def fetch_playlist_items(api_key: str, playlist_id: str, max_results: int = 50) -> List[str]:
    params = urllib.parse.urlencode({
        "part": "contentDetails",
        "playlistId": playlist_id,
        "maxResults": max_results,
        "key": api_key,
    })
    url = f"{YOUTUBE_API_BASE}/playlistItems?{params}"
    data = _get_json(url)
    return [item["contentDetails"]["videoId"] for item in data.get("items", [])]


def filter_embeddable_videos(api_key: str, video_ids: List[str]) -> List[str]:
    if not video_ids:
        return []
    params = urllib.parse.urlencode({
        "part": "status",
        "id": ",".join(video_ids),
        "key": api_key,
    })
    url = f"{YOUTUBE_API_BASE}/videos?{params}"
    data = _get_json(url)
    valid: List[str] = []
    for item in data.get("items", []):
        status = item.get("status", {})
        if status.get("embeddable") and status.get("privacyStatus") == "public":
            valid.append(item.get("id"))
    return valid


def fetch_valid_videos(api_key: str, playlist_id: str) -> List[str]:
    video_ids = fetch_playlist_items(api_key, playlist_id)
    return filter_embeddable_videos(api_key, video_ids)
