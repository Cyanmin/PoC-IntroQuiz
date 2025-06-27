# PoC IntroQuiz

This project is a simple proof of concept for a real-time intro quiz built with Next.js and WebSocket.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up the YouTube API key and playlist ID:

```bash
echo "YOUTUBE_API_KEY=your_api_key" > .env.local
echo "YOUTUBE_PLAYLIST_ID=your_playlist_id" >> .env.local
```

3. Start the WebSocket server and Next.js in separate terminals:

```bash
pnpm run ws
pnpm run dev
```

## Usage

1. Access `http://localhost:3000` in your browser.
2. Create a room or join an existing one using its ID.
3. In the room page, the host can click **Ask** to fetch the first video title from the playlist and broadcast it.
4. Participants click **Answer** and the first responder will be displayed.

This is a simple POC, so the implementation is minimal.

