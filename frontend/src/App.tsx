import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { connect, sendBuzz, disconnect } from './websocketClient'

function App() {
  const [count, setCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

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

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>{connected ? '✅ Connected' : '❌ Disconnected'}</p>
        <button onClick={handleConnect} disabled={connected}>Connect</button>
        <button onClick={handleDisconnect} disabled={!connected}>Disconnect</button>
        <button onClick={handleBuzz} disabled={!connected}>Send Buzz</button>
        <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
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
