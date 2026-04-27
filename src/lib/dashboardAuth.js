const VIEWER_TOKEN_KEY = 'quinkgl.dashboard.viewerToken'
const VIEWER_SCOPE_KEY = 'quinkgl.dashboard.viewerScope'

export function getViewerToken() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.sessionStorage.getItem(VIEWER_TOKEN_KEY)
}

export function getViewerScope() {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.sessionStorage.getItem(VIEWER_SCOPE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeViewerSession({ viewerToken, scope }) {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.setItem(VIEWER_TOKEN_KEY, viewerToken)
  window.sessionStorage.setItem(VIEWER_SCOPE_KEY, JSON.stringify(scope ?? {}))
}

export function clearViewerSession() {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.removeItem(VIEWER_TOKEN_KEY)
  window.sessionStorage.removeItem(VIEWER_SCOPE_KEY)
}

export function hasViewerSession() {
  return Boolean(getViewerToken())
}
