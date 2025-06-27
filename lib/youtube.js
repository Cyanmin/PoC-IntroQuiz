require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

async function fetchFirstVideoTitle() {
  if (!API_KEY || !PLAYLIST_ID) throw new Error('Missing API config');
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('YouTube API error');
  const data = await res.json();
  return data.items[0].snippet.title;
}

module.exports = { fetchFirstVideoTitle };
