import React from 'react'
import styled from 'styled-components'
import _ from 'underscore'
import { QuestionCheckbox } from './question_checkbox.jsx'
import { QuestionMultiple } from './question_multiple.jsx'
import { QuestionLinearScale } from './question_linear_scale.jsx'
import { QuestionParagraph } from './question_paragraph.jsx'
import { QuestionText } from './question_text.jsx'
import { Modal } from 'react-bootstrap'

const DivQuestion = styled.div``

const DivBlank = styled.div`
  height: 30px;
`

function SurveyQuestions ({
  questionDefs,
  currentPage,
  answered,
  onAnswerChanged
}) {
  const [selected, setSelected] = React.useState(answered)

  const defs = questionDefs.filter(questionDef => {
    return questionDef.page === currentPage
  })

  const createChangeHandler = questionDef => {
    return value => {
      const cloned = _.clone(selected)
      const unselected =
        (questionDef.type === 'checkbox' && _.isEmpty(value)) ||
        (questionDef.type === 'checkbox' && _.isEmpty(value)) ||
        (questionDef.type === 'paragraph' && _.isEmpty(value)) ||
        (questionDef.type === 'linear' && !_.isNumber(value))

      if (unselected) {
        delete cloned[questionDef.id]
      } else {
        cloned[questionDef.id] = value
      }
      setSelected(cloned)
      onAnswerChanged(cloned)
    }
  }

  let defsCount = 0
  return defs.map(questionDef => {
    defsCount += 1
    const value = selected[questionDef.id]
    const blank = defsCount === defs.length ? '' : <DivBlank />
    switch (questionDef.type) {
      case 'checkbox': {
        const choicesCheckbox = questionDef.choices.map(choice => {
          return { label: choice }
        })
        return (
          <DivQuestion key={questionDef.id}>
            <QuestionCheckbox
              question={questionDef.question}
              required={questionDef.required}
              choices={choicesCheckbox}
              selected={value}
              onChange={createChangeHandler(questionDef)}
            />
            {blank}
          </DivQuestion>
        )
      }
      case 'multiple': {
        const choicesMultiple = questionDef.choices.map(choice => {
          return { label: choice }
        })
        return (
          <DivQuestion key={questionDef.id}>
            <QuestionMultiple
              question={questionDef.question}
              required={questionDef.required}
              choices={choicesMultiple}
              selected={value}
              onChange={createChangeHandler(questionDef)}
            />
            {blank}
          </DivQuestion>
        )
      }
      case 'paragraph':
        return (
          <DivQuestion key={questionDef.id}>
            <QuestionParagraph
              question={questionDef.question}
              required={questionDef.required}
              text={value}
              onChange={createChangeHandler(questionDef)}
            />
            {blank}
          </DivQuestion>
        )
      case 'text':
        return (
          <DivQuestion key={questionDef.id}>
            <QuestionText
              question={questionDef.question}
              required={questionDef.required}
              text={value}
              onChange={createChangeHandler(questionDef)}
            />
            {blank}
          </DivQuestion>
        )
      case 'linear':
        return (
          <DivQuestion key={questionDef.id}>
            <QuestionLinearScale
              question={questionDef.question}
              required={questionDef.required}
              range={questionDef.range}
              labels={questionDef.labels}
              selected={value}
              onSelect={createChangeHandler(questionDef)}
            />
            {blank}
          </DivQuestion>
        )
      default:
        return <></>
    }
  })
}

function SurveyHeader ({ answered, totalQuestions, currentPage, totalPages }) {
  const answeredCounts = _.keys(answered).length
  return (
    <>
      <h4 className='modal-title'>
        Survey : {answeredCounts} / {totalQuestions} questions answered
      </h4>
      <span>
        page {currentPage} of {totalPages}
      </span>
    </>
  )
}

function SurveyButton ({
  questionDefs,
  answered,
  currentPage,
  totalPages,
  onNext,
  onPrevious,
  onSubmit,
  onClose
}) {
  const buttons = []
  const answeredAllRequired = questionDefs
    .filter(questionDef => {
      return questionDef.required
    })
    .every(questionDef => {
      return !_.isUndefined(answered[questionDef.id])
    })
  const handleSubmit = () => {
    onSubmit(answered)
  }

  if (currentPage > 1) {
    buttons.push(
      <button
        type='button'
        className='btn btn-success'
        key='prev'
        onClick={onPrevious}
      >
        Previous
      </button>
    )
  }
  if (currentPage < totalPages) {
    buttons.push(
      <button
        type='button'
        className='btn btn-success'
        key='next'
        onClick={onNext}
      >
        Next
      </button>
    )
  }
  if (currentPage === totalPages) {
    buttons.push(
      <button
        type='button'
        className='btn btn-primary'
        key='submit'
        onClick={handleSubmit}
        disabled={!answeredAllRequired}
      >
        Submit
      </button>
    )
  }
  buttons.push(
    <button
      type='button'
      className='btn btn-secondary'
      key='close'
      onClick={onClose}
    >
      Close
    </button>
  )
  return buttons
}

function SurveyModal ({
  questionDefs,
  show,
  page,
  onSubmit,
  onClose,
  onPageChange
}) {
  const totalQuestions = questionDefs.length
  const [answered, setAnswered] = React.useState({})
  const questionDefsByPage = _.groupBy(questionDefs, 'page')
  const totalPages = _.keys(questionDefsByPage).length

  const ref = React.createRef()
  const updateScroll = () => {
    ref.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
  const handleNext = () => {
    updateScroll()
    const newPage = page + 1
    onPageChange(newPage)
  }
  const handlePrevious = () => {
    updateScroll()
    const newPage = page - 1
    onPageChange(newPage)
  }
  const modalBodyStyles = { padding: '30px' }
  return (
    <Modal show={show} size='lg'>
      <div className='modal-content' ref={ref}>
        <div className='modal-header'>
          <SurveyHeader
            answered={answered}
            totalQuestions={totalQuestions}
            currentPage={page}
            totalPages={totalPages}
          />
        </div>
        <div className='modal-body' style={modalBodyStyles}>
          <SurveyQuestions
            questionDefs={questionDefs}
            currentPage={page}
            answered={answered}
            onAnswerChanged={setAnswered}
          />
        </div>
        <div
          className='modal-footer'
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <SurveyButton
            questionDefs={questionDefs}
            answered={answered}
            currentPage={page}
            totalPages={totalPages}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        </div>
      </div>
    </Modal>
  )
}

export { SurveyModal }
