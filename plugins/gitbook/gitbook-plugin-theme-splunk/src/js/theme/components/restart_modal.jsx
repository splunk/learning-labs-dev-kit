import React from 'react'
import { Modal } from 'react-bootstrap'

function RestartModal ({ show, onRestart, onClose }) {
  return (
    <Modal show={show} size='lg'>
      <div className='modal-content'>
        <div className='modal-header'>
          Restart Workshop
        </div>
        <div className='modal-body'>
          <p>You already started or completed this workshop before.</p>
          <p>Do you want to try this workshop again?</p>
        </div>
        <div
          className='modal-footer'
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <button type='button' className='btn btn-primary' onClick={onRestart}>
            Start Workshop Again
          </button>
          <button type='button' className='btn btn-secondary' onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export { RestartModal }
