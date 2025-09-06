import { DialogBody, ModalRoot, ModalRootProps } from '@decky/ui'
import React, { useRef } from 'react'

type Props = ModalRootProps & {
  src: string
  alt?: string
}

export const ImagePreviewModal: React.FC<Props> = ({ closeModal, src, alt }) => {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)


  return (
    <ModalRoot closeModal={closeModal} onEscKeypress={closeModal} bAllowFullSize={true} modalClassName="dg-fullscreen-modal">
      <style>{`
        .dg-fullscreen-modal { padding: 0 !important; }
        .dg-fullscreen-modal .DialogContent { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; margin: 0 !important; background: transparent !important; }
        .dg-fullscreen-modal .DialogContent_InnerWidth { width: 100% !important; height: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
        .dg-fullscreen-modal .DialogBody { padding: 0 !important; }
        .dg-fullscreen-modal .Panel { background: transparent !important; border: none !important; }
        .dg-fullscreen-modal form { height: 100% !important; }
        .dg-fullscreen-modal .GenericConfirmDialog { height: 100% !important; }
      `}</style>
      <DialogBody style={{ padding: 0 }}>
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt || 'Image'}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            onClick={() => {
              const img = imgRef.current
              if (!img) return
              const reqFs = (img.requestFullscreen || (img as any).webkitRequestFullscreen || (img as any).mozRequestFullScreen || (img as any).msRequestFullscreen)
              try {
                if (reqFs) reqFs.call(img)
              } catch { }
            }}
          />
        </div>
      </DialogBody>
    </ModalRoot>
  )
}

export default ImagePreviewModal
