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
const { verifierFactory, errors } = require('../../lib/verifier')
const client = require('../../lib/client')
const models = require('../../models')
const CONST = require('../../constant')
const logger = require('../../lib/logger').create('Workshop')

const router = express.Router()

router.post('/verify', async function (req, res) {
  const user = req.parsedToken.user
  // TODO: Skip if specified target is already completed
  try {
    const target = req.body.target
    const data = req.body.data || {}
    const verifier = verifierFactory.create(req.parsedToken, target)
    const result = await verifier.run(data)
    if (result.final) {
      await client.setUserProgressCompleted(user)
      logger.event({
        docId: CONST.CONFIG.DOC_ID,
        title: CONST.CONFIG.TITLE,
        user: user,
        message: 'Verify Status Updated',
        type: CONST.EVENT.VERIFY,
        status: 'Completed'
      })
    }
    res.json({ data: result })
  } catch (err) {
    const error = {}
    error.message = err.message
    if (err instanceof errors.VerifierUserError) {
      logger.event({
        docId: CONST.CONFIG.DOC_ID,
        title: CONST.CONFIG.TITLE,
        user: user,
        message: 'Verify Status Updated',
        type: CONST.EVENT.VERIFY,
        status: 'Failed'
      })
      error.passed = err.passed
    } else if (err instanceof errors.LevelWarning) {
      err.extra = { api: req.originalUrl }
      logger.warn(err)
    } else {
      err.extra = { api: req.originalUrl }
      logger.error(err)
    }
    res.json({ error: error })
  }
})

router.get('/verify', async function (req, res) {
  try {
    const user = req.parsedToken.user
    const data = await models.userState.getUserProgress(user)
    res.json({ data: data })
  } catch (err) {
    err.extra = { api: req.originalUrl }
    logger.error(err)
    res.json({ error: err.message })
  }
})

router.delete('/verify', async function (req, res) {
  try {
    const user = req.parsedToken.user
    await models.userState.deleteProgress(user)
    await client.setUserProgressAttempted(user)
    logger.event({
      docId: CONST.CONFIG.DOC_ID,
      title: CONST.CONFIG.TITLE,
      user: user,
      message: 'Verify Status Updated',
      type: CONST.EVENT.VERIFY,
      status: 'Started'
    })
    res.json({ data: 'successful' })
  } catch (err) {
    err.extra = { api: req.originalUrl }
    logger.error(err)
    res.json({ error: err.message })
  }
})

module.exports = router
