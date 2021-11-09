import React from 'react'
import styled from 'styled-components'
import _ from 'underscore'

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

function QuestionText ({ question, required, text, onChange }) {
  const [value, setValue] = React.useState(_.isString(text) ? text : '')
  const handleChange = e => {
    setValue(e.target.value)
    onChange(e.target.value)
  }
  required = required ? <SpanRequired>*</SpanRequired> : ''
  return (
    <>
      <H4Question>{question}{required}</H4Question>
      <input
        type='text' className='form-control' rows='3' value={value}
        onChange={handleChange}
      />
    </>
  )
}

export { QuestionText }
