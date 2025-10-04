import { DialogButton, Focusable, ModalRoot, ModalRootProps, Router, TextField } from '@decky/ui'
import { useEffect, useRef, useState } from 'react'


type props = ModalRootProps & {
  label: string,
  placeholder?: string,
  initialValue?: string,
  multiline?: boolean,
  rows?: number,
  applyLabel?: string,
  bCancelDisabled?: boolean,
  bApplyDisabled?: boolean,
  // Back-compat for misspelling
  bAppllyDisabled?: boolean,
  onClosed: (value: string) => void;
}
export const TextFieldModal = ({ closeModal, onClosed, label, placeholder, initialValue, multiline, rows = 5, applyLabel = 'Apply', bCancelDisabled, bApplyDisabled, bAppllyDisabled }: props) => {
  const [returnText, setReturnText] = useState(initialValue ?? '')
  const [applyFocused, setApplyFocused] = useState(false)
  const [hiddenEnabled, setHiddenEnabled] = useState(false)
  const textField = useRef<any>()
  const hiddenTextField = useRef<any>()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null)
  const applyBtnRef = useRef<HTMLButtonElement | null>(null)
  const isApplyDisabled = (bApplyDisabled ?? bAppllyDisabled) === true
  const isCancelDisabled = bCancelDisabled === true

  // Helper to reliably bring up virtual keyboard and ensure textarea focus sticks
  const focusTextareaWithKeyboard = (select: boolean = false) => {
    try {
      // Temporarily enable hidden input to trigger virtual keyboard, then disable again. Select the textarea.
      setHiddenEnabled(true)
      setTimeout(() => {
        hiddenTextField.current?.element?.click?.()
        setHiddenEnabled(false)
        setTimeout(() => {
          textareaRef.current?.focus?.()
          if (select) {
            textareaRef.current?.select?.()
          }
        }, 0)
      }, 0)
    } catch {
      setHiddenEnabled(false)
    }
  }

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnText(e.target.value)
  }

  const submit = () => {
    closeModal?.()
    onClosed(returnText)
  }

  useEffect(() => {
    Router.CloseSideMenus()
    // Set focus on text input
    try {
      if (multiline) {
        focusTextareaWithKeyboard(true)
      } else {
        textField.current?.element?.click?.()
      }
    } catch { }
  }, [multiline])

  const modalProps: any = { closeModal, onEscKeypress: closeModal }
  if (!multiline) {
    modalProps.onOK = submit
  } else {
    // Disable OK action so Enter from virtual keyboard doesn't close the modal
    modalProps.bOKDisabled = true
  }

  return (
    <ModalRoot {...modalProps}>
      {multiline ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, flex: 1 }}>{label}</div>
          </div>
          <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
            {/* Off-screen TextField only used to trigger virtual keyboard */}
            <TextField
              // @ts-ignore
              ref={hiddenTextField}
              value={returnText}
              tabIndex={-1}
              disabled={!hiddenEnabled}
            />
          </div>
          <textarea
            ref={textareaRef}
            rows={rows}
            autoFocus
            value={returnText}
            placeholder={placeholder}
            onFocus={() => {
              focusTextareaWithKeyboard(false)
            }}
            onClick={() => {
              focusTextareaWithKeyboard(false)
            }}
            onChange={(e) => {
              setReturnText((e.target as HTMLTextAreaElement).value)
            }}
            style={{
              width: '100%',
              resize: 'none',
              lineHeight: '1.3',
              padding: '10px 16px',
              fontSize: '14px',
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #555',
              borderRadius: '2px',
              boxSizing: 'border-box',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />
          {(!isCancelDisabled || !isApplyDisabled) && (
            <Focusable
              flow-children="horizontal"
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}
            >
              {!isCancelDisabled && (
                <DialogButton
                  // @ts-ignore
                  ref={cancelBtnRef}
                  onClick={() => closeModal?.()}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                > Cancel
                </DialogButton>
              )}
              {!isApplyDisabled && (
                <DialogButton
                  // @ts-ignore
                  ref={applyBtnRef}
                  onClick={submit}
                  onFocus={() => setApplyFocused(true)}
                  onBlur={() => setApplyFocused(false)}
                  style={{
                    backgroundColor: applyFocused ? 'white' : '#10b981',
                    color: applyFocused ? 'black' : 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                > {applyLabel}
                </DialogButton>
              )}
            </Focusable>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <TextField
            //@ts-ignore
            ref={textField}
            focusOnMount={true}
            value={returnText}
            label={label}
            placeholder={placeholder}
            onChange={handleText}
          />
          {(!isCancelDisabled || !isApplyDisabled) && (
            <Focusable
              flow-children="horizontal"
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
              onKeyDown={(e: any) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  e.stopPropagation?.()
                  try { textField.current?.element?.click?.() } catch { }
                }
              }}
            >
              {!isCancelDisabled && (
                <DialogButton
                  // @ts-ignore
                  ref={cancelBtnRef}
                  onClick={() => closeModal?.()}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                > Cancel
                </DialogButton>
              )}
              {!isApplyDisabled && (
                <DialogButton
                  // @ts-ignore
                  ref={applyBtnRef}
                  onClick={submit}
                  onFocus={() => setApplyFocused(true)}
                  onBlur={() => setApplyFocused(false)}
                  style={{
                    backgroundColor: applyFocused ? 'white' : '#10b981',
                    color: applyFocused ? 'black' : 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                > {applyLabel}
                </DialogButton>
              )}
            </Focusable>
          )}
        </div>
      )}
    </ModalRoot>
  )
}
