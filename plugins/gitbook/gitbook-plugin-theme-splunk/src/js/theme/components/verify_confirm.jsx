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
