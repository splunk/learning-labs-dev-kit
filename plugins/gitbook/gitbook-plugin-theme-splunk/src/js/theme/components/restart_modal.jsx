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
import { Modal } from 'react-bootstrap'

function RestartModal ({ show, onRestart, onClose }) {
  return (
    <Modal show={show} size='lg'>
      <div className='modal-content'>
        <div className='modal-header'>
          Restart Workshop
        </div>
        <div className='modal-body'>
          <p>You already started or completed this workshop before.</p>
          <p>Do you want to try this workshop again?</p>
        </div>
        <div
          className='modal-footer'
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <button type='button' className='btn btn-primary' onClick={onRestart}>
            Start Workshop Again
          </button>
          <button type='button' className='btn btn-secondary' onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export { RestartModal }
