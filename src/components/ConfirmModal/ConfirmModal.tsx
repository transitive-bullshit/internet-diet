import React from 'react'
import Modal from 'react-modal'

import styles from './ConfirmModal.module.css'

Modal.setAppElement('#root')
const noop = () => undefined

export const ConfirmModal: React.FC<{
  isOpen?: boolean
  children?: React.ReactNode
  cancel?: React.ReactNode
  confirm?: React.ReactNode
  contentLabel?: string
  style?: { overlay?: React.CSSProperties; content?: React.CSSProperties }
  onConfirm?: () => void
  onRequestClose?: () => void
}> = ({
  isOpen = false,
  children,
  cancel = 'Cancel',
  confirm = 'Confirm',
  contentLabel = 'Confirmation Dialog',
  style,
  onConfirm = noop,
  onRequestClose = noop
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={contentLabel}
      style={{
        overlay: {
          backdropFilter: 'blur(16px)',
          ...style?.overlay
        },
        content: {
          position: 'fixed',
          transform: 'translate(-50%,-50%)',
          top: '50%',
          left: '50%',
          bottom: 'auto',
          right: 'auto',
          width: '80%',
          minWidth: '20rem',
          maxWidth: '60rem',
          minHeight: '1rem',
          padding: '24px',
          borderRadius: '4px',
          ...style?.content
        }
      }}
    >
      <div className={styles.confirmModal}>
        <div className={styles.confirmModalBody}>{children}</div>

        <div className={styles.confirmModalFooter}>
          <button
            aria-label='Cancel'
            className={styles.btn}
            onClick={onRequestClose}
          >
            {cancel}
          </button>

          <button
            aria-label='Confirm'
            className={styles.btn}
            onClick={onConfirm}
          >
            {confirm}
          </button>
        </div>
      </div>
    </Modal>
  )
}
