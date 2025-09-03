export type QamKeyMap = {
  tdpLimitToggle: string[];          // 0/1
  manualGpuClockToggle: string[];    // 0/1
  manualGpuClockIndex: string[];     // small integer (index/enum)
};

// Fill with your observed keys. You can override via setQamKeyMap().
const DEFAULT_MAP: QamKeyMap = {
  tdpLimitToggle: ['iN8K'],
  manualGpuClockToggle: ['wN8K'],
  manualGpuClockIndex: ['yN8K2A==', 'yN8KvA=='], // treat either as the source of the numeric value
}

let keyMap: QamKeyMap = { ...DEFAULT_MAP }

type SettingCache = Map<string, number>; // key_b64 -> last numeric byte (0..255)
const cache: SettingCache = new Map()
let attached = false

// ---- Helpers ----
const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0))
const bytesToB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8))

/** Decode payload "KEY||VALUE" where VALUE is the last byte. */
function decodePayload(b64: string): { key_b64: string; value: number } | null {
  try {
    const buf = b64ToBytes(b64)
    if (!buf.length) return null
    const value = buf[buf.length - 1]
    const key = buf.slice(0, buf.length - 1)
    return { key_b64: bytesToB64(key), value }
  } catch {
    return null
  }
}

/** Attach a single logger to capture last-seen values. Safe to call multiple times. */
export function attachQamSettingsSniffer(): void {
  if (attached) return
  // @ts-ignore
  const S: any = (globalThis as any).SteamClient?.Settings
  if (!S || typeof S.SetSetting !== 'function') return
  if ((S as any).__wrappedQamSniffer) return

  const orig = S.SetSetting
  S.SetSetting = new Proxy(orig, {
    apply(target: any, thisArg: any, args: any[]) {
      const payload = args?.[0]
      if (typeof payload === 'string') {
        const dec = decodePayload(payload)
        if (dec) cache.set(dec.key_b64, dec.value)
      }
      return Reflect.apply(target, thisArg, args)
    },
  });
  (S as any).__wrappedQamSniffer = true
  attached = true
}

/** Optionally override the default key map at runtime (persist however you like). */
export function setQamKeyMap(map: Partial<QamKeyMap>) {
  keyMap = {
    tdpLimitToggle: map.tdpLimitToggle ?? keyMap.tdpLimitToggle,
    manualGpuClockToggle: map.manualGpuClockToggle ?? keyMap.manualGpuClockToggle,
    manualGpuClockIndex: map.manualGpuClockIndex ?? keyMap.manualGpuClockIndex,
  }
}

export function getQamKeyMap(): QamKeyMap {
  return { ...keyMap }
}

/** Try a getter if present, else return last-seen cached value for the first key that yields a number. */
async function readFirst(keys: string[]): Promise<number | null> {
  // @ts-ignore
  const S: any = (globalThis as any).SteamClient?.Settings

  for (const key of keys) {
    // Prefer an official getter if available on this client build
    if (S?.GetSetting) {
      try {
        const r = await S.GetSetting(key)
        if (typeof r === 'number') return r
        if (typeof r === 'boolean') return r ? 1 : 0
        if (r && typeof r.value === 'number') return r.value
      } catch {/* continue */
      }
    }
    // Fallback to our cache from SetSetting interceptor
    if (cache.has(key)) return cache.get(key)!
  }
  return null
}

/** Public API: read known QAM values (best-effort). */
export async function readQamSnapshot(): Promise<{
  tdpLimitEnabled: boolean | null;
  manualGpuClockEnabled: boolean | null;
  manualGpuClockIndex: number | null;
}> {
  attachQamSettingsSniffer()

  const [tdpToggle, gpuToggle, gpuIndex] = await Promise.all([
    readFirst(keyMap.tdpLimitToggle),
    readFirst(keyMap.manualGpuClockToggle),
    readFirst(keyMap.manualGpuClockIndex),
  ])

  return {
    tdpLimitEnabled: tdpToggle == null ? null : tdpToggle !== 0,
    manualGpuClockEnabled: gpuToggle == null ? null : gpuToggle !== 0,
    manualGpuClockIndex: gpuIndex,
  }
}

/** Optional: useful for debugging in a dev UI */
export function dumpQamCache(): Record<string, number> {
  return Object.fromEntries(cache.entries())
}
