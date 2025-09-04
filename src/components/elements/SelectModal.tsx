import { DialogBody, DialogButton, ModalRoot, ModalRootProps } from '@decky/ui'
import React from 'react'

type Props = ModalRootProps & {
  label: string
  options: string[]
  selectedIndex?: number
  onClosed: (value: string, index?: number) => void
}

export const SelectModal: React.FC<Props> = ({ closeModal, onClosed, label, options, selectedIndex }) => {
  const submit = (idx: number) => {
    const val = options[idx]
    onClosed(val, idx)
    closeModal?.()
  }

  return (
    <ModalRoot closeModal={closeModal} onEscKeypress={closeModal}>
      <DialogBody>
        <div style={{ fontWeight: 600, marginBottom: '6px' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {options.map((opt, i) => (
            <DialogButton
              key={`${opt}-${i}`}
              onClick={() => submit(i)}
              style={{
                padding: '6px 8px',
                fontSize: '14px',
                justifyContent: 'flex-start',
                textAlign: 'left',
              }}
            >
              {selectedIndex === i ? `✔ ${opt}` : opt}
            </DialogButton>
          ))}
        </div>
      </DialogBody>
    </ModalRoot>
  )
}
