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
