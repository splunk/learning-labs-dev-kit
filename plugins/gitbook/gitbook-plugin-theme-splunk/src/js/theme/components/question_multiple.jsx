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

const InputMultiple = styled.input`
  margin-right: 10px;
`
const LabelMultiple = styled.label`
  display: flex;
  align-items: center;
`
const SpanMultiple = styled.span`
  font-size: 14px;
`
const H4Question = styled.h4`
  font-size: 15px;
  margin-bottom: 20px;
  min-height:20px;
`

function MultipleChoices ({ choices, selected, onChange }) {
  const items = []

  choices.forEach((choice) => {
    const handleChange = (e) => {
      if (e.target.checked) {
        const selected = choice.label
        onChange(selected)
      }
    }
    const isChecked = selected === choice.label
    items.push(
      <LabelMultiple key={choice.label}>
        <InputMultiple
          checked={isChecked} type='radio'
          onChange={handleChange}
        />
        <SpanMultiple>{choice.label}</SpanMultiple>
      </LabelMultiple>
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

function QuestionMultiple ({ question, required, choices, selected, onChange }) {
  required = required ? <SpanRequired>*</SpanRequired> : ''
  return (
    <>
      <H4Question>{question}{required}</H4Question>
      <MultipleChoices
        choices={choices} onChange={onChange}
        selected={selected}
      />
    </>
  )
}

export { QuestionMultiple }
