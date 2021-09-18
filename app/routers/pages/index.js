'use strict'

const util = require('util')
const express = require('express')
const jwt = require('jsonwebtoken')
const _ = require('underscore')
const CONST = require('../../constant')
const middleware = require('../middleware')
const logger = require('../..//lib/logger').create('Workshop')

const jwtSign = util.promisify(jwt.sign)

const router = express.Router()

// Test Pages for authentication
router.get('/auth', async function (req, res) {
  if (!CONST.AUTH.TEST_TOKEN) {
    return res.sendStatus(404)
  }

  let token = CONST.AUTH.TEST_TOKEN
  if (req.query.user || req.query.name) {
    token = _.clone(token)
    token.user = req.query.user
    token.name = req.query.name
  }

  const redirectUrl = req.query.redirect_from || '/'
  const signedToken = await jwtSign(token, CONST.AUTH.SECRET)
  res.cookie('JWT', signedToken)
  res.redirect(redirectUrl)
})

router.get('/logout', function (req, res) {
  if (!CONST.AUTH.TEST_TOKEN) {
    return res.sendStatus(404)
  }
  res.send('logged out!')
})

// Check
router.get('/ready', function (req, res) {
  res.send('ready')
})

// Serve files as attachment
//
// NOTE: DO NOT put this after loginValidator because we want resources to be
// accessible without login
logger.info({ message: 'Page Router: Added /resources handler' })
router.use('/resources', require('./resources'))

// The middleware for login validation should be placed after test auth page
if (CONST.CONFIG.LOGIN) {
  logger.info({ message: 'Page Router: Added Login Middleware' })
  router.use(middleware.loginValidator)
}

// Register static file handler
//
// NOTE: This MUST be the last one because this serves all path
logger.info({ message: 'Page Router: Static file handler' })
router.use(require('./static'))

module.exports = router
