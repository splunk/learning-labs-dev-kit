'use strict'

const express = require('express')
const CONST = require('../../constant')

const router = express.Router()
const authSupported = !!CONST.AUTH.SECRET && !!CONST.AUTH.REDIRECT_URL

router.get('/auth', function (req, res) {
  if (!authSupported) {
    return res.json({ error: 'Not Supported' })
  }

  res.json(req.parsedToken)
})

if (CONST.AUTH.TEST_TOKEN) {
  router.get('/auth/token', function (req, res) {
    res.json({ token: req.token })
  })
}

module.exports = router
