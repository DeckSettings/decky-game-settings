// Site URLs
import type { NotificationSettings, NotificationRecord, PluginConfig } from './interfaces'

export const reportsApiBaseUrl = 'https://deckverified.games/deck-verified/api/v1'
export const reportsWebsiteBaseUrl = 'https://deckverified.games/deck-verified'

export const defaultNotificationSettings: NotificationSettings = {
  onGameStartWithReports: true,
  onGameStartWithoutReports: false,
  onGameStopWithReports: false,
  onGameStopWithoutReports: true,
  notifyOncePerGame: false,
}

const notificationSettingsKey = `${__PLUGIN_NAME__}:notificationRecord`

export const loadNotificationRecord = (): NotificationRecord => {
  const raw = window.localStorage.getItem(notificationSettingsKey)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as NotificationRecord) : {}
  } catch (error) {
    console.error('[decky-game-settings:constants] Failed to parse notification record config:', error)
    return {}
  }
}

export const saveNotificationRecord = (record: NotificationRecord): void => {
  try {
    window.localStorage.setItem(notificationSettingsKey, JSON.stringify(record))
  } catch (error) {
    console.error('[decky-game-settings:constants] Failed to save notification record config:', error)
  }
}

export const makeNotificationRecordKey = (appId: number | undefined, gameName: string): string => {
  const safeName = gameName ?? 'Unknown'
  const prefix = typeof appId === 'number' && Number.isFinite(appId) ? String(appId) : 'none'
  return `${prefix}_${safeName}`
}

export const notificationMeta = {
  onGameStartWithReports: {
    title: 'Deck Settings: Reports Found',
    body: 'Check out game reports before playing.',
  },
  onGameStartWithoutReports: {
    title: 'Deck Settings: No Reports Found',
    body: 'Be the first to submit a game report!',
  },
  onGameStopWithReports: {
    title: 'Deck Settings: Reports Available',
    body: 'Open the plugin to check them out.',
  },
  onGameStopWithoutReports: {
    title: 'Deck Settings: No Reports Yet',
    body: 'Help others—submit a game report.',
  },
}

// List of apps to always filter out
export const ignoreListAppRegex = [/^Proton\s\d+\.\d+$/, /^Steam Linux Runtime \d+\.\d+\s\(.*\)$/]
export const ignoreListCompatibilityTools = [
  2180100, // Proton Hotfix
  1493710, // Proton Experimental
  1070560, // Steam Linux Runtime
  1070560, // "Steam Linux Runtime 1.0 (scout)"
  1391110, // "Steam Linux Runtime 2.0 (soldier)"
  1628350, // "Steam Linux Runtime 3.0 (sniper)"
  228980, // "Steamworks Common Redistributables"
]

export const restartSteamClient = (): void => {
  SteamClient.User.StartRestart(false)
}

export const generateUniqueId = (): string => {
  // Use the built-in randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Create a template string by forcing the first value to a string.
    const template = String(1e7) + -1e3 + -4e3 + -8e3 + -1e11
    return template.replace(/[018]/g, (c) =>
      (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
    )
  }
  // Fallback if crypto is not available
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

const pluginSettingsKey = __PLUGIN_NAME__

export const getPluginConfig = (): PluginConfig => {
  const defaultConfig: PluginConfig = {
    filterDevices: [],
    showAllApps: false,
    notificationSettings: { ...defaultNotificationSettings },
  }
  const dataJson = window.localStorage.getItem(pluginSettingsKey)
  let config: PluginConfig = defaultConfig
  if (dataJson) {
    try {
      const parsedConfig = JSON.parse(dataJson)
      config = {
        ...defaultConfig,
        ...parsedConfig,
      }
    } catch (error) {
      console.error('[decky-game-settings:constants] Failed to parse plugin config:', error)
    }
  }
  config.notificationSettings = {
    ...defaultNotificationSettings,
    ...(config.notificationSettings ?? {}),
  }
  // If the installation ID is not present, generate one and save it.
  if (!('installationId' in config) || !config.installationId) {
    config.installationId = generateUniqueId()
    window.localStorage.setItem(pluginSettingsKey, JSON.stringify(config))
  }
  return config
}

export const setPluginConfig = (updates: Partial<PluginConfig>): void => {
  const currentConfig = getPluginConfig()
  const newConfig = {
    ...currentConfig,
    ...updates,
    notificationSettings: {
      ...defaultNotificationSettings,
      ...(currentConfig.notificationSettings ?? {}),
      ...(updates.notificationSettings ?? {}),
    },
  }
  try {
    window.localStorage.setItem(pluginSettingsKey, JSON.stringify(newConfig))
    //console.debug('[decky-game-settings:constants] Plugin configuration updated:', newConfig)
  } catch (error) {
    console.error('[decky-game-settings:constants] Failed to save plugin config:', error)
  }
}

export const hasYoutubeLink = (text: string): boolean => {
  const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  return regex.test(text)
}

export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  const hourStr = hours === 1 ? 'hour' : 'hours'
  const minuteStr = remainingMins === 1 ? 'min' : 'mins'
  if (remainingMins === 0) {
    return `${hours} ${hourStr}`
  }
  return `${hours} ${hourStr}, ${remainingMins} ${minuteStr}`
}
