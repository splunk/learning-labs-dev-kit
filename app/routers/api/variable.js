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
const { variable: modelVariable } = require('../../models')
const router = express.Router()

// Register Feature
router.put('/variable/protected', async function (req, res) {
  const user = req.parsedToken.user
  if (!CONST.CONFIG.MAINTAINERS.includes(user)) {
    return res.status(403).json({ error: 'Not Authorized' })
  }

  const variables = req.body
  try {
    const scope = 'protected'
    const returned = await modelVariable.updateVariables(scope, variables)
    res.json(returned.variables)
  } catch (e) {
    res.status(500).json({ error: 'failed to update system variables' })
  }
})

router.put('/variable/shared', async function (req, res) {
  const user = req.parsedToken.user
  if (!CONST.CONFIG.MAINTAINERS.includes(user)) {
    return res.status(403).json({ error: 'Not Authorized' })
  }

  const variables = req.body
  try {
    const scope = 'shared'
    const returned = await modelVariable.updateVariables(scope, variables)
    res.json(returned.variables)
  } catch (e) {
    res.status(500).json({ error: 'failed to update system variables' })
  }
})

router.put('/variable/user', async function (req, res) {
  const user = req.parsedToken.user
  const variables = req.body
  try {
    const scope = user
    const returned = await modelVariable.updateVariables(scope, variables)
    res.json(returned.variables)
  } catch (e) {
    res.status(500).json({ error: 'failed to update user variables' })
  }
})

router.get('/variable', async function (req, res) {
  const user = req.parsedToken.user
  const isMaintainer = CONST.CONFIG.MAINTAINERS.includes(user)
  try {
    const returned = await modelVariable.getVariables(user, isMaintainer)
    res.json(returned)
  } catch (e) {
    res.status(500).json({ error: 'failed to get variables' })
  }
})

module.exports = router
