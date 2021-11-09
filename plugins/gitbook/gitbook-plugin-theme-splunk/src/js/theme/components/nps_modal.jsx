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
import { QuestionLinearScale } from './question_linear_scale.jsx'
import { QuestionParagraph } from './question_paragraph.jsx'
import { QuestionCheckbox } from './question_checkbox.jsx'

const DivComponent = styled.div`
  margin-top:30px;
`

const thresholdHigh = 9
const thresholdLow = 6

const isRatingSelected = (rating) => {
  return rating !== null && rating >= 0 && rating <= 10
}

const showExtraQuestion = (rating) => {
  return (rating !== null) &&
    (rating >= thresholdHigh || rating <= thresholdLow)
}
const showExtraCheckbox = (rating) => {
  return rating !== null && rating <= thresholdLow
}

const isBtnDisabled = (rating, feedback) => {
  return !isRatingSelected(rating) || (
    showExtraQuestion(rating) && feedback === '')
}

function SubmitButton ({ rating, feedback, more, onSubmit }) {
  const disabled = isBtnDisabled(rating, feedback)
  const handleSubmit = () => {
    const answers = {
      rating: rating
    }
    if (showExtraQuestion(rating)) {
      answers.feedback = feedback
    }
    if (showExtraCheckbox(rating)) {
      answers.more = more
    }
    onSubmit(answers)
  }

  return (
    <button
      type='button' className='btn btn-primary submit' disabled={disabled}
      onClick={handleSubmit}
    >
      Submit
    </button>
  )
}

function ConditionalParagraph ({ rating, question, text, onChange }) {
  if (rating === null) {
    return null
  }
  const required = (rating !== null) && (rating >= 9 || rating <= 6)

  return (
    <DivComponent>
      <QuestionParagraph required={required} question={question} text={text} onChange={onChange} />
    </DivComponent>
  )
}

function ConditionalCheckbox ({ rating, choices, selected, onChange }) {
  if (!showExtraCheckbox(rating)) {
    return null
  }
  const question = 'Check if the followings are applicable to you:'
  return (
    <DivComponent>
      <QuestionCheckbox
        question={question} choices={choices} selected={selected}
        onChange={onChange}
      />
    </DivComponent>
  )
}

function NpsModal ({ title, body, onSubmit }) {
  const [rating, setRating] = React.useState(null)
  const [feedback, setFeedback] = React.useState('')
  const [more, setMore] = React.useState([])

  const range = { start: 0, end: 10 }
  const labels = { left: 'not at all likely', right: 'extremely likely' }
  const questionLinear = 'How likely are you to recommend this workshop to a colleague?'
  const questionParagraph = 'What is the reason for your score?'
  const choices = [
    { label: 'The workshop had errors and I have pinged #go-workshop-community channel.' }
  ]

  return (
    <div className='modal-content'>
      <div className='modal-header'>
        <h4 className='modal-title'>{title}</h4>
      </div>
      <div className='modal-body'>
        <p>{body}</p>
        <DivComponent>
          <QuestionLinearScale
            question={questionLinear} range={range}
            labels={labels} selected={rating} onSelect={setRating}
          />
        </DivComponent>
        <ConditionalParagraph
          rating={rating} question={questionParagraph}
          text={feedback} onChange={setFeedback}
        />
        <ConditionalCheckbox
          rating={rating} choices={choices}
          selected={more} onChange={setMore}
        />
      </div>
      <div className='modal-footer'>
        <SubmitButton
          rating={rating} feedback={feedback} more={more}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}

export { NpsModal }
