'use strict'

const express = require('express')
const CONST = require('../constant')
const logger = require('../lib/logger').create('Workshop')

const router = express.Router()

// Register URL tracker
router.use((req, res, next) => {
  logger.debug({
    message: 'HTTP Request',
    method: req.method,
    url: req.originalUrl
  })
  next()
})

// Register APIs for workshop
if (CONST.CONFIG.WORKSHOP) {
  logger.info({ message: 'WORKSHOP mode enabled' })
  logger.info({ message: 'API Router: Initializing' })
  router.use('/api', require('./api'))
}

// Register page handler
logger.info({ message: 'Page Router: Initializing' })
router.use(require('./pages'))

module.exports = router
