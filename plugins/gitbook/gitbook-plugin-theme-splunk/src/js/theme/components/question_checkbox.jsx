import React from 'react'
import styled from 'styled-components'

const InputCheckbox = styled.input`
  margin-right: 10px;
`
const LabelCheckbox = styled.label`
  display: flex;
  align-items: center;
`
const SpanCheckbox = styled.span`
  font-size: 14px;
`
const H4Question = styled.h4`
  font-size: 15px;
  margin-bottom: 20px;
  min-height:20px;
`

function CheckboxChoices ({ choices, selected, onChange }) {
  const items = []

  const selectedSet = new Set(selected)
  choices.forEach((choice) => {
    const handleChange = (e) => {
      if (e.target.checked) {
        console.log('checked')
        selectedSet.add(choice.label)
      } else {
        console.log('unchecked')
        selectedSet.delete(choice.label)
      }
      const selected = Array.from(selectedSet)
      onChange(selected)
    }
    const isChecked = selectedSet.has(choice.label)
    items.push(
      <LabelCheckbox key={choice.label}>
        <InputCheckbox
          checked={isChecked} type='checkbox'
          onChange={handleChange}
        />
        <SpanCheckbox>{choice.label}</SpanCheckbox>
      </LabelCheckbox>
    )
  })
  return (
    <div>
      {items}
    </div>
  )
}

const SpanRequired = styled.span`
margin-left: 2px;
font-size: 20px;
vertical-align: sub;
color: red;
`

function QuestionCheckbox ({ question, required, choices, selected, onChange }) {
  required = required ? <SpanRequired>*</SpanRequired> : ''
  return (
    <>
      <H4Question>{question}{required}</H4Question>
      <CheckboxChoices
        choices={choices} onChange={onChange}
        selected={selected}
      />
    </>
  )
}

export { QuestionCheckbox }
