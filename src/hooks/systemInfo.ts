export const fetchSystemInfo = async (): Promise<any | null> => {
  try {
    // SteamClient is provided by the Steam environment at runtime
    // @ts-ignore
    const sysApi = (typeof SteamClient !== 'undefined') ? (SteamClient as any).System : undefined
    const getter = sysApi?.GetSystemInfo
    if (!getter) {
      console.warn('[systemInfo] SteamClient.System.GetSystemInfo is not available')
      return null
    }
    const info = await sysApi?.GetSystemInfo()
    try {
      console.log('[systemInfo] System info:', info)
    } catch { }
    return info ?? null
  } catch (e) {
    console.error('[systemInfo] Failed to fetch system info:', e)
    return null
  }
}

export const inferOsVersionString = (info: any | null): string | null => {
  if (!info || typeof info !== 'object') return null
  // Prefer explicit SteamOS fields when available
  const rawName = info.sOSName as string | undefined
  const rawVer = info.sOSVersionId as string | undefined
  const rawBuild = info.sOSBuildId as string | undefined
  const normalize = (s: any) => (typeof s === 'string' ? s.replace(/^['"]+|['"]+$/g, '').trim() : '')
  const name = normalize(rawName)
  const ver = normalize(rawVer)
  const build = normalize(rawBuild)

  if (name) {
    if (name === 'SteamOS Holo') {
      // For SteamOS Holo, return just the version id (eg: 3.7.13)
      if (ver) return ver
    } else if (ver) {
      // For other OSes, return sOSName_sOSVersionId_sOSBuildId
      if (build) return `${name}_${ver}_${build}`
      return `${name}_${ver}`
    }
  }

  const candidates = [
    info.strOSDisplayVersion,
    info.strOSVersion,
    info.OSVersion,
    info.os_version,
    info.version,
    info.system_version,
    info?.steamOS?.version,
    info.SteamOSVersion,
    info.szOSVersion,
    info?.os?.version,
  ]
  const found = candidates.find(v => typeof v === 'string' && v.trim().length > 0)
  if (found) return String(found).trim()
  // Some environments may provide distro + version separately
  const dist = info.distribution || info.distro || info.os_name
  const distVer = info.distribution_version || info.distro_version || info.os_version
  if (dist && distVer) return `${String(dist).trim()}_${String(distVer).trim()}`
  if (dist) return String(dist).trim()
  return null
}

export type DeckModel = 'steam-deck-lcd' | 'steam-deck-oled'

export const inferSteamDeckModel = (info: any | null): DeckModel | null => {
  if (!info || typeof info !== 'object') return null
  const cpuName = typeof info.sCPUName === 'string' ? info.sCPUName : ''
  if (cpuName.includes('AMD Custom APU 0932')) return 'steam-deck-oled'
  if (cpuName.includes('AMD Custom APU 0405')) return 'steam-deck-lcd'
  return null
}

export const inferSteamDeckDeviceLabel = (info: any | null): string | null => {
  const model = inferSteamDeckModel(info)
  if (model === 'steam-deck-oled') return 'Steam Deck OLED'
  if (model === 'steam-deck-lcd') return 'Steam Deck LCD (256GB/512GB)'
  return null
}
