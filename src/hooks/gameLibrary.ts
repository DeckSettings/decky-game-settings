import { Router } from '@decky/ui'
import { toaster } from '@decky/api'
import { createElement } from 'react'
import {
  ignoreListAppRegex,
  ignoreListCompatibilityTools,
  notificationMeta,
  getPluginConfig,
  makeNotificationRecordKey,
  loadNotificationRecord,
  saveNotificationRecord,
  defaultNotificationSettings,
} from '../constants'
import DeckSettingsIcon from '../components/icons/DeckSettingsIcon'
import type { GameInfo, NotificationEventKey, NotificationSettings } from '../interfaces'
import { fetchGameDataByAppId, fetchGameDataByGameName } from './deckVerifiedApi'
import { AppLifetimeNotification } from '@decky/ui/dist/globals/steam-client/GameSessions'

export type ImageInfo = {
  url: string
  path?: string
  name?: string
}

export const getGamesList = async () => {
  const installFolders = await SteamClient.InstallFolder.GetInstallFolders()
  const installedGames: Required<GameInfo>[] = []
  const nonInstalledGames: Required<GameInfo>[] = []
  const currentRunningGame = Router.MainRunningApp
  let runningGame: GameInfo | null = null
  const installedAppIds = new Set<number>()

  installFolders.forEach((folder) => {
    folder.vecApps.forEach((app) => {
      if (
        !ignoreListCompatibilityTools.includes(app.nAppID) &&
        !ignoreListAppRegex.some((regex) => regex.test(app.strAppName))
      ) {
        if (!runningGame && currentRunningGame?.appid == app.nAppID.toString()) {
          runningGame = {
            title: app.strAppName,
            appId: app.nAppID,
          }
        }
        installedGames.push({
          title: app.strAppName,
          appId: app.nAppID,
          sortAs: app.strSortAs,
        })
        installedAppIds.add(app.nAppID)
      }
    })
  })
  installedGames.sort((a, b) => (a.sortAs ? (a.sortAs > b.sortAs ? 1 : -1) : 0))

  // These are left here for development only. They should not be uncommented in GitHub.
  //runningGame = {
  //    title: 'Avowed',
  //    appId: 2457220,
  //};
  //runningGame = {
  //    title: 'Monster Hunter Wilds',
  //    appId: 2246340,
  //};
  //runningGame = {
  //    title: 'Grand Theft Auto V',
  //    appId: 271590,
  //};

  const allApps = (window as any).collectionStore.allGamesCollection.allApps
  allApps.forEach((app: any) => {
    if (
      !ignoreListCompatibilityTools.includes(app.nAppID) &&
      !ignoreListAppRegex.some((regex) => regex.test(app.strAppName)) &&
      !installedAppIds.has(app.appid)
    ) {
      const gameInfo: Required<GameInfo> = {
        title: app.display_name,
        appId: app.appid,
        sortAs: app.sort_as,
      }
      nonInstalledGames.push(gameInfo)
    }
  })
  nonInstalledGames.sort((a, b) => (a.sortAs > b.sortAs ? 1 : -1))

  // If runningGame was not set, but currentRunningGame has a display_name, set the runningGame title.
  // Here, we cannot trust the appId is the real game appId. So leave it off.
  // The API will handle things via just game name if it is correct and without typos.
  if (!runningGame && currentRunningGame && currentRunningGame.display_name.trim() !== '') {
    runningGame = {
      title: currentRunningGame.display_name,
    }
  }

  return { runningGame, installedGames, nonInstalledGames }
}

// Fetch local Steam screenshots via the SteamClient API
export const fetchScreenshotList = async (): Promise<ImageInfo[]> => {
  try {
    // Prefer all local screenshots; fallback to all-apps variant
    // @ts-ignore global from @decky/ui
    const allScreenshots = await (SteamClient?.Screenshots?.GetAllLocalScreenshots?.() ??
      SteamClient?.Screenshots?.GetAllAppsLocalScreenshots?.())
    if (!Array.isArray(allScreenshots)) return []
    // Sort newest first
    const sorted = allScreenshots.sort((a: any, b: any) => (b?.nCreated ?? 0) - (a?.nCreated ?? 0))
    // Build display list with robust URL + disk path
    const resolved: ImageInfo[] = await Promise.all(
      sorted.map(async (s: any) => {
        const created = typeof s?.nCreated === 'number' ? new Date(s.nCreated * 1000) : null
        const label = created ? `${s?.nAppID ?? ''} – ${created.toLocaleString()}` : `${s?.nAppID ?? ''}`
        let url: string | undefined = typeof s?.strUrl === 'string' && s.strUrl.length > 0 ? s.strUrl : undefined
        let path: string | undefined
        try {
          // @ts-ignore global from @decky/ui
          const localPath: string = await SteamClient?.Screenshots?.GetLocalScreenshotPath?.(`${s?.nAppID}`, s?.hHandle)
          if (typeof localPath === 'string' && localPath.length > 0) path = localPath
        } catch {}
        if (!url && path) {
          url = path.startsWith('file://') ? path : `file://${path}`
        }
        if (!url) url = ''
        return { url, path, name: label }
      })
    )
    // Filter any still-missing URLs
    return resolved.filter((x) => x.url)
  } catch (e) {
    console.warn('[decky-game-settings:gameLibrary] Failed to fetch screenshots', e)
    return []
  }
}
// Attempts to fetch the game display name from collectionStore given the App ID
const getAppDisplayName = (appId: number | undefined): string | undefined => {
  if (!appId) return undefined
  try {
    const allApps = (window as any).collectionStore.allGamesCollection.allApps
    if (allApps && typeof allApps.forEach === 'function') {
      let found: string | undefined
      allApps.forEach((app: any) => {
        if (found) return
        const candidateId = app?.appid
        if (candidateId === appId || Number(candidateId) === appId) {
          found = app?.display_name
          console.log(`[decky-game-settings:gameLibrary] Discovered App display name: ${found}`)
        }
      })
      if (found && typeof found === 'string' && found.trim().length > 0) return found.trim()
    }
  } catch (error) {
    console.warn('[decky-game-settings:gameLibrary] Failed to resolve app name from collectionStore', error)
  }
  return undefined
}

// Cache data
type NotificationCacheEntry = {
  value: { hasReports: boolean; gameName: string }
  cachedAt: number
}
const gameNotificationCache = new Map<number, NotificationCacheEntry>()
const gameNamesCache = new Map<number, string>()

// Fetch data from Deck Verified API... See if there are any reports
const resolveGameNotificationInfo = async (appId: number, assumedGameName?: string) => {
  // First check for a cached copy of the reports check result
  const cached = gameNotificationCache.get(appId)
  const now = Date.now()
  const gameNotificationCacheAge = 60 * 60 * 1000 // 1 hour
  if (cached && now - cached.cachedAt < gameNotificationCacheAge) {
    return cached.value
  }

  // Ensure we have a game name
  let gameName = assumedGameName ?? getAppDisplayName(appId)

  // Check for reports
  let hasReports = false
  try {
    let details = appId ? await fetchGameDataByAppId(appId) : null
    if (!details && gameName) {
      details = await fetchGameDataByGameName(gameName)
    }
    if (details) {
      hasReports = (details.reports?.length ?? 0) > 0 || (details.external_reviews?.length ?? 0) > 0
      if (!gameName && details.gameName) gameName = details.gameName
    }
  } catch (error) {
    console.error('[decky-game-settings:gameLibrary] Failed to fetch game details for notifications', error)
  }

  // Fallback to using AppID in results
  if (!gameName || gameName.trim().length === 0) {
    gameName = `App ${appId || 'Unknown'}`
  }

  const result = { hasReports, gameName }
  // Cache results before returing
  gameNotificationCache.set(appId, { value: result, cachedAt: now })
  return result
}

const shouldProcessEvent = (settings: NotificationSettings, isStart: boolean): boolean => {
  if (isStart) {
    return !!(settings.onGameStartWithReports || settings.onGameStartWithoutReports)
  }
  return !!(settings.onGameStopWithReports || settings.onGameStopWithoutReports)
}

// Register for Steam game lifetime notifications (apps start/stop)
export const gameChangeActions = (): any | null => {
  try {
    const handle = SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications(
      async (notification: AppLifetimeNotification) => {
        try {
          console.log('[decky-game-settings:gameLibrary] AppLifetime notification:', notification)

          const config = getPluginConfig()
          const settings: NotificationSettings = {
            ...defaultNotificationSettings,
            ...(config.notificationSettings ?? {}),
          }
          const isStart = !!notification.bRunning

          if (!shouldProcessEvent(settings, isStart)) {
            return
          }

          const appId = notification.unAppID
          const runningDisplayName = Router.MainRunningApp?.display_name

          if (isStart && runningDisplayName) {
            gameNamesCache.set(appId, runningDisplayName)
          }

          const assumedGameName = (isStart ? runningDisplayName : gameNamesCache.get(appId)) ?? getAppDisplayName(appId)
          const { hasReports, gameName } = await resolveGameNotificationInfo(appId, assumedGameName)

          const eventKey: NotificationEventKey = isStart
            ? hasReports
              ? 'onGameStartWithReports'
              : 'onGameStartWithoutReports'
            : hasReports
            ? 'onGameStopWithReports'
            : 'onGameStopWithoutReports'

          if (!settings[eventKey]) {
            return
          }

          const notificationDelay = isStart ? 15_000 : 3_000

          if (settings.notifyOncePerGame) {
            const record = loadNotificationRecord()
            const recordKey = makeNotificationRecordKey(appId, gameName)
            const existing = record[recordKey]?.[eventKey]
            if (existing) {
              return
            }
            sendNotification(eventKey, notificationDelay)
            const updatedRecord = {
              ...record,
              [recordKey]: {
                ...(record[recordKey] ?? {}),
                [eventKey]: true,
              },
            }
            saveNotificationRecord(updatedRecord)
          } else {
            sendNotification(eventKey, notificationDelay)
          }
        } catch (error) {
          console.error('[decky-game-settings:gameLibrary] Failed to process AppLifetime notification:', error)
        }
      }
    )

    // Expect an object exposing `unregister()`
    return handle ?? null
  } catch (e) {
    console.error('[decky-game-settings:gameLibrary] gameChangeActions registration failed:', e)
    return null
  }
}

const createNotificationLogo = () =>
  createElement(DeckSettingsIcon, {
    size: 44,
    style: { color: '#f5f5f5' },
  })

export const sendNotification = (type: NotificationEventKey, delay?: number | null) => {
  const ms = typeof delay === 'number' && delay >= 0 ? delay : 1_000

  setTimeout(() => {
    const title = notificationMeta[type]?.title ?? ''
    const body = notificationMeta[type]?.body ?? ''

    toaster.toast({
      title,
      body,
      logo: createNotificationLogo(),
      playSound: true,
      duration: 10_000,
    })
  }, ms)
}
