'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const CONST = require('../../constant')
const logger = require('../../lib/logger').create('Workshop')
const middleware = require('../middleware')

const router = express.Router()

router.use(middleware.tokenValidator)

// Register body parser to decode JSON body
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }))

// Register API endpoints
logger.info({ message: 'API Router: Added /api/auth handler' })
router.use(require('./auth'))

if (CONST.CONFIG.VERIFY) {
  logger.info({ message: 'API Router: Added /api/verify handler' })
  router.use(require('./verify'))
}

logger.info({ message: 'API Router: Added /api/rating handler' })
router.use(require('./rating'))

logger.info({ message: 'API Router: Added /api/features handler' })
router.use(require('./features'))

logger.info({ message: 'API Router: Added /api/variable handler' })
router.use(require('./variable'))

// Register API endpoints injected from a workshop
try {
  const subApp = require(CONST.PATH.SUBAPP)
  if (subApp) {
    router.use(subApp.mount, subApp.router)
    logger.info({ message: `API Router: Extended endpoint ${subApp.mount}` })
  }
} catch (err) {
}

module.exports = router
