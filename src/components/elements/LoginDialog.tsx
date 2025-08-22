import React, { useEffect, useState } from 'react'
import { ConfirmModal, showModal } from '@decky/ui'
import { beginDeviceFlow, fetchUserProfile, pollOnce, saveTokens, saveUserProfile } from '../../hooks/githubAuth'
import { QRCodeSVG } from 'qrcode.react'

type Step = 'init' | 'waiting' | 'success' | 'error'

export const popupLoginDialog = (onCloseCallback = () => {
}) => {
  let closePopup = () => {
  }

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
      ;(async () => {
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
      })()
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
              console.warn('[LoginDialog] Failed to fetch profile:', e)
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
          @keyframes dv-indeterminate {
            0% { left: -40%; width: 40%; }
            50% { left: 20%; width: 60%; }
            100% { left: 100%; width: 40%; }
          }
        `}
        </style>

        {step === 'waiting' && (
          <div
            style={{
              margin: '8px 10px',
              maxWidth: 520,
            }}
          >
            <p style={{ margin: '0 0 10px 0', opacity: 0.9 }}>
              Connect the Deck Settings plugin to your GitHub account to submit your own game reports directly from the
              plugin.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 6px 0' }}>Enter this code:</p>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: 2,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    display: 'inline-block',
                  }}
                >
                  {userCode}
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <QRCodeSVG value={verifyUrl} size={160} marginSize={4} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
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
          </div>
        )}
        {step === 'success' && (
          <div style={{ margin: '8px 10px' }}>
            <p>✅ Connected! You can now submit reports directly to GitHub from this Decky Plugin.</p>
          </div>
        )}
        {step === 'error' && (
          <div style={{ margin: '8px 10px' }}>
            <p>❌ {msg || 'Something went wrong.'}</p>
          </div>
        )}
      </ConfirmModal>
    )
  }

  const modal = showModal(<Popup />, window)
  closePopup = modal.Close
}
