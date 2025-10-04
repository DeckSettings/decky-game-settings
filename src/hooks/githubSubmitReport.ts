import { fetchNoCors, call } from '@decky/api'
import { commonGithubApiHeaders, ensureFreshToken, githubApiBase } from './githubAuth'

const GH_REPORTS_OWNER = 'DeckSettings'
const GH_REPORTS_REPO = 'game-reports-steamos'

export const reportFormStatesKey = `${__PLUGIN_NAME__}:reportFormStates`

// Load the report state from localstorage
export const loadReportFormStates = (): Record<string, any> => {
  try {
    const raw = window.localStorage.getItem(reportFormStatesKey)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return (obj && typeof obj === 'object') ? obj : {}
  } catch {
    return {}
  }
}

// Save the report state from localstorage
export const saveReportFormState = (key: string, state: Record<string, any>): void => {
  try {
    const all = loadReportFormStates()
    all[key] = state
    window.localStorage.setItem(reportFormStatesKey, JSON.stringify(all))
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] Failed to save report form state', e)
  }
}

// Save the report state from localstorage
export const removeReportFromState = (key: string): void => {
  try {
    const all = loadReportFormStates()
    all[key] = null
    window.localStorage.setItem(reportFormStatesKey, JSON.stringify(all))
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] Failed to save report form state', e)
  }
}

// Creates a key for storing the report form state
export const makeDraftKey = (name?: string, appid?: string | number): string => {
  const n = (name || '').toString().trim()
  const a = (appid !== undefined && appid !== null && `${appid}`.trim() !== '') ? `${appid}`.trim() : 'no appid'
  return `${n} [${a}]`
}

// Submit game report draft as Github Issue
export const submitReportDraft = async (payload: any, templateBody: any[]): Promise<string | null> => {
  try {
    // 1) Convert local image paths to base64
    const paths: string[] = Array.isArray(payload.images) ? payload.images : []
    const toFs = (p: string) => (p?.startsWith('file://') ? p.replace(/^file:\/\//, '') : p)
    const fsPaths = paths.map(toFs)
    // 2) Upload images, get raw URLs.
    const uploadedUrls = paths.length > 0 ? await uploadImagesViaBackend(fsPaths) : []
    if (paths.length > 0 && uploadedUrls.length === 0) {
      throw new Error('Failed to upload screenshots. Please try again.')
    }
    // 3) Build markdown body with labels mapped from template and images under Game Display Settings
    const body = buildIssueBodyFromTemplate(payload, templateBody, uploadedUrls)
    // 4) Create issue with placeholder title
    const title = "(Report submitted from Deck Settings Decky Plugin)"
    const issue = await createIssueWithBody(title, body)
    if (!issue || typeof issue.html_url !== 'string') {
      throw new Error('Issue creation failed or missing html_url')
    }
    const url: string = issue.html_url
    return url
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] submitReportDraft failed', e)
    throw e
  }
}

// Update an existing Github issue
export const updateReportDraft = async (
  payload: any,
  templateBody: any[],
  issueNumber: number
): Promise<string | null> => {
  try {
    // 1) Convert local image paths to base64
    const paths: string[] = Array.isArray(payload.images) ? payload.images : []
    const toFs = (p: string) => (p?.startsWith('file://') ? p.replace(/^file:\/\//, '') : p)
    const fsPaths = paths.map(toFs)
    // 2) Upload images, get raw URLs.
    const uploadedUrls = paths.length > 0 ? await uploadImagesViaBackend(fsPaths) : []
    // 3) Build markdown body with labels mapped from template and only newly uploaded images
    const body = buildIssueBodyFromTemplate(payload, templateBody, uploadedUrls)
    // 4) Update issue with new placeholder title
    const title = "(Report updated from Deck Settings Decky Plugin)"
    const issue = await updateIssueBody(title, body, issueNumber)
    if (!issue || typeof issue.html_url !== 'string') {
      throw new Error('Issue update failed or missing html_url')
    }
    const url: string = issue.html_url
    return url
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] updateReportDraft failed', e)
    throw e
  }
}

// Upload images to repo and return raw URLs
export const uploadImagesFromBase64 = async (imagesBase64: string[] = []): Promise<string[]> => {
  if (!imagesBase64 || imagesBase64.length === 0) return []
  const token = await ensureFreshToken()
  if (!token) throw new Error('No GitHub token available')
  const endpoint = 'https://deck-verified-asset-upload.jsunnex.workers.dev/'
  const res = await fetchNoCors(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images: imagesBase64 }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Asset upload failed (${res.status} ${res.statusText}): ${txt}`)
  }
  const json: any = await res.json().catch(() => null)
  const results: any[] = Array.isArray(json?.results) ? json.results : []
  return results
    .map((r) => (typeof r?.url === 'string' ? r.url : null))
    .filter((u: string | null): u is string => !!u && u.startsWith('http'))
}

// Upload images to repo and return raw URLs
export const uploadImagesViaBackend = async (paths: string[]): Promise<string[]> => {
  const token = await ensureFreshToken()
  if (!token) throw new Error('No GitHub token available')
  // The Python function signature is (paths: list, token: str)
  return await call<[string[], string], string[]>('upload_images', paths, token)
}

// Build markdown from template body, mapping ids to labels; inject images under Game Display Settings
function buildIssueBodyFromTemplate(values: Record<string, any>, templateBody: any[] = [], uploadedImageUrls: string[] = []): string {
  const lines: string[] = []
  const valueOrNo = (val: any) => {
    const s = (val ?? '').toString().trim()
    return s.length > 0 ? s : '_No response_'
  }
  const imagesMd = uploadedImageUrls.map((u) => `![screenshot](${u})`).join('\n\n')
  templateBody.forEach((item: any) => {
    if (!item || item.type === 'markdown') return
    const id = item.id
    const label = item?.attributes?.label || id
    lines.push(`### ${label}\n\n`)
    if (id === 'game_display_settings') {
      const text = valueOrNo(values[id])
      if (text) lines.push(text + '\n\n')
      if (imagesMd) lines.push(imagesMd + '\n\n')
      if (!text && !imagesMd) lines.push('_No response_\n\n')
    } else {
      lines.push(valueOrNo(values[id]) + '\n\n')
    }
  })
  return lines.join('')
}

// Create issue with provided body
interface GitHubIssue { html_url?: string }

async function createIssueWithBody(title: string, body: string): Promise<GitHubIssue | null> {
  const token = await ensureFreshToken()
  if (!token) throw new Error('No GitHub token available')
  try {
    return await ghRequest<GitHubIssue>(`/repos/${GH_REPORTS_OWNER}/${GH_REPORTS_REPO}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    }, token)
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] createIssueWithBody failed', e)
    return null
  }
}

// Update issue body (and optionally title)
async function updateIssueBody(title: string, body: string, issueNumber: number): Promise<GitHubIssue | null> {
  const token = await ensureFreshToken()
  if (!token) throw new Error('No GitHub token available')
  try {
    return await ghRequest<GitHubIssue>(`/repos/${GH_REPORTS_OWNER}/${GH_REPORTS_REPO}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, body }),
    }, token)
  } catch (e) {
    console.error('[decky-game-settings:githubSubmitReports] updateIssueBody failed', e)
    return null
  }
}

// Semd request to GH
async function ghRequest<T>(path: string, init: RequestInit, token: string): Promise<T> {
  const res = await fetchNoCors(`${githubApiBase}${path}`, {
    ...init,
    headers: {
      ...commonGithubApiHeaders,
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub ${path} failed: ${res.status} ${res.statusText}\n${text}`)
  }
  return res.json()
}
