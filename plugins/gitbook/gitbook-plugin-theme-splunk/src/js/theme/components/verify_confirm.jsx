import { Verify } from './verify.jsx'
import React from 'react'

function ConfirmBlock ({
  targetDef, readyMessage, doneMessage, status,
  onVerifyRequest, onAccepted
}) {
  const [failed, setFailed] = React.useState([])
  const [buttonStatus, setButtonStatus] = React.useState(status)
  const target = targetDef.name

  const processMessage = (body) => {
    if (body.error) {
      setFailed([body.error.message])
      setButtonStatus('ready')
      return
    }
    setButtonStatus('done')
    onAccepted(body.data)
  }
  const handleButtonClick = async () => {
    setFailed([])
    setButtonStatus('verifying')
    const body = await onVerifyRequest(target)
    processMessage(body)
  }

  return (
    <>
      <Verify.Button
        readyMessage={readyMessage}
        doneMessage={doneMessage} status={buttonStatus}
        onClick={handleButtonClick}
      />
      <Verify.MessageBox passed={[]} failed={failed} />
    </>
  )
}

export { ConfirmBlock }
