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

'use strict'

const express = require('express')
const _ = require('underscore')
const CONST = require('./constant')
const { verifierFactory } = require('./lib/verifier')
const logger = require('./lib/logger').create('Workshop')

// Create Express app
const app = express()

// Load routers
app.use(require('./routers'))

exports.app = app

exports.init = async () => {
  if (CONST.CONFIG.VERIFY) {
    logger.info({ message: 'Initializing Verifier Factory' })
    const globalConfig = {
      timeout: CONST.VERIFY.TIMEOUT,
      appDirectory: CONST.PATH.SUBAPP,
      tempDirectory: CONST.PATH.TEMP,
      debug: _.isObject(CONST.CONFIG.VERIFY) &&
        Boolean(CONST.CONFIG.VERIFY.debug),
      displayAnswer: CONST.CONFIG.DISPLAY_ANSWER,
      redirectUrl: CONST.CONFIG.REDIRECT_URL
    }
    await verifierFactory.init(CONST.CONFIG.VERIFY, globalConfig)
  }
}
