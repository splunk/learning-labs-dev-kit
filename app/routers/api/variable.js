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
