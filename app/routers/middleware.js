'use strict'

const util = require('util')
const express = require('express')
const cookieParser = require('cookie-parser')
const _ = require('underscore')
const jwt = require('jsonwebtoken')
const CONST = require('../constant')
const models = require('../models')
const logger = require('../lib/logger').create('Workshop')

const jwtVerify = util.promisify(jwt.verify)
const secret = CONST.AUTH.SECRET
const authSupported = !!CONST.AUTH.SECRET && !!CONST.AUTH.REDIRECT_URL

// -----------------------------------------------------------------------------
// Middleware : Auth Token Parser using Cookie or Header
// Use this only with APIs
// -----------------------------------------------------------------------------

const tokenValidator = express.Router()

// Register cookie parser to access JWT token
tokenValidator.use(cookieParser())

tokenValidator.use(async function (req, res, next) {
  const token = req.headers.jwt || req.cookies.JWT

  if (_.isUndefined(token)) {
    logger.info({ message: 'A valid token not found' })
    return res.status(401).json({ error: 'A valid token does not exist in cookie or header' })
  }

  try {
    const decoded = await jwtVerify(token, secret)
    req.token = token
    req.parsedToken = decoded
    next()
  } catch (err) {
    logger.info({ message: 'Invalid Token' })
    return res.status(401).json({ error: 'Provided token is invalid' })
  }
})

exports.tokenValidator = tokenValidator

const loginValidator = express.Router()

// Register cookie parser to access JWT token
loginValidator.use(cookieParser())

loginValidator.use(async function (req, res, next) {
  if (!authSupported) {
    return next()
  }

  const token = req.cookies.JWT
  const redirectUrl = `${CONST.AUTH.REDIRECT_URL}?redirect_from=${req.url}`
  if (_.isUndefined(token)) {
    logger.info({ message: `Token Not Found. Redirecting to ${redirectUrl}` })
    return res.redirect(redirectUrl)
  }

  try {
    const decoded = await jwtVerify(token, CONST.AUTH.SECRET)
    req.parsedToken = decoded
    const user = decoded.user
    const baseUrl = `${req.protocol}://${req.hostname}`
    const parsedUrl = new URL(req.originalUrl, baseUrl)
    if (parsedUrl.pathname === '/' || parsedUrl.pathname.indexOf('.html') >= 0) {
      logger.event({
        docId: CONST.CONFIG.DOC_ID,
        title: CONST.CONFIG.TITLE,
        user: user,
        message: 'Page Accessed',
        type: 'PageView',
        url: req.originalUrl
      })
    }
    await models.userState.updateLastAccessed(user)
    next()
  } catch (err) {
    logger.info({ message: `Invalid Token. Redirecting to ${redirectUrl}` })
    res.redirect(redirectUrl)
  }
})

exports.loginValidator = loginValidator
