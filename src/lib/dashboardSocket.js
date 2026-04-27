const DEFAULT_RECONNECT_DELAY = 1200
const MAX_RECONNECT_DELAY = 10000

function getDefaultSocketUrl(baseUrl) {
  if (typeof window === 'undefined') {
    return null
  }

  if (baseUrl && /^wss?:\/\//i.test(baseUrl)) {
    return baseUrl
  }

  const apiUrl = new URL(baseUrl || '/api', window.location.origin)
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  apiUrl.pathname = `${apiUrl.pathname.replace(/\/+$/, '')}/ws`
  return apiUrl.toString()
}

export function createDashboardSocket({
  url = null,
  onMessage,
  onStatus,
} = {}) {
  const socketUrl = url || getDefaultSocketUrl(import.meta.env?.VITE_QUINKGL_DASHBOARD_API_BASE || '/api')
  let socket = null
  let closed = false
  let reconnectDelay = DEFAULT_RECONNECT_DELAY
  let reconnectTimer = null

  const emitStatus = (status, detail = null) => {
    onStatus?.({ status, detail, url: socketUrl })
  }

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const scheduleReconnect = () => {
    clearReconnectTimer()
    reconnectTimer = window.setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 1.6, MAX_RECONNECT_DELAY)
      connect()
    }, reconnectDelay)
  }

  function connect() {
    if (closed) {
      return null
    }

    if (typeof window === 'undefined' || !window.WebSocket || !socketUrl) {
      emitStatus('unsupported', 'WebSocket unavailable')
      return null
    }

    emitStatus('connecting')

    try {
      socket = new window.WebSocket(socketUrl)
    } catch (error) {
      emitStatus('error', error instanceof Error ? error.message : 'Failed to open socket')
      scheduleReconnect()
      return null
    }

    socket.onopen = () => {
      reconnectDelay = DEFAULT_RECONNECT_DELAY
      emitStatus('open')
    }

    socket.onmessage = (event) => {
      try {
        onMessage?.(JSON.parse(event.data))
      } catch (error) {
        emitStatus('error', error instanceof Error ? error.message : 'Invalid socket payload')
      }
    }

    socket.onerror = () => {
      emitStatus('error', 'Socket error')
    }

    socket.onclose = () => {
      socket = null
      if (closed) {
        emitStatus('closed')
        return
      }

      emitStatus('reconnecting')
      scheduleReconnect()
    }

    return socket
  }

  function close() {
    closed = true
    clearReconnectTimer()

    if (socket) {
      try {
        socket.close()
      } catch {
        // ignore close failures
      }
    }

    socket = null
  }

  function send(message) {
    if (!socket || socket.readyState !== window.WebSocket.OPEN) {
      return false
    }

    socket.send(typeof message === 'string' ? message : JSON.stringify(message))
    return true
  }

  return {
    url: socketUrl,
    connect,
    close,
    send,
  }
}
