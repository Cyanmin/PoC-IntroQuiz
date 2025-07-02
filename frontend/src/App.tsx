import { useState } from 'react'
import './App.css'
import { connect, sendBuzz, sendJoinRoom, disconnect } from './hooks/useWebSocket'

function App() {
  const [count, setCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [roomId, setRoomId] = useState('')
  const [playerId, setPlayerId] = useState('')

  const handleConnect = () => {
    connect({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onMessage: msg => setMessages(m => [...m, msg])
    })
  }

  const handleDisconnect = () => {
    disconnect()
    setConnected(false)
  }

  const handleBuzz = () => {
    sendBuzz(Date.now())
  }

  const handleJoinRoom = () => {
    if (!roomId || !playerId) {
      alert('roomIdとplayerIdを入力してください')
      return
    }
    sendJoinRoom(roomId, playerId)
  }

  return (
    <>
      <h1>Vite + React + IntroQuiz</h1>
      <div className="card">
        <p>{connected ? '✅ Connected' : '❌ Disconnected'}</p>
        <button onClick={handleConnect} disabled={connected}>Connect</button>
        <button onClick={handleDisconnect} disabled={!connected}>Disconnect</button>
        <button onClick={handleBuzz} disabled={!connected}>Send Buzz</button>
        <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
      </div>

      <div className="card">
        <h2>Join Room</h2>
        <input
          type="text"
          placeholder="roomId"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="playerId"
          value={playerId}
          onChange={e => setPlayerId(e.target.value)}
          className="input"
        />
        <button onClick={handleJoinRoom} disabled={!connected}>
          Send JoinRoom
        </button>
      </div>

      <div className="card">
        <h2>Messages</h2>
        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
