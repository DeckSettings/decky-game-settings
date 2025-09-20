import { Router } from '@decky/ui'
import { ignoreListAppRegex, ignoreListCompatibilityTools } from '../constants'
import type { GameInfo } from '../interfaces'
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
        !ignoreListAppRegex.some(regex => regex.test(app.strAppName))
      ) {
        if (
          !runningGame &&
          currentRunningGame?.appid == app.nAppID.toString()
        ) {
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
      !ignoreListAppRegex.some(regex => regex.test(app.strAppName)) &&
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
    const allScreenshots = await (SteamClient?.Screenshots?.GetAllLocalScreenshots?.() ?? SteamClient?.Screenshots?.GetAllAppsLocalScreenshots?.())
    if (!Array.isArray(allScreenshots)) return []
    // Sort newest first
    const sorted = allScreenshots.sort((a: any, b: any) => (b?.nCreated ?? 0) - (a?.nCreated ?? 0))
    // Build display list with robust URL + disk path
    const resolved: ImageInfo[] = await Promise.all(sorted.map(async (s: any) => {
      const created = typeof s?.nCreated === 'number' ? new Date(s.nCreated * 1000) : null
      const label = created ? `${s?.nAppID ?? ''} – ${created.toLocaleString()}` : `${s?.nAppID ?? ''}`
      let url: string | undefined = typeof s?.strUrl === 'string' && s.strUrl.length > 0 ? s.strUrl : undefined
      let path: string | undefined
      try {
        // @ts-ignore global from @decky/ui
        const localPath: string = await SteamClient?.Screenshots?.GetLocalScreenshotPath?.(`${s?.nAppID}`, s?.hHandle)
        if (typeof localPath === 'string' && localPath.length > 0) path = localPath
      } catch { }
      if (!url && path) {
        url = path.startsWith('file://') ? path : `file://${path}`
      }
      if (!url) url = ''
      return { url, path, name: label }
    }))
    // Filter any still-missing URLs
    return resolved.filter(x => x.url)
  } catch (e) {
    console.warn('[gameLibrary] Failed to fetch screenshots', e)
    return []
  }
}

// Register for Steam game lifetime notifications (apps start/stop)
// Returns the Steam "Unregisterable" handle (or null if unavailable)
// Use this to hook actions when a game starts/stops.
export const gameChangeActions = (): any | null => {
  try {
    const gsApi = SteamClient?.GameSessions
    const register = gsApi?.RegisterForAppLifetimeNotifications
    if (!register) {
      console.warn('[gameLibrary] SteamClient.GameSessions.RegisterForAppLifetimeNotifications is not available')
      return null
    }

    // Register callback; Steam invokes this with AppLifetimeNotification
    const handle = register((notification: AppLifetimeNotification) => {
      // TODO: Execute actions on game start/stop using notification
      // Example usage to be implemented later:
      // if (!notification.bRunning) {
      //   const appId = notification.unAppID
      //   // Do something with appId
      // }
      try { console.debug('[gameLibrary] AppLifetime notification:', notification) } catch { }
    })

    // Expect an object exposing `unregister()`
    return handle ?? null
  } catch (e) {
    console.error('[gameLibrary] gameChangeActions registration failed:', e)
    return null
  }
}
