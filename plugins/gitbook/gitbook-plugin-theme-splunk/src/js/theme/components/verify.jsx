import React from 'react'
import styled from 'styled-components'
import { Modal } from 'react-bootstrap'

const DivMessageBox = styled.div`
  margin-top: 2.5rem;
  white-space: pre-wrap;
  font-family: monospace;
`

function MessageBox ({ passed = [], failed = [] }) {
  const messages = []
  if (passed.length > 0) {
    const passedDivs = passed.map((message, index) => {
      return (
        <div key={index}><i className='fa fa-check mr-2' />{message}</div>
      )
    })
    messages.push(
      <div key='passed' className='alert alert-success mb-2' role='alert'>
        {passedDivs}
      </div>
    )
  }
  if (failed.length > 0) {
    const failedDivs = failed.map((message, index) => {
      return (
        <div key={index}><i className='fa fa-times mr-2' />{message}</div>
      )
    })
    messages.push(
      <div key='failed' className='alert alert-danger mb-2' role='alert'>
        {failedDivs}
      </div>
    )
  }
  return (
    <DivMessageBox className='message-box'>
      {messages}
    </DivMessageBox>
  )
}

function Button ({ readyMessage, doneMessage, status, onClick }) {
  if (status === 'done') {
    return (
      <button
        type='button'
        className='btn btn-success'
        disabled
        onClick={onClick}
      >
        {doneMessage}
      </button>
    )
  } else {
    const message = status === 'ready' ? readyMessage : 'Verifying'
    const disabled = status !== 'ready'
    return (
      <button
        type='button'
        className='btn btn-primary'
        disabled={disabled}
        onClick={onClick}
      >
        {message}
      </button>
    )
  }
}

function CompletionDialog ({ show, fromTrack, url }) {
  const buttonText = fromTrack
    ? 'Go Back To Track' : ' Show Other Workshops'
  const [showModal, setShowModal] = React.useState(show)
  const handleComplete = () => {
    setShowModal(false)
    window.location.replace(url)
  }
  const handleCancel = () => {
    setShowModal(false)
    window.location.reload()
  }
  return (
    <Modal show={showModal} size='lg'>
      <div className='modal-content'>
        <div className='modal-header'>
          <h4 className='modal-title'>Congratulations!</h4>
        </div>
        <div className='modal-body'>
          <p>You completed this workshop.</p>
          <h4>Do you want to try other workshops?</h4>
        </div>
        <div className='modal-footer'>
          <button
            type='button' className='btn btn-success'
            onClick={handleComplete}
          >
            {buttonText}
          </button>
          <button
            type='button' className='btn btn-secondary'
            onClick={handleCancel}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

const components = {
  MessageBox,
  Button,
  CompletionDialog
}

export { components as Verify }
