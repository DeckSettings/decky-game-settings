import { fetchNoCors } from '@decky/api'

export type TokenBundle = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  token_type?: string
}

export type GithubUserProfile = {
  login: string
  avatar_url: string
  html_url: string
  name?: string
}

const ghTokensKey = `${__PLUGIN_NAME__}:githubTokens`
const ghProfileKey = `${__PLUGIN_NAME__}:githubUserProfile`
const GITHUB_APP_CLIENT_ID = 'Iv23liOILKnctgTZ9i33'
const COMMON_HEADERS = {
  Accept: 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
}

export const loadTokens = () => {
  const raw = window.localStorage.getItem(ghTokensKey)
  return raw ? (JSON.parse(raw) as TokenBundle & { expiresAt?: number; refreshExpiresAt?: number }) : null
}

export const saveTokens = (t: TokenBundle) => {
  const now = Date.now()
  window.localStorage.setItem(
    ghTokensKey,
    JSON.stringify({
      ...t,
      expiresAt: t.expires_in ? now + t.expires_in * 1000 : undefined,
      refreshExpiresAt: t.refresh_token_expires_in ? now + t.refresh_token_expires_in * 1000 : undefined,
    }),
  )
}

export const clearTokens = () => localStorage.removeItem(ghTokensKey)
export const hasToken = () => !!loadTokens()?.access_token


export const saveUserProfile = (p: GithubUserProfile) => {
  window.localStorage.setItem(ghProfileKey, JSON.stringify(p))
}
export const loadUserProfile = (): GithubUserProfile | null => {
  const raw = window.localStorage.getItem(ghProfileKey)
  return raw ? (JSON.parse(raw) as GithubUserProfile) : null
}
export const clearUserProfile = () => localStorage.removeItem(ghProfileKey)


export async function fetchUserProfile(access_token: string): Promise<GithubUserProfile> {
  const res = await fetchNoCors('https://api.github.com/user', {
    method: 'GET',
    headers: {
      ...COMMON_HEADERS,
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${access_token}`,
    },
  })
  if (!res.ok) throw new Error(`fetchUserProfile failed: ${res.status} ${res.statusText}`)
  const u = await res.json()
  return {
    login: u.login,
    avatar_url: u.avatar_url,
    html_url: u.html_url,
    name: u.name ?? undefined,
  }
}


export async function beginDeviceFlow() {
  const body = new URLSearchParams({ client_id: GITHUB_APP_CLIENT_ID })
  const res = await fetchNoCors('https://github.com/login/device/code', {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`begin_device_flow failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<{
    device_code: string
    user_code: string
    verification_uri: string
    expires_in: number
    interval: number
  }>
}

export async function pollOnce(device_code: string) {
  const body = new URLSearchParams({
    client_id: GITHUB_APP_CLIENT_ID,
    device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })
  const res = await fetchNoCors('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`poll_for_token failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function refreshToken(refresh_token: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    client_id: GITHUB_APP_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token,
  })
  const res = await fetchNoCors('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`refresh_token failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function ensureFreshToken(): Promise<string | null> {
  const t = loadTokens()
  if (!t?.access_token) return null
  const now = Date.now()
  if (!t.expiresAt || now < t.expiresAt - 60_000) return t.access_token
  if (!t.refresh_token) {
    clearTokens()
    return null
  }
  const refreshed = await refreshToken(t.refresh_token)
  saveTokens(refreshed)
  return refreshed.access_token
}
