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

import { Verify } from './verify.jsx'
import { CodeEditor } from './code_editor.jsx'
import React, { useState } from 'react'

function CodelabBlock ({
  targetDef, readyMessage, doneMessage, status,
  onVerifyRequest, onFailed, onAccepted
}) {
  const [passed, setPassed] = useState([])
  const [failed, setFailed] = useState([])
  const [buttonStatus, setButtonStatus] = useState(status)
  const [userInput, setUserInput] = useState('')
  const target = targetDef.name
  const height = targetDef.editorHeight
  const language = targetDef.language || 'cpp'

  const processMessage = (body) => {
    setPassed(body.error ? (body.error.passed || []) : body.data.passed)
    setFailed(body.error ? [body.error.message] : [])
    const accepted = !body.error

    if (accepted) {
      setButtonStatus('done')
      onAccepted(body.data)
    } else {
      setButtonStatus('ready')
      onFailed()
    }
  }

  const handleButtonClick = async () => {
    setPassed([])
    setFailed([])
    setButtonStatus('verifying')
    const body = await onVerifyRequest(target, { input: userInput })
    processMessage(body)
  }

  return (
    <>
      <CodeEditor
        text={userInput}
        onChange={setUserInput}
        language={language}
        height={height}
      />
      <Verify.Button
        readyMessage={readyMessage}
        doneMessage={doneMessage} status={buttonStatus}
        onClick={handleButtonClick}
      />
      <Verify.MessageBox passed={passed} failed={failed} />
    </>
  )
}

export {
  CodelabBlock
}
