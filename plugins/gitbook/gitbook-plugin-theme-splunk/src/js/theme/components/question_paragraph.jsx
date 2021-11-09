import React from 'react'
import styled from 'styled-components'

const H4Question = styled.h4`
  font-size: 15px;
  margin-bottom: 20px;
  min-height:20px;
`

const SpanRequired = styled.span`
  margin-left: 2px;
  font-size: 20px;
  vertical-align: sub;
  color: red;
`

function QuestionParagraph ({ question, required, text, onChange }) {
  const handleChange = e => {
    onChange(e.target.value)
  }
  required = required ? <SpanRequired>*</SpanRequired> : ''
  return (
    <>
      <H4Question>{question}{required}</H4Question>
      <textarea
        className='form-control' rows='3' value={text}
        onChange={handleChange}
      />
    </>
  )
}

export { QuestionParagraph }
