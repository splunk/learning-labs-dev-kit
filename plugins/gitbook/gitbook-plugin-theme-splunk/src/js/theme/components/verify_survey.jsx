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

import { SurveyModal } from './survey_modal.jsx'
import { Verify } from './verify.jsx'

function SurveyBlock ({
  targetDef,
  readyMessage,
  doneMessage,
  status,
  onVerifyRequest,
  onAccepted
}) {
  const [questionDefs, setQuestionDefs] = React.useState([])
  const [page, setPage] = React.useState(1)
  const [failed, setFailed] = React.useState([])
  const [buttonStatus, setButtonStatus] = React.useState(status)
  const [modalShow, setModalShow] = React.useState(false)
  const target = targetDef.name

  const processMessage = body => {
    const failed = []
    let accepted = false
    if (body.error) {
      failed.push(body.error.message)
    } else {
      accepted = true
    }
    setFailed(failed)
    setModalShow(false)
    if (accepted) {
      setButtonStatus('done')
      onAccepted(body.data)
    } else {
      setButtonStatus('ready')
    }
  }
  const handleSubmit = async answers => {
    const body = await onVerifyRequest(target, answers)
    processMessage(body)
  }
  const handleClose = () => {
    setButtonStatus('ready')
    setModalShow(false)
  }
  const handleButtonClick = async () => {
    setFailed([])
    setButtonStatus('verifying')
    const body = await onVerifyRequest(target)
    if (!body.data.pending) {
      processMessage(body)
    }
    setQuestionDefs(body.data.pending.questions)
    setModalShow(true)
    setPage(1)
  }

  const ref = React.createRef()

  const handlePageChange = page => {
    setPage(page)
  }

  return (
    <div ref={ref}>
      <SurveyModal
        questionDefs={questionDefs}
        show={modalShow}
        page={page}
        onSubmit={handleSubmit}
        onClose={handleClose}
        onPageChange={handlePageChange}
      />
      <Verify.Button
        readyMessage={readyMessage}
        doneMessage={doneMessage}
        status={buttonStatus}
        onClick={handleButtonClick}
      />
      <Verify.MessageBox passed={[]} failed={failed} />
    </div>
  )
}

export { SurveyBlock }
