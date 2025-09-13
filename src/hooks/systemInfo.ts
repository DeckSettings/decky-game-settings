import { call } from '@decky/api'

export interface SystemInfo {
  bIsUnsupportedPrototypeHardware: boolean
  eGamingDeviceType: number
  eHardwareVariant_DoNotUse: number
  nCPUHz: number
  nCPULogicalCores: number
  nCPUPhysicalCores: number
  nSteamVersion: number
  nSystemRAMSizeMB: number
  nVideoRAMSizeMB: number
  sBIOSVersion: string
  sCPUName: string
  sCPUVendor: string
  sHostname: string
  sKernelVersion: string
  sOSBuildId: string
  sOSCodename: string
  sOSName: string
  sOSVariantId: string
  sOSVersionId: string
  sSteamAPI: string
  sSteamBuildDate: string
  sVideoCardName: string
  sVideoDriverVersion: string
  sysVendor: string
  [key: string]: any
}

// String normaliser: trim whitespace and strip surrounding quotes
export const normalise = (s: any): string => {
  if (s === null || s === undefined) return ''
  const str = typeof s === 'string' ? s : String(s)
  return str.trim().replace(/^['"]+|['"]+$/g, '')
}

// Number normaaliser (defaults to 0)
const toNumber = (v: any): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = typeof v === 'string' ? Number(v.trim()) : Number(v)
  return Number.isFinite(n) ? n : 0
}

export const fetchSystemInfo = async (): Promise<SystemInfo | null> => {
  try {
    // SteamClient is provided by the Steam environment at runtime
    const sysApi = (typeof SteamClient !== 'undefined') ? (SteamClient as any).System : undefined
    const getter = sysApi?.GetSystemInfo
    if (!getter) {
      console.warn('[systemInfo] SteamClient.System.GetSystemInfo is not available')
      return null
    }
    const infoRaw = await sysApi?.GetSystemInfo()
    try { console.log('[systemInfo] System info:', infoRaw) } catch { }

    // Add additionaal information from python backend
    let sysVendorResp = ''
    try {
      sysVendorResp = await call<[], string>('get_sys_vendor')
    } catch { sysVendorResp = '' }

    // Return nothing if nothing was able to be fetched
    if (!infoRaw || typeof infoRaw !== 'object') return null

    const info: SystemInfo = {
      bIsUnsupportedPrototypeHardware: Boolean((infoRaw as any).bIsUnsupportedPrototypeHardware),
      eGamingDeviceType: toNumber((infoRaw as any).eGamingDeviceType),
      eHardwareVariant_DoNotUse: toNumber((infoRaw as any).eHardwareVariant_DoNotUse),
      nCPUHz: toNumber((infoRaw as any).nCPUHz),
      nCPULogicalCores: toNumber((infoRaw as any).nCPULogicalCores),
      nCPUPhysicalCores: toNumber((infoRaw as any).nCPUPhysicalCores),
      nSteamVersion: toNumber((infoRaw as any).nSteamVersion),
      nSystemRAMSizeMB: toNumber((infoRaw as any).nSystemRAMSizeMB),
      nVideoRAMSizeMB: toNumber((infoRaw as any).nVideoRAMSizeMB),
      sBIOSVersion: normalise((infoRaw as any).sBIOSVersion),
      sCPUName: normalise((infoRaw as any).sCPUName),
      sCPUVendor: normalise((infoRaw as any).sCPUVendor),
      sHostname: normalise((infoRaw as any).sHostname),
      sKernelVersion: normalise((infoRaw as any).sKernelVersion),
      sOSBuildId: normalise((infoRaw as any).sOSBuildId),
      sOSCodename: normalise((infoRaw as any).sOSCodename),
      sOSName: normalise((infoRaw as any).sOSName),
      sOSVariantId: normalise((infoRaw as any).sOSVariantId),
      sOSVersionId: normalise((infoRaw as any).sOSVersionId),
      sSteamAPI: normalise((infoRaw as any).sSteamAPI),
      sSteamBuildDate: normalise((infoRaw as any).sSteamBuildDate),
      sVideoCardName: normalise((infoRaw as any).sVideoCardName),
      sVideoDriverVersion: normalise((infoRaw as any).sVideoDriverVersion),
      sysVendor: normalise(sysVendorResp || (infoRaw as any).sSysVendor || (infoRaw as any).sysVendor),
    }

    return info
  } catch (e) {
    console.error('[systemInfo] Failed to fetch system info:', e)
    return null
  }
}

export const inferOsVersionString = (info: SystemInfo | null): string | null => {
  if (!info || typeof info !== 'object') return null
  // Prefer explicit SteamOS fields when available
  const name = info.sOSName
  const ver = info.sOSVersionId
  const build = info.sOSBuildId
  const kernel = info.sKernelVersion

  if (name) {
    if (name === 'SteamOS Holo') {
      // For SteamOS Holo, return just the version id (eg: 3.7.13)
      if (ver) return ver
    }
    // Handle rolling-release distros (e.g., CachyOS) where sOSVersionId is empty
    // and sOSBuildId indicates 'rolling'. Include kernel version if available.
    if (!ver && build && /rolling/i.test(build)) {
      if (kernel) return `${name}_rolling_${kernel}`
      return `${name}_rolling`
    } else if (ver) {
      // For other OSes, return sOSName_sOSVersionId_sOSBuildId
      if (build) return `${name}_${ver}_${build}`
      return `${name}_${ver}`
    }
  }
  return null
}

export const inferSteamDeckModel = (info: SystemInfo | null): string | null => {
  if (!info || typeof info !== 'object') return null
  const cpuName = info.sCPUName
  if (cpuName.includes('AMD Custom APU 0932')) return 'steam-deck-oled'
  if (cpuName.includes('AMD Custom APU 0405')) return 'steam-deck-lcd'
  return null
}

export const inferDeviceLabel = (info: SystemInfo | null): string | null => {
  if (!info || typeof info !== 'object') return null

  // -- Steam Deck --
  // First try to detect Steam Deck models (The easy stuff...)
  const model = inferSteamDeckModel(info)
  if (model === 'steam-deck-oled') return 'Steam Deck OLED'
  if (model === 'steam-deck-lcd') return 'Steam Deck LCD (256GB/512GB)'

  // For everything else, we need to do some digging through the specs and BIOS verions...
  const cpuName = info.sCPUName
  const bios = info.sBIOSVersion
  const sysVendor = info.sysVendor

  // -- Lenovo Legion Go --
  // Legion Go: I'm guessing with this - I don't own a Lenovo device, but this should work...
  if (sysVendor && /lenovo/i.test(sysVendor) && /z1\s*extreme/i.test(cpuName)) {
    return 'Legion Go'
  }

  // -- ASUS Devices --
  // Pretty sure this is right for ASUS ROG Ally models -> {"RC72LA": ["ROG Ally X"], "RC71L": ["ROG Ally Z1", "ROG Ally Z1 Extreme"]}
  if (/rc72la/i.test(bios)) return 'ROG Ally X'
  if (/rc71l/i.test(bios) && /z1\s*extreme/i.test(cpuName)) return 'ROG Ally Z1 Extreme'
  if (/rc71l/i.test(bios)) return 'ROG Ally Z1'


  // -- The Cracks ¯\_(ツ)_/¯ --
  // If we have not detected any winners here, lets fall back to some defaults based only on CPU
  if (/amd\s*ryzen\s*z1(?!\s*extreme)/i.test(cpuName)) return 'ROG Ally Z1'
  if (/amd\s*ryzen\s*z1\s*extreme/i.test(cpuName)) return 'ROG Ally Z1 Extreme'

  // This must be a new device - Let the user decide...
  return null
}
