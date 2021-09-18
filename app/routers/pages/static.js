'use strict'

const CONST = require('../../constant')
const express = require('express')
var serveStatic = require('serve-static')

const router = express.Router()
router.use(serveStatic(CONST.PATH.STATIC, {
  cacheControl: 'no-cache'
}))

module.exports = router
