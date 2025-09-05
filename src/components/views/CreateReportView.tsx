import React, { useEffect, useMemo, useState } from 'react'
import { DialogButton, Focusable, PanelSection, PanelSectionRow, ToggleField, SliderField, showModal } from '@decky/ui'
import { MdArrowBack } from 'react-icons/md'
import { getGamesList } from '../../hooks/gameLibrary'
import type { ReportDraft } from '../../interfaces'
import { TextFieldModal } from '../elements/TextFieldModal'
import { fetchReportFormDefinition } from '../../hooks/deckVerifiedApi'
import { loadReportFormStates, saveReportFormState, submitReportDraft } from '../../hooks/githubSubmitReport'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { ImageSelectorModal } from '../elements/ImageSelectorModal'
import { fetchScreenshotList } from '../../hooks/gameLibrary'
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
  const [submitError, setSubmitError] = useState<string | null>(null)

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

      // Build simplified sections with transformed fields based on hardware and rules
      try {
        const hardware = Array.isArray(def?.hardware) ? def.hardware : []
        const getHw = (deviceName?: string) => hardware.find((h: any) => h?.name === deviceName)

        const body: any[] = def?.template?.body || []
        const sections: any[] = []
        let current: any | null = null
        let inGame = false
        let isPerf = false

        const push = () => { if (current) sections.push(current); current = null }

        body.forEach((item: any) => {
          if (item.type === 'markdown') {
            const text: string = item?.attributes?.value || ''
            const isInGame = /##\s*In-Game Settings/i.test(text)
            const isAdditional = /##\s*Additional Notes/i.test(text)
            isPerf = /##\s*SteamOS Performance Settings/i.test(text)
            inGame = isInGame
            push()
            current = {
              markdown: isInGame ? '## In-Game Settings' : (isAdditional ? '## Additional Notes' : text),
              fields: [] as any[],
            }
            if (isInGame) {
              current.fields.push({
                type: 'image_select',
                id: 'game_display_settings',
                attributes: { label: 'Game Display Settings', description: 'Upload screenshots of your in-game settings.' },
              })
            }
            return
          }

          // Skip replaced textareas in In-Game section
          if (inGame && (item.id === 'game_display_settings' || item.id === 'game_graphics_settings')) return

          // Seed defaults
          if ((item.type === 'input' || item.type === 'textarea') && item.id && item.attributes?.value && !initial[item.id]) {
            initial[item.id] = String(item.attributes.value)
          }
          if (item.type === 'dropdown' && item.id && Array.isArray(item.attributes?.options) && typeof item.attributes?.default === 'number') {
            const idx = item.attributes.default
            const opts = item.attributes.options
            if (!initial[item.id] && opts[idx] !== undefined) initial[item.id] = String(opts[idx])
          }

          // Transform per rules
          let transformed: any = { ...item }
          if (isPerf) {
            // Strip descriptions in performance section
            if (transformed?.attributes) transformed.attributes = { ...transformed.attributes, description: undefined }
            // Convert performance inputs to sliders
            if (item.type === 'input') {
              const lowerId = String(item?.id || '').toLowerCase()
              const hw = getHw(initial['device']) || {}
              let min: number | undefined
              let max: number | undefined
              let step: number | undefined
              if (lowerId === 'frame_limit') {
                min = 10
                max = Number(hw.max_refresh_rate) || 60
                step = 1
              }
              if (lowerId === 'tdp_limit') {
                min = 3
                max = Number(hw.max_tdp_w) || 15
                step = 1
              }
              if (lowerId === 'manual_gpu_clock') {
                min = 200
                max = Number(hw.max_gpu_clk) || 1600
                step = 100
              }
              if (min !== undefined && max !== undefined && step !== undefined) {
                transformed = {
                  type: 'slider',
                  id: item.id,
                  attributes: { label: item?.attributes?.label, min, max, step },
                  validations: item.validations,
                }
              }
            }
          }
          if (item.type === 'dropdown') {
            const opts: string[] = Array.isArray(item?.attributes?.options) ? item.attributes.options : []
            const isOnOff = opts.length === 2 && new Set(opts.map(o => String(o).toLowerCase())).size === 2 && opts.map(o => String(o).toLowerCase()).every(o => o === 'on' || o === 'off')
            if (isOnOff) {
              transformed = { type: 'toggle', id: item.id, attributes: { label: item?.attributes?.label }, validations: item.validations }
            }
            if (item.id === 'enable_vrr') {
              const hw = getHw(initial['device'])
              const supportsVRR = !!hw?.supports_vrr
              if (!supportsVRR) {
                // Ensure default value
                const dIdx = typeof item?.attributes?.default === 'number' ? item.attributes.default : 0
                const op = Array.isArray(item?.attributes?.options) ? item.attributes.options : []
                const defVal = op[dIdx] ?? op[0] ?? 'Off'
                if (!initial[item.id]) initial[item.id] = String(defVal)
                return // hide field
              }
            }
          }
          if (!current) current = { markdown: '', fields: [] }
          current.fields.push(transformed)
        })
        push()
        setFormDef({ ...def, sections })
        console.log(sections)
      } catch { }

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

  const handleSubmit = async () => {
    if (!formDef) return
    const templateBody: any[] = formDef?.template?.body || []
    const items = templateBody.filter((x: any) => x && x.type !== 'markdown' && x.id)
    // Ensure missing items are present as empty strings
    const nextValues: Record<string, string> = { ...values }
    // Special-case: treat screenshots as satisfying game_display_settings
    if (Array.isArray(selectedImages) && selectedImages.length > 0) {
      try { nextValues['game_display_settings'] = JSON.stringify(selectedImages) } catch { nextValues['game_display_settings'] = selectedImages.join('\n') }
    }
    items.forEach((it: any) => {
      if (nextValues[it.id] === undefined || nextValues[it.id] === null) nextValues[it.id] = ''
    })
    // Validate all items
    const newErrors: Record<string, string> = {}
    let ok = true
    items.forEach((it: any) => {
      if (it.id === 'game_display_settings') {
        const hasImages = Array.isArray(selectedImages) && selectedImages.length > 0
        const err = hasImages ? '' : validate(it, nextValues[it.id] ?? '')
        if (err) ok = false
        if (err) newErrors[it.id] = err
        return
      }
      const val = nextValues[it.id] ?? ''
      const err = validate(it, val)
      if (err) ok = false
      if (err) newErrors[it.id] = err
    })
    console.error(newErrors)
    setErrors(newErrors)
    if (!ok) {
      setSubmitError('Please correct the highlighted fields before submitting.')
      return
    }
    setSubmitError(null)
    // Build final draft and submit
    const finalDraft: Record<string, any> = { ...nextValues, images: selectedImages }
    try {
      await submitReportDraft(finalDraft, templateBody)
      setSubmitError(null)
    } catch (e: any) {
      const msg = (e?.message && typeof e.message === 'string') ? e.message : 'Submission failed. Please try again.'
      setSubmitError(msg)
      return
    }
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
        {/* Render sections dynamically from preprocessed sections */}
        {formReady && Array.isArray(formDef?.sections) ? (
          <>
            {(() => {
              const elements: React.ReactNode[] = []
              formDef.sections.forEach((section: any, sIdx: number) => {
                if (elements.length > 0) elements.push(<hr key={`hr-${sIdx}`} />)
                elements.push(
                  <div key={`sec-${sIdx}`} style={{ padding: '8px 16px 8px 0' }}>
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
                      {section.markdown || ''}
                    </ReactMarkdown>
                  </div>,
                )
                section.fields?.forEach((item: any, idx: number) => {
                  const type = item.type
                  const label = item?.attributes?.label || item.id
                  const required = !!item?.validations?.required
                  const err = errors[item.id]
                  const current = values[item.id] ?? ''

                  // Handle image selector input
                  if (type === 'image_select') {
                    elements.push(
                      <PanelSectionRow key={`imgsel-${sIdx}-${idx}`}>
                        <DialogButton
                          style={centeredRowStyle}
                          onClick={async () => {
                            try {
                              const imgs = await fetchScreenshotList()
                              showModal(
                                <ImageSelectorModal
                                  images={imgs}
                                  initialSelected={selectedImages}
                                  onClosed={(sel) => setSelectedImages(sel)}
                                />,
                              )
                            } catch {
                              showModal(
                                <ImageSelectorModal
                                  images={[]}
                                  initialSelected={selectedImages}
                                  onClosed={(sel) => setSelectedImages(sel)}
                                />,
                              )
                            }
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>Select screenshots</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                              {selectedImages.length > 0 ? `${selectedImages.length} selected` : 'Tap to choose images'}
                            </div>
                          </div>
                        </DialogButton>
                      </PanelSectionRow>,
                    )
                    return
                  }

                  // Handle slider inputs
                  if (type === 'slider') {
                    const toNum = (v: any) => { const n = typeof v === 'number' ? v : parseFloat(String(v)); return isNaN(n) ? 0 : n }
                    const min = Number(item?.attributes?.min) || 0
                    const max = Number(item?.attributes?.max) || 100
                    const step = Number(item?.attributes?.step) || 1
                    const isUnset = current === '' || current === undefined || current === null
                    const valueNum = isUnset ? min : toNum(current)
                    elements.push(
                      <div style={{ padding: "3px 0" }}>
                        <PanelSectionRow key={`row-${item.id}-${sIdx}-${idx}`}>
                          <div style={{ width: '100%', padding: 0 }}>
                            <ToggleField
                              checked={!isUnset}
                              label={`Set ${label}`}
                              onChange={(enabled: boolean) => {
                                if (!enabled) {
                                  setField(item, '')
                                } else {
                                  const currentAfter = values[item.id]
                                  const n = currentAfter === '' || currentAfter === undefined || currentAfter === null ? min : toNum(currentAfter)
                                  setField(item, String(n))
                                }
                              }}
                            />
                            {!isUnset && (
                              <div style={{ marginTop: '6px' }}>
                                <SliderField
                                  value={valueNum}
                                  min={min}
                                  max={max}
                                  step={step}
                                  showValue={true}
                                  editableValue={true}
                                  onChange={(v) => setField(item, String(v))}
                                />
                              </div>
                            )}
                            {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                          </div>
                        </PanelSectionRow>
                      </div>,
                    )
                    return
                  }

                  // Handle toggle inputs
                  if (type === 'toggle') {
                    const checked = String(current).toLowerCase() === 'on'
                    elements.push(
                      <div style={{ padding: "3px 0" }}>
                        <PanelSectionRow key={`row-${item.id}-${sIdx}-${idx}`}>
                          <ToggleField
                            checked={checked}
                            label={label}
                            onChange={(val: boolean) => setField(item, val ? 'On' : 'Off')}
                          />
                        </PanelSectionRow>
                        {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                      </div>,
                    )
                    return
                  }

                  // Handle dropdown inputs
                  if (type === 'dropdown') {
                    const options: string[] = item?.attributes?.options || []
                    const value = values[item.id]
                    const selected = value ? options.findIndex((x) => x === value) : (typeof item?.attributes?.default === 'number' ? item.attributes.default : -1)
                    elements.push(
                      <div style={{ padding: "3px 0" }}>
                        <PanelSectionRow key={`row-${item.id}-${sIdx}-${idx}`}>
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
                    return
                  }

                  const isAdditionalNotesField = item.type === 'textarea' && item.id === 'additional_notes'
                  elements.push(
                    <div style={{ padding: "3px 0" }}>
                      <PanelSectionRow key={`row-${item.id}-${sIdx}-${idx}`}>
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
                                onClosed={(val) => setField(item, val)}
                              />,
                            )}
                          >
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>{current || (isAdditionalNotesField ? 'Tap to enter additional notes' : 'Tap to enter')}</div>
                          </DialogButton>
                          {err ? <div style={{ fontSize: '10px', color: 'orangered', marginTop: '2px' }}>{err}</div> : null}
                          {item?.attributes?.description ? (
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{item.attributes.description}</div>
                          ) : null}
                        </div>
                      </PanelSectionRow>
                    </div>,
                  )
                })
              })
              return elements
            })()}
            {/* Submit area */}
            <div style={{ padding: '8px 16px 8px 0' }}>
              <div style={{ color: 'orangered', fontSize: '12px', marginBottom: '6px', display: submitError ? 'visible' : 'hidden' }}>{submitError}</div>
              {/* {submitError ? (
                <div style={{ color: 'orangered', fontSize: '12px', marginBottom: '6px' }}>{submitError}</div>
              ) : null} */}
              <PanelSectionRow>
                <Focusable flow-children="horizontal" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <DialogButton onClick={handleSubmit} style={{ padding: '8px 12px', marginRight: '16px', fontSize: '12px' }}>
                    Submit
                  </DialogButton>
                </Focusable>
              </PanelSectionRow>
            </div>
          </>
        ) : null}
      </PanelSection>
      <div style={{ height: '32px' }} />
      {/*  provide space for bottom banner */}
    </>
  )
}

export default CreateReportView
