'use strict'

const express = require('express')
const _ = require('underscore')
const CONST = require('./constant')
const { verifierFactory } = require('./lib/verifier')
const logger = require('./lib/logger').create('Workshop')

// Create Express app
const app = express()

// Load routers
app.use(require('./routers'))

exports.app = app

exports.init = async () => {
  if (CONST.CONFIG.VERIFY) {
    logger.info({ message: 'Initializing Verifier Factory' })
    const globalConfig = {
      timeout: CONST.VERIFY.TIMEOUT,
      appDirectory: CONST.PATH.SUBAPP,
      tempDirectory: CONST.PATH.TEMP,
      debug: _.isObject(CONST.CONFIG.VERIFY) &&
        Boolean(CONST.CONFIG.VERIFY.debug),
      displayAnswer: CONST.CONFIG.DISPLAY_ANSWER,
      redirectUrl: CONST.CONFIG.REDIRECT_URL
    }
    await verifierFactory.init(CONST.CONFIG.VERIFY, globalConfig)
  }
}
