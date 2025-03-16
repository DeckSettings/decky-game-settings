// Site URLs
import type { PluginConfig } from './interfaces'

export const reportsApiBaseUrl = 'https://deckverified.games/deck-verified/api/v1'
export const reportsWebsiteBaseUrl = 'https://deckverified.games/deck-verified'

// List of apps to always filter out
export const ignoreListAppRegex = [
  /^Proton\s\d+\.\d+$/,
  /^Steam Linux Runtime \d+\.\d+\s\(.*\)$/,
]
export const ignoreListCompatibilityTools = [
  2180100, // Proton Hotfix
  1493710, // Proton Experimental
  1070560, // Steam Linux Runtime
  1070560, // "Steam Linux Runtime 1.0 (scout)"
  1391110, // "Steam Linux Runtime 2.0 (soldier)"
  1628350, // "Steam Linux Runtime 3.0 (sniper)"
  228980,  // "Steamworks Common Redistributables"
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
      (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16),
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
      console.error('Failed to parse plugin config:', error)
    }
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
  }
  try {
    window.localStorage.setItem(pluginSettingsKey, JSON.stringify(newConfig))
    console.log('Plugin configuration updated:', newConfig)
  } catch (error) {
    console.error('Failed to save plugin config:', error)
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
