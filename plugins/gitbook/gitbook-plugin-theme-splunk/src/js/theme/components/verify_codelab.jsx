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
