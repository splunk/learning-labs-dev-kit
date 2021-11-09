/**
 * Copyright 2021 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'
import styled from 'styled-components'
import _ from 'underscore'

import { Verify } from './verify.jsx'
import { QuestionParagraph } from './question_paragraph.jsx'
import { Modal } from 'react-bootstrap'

const DivQuestion = styled.div`
`

const DivBlank = styled.div`
  height:30px
`

function ScriptModalInputs ({ inputDefs, answered, onAnswerChanged }) {
  const [selected, setSelected] = React.useState(answered)

  const createChangeHandler = (inputDef) => {
    return (value) => {
      const cloned = _.clone(selected)
      const unselected = _.isEmpty(value)
      if (unselected) {
        delete cloned[inputDef.name]
      } else {
        cloned[inputDef.name] = value
      }
      setSelected(cloned)
      onAnswerChanged(cloned)
    }
  }

  let defsCount = 0
  return inputDefs.map((inputDef) => {
    defsCount += 1
    const value = selected[inputDef.name]
    const blank = defsCount === inputDefs.length ? '' : <DivBlank />
    return (
      <DivQuestion key={inputDef.name}>
        <QuestionParagraph
          question={inputDef.desc}
          required text={value}
          onChange={createChangeHandler(inputDef)}
        />
        {blank}
      </DivQuestion>)
  })
}

function ScriptModalHeader ({ targetDef }) {
  let title = 'Need the following information to start script validation:'
  if (targetDef.title) { title = targetDef.title }
  return (
    <>
      <h4 className='modal-title'>
        {title}
      </h4>
    </>
  )
}

function ScriptModalButtons ({ inputDefs, answered, onSubmit, onClose }) {
  const buttons = []
  const answeredAllRequired = inputDefs.every((inputDef) => {
    return !_.isUndefined(answered[inputDef.name])
  })
  const handleSubmit = () => {
    const answeredArray = []
    for (const name in answered) {
      answeredArray.push({ name: name, value: answered[name] })
    }
    onSubmit(answeredArray)
  }

  buttons.push(
    <button
      type='button' className='btn btn-primary'
      key='submit' onClick={handleSubmit} disabled={!answeredAllRequired}
    >
    Submit
    </button>)
  buttons.push(
    <button
      type='button' className='btn btn-secondary' key='close'
      onClick={onClose}
    >Close
    </button>)
  return buttons
}

function ScriptModal ({ targetDef, inputDefs, show, onSubmit, onClose }) {
  const [answered, setAnswered] = React.useState({})
  if (inputDefs.length <= 0) {
    return (<></>)
  }
  const modalBodyStyles = { padding: '30px' }
  return (
    <Modal show={show} size='lg'>
      <div className='modal-content'>
        <div className='modal-header'>
          <ScriptModalHeader targetDef={targetDef} />
        </div>
        <div className='modal-body' style={modalBodyStyles}>
          <ScriptModalInputs
            inputDefs={inputDefs} answered={answered}
            onAnswerChanged={setAnswered}
          />
        </div>
        <div className='modal-footer' style={{ display: 'flex', justifyContent: 'center' }}>
          <ScriptModalButtons
            inputDefs={inputDefs} answered={answered}
            onSubmit={onSubmit} onClose={onClose}
          />
        </div>
      </div>
    </Modal>
  )
}

function ScriptBlock ({
  targetDef, readyMessage, doneMessage, status,
  onVerifyRequest, onFailed, onAccepted
}) {
  const [passed, setPassed] = React.useState([])
  const [failed, setFailed] = React.useState([])
  const [buttonStatus, setButtonStatus] = React.useState(status)
  const [modalShow, setModalShow] = React.useState(false)
  const target = targetDef.name
  const hasInputs = targetDef.input && targetDef.input.length > 0

  const processMessage = (body) => {
    let passed = []
    const failed = []
    let accepted = false
    if (body.error) {
      if (body.error.passed) {
        passed = body.error.passed
      }
      failed.push(body.error.message)
    } else {
      passed = body.data.passed
      accepted = true
    }
    setPassed(passed)
    setFailed(failed)
    setModalShow(false)
    if (accepted) {
      setButtonStatus('done')
      onAccepted(body.data)
    } else {
      setButtonStatus('ready')
      onFailed()
    }
  }
  const handleSubmit = async (data) => {
    const body = await onVerifyRequest(target, { input: data })
    processMessage(body)
  }
  const handleClose = () => {
    setButtonStatus('ready')
    setModalShow(false)
  }
  const handleButtonClick = async () => {
    setPassed([])
    setFailed([])
    setButtonStatus('verifying')
    if (hasInputs) {
      setModalShow(true)
      return
    }
    const body = await onVerifyRequest(target)
    processMessage(body)
  }

  return (
    <>
      <ScriptModal
        targetDef={targetDef} inputDefs={targetDef.input} show={modalShow}
        onSubmit={handleSubmit} onClose={handleClose}
      />
      <Verify.Button
        readyMessage={readyMessage}
        doneMessage={doneMessage} status={buttonStatus}
        onClick={handleButtonClick}
      />
      <Verify.MessageBox passed={passed} failed={failed} />
    </>
  )
}

export {
  ScriptBlock
}
