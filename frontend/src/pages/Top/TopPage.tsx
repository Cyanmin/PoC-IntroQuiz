import { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { parseYoutubeUrl } from '../../lib/parseYoutubeUrl';
import type { WSIncoming } from '../../types/websocket';

const TopPage: React.FC = () => {
  const { send, messages } = useWebSocket();
  const [url, setUrl] = useState('');
  const [playlistId, setPlaylistId] = useState<string>('');
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    const last = messages[messages.length - 1] as WSIncoming | undefined;
    if (!last) return;
    if (
      last.type === 'playlistFetched' &&
      typeof last.playlistId === 'string' &&
      Array.isArray(last.videos)
    ) {
      setPlaylistId(last.playlistId);
      setVideos(last.videos);
    }
  }, [messages]);

  const handleFetch = () => {
    const id = parseYoutubeUrl(url);
    if (!id) return;
    send({ action: 'fetchPlaylist', playlistId: id });
  };

  return (
    <div>
      <h1>Top Page</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube Playlist URL"
      />
      <button onClick={handleFetch}>Fetch Playlist</button>
      {playlistId && (
        <div>
          <h2>Playlist: {playlistId}</h2>
          <ul>
            {videos.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TopPage;
