import React, { useEffect, useState } from 'react'
import { ConfirmModal, showModal } from '@decky/ui'
import { beginDeviceFlow, fetchUserProfile, pollOnce, saveTokens, saveUserProfile } from '../../hooks/githubAuth'
import { QRCodeSVG } from 'qrcode.react'

type Step = 'init' | 'waiting' | 'success' | 'error'

const LOGIN_MODAL_CLASS = 'login-dialog-modal'

export const popupLoginDialog = (onCloseCallback = () => {}) => {
  let closePopup = () => {}

  const handleClose = () => {
    closePopup()
    onCloseCallback()
  }

  const Popup: React.FC = () => {
    const [step, setStep] = useState<Step>('init')
    const [msg, setMsg] = useState<string>('')
    const [deviceCode, setDeviceCode] = useState<string>('')
    const [userCode, setUserCode] = useState<string>('')
    const [verifyUrl, setVerifyUrl] = useState<string>('https://github.com/login/device')
    const [intervalMs, setIntervalMs] = useState<number>(5000)

    // Start device flow
    useEffect(() => {
      const startDeviceFlow = async () => {
        try {
          const d = await beginDeviceFlow()
          setDeviceCode(d.device_code)
          setUserCode(d.user_code)
          setVerifyUrl(d.verification_uri || 'https://github.com/login/device')
          setIntervalMs((d.interval ?? 5) * 1000)
          setStep('waiting')
        } catch (e: any) {
          setMsg(e?.message || 'Failed to start GitHub login.')
          setStep('error')
        }
      }
      startDeviceFlow()
    }, [])

    // Poll for token
    useEffect(() => {
      if (step !== 'waiting' || !deviceCode) return
      let active = true
      let delay = intervalMs
      const tick = async () => {
        if (!active) return
        try {
          const res = await pollOnce(deviceCode)
          if (res.access_token) {
            saveTokens(res)
            try {
              const profile = await fetchUserProfile(res.access_token)
              saveUserProfile(profile)
            } catch (e) {
              // Non-fatal if profile fetch fails; you can still proceed.
              console.warn('[decky-game-settings:LoginDialog] Failed to fetch profile:', e)
            }
            setStep('success')
            return
          }
          if (res.error === 'authorization_pending') {
            // keep polling...
          } else if (res.error === 'slow_down') {
            delay += 5000
          } else if (res.error === 'expired_token' || res.error === 'access_denied') {
            setMsg(res.error_description || res.error || 'Authorization failed')
            setStep('error')
            return
          } else if (res.error) {
            setMsg(res.error_description || res.error)
            setStep('error')
            return
          }
        } catch (e: any) {
          setMsg(e?.message || 'Login failed')
          setStep('error')
          return
        }
        setTimeout(tick, delay)
      }
      const id = setTimeout(tick, delay)
      return () => {
        active = false
        clearTimeout(id)
      }
    }, [step, deviceCode, intervalMs])

    return (
      <ConfirmModal
        modalClassName={LOGIN_MODAL_CLASS}
        strTitle={
          <p
            style={{
              width: '100%',
              textAlign: 'center',
              color: 'steelblue',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Connect your GitHub account
          </p>
        }
        bAlertDialog={true}
        strOKButtonText={step === 'success' ? 'Close' : 'Cancel'}
        onOK={handleClose}
        closeModal={handleClose}
      >
        <style>
          {`
          .${LOGIN_MODAL_CLASS} .DialogContent {
            width: min(750px, 88vw);
          }

          .${LOGIN_MODAL_CLASS} .DialogFooter {
            display: none !important;
          }

          @keyframes dv-indeterminate {
            0% { left: -40%; width: 40%; }
            50% { left: 20%; width: 60%; }
            100% { left: 100%; width: 40%; }
          }
        `}
        </style>

        {step === 'waiting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 11 }}>
            <p style={{ margin: '0 0 6px 0', opacity: 0.9 }}>
              Connect the Deck Settings plugin to your GitHub account to submit your own game reports directly from the
              plugin.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'stretch',
                padding: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        opacity: 0.7,
                        marginBottom: 4,
                      }}
                    >
                      Step 1
                    </div>

                    <p style={{ margin: '0 0 6px' }}>
                      Open the URL blow in your browser or scan the QR code to the right.
                      <br />
                      <span style={{ fontFamily: 'monospace', fontStyle: 'italic' }}>{verifyUrl}</span>
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            opacity: 0.7,
                            marginBottom: 4,
                          }}
                        >
                          Step 2
                        </div>
                        <p style={{ margin: '0 0 6px' }}>Enter this code:</p>
                      </div>

                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: 'rgba(100,255,100,0.25)',
                          display: 'inline-block',
                        }}
                      >
                        {userCode}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: 8,
                      borderRadius: 6,
                      background: 'rgba(100,255,100,0.25)',
                    }}
                  >
                    <QRCodeSVG value={verifyUrl} size={100} marginSize={2} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 10,
                    lineHeight: 1.4,
                    padding: '3px 6px',
                    marginTop: 3,
                    borderRadius: 3,
                    background: 'rgba(255,190,140,0.04)',
                    border: '1px solid rgba(255,190,140,0.5)',
                  }}
                >
                  <strong>Granted Permissions:</strong> This plugin uses GitHub Device Authorization with a "Deck
                  Settings" owned GitHub App. The token granted is limited to reading repository metadata and
                  creating/updating issues, and only applies to the https://github.com/DeckSettings/game-reports-steamos
                  repository. The plugin cannot access your private repositories or make changes elsewhere on your
                  GitHub account with the issued token.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 7, minWidth: 0 }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>waiting for auth…</div>
                <div
                  style={{
                    position: 'relative',
                    height: 6,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '40%',
                      background: 'rgba(255,255,255,0.35)',
                      borderRadius: 4,
                      animation: 'dv-indeterminate 1.2s linear infinite',
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type='button'
                  onClick={handleClose}
                  style={{
                    padding: '8px 16px',
                    background: '#1a9fff',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: 120,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div
            style={{
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <p style={{ margin: 0 }}>
              ✅ Connected! You can now submit reports directly to GitHub from this Decky Plugin.
            </p>
            <button
              type='button'
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                background: '#1a9fff',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div
            style={{
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <p style={{ margin: 0 }}>❌ {msg || 'Something went wrong.'}</p>
            <button
              type='button'
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                background: '#1a9fff',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              Close
            </button>
          </div>
        )}
      </ConfirmModal>
    )
  }

  const modal = showModal(<Popup />, window)
  closePopup = modal.Close
}
