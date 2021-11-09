/* global fetch */

'use strict'

import { reportError } from '../error_report'
import { NpsModal } from './nps_modal.jsx'
import React from 'react'
import { Modal } from 'react-bootstrap'

function RatingModal ({ show, url, onComplete }) {
  const [showModal, setShowModal] = React.useState(show)
  const title = 'Congratulations!'
  const body = 'You completed this workshop.'
  const handleSubmit = async (answers) => {
    try {
      const postObj = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(answers)
      }
      const response = await fetch(url, postObj)
      await response.json()
    } catch (err) {
      // Continue even if failed to submit rating
      const message = `Failed to submit rating, message: ${err.message}`
      await reportError({ message: message, stack: err.stack })
    }
    setShowModal(false)
    onComplete()
  }

  return (
    <Modal show={showModal}>
      <NpsModal title={title} body={body} onSubmit={handleSubmit} />
    </Modal>
  )
}

export { RatingModal }
