import React from 'react'
import styled from 'styled-components'

const LabelRadio = styled.label`
  margin-left: 8px;
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25px;
`
const SpanRadio = styled.span`
  display: inline-block;
  height: 20px;
  margin: 10px 0;
`
const InputRadio = styled.input`
  display: inline-block;
  height: 20px;
  margin: 10px 0;
`

function RadioButton ({ label, name, checked, onSelect }) {
  const handleChange = (e) => {
    if (e.target.checked) {
      onSelect(e.target.value)
    }
  }
  return (
    <LabelRadio>
      <SpanRadio>{label}</SpanRadio>
      <InputRadio
        name={name} type='radio' value={label}
        checked={checked} onChange={handleChange}
      />
    </LabelRadio>
  )
}

const DivRadioContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`
const LabelLeft = styled.label`
  text-align: right;
  font-size: 12px;
  font-weight: bold;
  margin-top: 40px;
  margin-right: 10px;
`
const LabelRight = styled.label`
  text-align: left;
  font-size: 12px;
  font-weight: bold;
  margin-top: 40px;
  margin-left: 10px;
`

function RadioContainer ({ range, labels, selected, onSelect }) {
  const handleChange = selected => {
    const value = parseInt(selected)
    onSelect(value)
  }

  const name = Math.floor(Math.random() * (new Date()).getTime())
  const choices = []
  for (let index = range.start; index <= range.end; index++) {
    const checked = selected === index
    choices.push(
      <RadioButton
        key={index} name={name} label={index} onSelect={handleChange}
        checked={checked}
      />
    )
  }

  return (
    <DivRadioContainer>
      <LabelLeft>{labels.left}</LabelLeft>
      <>{choices}</>
      <LabelRight>{labels.right}</LabelRight>
    </DivRadioContainer>
  )
}

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

function QuestionLinearScale ({
  question, required, range, labels, selected,
  onSelect
}) {
  required = required ? <SpanRequired>*</SpanRequired> : ''
  return (
    <>
      <H4Question>{question}{required}</H4Question>
      <RadioContainer
        range={range} labels={labels}
        selected={selected} onSelect={onSelect}
      />
    </>
  )
}

export { QuestionLinearScale }
