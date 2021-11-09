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

import { Modal } from 'react-bootstrap'
import { Verify } from './verify.jsx'
import React from 'react'
import * as showdown from 'showdown'
import _ from 'underscore'

function QuizText ({ questionDef, selected, disabled, onSelectionChanged }) {
  var converter = new showdown.Converter()

  const handleChange = (event) => {
    onSelectionChanged(event.target.value)
  }

  return (
    <form>
      <div className='content' dangerouslySetInnerHTML={{ __html: converter.makeHtml(questionDef.question) }} />
      <label style={{ fontSize: '13px' }}>Fill in the blank.</label>
      <input
        type='text' className='form-control' disabled={disabled}
        value={selected} onChange={handleChange} id='answer'
      />
    </form>
  )
}

function QuizMultipleChoices ({ questionDef, selected, disabled, onSelectionChanged }) {
  const converter = new showdown.Converter()
  const questionHtml = converter.makeHtml(questionDef.question)

  const handleChange = (event) => {
    const index = parseInt(event.target.value)
    if (!questionDef.multiAnswer) {
      onSelectionChanged(index)
    } else {
      let current = selected
      if (selected === '') {
        current = []
      }
      if (current.includes(index)) {
        onSelectionChanged(_.difference(current, [index]))
      } else {
        onSelectionChanged(_.sortBy(current.concat([index])))
      }
    }
  }

  const renderChoiceItem = (choice, index) => {
    const valueStr = `${index}`
    const inputType = questionDef.multiAnswer ? 'checkbox' : 'radio'

    const isChecked = () => {
      if (!questionDef.multiAnswer) {
        return valueStr === selected.toString()
      } else if (selected === '') {
        return false
      }
      return selected.includes(index)
    }

    return (
      <div className='form-check' key={index}>
        <input
          className='form-check-input' type={inputType} value={valueStr}
          checked={isChecked()} disabled={disabled} onChange={handleChange}
        />
        <label className='form-check-label'>
          {choice}
        </label>
      </div>)
  }

  const renderChoices = () => {
    let index = 0
    return questionDef.choices.map((choice) => {
      const elem = renderChoiceItem(choice, index)
      index += 1
      return elem
    })
  }

  return (
    <form>
      <div dangerouslySetInnerHTML={{ __html: questionHtml }} />
      <label style={{ fontSize: '13px' }}>Select all that apply.</label>
      <>
        {renderChoices()}
      </>
    </form>
  )
}

function QuizQuestionView ({ questionDef, ...props }) {
  console.log(props)
  switch (questionDef.type) {
    case 'text':
      return (<QuizText {...props} questionDef={questionDef} />)
    case 'multiple':
      return (<QuizMultipleChoices {...props} questionDef={questionDef} />)
    default:
      return (<></>)
  }
}

function QuizMessageView ({ status, correct, correctAnswer }) {
  if (status !== 'Started' && status !== 'Submitted') {
    if (correct) {
      return (<div className='alert alert-success mt-3' role='alert'>Correct Answer!</div>)
    } else if (correctAnswer) {
      return (
        <>
          <div className='alert alert-danger mt-3' role='alert'>Sorry, wrong answer.</div>
          <div className='alert alert-success mt-3' role='alert'>Correct answer is "{correctAnswer}"</div>
        </>)
    } else {
      return (<div className='alert alert-danger mt-3' role='alert'>Sorry, wrong answer.</div>)
    }
  } else {
    return (<></>)
  }
}

function QuizButtonView ({ status, selected, handleSubmit, handleNext }) {
  const isSubmitDisabled = () => {
    return (selected === '')
  }

  if (status === 'Started') {
    return (
      <button
        type='button' className='btn btn-success'
        onClick={handleSubmit} disabled={isSubmitDisabled()}
      >
      Submit
      </button>)
  } else if (status !== 'Submitted') {
    return (
      <button
        type='button' className='btn btn-success'
        onClick={handleNext}
      >
      Next
      </button>)
  } else {
    return (<></>)
  }
}

function QuizBlock ({
  targetDef, readyMessage, doneMessage, status,
  onVerifyRequest, onAccepted
}) {
  const target = targetDef.name
  const [failed, setFailed] = React.useState([])
  const [passThreshold, setPassThreshold] = React.useState(0)
  const [buttonStatus, setButtonStatus] = React.useState(status)
  const [modalShow, setModalShow] = React.useState(false)
  const [correct, setCorrect] = React.useState(true)
  const [quizStatus, setQuizStatus] = React.useState('Started')
  const [selected, setSelected] = React.useState('')
  const [correctAnswer, setCorrectAnswer] = React.useState('')
  const [questionDef, setQuestionDef] = React.useState({})
  const [nextQuestion, setNextQuestion] = React.useState({})
  const [solved, setSolved] = React.useState(0)

  const handleSubmit = async () => {
    setQuizStatus('Submitted')
    const data = {
      questionIndex: questionDef.index,
      answer: selected
    }
    const result = await onVerifyRequest(target, data)
    if (result.error) {
      setFailed([result.error.message])
      setQuizStatus('Error')
    } else if (result.data.pending) {
      setQuizStatus('Pending')
      setCorrect(result.data.pending.passed)
      setSolved(result.data.pending.solved.length)
      setNextQuestion(result.data.pending.question)
      if (result.data.pending.correctAnswer) {
        setCorrectAnswer(result.data.pending.correctAnswer)
      } else {
        setCorrectAnswer(null)
      }
    } else {
      setCorrect(true)
      setQuizStatus('Completed')
      setSolved(passThreshold)
      setNextQuestion(result.data)
    }
  }

  const handleNext = () => {
    if (quizStatus === 'Completed') {
      console.log(nextQuestion)
      setModalShow(false)
      setButtonStatus('done')
      onAccepted(nextQuestion)
    } else {
      setSelected('')
      setQuizStatus('Started')
      setQuestionDef(nextQuestion)
    }
  }

  const handleClose = () => {
    setModalShow(false)
    setButtonStatus('ready')
    setQuizStatus('Started')
    setSelected('')
  }

  const handleButtonClick = async () => {
    setButtonStatus('verifying')
    const body = await onVerifyRequest(target)
    if (body.error) {
      setFailed([body.error.message])
      return
    }
    setFailed([])
    setPassThreshold(body.data.pending.passThreshold)
    setQuestionDef(body.data.pending.question)
    if (body.data.pending.solved) {
      setSolved(body.data.pending.solved.length)
    }
    setModalShow(true)
  }

  return (
    <>
      <Modal show={modalShow} size='lg'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h4 className='modal-title'>
              Quiz : You need to answer {passThreshold} questions correctly to pass.
            </h4>
            <span>{solved} / {passThreshold} solved</span>
          </div>
          <div className='modal-body'>
            <QuizQuestionView
              questionDef={questionDef}
              onSelectionChanged={setSelected}
              selected={selected}
              disabled={quizStatus !== 'Started' && quizStatus !== 'Submitted'}
            />
            <QuizMessageView
              status={quizStatus} correct={correct}
              correctAnswer={correctAnswer}
            />
          </div>
          <div className='modal-footer' style={{ display: 'flex', justifyContent: 'center' }}>
            <QuizButtonView
              status={quizStatus} selected={selected}
              handleSubmit={handleSubmit} handleNext={handleNext}
            />
            <button
              type='button' className='btn btn-secondary' key='close'
              onClick={handleClose}
            >Close
            </button>
          </div>
        </div>
      </Modal>
      <Verify.Button
        readyMessage={readyMessage}
        doneMessage={doneMessage} status={buttonStatus}
        onClick={handleButtonClick}
      />
      <Verify.MessageBox passed={[]} failed={failed} />
    </>
  )
}

export { QuizBlock }
