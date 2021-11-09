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
const CONST = require('../constant')
const logger = require('../lib/logger').create('Workshop')

const router = express.Router()

// Register URL tracker
router.use((req, res, next) => {
  logger.debug({
    message: 'HTTP Request',
    method: req.method,
    url: req.originalUrl
  })
  next()
})

// Register APIs for workshop
if (CONST.CONFIG.WORKSHOP) {
  logger.info({ message: 'WORKSHOP mode enabled' })
  logger.info({ message: 'API Router: Initializing' })
  router.use('/api', require('./api'))
}

// Register page handler
logger.info({ message: 'Page Router: Initializing' })
router.use(require('./pages'))

module.exports = router
