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

const path = require('path')
const fs = require('fs-extra')
const _ = require('underscore')
const logger = require('./lib/logger').create('Workshop')

// -------------------------------------------------------------------
//
// CONSTANTS : PATH
//
// -------------------------------------------------------------------
const PATH = {
  MOUNT: '/mount',
  SUBAPP: path.normalize(path.join(__dirname, '../app_sub')),
  STATIC: '/doc/static',
  TEMP: '/workshop_temp',
  RESOURCES: '/doc/resources'
}

// -------------------------------------------------------------------
//
// CONSTANTS : CONFIG
//
// -------------------------------------------------------------------
const versionFilePath = '/doc/SDK_VERSION'
const config = fs.readJsonSync(path.resolve(__dirname, 'config.json'))
const features = config.features || {}
const CONFIG = {
  LOGIN: Boolean(features.login),
  WORKSHOP: features.login || features.verify,
  TITLE: config.title,
  DOC_ID: process.env.DOC_ID || 'local',
  VERIFY: features.verify || false,
  NPS: _.isUndefined(features.nps) ? true : features.nps,
  SDK_VERSION: fs.existsSync(versionFilePath) ? fs.readFileSync('/doc/SDK_VERSION').toString() : 'local',
  DISPLAY_ANSWER: !_.isObject(features.verify) ? true : !!features.verify.displayAnswer,
  REDIRECT_URL: !_.isObject(features.verify) ? true : features.verify.redirectUrl,
  MAINTAINERS: config.author,
  MEMDB: process.env.TEST_MEMDB === 'yes'
}

// -------------------------------------------------------------------
//
// CONSTANTS : AUTH
//
// -------------------------------------------------------------------
let testToken = false
if (process.env.AUTH_TEST_TOKEN) {
  const pathToken = path.normalize(path.join(PATH.MOUNT, process.env.AUTH_TEST_TOKEN))
  try {
    testToken = Object.freeze(fs.readJsonSync(pathToken))
  } catch (err) {
    logger.critical({ message: `Failed to load ${pathToken}` })
    process.exit(1)
  }
}
const AUTH = {
  TEST_TOKEN: testToken,
  REDIRECT_URL: testToken ? '/auth' : process.env.AUTH_REDIRECT,
  LOGOUT_URL: testToken ? '/logout' : process.env.AUTH_LOGOUT_URL,
  SECRET: testToken ? 'MY SUPER STRONG SECRET' : process.env.AUTH_SECRET
}

// -------------------------------------------------------------------
//
// CONSTANTS : VERIFY
//
// -------------------------------------------------------------------
const VERIFY = {
  HUB_URL: process.env.HUB_REDIRECT || '/',
  TIMEOUT: 10000,
  RETRY_LIMIT: 10000
}

// -------------------------------------------------------------------
//
// CONSTANTS : ERRORCODE
//
// -------------------------------------------------------------------
const ERRORCODE = {
  VERIFY_UNEXPECTED: 1000,
  VERIFY_TIMEOUT: 1001,
  VERIFY_FAILED: 1002,
  VERIFY_RETRYLIMIT: 1003,
  VERIFY_BAD_CONFIG: 1004,
  DATABASE_ERROR: 2000
}

// -------------------------------------------------------------------
//
// CONSTANTS : DATASTORE
//
// -------------------------------------------------------------------
const DATASTORE = {
  URL: '/mount'
}

// -------------------------------------------------------------------
//
// CONSTANTS : SERVICE
//
// -------------------------------------------------------------------
const SERVICE = {
  PROGRESS: process.env.SERVICE_PROGRESS,
  CATALOG: process.env.SERVICE_CATALOG
}

// -------------------------------------------------------------------
//
// CONSTANTS : EVENT
//
// -------------------------------------------------------------------
const EVENT = {
  VERIFY: 'Verify',
  RATING: 'Rating',
  VERIFY_TARGET: 'VerifyTarget'
}

// -------------------------------------------------------------------
//
// CONSTANTS : MODEL
//
// -------------------------------------------------------------------
const MODEL = {
  USER_STATE: 'user_state',
  VARIABLE: 'variable'
}

// -------------------------------------------------------------------
//
// CONSTANTS : ALL
//
// -------------------------------------------------------------------
const CONST = {
  PATH: Object.freeze(PATH),
  CONFIG: Object.freeze(CONFIG),
  AUTH: Object.freeze(AUTH),
  VERIFY: Object.freeze(VERIFY),
  ERRORCODE: Object.freeze(ERRORCODE),
  SERVICE: Object.freeze(SERVICE),
  EVENT: Object.freeze(EVENT),
  DATASTORE: Object.freeze(DATASTORE),
  MODEL: Object.freeze(MODEL)
}

logger.info({ message: 'Constants loaded' })

module.exports = CONST
