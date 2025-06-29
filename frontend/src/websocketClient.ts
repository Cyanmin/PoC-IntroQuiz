// WebSocket test client for IntroQuiz
// Start Vite with '--host' for LAN debugging

const API_ID = '<API-ID>'
const REGION = '<region>'

// Construct the WebSocket URL
const wsUrl = `wss://${API_ID}.execute-api.${REGION}.amazonaws.com/dev`

let socket: WebSocket | null = null

export function connect() {
  socket = new WebSocket(wsUrl)

  socket.addEventListener('open', () => {
    console.log('✅ WebSocket connected')
  })

  socket.addEventListener('message', event => {
    console.log('📩 Message received:', event.data)
  })

  socket.addEventListener('close', () => {
    console.log('❌ WebSocket disconnected')
  })

  socket.addEventListener('error', () => {
    console.log('💥 WebSocket error')
  })
}

export function sendBuzz(elapsed: number) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket is not connected')
    return
  }
  const message = {
    action: 'buzz',
    elapsed
  }
  socket.send(JSON.stringify(message))
}

export function disconnect() {
  socket?.close()
}
