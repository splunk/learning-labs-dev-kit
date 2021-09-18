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
