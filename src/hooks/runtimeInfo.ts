// src/hooks/getCurrentRunningGameConfig.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { findModuleExport } from '@decky/ui'

export type RunningGameConfig = {
  app: {
    appId: number | null
    name: string | null
  }
  performance: {
    framerateLimit: number | null
    tdpLimitWatts: number | null
    refreshRate: number | null
    halfRateShading: boolean | null
    vsync: boolean | null
  }
  steamOSVersion: string | null
  protonVersion: string | null
  launch: {
    options: string | null
  }
}

function callSteam<T = any>(path: string, ...args: any[]): T | undefined {
  // Example path: "Apps.GetAppData"
  const parts = path.split('.')
  // @ts-ignore
  let cur: any = (globalThis as any).SteamClient
  for (const p of parts) {
    if (!cur) return undefined
    cur = cur[p]
  }
  if (typeof cur === 'function') {
    try {
      return cur(...args) as T
    } catch {
      return undefined
    }
  }
  return cur as T
}

function firstResult<T>(attempts: Array<() => T | null | undefined>): T | undefined {
  for (const a of attempts) {
    const v = a()
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

/* -------- individual getters (best-effort, safe) -------- */

function getSteamOSVersion(): string | null {
  return (
    firstResult<string>([
      () => callSteam<string>('System.GetOSVersionString'),
      () => callSteam<string>('System.SteamOSVersionString'),
      () => callSteam<string>('System.GetSystemVersionString'),
    ]) || null
  )
}

function getProtonVersion(appId: number | null): string | null {
  if (!appId) return null
  const compat =
    firstResult<any>([
      () => callSteam<any>('Apps.GetCurrentCompatTool', appId),
      () => callSteam<any>('Apps.GetAppCompatTool', appId),
      () => callSteam<any>('Apps.GetAppData', appId, ['CompatToolName', 'CompatToolDisplayName']),
    ]) || null

  if (!compat) return null
  if (typeof compat === 'string') return compat
  if (compat.display_name) return String(compat.display_name)
  if (compat.CompatToolDisplayName) return String(compat.CompatToolDisplayName)
  if (compat.name) return String(compat.name)
  if (compat.CompatToolName) return String(compat.CompatToolName)
  return null
}

function getLaunchOptions(appId: number | null): string | null {
  if (!appId) return null
  const opts =
    firstResult<any>([
      () => callSteam<any>('Apps.GetLaunchOptionsForApp', appId), // may return array of options
      () => callSteam<any>('Apps.GetAppData', appId, ['LaunchOptions']),
    ]) || null

  if (!opts) return null
  if (typeof opts === 'string') return opts
  if (Array.isArray(opts)) {
    const def = opts.find((o) => o?.selected || o?.is_default) || opts[0]
    if (def?.arguments) return String(def.arguments)
    if (def?.launch_options) return String(def.launch_options)
    return null
  }
  if (typeof opts?.LaunchOptions === 'string') return opts.LaunchOptions
  return null
}

function getPerformanceSnapshot(): RunningGameConfig['performance'] {
  const framerate =
    firstResult<number>([
      () => callSteam<number>('System.GetFramerateLimit'),
      () => callSteam<number>('PerformanceSettings.GetFramerateLimit'),
    ]) ?? null

  const tdp =
    firstResult<number>([
      () => callSteam<number>('PerformanceSettings.GetTDPLimitWatts'),
      () => callSteam<number>('System.GetTDPLimitWatts'),
    ]) ?? null

  const refreshRate =
    firstResult<number>([
      () => callSteam<number>('PerformanceSettings.GetRefreshRate'),
      () => callSteam<number>('System.GetDisplayRefreshRate'),
    ]) ?? null

  const halfRateShading =
    firstResult<boolean>([
      () => callSteam<boolean>('PerformanceSettings.GetHalfRateShading'),
      () => callSteam<boolean>('System.GetHalfRateShadingEnabled'),
    ]) ?? null

  const vsync =
    firstResult<boolean>([
      () => callSteam<boolean>('PerformanceSettings.GetVsync'),
      () => callSteam<boolean>('System.GetVsyncEnabled'),
    ]) ?? null

  return { framerateLimit: framerate, tdpLimitWatts: tdp, refreshRate, halfRateShading, vsync }
}



/* -------- main exported function -------- */

/**
 * Returns a snapshot of the currently running game and environment.
 * Throws Error('NO_GAME_RUNNING') if nothing is active.
 */
export async function getCurrentRunningGameConfig(): Promise<RunningGameConfig> {
  // Use your existing library to determine the running game
  // const { runningGame } = await getGamesList()
  // console.log(runningGame)
  const runningGame = { title: 'Stardew Valley', appId: 413150 }

  if (!runningGame) {
    throw new Error('NO_GAME_RUNNING')
  }

  const appId = typeof runningGame.appId === 'number' ? runningGame.appId : null
  const name = runningGame.title ?? null


  /** Find the protobuf constructors we need. */
  const CMsgSystemPerfLimits = findModuleExport((e: any) =>
    typeof e === 'function' && e.toString().includes('CMsgSystemPerfLimits'),
  )
  const CMsgSystemPerfSettingsPerApp = findModuleExport((e: any) =>
    typeof e === 'function' && e.toString().includes('CMsgSystemPerfSettingsPerApp'),
  )

  if (!CMsgSystemPerfLimits) {
    console.warn('[Perf] Could not locate CMsgSystemPerfLimits classes.')
  }
  if (!CMsgSystemPerfSettingsPerApp) {
    console.warn('[Perf] Could not locate CMsgSystemPerfSettingsPerApp classes.')
  }

  return {
    app: { appId, name },
    performance: getPerformanceSnapshot(),
    steamOSVersion: getSteamOSVersion(),
    protonVersion: getProtonVersion(appId),
    launch: { options: getLaunchOptions(appId) },
  }
}
