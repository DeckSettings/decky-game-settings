import React from 'react'
import { DialogBody, DialogButton, Focusable, ModalRoot } from '@decky/ui'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  url?: string | null
  onClose: () => void
}

export const ReportSubmittedModal: React.FC<Props> = ({ url, onClose }) => {
  const link = url || ''
  return (
    <ModalRoot closeModal={onClose}>
      <DialogBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>Report Submitted</div>
          <div style={{ fontSize: '12px' }}>Your report was submitted successfully.</div>
          <div style={{ fontSize: '12px' }}>It may take up to an hour for the report to become visible in the website and plugin.</div>
          {link ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>View on GitHub</div>
                <div style={{ fontSize: '11px', opacity: 0.8, maxWidth: '480px', wordBreak: 'break-all' }}>Scan the QR code to the right to view your report on GitHub.</div>
                <div style={{ fontSize: '11px', opacity: 0.8, maxWidth: '480px', wordBreak: 'break-all' }}>({link})</div>
              </div>
              <div style={{ marginLeft: 'auto', marginRight: '40px' }}>
                <QRCodeSVG value={link} size={96} marginSize={4} />
              </div>
            </div>
          ) : null}
          <Focusable flow-children="horizontal" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            {link ? (
              <DialogButton onClick={() => {
                try {
                  SteamClient?.System?.OpenInSystemBrowser?.(link)
                  onClose()
                } catch { }
              }}>
                Open in Browser
              </DialogButton>
            ) : null}
            <DialogButton onClick={onClose}>
              Close
            </DialogButton>
          </Focusable>
        </div>
      </DialogBody>
    </ModalRoot>
  )
}

export default ReportSubmittedModal

