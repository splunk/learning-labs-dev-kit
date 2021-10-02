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

/* globals test, jest */
const request = require('supertest')
const { basename } = require('path')

jest.mock('../routers/pages/static', () => {
  const { Router } = require('express')
  const router = Router()
  router.get('*', async (req, res) => res.sendStatus(200))
  return router
})

async function configureApp ({ login }) {
  await jest.resetModules()

  // Mock readJsonSync
  jest.mock('fs-extra')
  const fs = require('fs-extra')
  fs.readJsonSync.mockImplementation(path => {
    if (basename(path) === 'config.json') {
      return {
        features: {
          login: login
        }
      }
    }
    return {}
  })

  // Set environment variable
  disableLogger()

  // Disable datastore auto load
  process.env.TEST_MEMDB = 'yes'
}

// Disable Logger
function disableLogger () {
  jest.mock('../lib/logger')
  const { create } = require('../lib/logger')
  create.mockImplementation(() => {
    const levels = ['info', 'event', 'debug', 'warn', 'error', 'critical']
    const obj = {}
    levels.forEach(level => {
      obj[level] = () => {}
    })
    return obj
  })
}

test('GET / should return 200 if login is disabled', async () => {
  await configureApp({ login: false })
  const { app } = require('../app')
  const agent = request.agent(app)
  await agent.get('/').expect(200)
})

test('GET / should return 302 if login is enabled and not logged in', async () => {
  await configureApp({ login: true })
  process.env.AUTH_REDIRECT = '/login'
  process.env.AUTH_SECRET = 'TEST SECRET'
  const { app } = require('../app')
  const agent = request.agent(app)
  await agent.get('/').expect(302)
})
