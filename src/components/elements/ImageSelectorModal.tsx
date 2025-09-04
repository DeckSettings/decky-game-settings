import { DialogBody, DialogButton, Focusable, ModalRoot, ModalRootProps } from '@decky/ui'
import React, { useEffect, useState } from 'react'

type ImageInfo = {
  url: string
  path?: string
  name?: string
}

type Props = ModalRootProps & {
  initialSelected?: string[]
  onClosed: (selected: string[]) => void
}

// Fetch local Steam screenshots via the SteamClient API
const fetchScreenshotList = async (): Promise<ImageInfo[]> => {
  try {
    // Prefer all local screenshots; fallback to all-apps variant
    // @ts-ignore global from @decky/ui
    const allScreenshots = await (SteamClient?.Screenshots?.GetAllLocalScreenshots?.() ?? SteamClient?.Screenshots?.GetAllAppsLocalScreenshots?.())
    if (!Array.isArray(allScreenshots)) return []
    // Sort newest first
    const sorted = allScreenshots.sort((a: any, b: any) => (b?.nCreated ?? 0) - (a?.nCreated ?? 0))
    console.log(sorted)
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
    console.warn('[ImageSelectorModal] Failed to fetch screenshots', e)
    return []
  }
}

export const ImageSelectorModal: React.FC<Props> = ({ closeModal, onClosed, initialSelected }) => {
  const [items, setItems] = useState<ImageInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected || []))
  const COLS = 3
  type ColLetter = 'a' | 'b' | 'c'
  const letters: ColLetter[] = ['a', 'b', 'c']
  const idFor = (rowId: number, columnId: ColLetter) => `${rowId}${columnId}`
  const currentPosition = React.useRef<{ rowId: number; columnId: ColLetter }>({ rowId: 1, columnId: 'a' })

  useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    fetchScreenshotList().then(setItems).catch(() => setItems([]))
  }, [])



  const submit = () => {
    // Only return disk paths as requested
    const arr = Array.from(selected).filter(p => !!p)
    onClosed(arr)
    closeModal?.()
  }

  const getKey = (img: ImageInfo): string => {
    // Only use on-disk path for selection as requested
    if (img.path && img.path.length > 0) return img.path
    return ''
  }

  const toggleByKey = (key: string) => {
    if (!key) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Chunk items into rows of 3 for grid rendering
  const rows: typeof items[] = []
  for (let i = 0; i < items.length; i += COLS) rows.push(items.slice(i, i + COLS))

  return (
    <ModalRoot closeModal={closeModal} onOK={submit} onEscKeypress={closeModal}>
      <DialogBody>
        <div style={{ display: 'flex', flexDirection: 'column', height: '70vh', maxHeight: '70vh' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ fontSize: '12px', opacity: 0.8 }}>No screenshots found.</div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {rows.map((row, r) => (
                  <div key={`row-${r}`} style={{ display: 'flex', gap: '8px' }}>
                    {row.map((img, c) => {
                      const rowId = r + 1
                      const columnId = letters[c]
                      const tileId = idFor(rowId, columnId)
                      const key = getKey(img)
                      const isChecked = selected.has(key)
                      return (
                        <Focusable
                          key={tileId}
                          id={tileId}
                          onFocus={() => {
                            currentPosition.current = { rowId, columnId }
                          }}
                          onKeyDown={(e: any) => {
                            const { rowId, columnId } = currentPosition.current
                            const colIndex = letters.indexOf(columnId)
                            if (e.key === 'ArrowUp') {
                              if (rowId > 1) {
                                const next = { rowId: rowId - 1, columnId }
                                const el = document.getElementById(idFor(next.rowId, next.columnId))
                                if (el) {
                                  e.preventDefault(); e.stopPropagation?.()
                                  currentPosition.current = next
                                  setTimeout(() => (el as HTMLDivElement).focus(), 0)
                                }
                              }
                            } else if (e.key === 'ArrowDown') {
                              const maxRow = rows.length
                              if (rowId < maxRow) {
                                const next = { rowId: rowId + 1, columnId }
                                const el = document.getElementById(idFor(next.rowId, next.columnId))
                                if (el) {
                                  e.preventDefault(); e.stopPropagation?.()
                                  currentPosition.current = next
                                  setTimeout(() => (el as HTMLDivElement).focus(), 0)
                                }
                              }
                            } else if (e.key === 'ArrowLeft') {
                              if (colIndex > 0) {
                                const next = { rowId, columnId: letters[colIndex - 1] as ColLetter }
                                const el = document.getElementById(idFor(next.rowId, next.columnId))
                                if (el) {
                                  e.preventDefault(); e.stopPropagation?.()
                                  currentPosition.current = next
                                  setTimeout(() => (el as HTMLDivElement).focus(), 0)
                                }
                              }
                            } else if (e.key === 'ArrowRight') {
                              if (colIndex < COLS - 1) {
                                const next = { rowId, columnId: letters[colIndex + 1] as ColLetter }
                                const el = document.getElementById(idFor(next.rowId, next.columnId))
                                if (el) {
                                  e.preventDefault(); e.stopPropagation?.()
                                  currentPosition.current = next
                                  setTimeout(() => (el as HTMLDivElement).focus(), 0)
                                }
                              }
                            }
                          }}
                          style={{ flex: 1 }}
                        >
                          <div
                            onClick={() => toggleByKey(key)}
                            style={{
                              position: 'relative',
                              width: '100%',
                              height: '100px',
                              border: isChecked ? '2px solid #10b981' : '1px solid #555',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.name || key}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <input
                              type="checkbox"
                              readOnly
                              checked={isChecked}
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                width: '18px',
                                height: '18px',
                                accentColor: '#10b981',
                              }}
                            />
                          </div>
                        </Focusable>
                      )
                    })}
                    {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, i) => (
                      <div key={`spacer-${r}-${i}`} style={{ flex: 1 }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: '8px' }}>
            <Focusable flow-children="horizontal" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <DialogButton onClick={submit} style={{ padding: '8px 12px', fontSize: '12px' }}>
                Apply
              </DialogButton>
            </Focusable>
          </div>
        </div>
      </DialogBody>
    </ModalRoot>
  )
}
