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
const models = require('../../models')
const client = require('../../lib/client')
const CONST = require('../../constant')
const logger = require('../../lib/logger').create('Workshop')

const router = express.Router()

router.post('/rating', async function (req, res) {
  try {
    // Update rating
    const user = req.parsedToken.user
    const rating = req.body.rating
    await models.userState.updateRating(user, rating)

    // Log rating
    const docId = CONST.CONFIG.DOC_ID
    const title = CONST.CONFIG.TITLE
    const type = CONST.EVENT.RATING
    const message = 'Rating Submitted'
    const messageObj = { docId, title, user, message, type, rating }
    if (req.body.feedback) {
      messageObj.feedback = req.body.feedback
    }
    if (req.body.more) {
      messageObj.more = req.body.more
    }
    logger.event(messageObj)

    // Update average rating from Doc-hub service
    if (CONST.SERVICE.CATALOG) {
      const averageRating = await models.userState.getAverageRating()
      await client.setCatalogRating(docId, averageRating)
      logger.info({ message: `Updated rating of Doc ${docId} to ${averageRating}` })
    }
    res.json({ data: 'successfully updated' })
  } catch (err) {
    res.json({ error: err.message })
  }
})

module.exports = router
