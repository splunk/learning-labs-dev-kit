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
const CONST = require('../../constant')

const router = express.Router()

// Register Feature
router.get('/features', function (req, res) {
  const features = {}
  if (CONST.CONFIG.WORKSHOP) {
    features.login = {
      urlLogout: CONST.AUTH.LOGOUT_URL,
      name: req.parsedToken.name
    }
    features.verify = {
      urlHub: CONST.VERIFY.HUB_URL,
      nps: CONST.CONFIG.NPS,
      displayAnswer: CONST.CONFIG.DISPLAY_ANSWER
    }
  }
  res.json(features)
})

module.exports = router
