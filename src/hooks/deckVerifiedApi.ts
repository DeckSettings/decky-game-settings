import { reportsApiBaseUrl } from '../constants'
import type { GameDetails, Devices, GameInfo, GameSearchResult, GitHubIssueLabel } from '../interfaces'
import { fetchNoCors } from '@decky/api'

export const fetchGameDataByAppId = async (appId: number): Promise<GameDetails | null> => {
  const url = `${reportsApiBaseUrl}/game_details?appid=${appId}&include_external=true`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!res.ok) {
    console.error(`Failed to fetch games by app ID: ${res.status} ${res.statusText}`)
    return null
  }
  return await res.json() as GameDetails
}

export const fetchGameDataByGameName = async (gameName: string): Promise<GameDetails | null> => {
  const url = `${reportsApiBaseUrl}/game_details?name=${gameName}&include_external=false`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!res.ok) {
    console.error(`Failed to fetch games by name: ${res.status} ${res.statusText}`)
    return null
  }
  return await res.json() as GameDetails
}

export const getGamesBySearchTerm = async (term: string): Promise<GameInfo[] | null> => {
  const url = `${reportsApiBaseUrl}/search_games?term=${term}&include_external=true`
  if (!term && term.trim().length < 3) {
    return []
  }
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!res.ok) {
    console.error(`Failed to fetch games by search term: ${res.status} ${res.statusText}`)
    return []
  }
  const data = await res.json() as GameSearchResult[]
  const results: GameInfo[] = []
  data.forEach((app) => {
    results.push({
      title: app.gameName,
      appId: app.appId,
    })
  })
  return results
}

export const fetchDeviceList = async (): Promise<Devices[]> => {
  const url = `${reportsApiBaseUrl}/issue_labels`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!res.ok) {
    console.error(`Failed to fetch report form details: ${res.status} ${res.statusText}`)
    return []
  }

  const issueLabels = await res.json()

  if (!Array.isArray(issueLabels)) {
    console.error('Invalid issue labels data format')
    return []
  }

  // Map and filter the labels
  const devices: Devices[] = issueLabels
    .filter((label: GitHubIssueLabel) => label.name.startsWith('device:'))
    .map((label: GitHubIssueLabel) => ({
      name: label.name.trim(),
      description: label.description || 'No description available',
    }))

  return devices
}
