import React, { useEffect, useMemo, useState } from 'react'
import { DialogButton, Focusable, PanelSection, PanelSectionRow, ToggleField, showModal } from '@decky/ui'
import { MdArrowBack } from 'react-icons/md'
import { getGamesList } from '../../hooks/gameLibrary'
import type { ReportDraft } from '../../interfaces'
import { TextFieldModal } from '../elements/TextFieldModal'
import { fetchReportFormDefinition, loadReportFormStates, saveReportFormState } from '../../hooks/deckVerifiedApi'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { ImageSelectorModal } from '../elements/ImageSelectorModal'
import { fetchSystemInfo, inferOsVersionString, inferSteamDeckDeviceLabel } from '../../hooks/systemInfo'
import { SelectModal } from '../elements/SelectModal'

interface CreateReportViewProps {
  onGoBack: () => void;
  defaultGameName?: string;
  defaultAppId?: number;
}


const CreateReportView: React.FC<CreateReportViewProps> = ({ onGoBack, defaultGameName, defaultAppId }) => {
  const [formDef, setFormDef] = useState<any | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [formReady, setFormReady] = useState<boolean>(false)

  // Fetch dynamic form definition and initialize values
  useEffect(() => {
    const init = async () => {
      const def = await fetchReportFormDefinition()
      setFormDef(def)
      const initial: Record<string, string> = {}
      // seed defaults from props/current game
      if (!initial['game_name'] && defaultGameName) initial['game_name'] = defaultGameName
      if (!initial['app_id'] && typeof defaultAppId !== 'undefined') initial['app_id'] = String(defaultAppId)

      // if still blank, try to pull running game
      if ((!initial['game_name'] || !initial['app_id'])) {
        try {
          const { runningGame } = await getGamesList()
          if (runningGame) {
            if (!initial['game_name']) initial['game_name'] = runningGame.title
            if (!initial['app_id'] && runningGame.appId !== undefined) initial['app_id'] = String(runningGame.appId)
          }
        } catch (e) {
          console.error('[CreateReportView] auto-populate failed', e)
        }
      }

      // seed defaults from form definition for text inputs with a suggested value
      try {
        def?.template?.body?.forEach((item: any) => {
          if ((item.type === 'input' || item.type === 'textarea') && item.id && item.attributes?.value && !initial[item.id]) {
            initial[item.id] = String(item.attributes.value)
          }
          if (item.type === 'dropdown' && item.id && Array.isArray(item.attributes?.options) && typeof item.attributes?.default === 'number') {
            const idx = item.attributes.default
            const opts = item.attributes.options
            if (!initial[item.id] && opts[idx] !== undefined) initial[item.id] = String(opts[idx])
          }
        })
      } catch { }

      // Load per-game saved state before system overrides
      const states = loadReportFormStates()
      const key = makeDraftKey(initial['game_name'], initial['app_id'])
      const saved = states[key]
      if (saved && typeof saved === 'object') {
        Object.entries(saved).forEach(([k, v]) => {
          if (typeof v === 'string' || typeof v === 'number') initial[k] = String(v)
        })
        if (Array.isArray(saved.images)) setSelectedImages(saved.images as string[])
      }

      // Apply system parsed overrides
      try {
        const sysInfo = await fetchSystemInfo()
        if (sysInfo) {
          // Set the OS version
          const osVer = inferOsVersionString(sysInfo)
          if (osVer) initial['os_version'] = osVer
          // Set the device
          const inferredLabel = inferSteamDeckDeviceLabel(sysInfo)
          if (inferredLabel) {
            const deviceItem = def?.template?.body?.find((x: any) => x?.id === 'device')
            const opts: string[] = deviceItem?.attributes?.options || []
            const match = opts.find(o => o === inferredLabel)
            if (match) initial['device'] = match
          }
        }
      } catch (e) {
        console.warn('[CreateReportView] Could not infer system fields')
      }

      setValues(initial)
      setFormReady(true)
    }
    // noinspection JSIgnoredPromiseFromCall
    init()
  }, [])

  const makeDraftKey = (name?: string, appid?: string | number): string => {
    const n = (name || '').toString().trim()
    const a = (appid !== undefined && appid !== null && `${appid}`.trim() !== '') ? `${appid}`.trim() : 'no appid'
    return `${n} [${a}]`
  }

  const persistDraft = (overrideValues?: Record<string, string>) => {
    const v = overrideValues ?? values
    const key = makeDraftKey(v['game_name'], v['app_id'])
    const draft: ReportDraft = { ...v, images: selectedImages }
    saveReportFormState(key, draft)
  }

  const handleClose = () => {
    persistDraft()
    onGoBack()
  }

  const schemaProps: Record<string, any> = useMemo(() => formDef?.schema?.properties || {}, [formDef])

  const validate = (item: any, newValue: string): string => {
    const label = item?.attributes?.label as string | undefined
    const isRequired = !!item?.validations?.required
    const schema = label ? schemaProps[label] : undefined
    const trimmed = (newValue ?? '').toString().trim()
    if (isRequired && trimmed.length === 0) return 'This field is required.'
    if (!schema) return ''
    // enum
    if (Array.isArray(schema.enum)) {
      if (!schema.enum.includes(trimmed)) return 'Invalid option.'
    }
    // type number
    if (schema.type === 'number') {
      if (trimmed.length === 0) return '' // allow empty if not required
      if (!/^[-+]?[0-9]*\.?[0-9]+$/.test(trimmed)) return 'Must be a number.'
    }
    // string length
    if (schema.type === 'string') {
      if (typeof schema.minLength === 'number' && trimmed.length < schema.minLength) return `Must be at least ${schema.minLength} characters.`
      if (typeof schema.maxLength === 'number' && trimmed.length > schema.maxLength) return `Must be at most ${schema.maxLength} characters.`
    }
    return ''
  }

  const setField = (item: any, newValue: string) => {
    const err = validate(item, newValue)
    setErrors(prev => ({ ...prev, [item.id]: err }))
    // Compute next values first so we can persist immediately
    const nextValues = { ...values, [item.id]: newValue }
    setValues(nextValues)
    persistDraft(nextValues)
  }

  const centeredRowStyle: React.CSSProperties = {
    width: '90%',
    padding: '4px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'left',
    gap: '0.35rem',
  }

  return (
    <>
      <div>
        <div style={{ padding: '3px 16px 3px 16px', margin: 0 }}>
          <Focusable style={{ display: 'flex', alignItems: 'stretch', gap: '1rem' }} flow-children="horizontal">
            <DialogButton
              // @ts-ignore
              autoFocus={true}
              retainFocus={true}
              style={{
                width: '30%',
                minWidth: 0,
                padding: '3px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
              onClick={handleClose}
            >
              <MdArrowBack />
            </DialogButton>
          </Focusable>
        </div>
        <hr />
      </div>

      <PanelSection title="Create Report">
        {!formReady ? (
          <PanelSection spinner title="Loading form..." />
        ) : null}
        {/* Render sections dynamically from report form */}
        {formReady && formDef?.template?.body ? (
          <>
            {(() => {
              const elements: React.ReactNode[] = []
              let inGameSettingsSection = false
              let additionalNotesSection = false
              const skipIds = new Set<string>(['game_display_settings', 'game_graphics_settings'])

              formDef.template.body.forEach((item: any, idx: number) => {
                if (item.type === 'markdown') {
                  const text: string = item?.attributes?.value || ''
                  const isInGame = /##\s*In-Game Settings/i.test(text)
                  const isAdditionalNotes = /##\s*Additional Notes/i.test(text)
                  // Separate sections with a horizontal line (except before the first)
                  if (elements.length > 0) elements.push(<hr key={`hr-${idx}`} />)
                  if (isInGame) {
                    inGameSettingsSection = true
                    elements.push(
                      <div key={`md-${idx}`} style={{ padding: '8px 16px 8px 0' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px' }}>In-Game Settings</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Upload screenshots of your in-game settings</div>
                        {/* Image selector row */}
                        <PanelSectionRow>
                          <DialogButton
                            style={centeredRowStyle}
                            onClick={() => showModal(
                              <ImageSelectorModal
                                initialSelected={selectedImages}
                                onClosed={(sel) => setSelectedImages(sel)}
                              />,
                            )}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>Select screenshots</div>
                              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {selectedImages.length > 0 ? `${selectedImages.length} selected` : 'Tap to choose images'}
                              </div>
                            </div>
                          </DialogButton>
                        </PanelSectionRow>
                      </div>,
                    )
                  } else if (isAdditionalNotes) {
                    additionalNotesSection = true
                    // Discard markdown and render just a header
                    elements.push(
                      <div key={`md-${idx}`} style={{ padding: '8px 16px 8px 0' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px' }}>Additional Notes</div>
                      </div>,
                    )
                  } else {
                    elements.push(
                      <div key={`md-${idx}`} style={{ padding: '8px 16px 8px 0' }}>
                        <ReactMarkdown
                          rehypePlugins={[rehypeSanitize]}
                          allowedElements={["h1", "h2", "h3", "h4", "p", "strong", "br"]}
                          components={{
                            h1: ({ children }) => <h2 style={{ margin: 0, fontSize: '20px' }}>{children}</h2>,
                            h2: ({ children }) => <h2 style={{ margin: 0, fontSize: '18px' }}>{children}</h2>,
                            h3: ({ children }) => <h3 style={{ margin: 0, fontSize: '16px' }}>{children}</h3>,
                            h4: ({ children }) => <h4 style={{ margin: 0, fontSize: '14px' }}>{children}</h4>,
                            p: ({ children }) => <p style={{ fontSize: '12px' }}>{children}</p>,
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      </div>,
                    )
                  }
                  return
                }

                if (inGameSettingsSection && item.id && skipIds.has(item.id)) {
                  // Skip the two textareas replaced by image upload
                  return
                }

                // Input field types
                if (item.type === 'input' || item.type === 'textarea') {
                  const label = item?.attributes?.label || item.id
                  const required = !!item?.validations?.required
                  const current = values[item.id] ?? ''
                  const err = errors[item.id]
                  const isAdditionalNotesField = additionalNotesSection && item.id === 'additional_notes'
                  elements.push(
                    <div style={{ padding: "3px 0" }}>
                      <PanelSectionRow key={`row-${item.id}-${idx}`}>
                        <div style={{ width: '100%', padding: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>
                            {label} {required ? <span style={{ color: 'orangered' }}>*</span> : null}
                          </div>
                          <DialogButton
                            style={centeredRowStyle}
                            onClick={() => showModal(
                              <TextFieldModal
                                label={label}
                                initialValue={current}
                                multiline={isAdditionalNotesField}
                                rows={isAdditionalNotesField ? 5 : 1}
                                onClosed={(val) => {
                                  console.log(val)
                                  setField(item, val)
                                }}
                              />,
                            )}
                          >
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>{current || (isAdditionalNotesField ? 'Tap to enter additional notes' : 'Tap to enter')}</div>
                          </DialogButton>
                          {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                          {item?.attributes?.description && !isAdditionalNotesField ? (
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{item.attributes.description}</div>
                          ) : null}
                        </div>
                      </PanelSectionRow>
                    </div>,
                  )
                  return
                }

                if (item.type === 'dropdown') {
                  const label = item?.attributes?.label || item.id
                  const required = !!item?.validations?.required
                  const options: string[] = item?.attributes?.options || []
                  const value = values[item.id]
                  const selected = value ? options.findIndex((x) => x === value) : (typeof item?.attributes?.default === 'number' ? item.attributes.default : -1)
                  const err = errors[item.id]

                  // Render pure On/Off dropdowns as a ToggleField. Everything else is a SelectModal
                  const isOnOffDropdown = options.length === 2 && new Set(options.map(o => String(o).toLowerCase())).size === 2 && options.map(o => String(o).toLowerCase()).every(o => o === 'on' || o === 'off')
                  if (isOnOffDropdown) {
                    const defaultIndex = (typeof item?.attributes?.default === 'number' ? item.attributes.default : 0)
                    const currentValue = (typeof value === 'string' && value.length > 0)
                      ? value
                      : (options[defaultIndex] ?? options[0] ?? 'Off')
                    const checked = String(currentValue).toLowerCase() === 'on'
                    elements.push(
                      <div style={{ padding: "3px 0" }}>
                        <PanelSectionRow key={`row-${item.id}-${idx}`}>
                          <ToggleField
                            checked={checked}
                            label={label}
                            description={item?.attributes?.description}
                            onChange={(val: boolean) => setField(item, val ? 'On' : 'Off')}
                          />
                        </PanelSectionRow>
                        {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                      </div>,
                    )
                    return
                  } else {
                    elements.push(
                      <div style={{ padding: "3px 0" }}>
                        <PanelSectionRow key={`row-${item.id}-${idx}`}>
                          <div style={{ ...centeredRowStyle, padding: 0, display: 'block' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', padding: '6px 6px 2px 0' }}>
                              {label} {required ? <span style={{ color: 'orangered' }}>*</span> : null}
                            </div>
                            <DialogButton
                              style={{ ...centeredRowStyle, padding: '4px', display: 'flex' }}
                              onClick={() =>
                                showModal(
                                  <SelectModal
                                    label={label}
                                    options={options}
                                    selectedIndex={selected}
                                    onClosed={(val) => setField(item, val)}
                                  />,
                                )
                              }
                            >
                              <div style={{ fontSize: '11px', opacity: 0.8 }}>{value || 'Select option'}</div>
                            </DialogButton>
                            {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                            {item?.attributes?.description ? (
                              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{item.attributes.description}</div>
                            ) : null}
                          </div>
                        </PanelSectionRow>
                      </div>,
                    )
                  }
                }
              })
              return elements
            })()}
          </>
        ) : null}
      </PanelSection>
    </>
  )
}

export default CreateReportView
