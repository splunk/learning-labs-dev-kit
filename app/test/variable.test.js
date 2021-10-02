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

/* globals beforeAll, beforeEach, test, jest */

const { join, normalize } = require('path')
const { writeJson, ensureFile } = require('fs-extra')
const _ = require('underscore')
const request = require('supertest')
const workspaceDir = '/mount'
const appDir = normalize(join(__dirname, '..'))

async function configureApp (user, author) {
  await jest.resetModules()

  // Create a test auth token
  const token = {
    user: user,
    name: 'Test User'
  }
  const tokenFile = join(workspaceDir, 'token.json')
  await ensureFile(tokenFile)
  await writeJson(tokenFile, token)

  // Create a config.json file
  const config = {
    author: author,
    features: {
      login: true
    }
  }
  const configFile = join(appDir, 'config.json')
  await writeJson(configFile, config)

  // Set environment variable
  process.env.AUTH_TEST_TOKEN = 'token.json'
  process.env.TEST_MEMDB = 'yes'
  disableLogger()
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

const tokens = {}
const user = 'test_user@example.com'
const author = 'test_author@example.com'

async function getUserToken () {
  await configureApp(user, user)

  const { app } = require('../app')
  const agent = request.agent(app)
  await agent.get('/auth').expect(302)
  const res = await agent.get('/api/auth/token')
  return res.body.token
}

async function getAuthorToken () {
  await configureApp(author, author)

  const { app } = require('../app')
  const agent = request.agent(app)
  await agent.get('/auth').expect(302)
  const res = await agent.get('/api/auth/token')
  return res.body.token
}

beforeAll(async () => {
  tokens.user = await getUserToken()
  tokens.author = await getAuthorToken()
})

beforeEach(async () => {
  await configureApp(user, author)
})

test('GET /api/variable should return 401 without token', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)
  await agent.get('/api/variable').expect(401)
})

test('GET /api/variable should return empty object when variables are not configured', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.user)
    .expect(200)
    .expect({})
})

test('PUT /api/variable/user should update user variable successfully', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { uservalue: true }
  await agent
    .put('/api/variable/user')
    .set('JWT', tokens.user)
    .type('json')
    .send(testValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.user)
    .expect(200)
    .expect(testValue)
})

test('PUT /api/variable/user should return 401 without token', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { uservalue: true }
  await agent
    .put('/api/variable/user')
    .type('json')
    .send(testValue)
    .expect(401)
})

test('PUT /api/variable/shared should update shared variable successfully', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { sharedvalue: true }
  await agent
    .put('/api/variable/shared')
    .set('JWT', tokens.author)
    .type('json')
    .send(testValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.author)
    .expect(200)
    .expect(testValue)
})

test('PUT /api/variable/shared should return 403 when token user is not author', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { hello: 'sharedvalue' }
  await agent
    .put('/api/variable/shared')
    .set('JWT', tokens.user)
    .type('json')
    .send(testValue)
    .expect(403)
})

test('PUT /api/variable/shared should return 401 without token', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { hello: 'sharedvalue' }
  await agent
    .put('/api/variable/shared')
    .type('json')
    .send(testValue)
    .expect(401)
})

test('PUT /api/variable/protected should update protected variable successfully', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  await agent.get('/auth').expect(302)
  const testValue = { protectedvalue: true }
  await agent
    .put('/api/variable/protected')
    .set('JWT', tokens.author)
    .type('json')
    .send(testValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.author)
    .expect(200)
    .expect(testValue)
})

test('PUT /api/variable/protected should return 403 when token user is not author', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { hello: 'protectedvalue' }
  await agent
    .put('/api/variable/protected')
    .set('JWT', tokens.user)
    .type('json')
    .send(testValue)
    .expect(403)
})

test('PUT /api/variable/protected should return 401 without token', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const testValue = { hello: 'protectedvalue' }
  await agent
    .put('/api/variable/protected')
    .type('json')
    .send(testValue)
    .expect(401)
})

test('GET /api/variable should not return protected variables for non-authors', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  await agent.get('/auth').expect(302)
  const testValue = { protectedvalue: true }
  await agent
    .put('/api/variable/protected')
    .set('JWT', tokens.author)
    .type('json')
    .send(testValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.user)
    .expect(200)
    .expect({})
})

test('GET /api/variable should return shared variables for non-authors', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  await agent.get('/auth').expect(302)
  const testValue = { sharedvalue: true }
  await agent
    .put('/api/variable/shared')
    .set('JWT', tokens.author)
    .type('json')
    .send(testValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.user)
    .expect(200)
    .expect(testValue)
})

test('GET /api/variable returns a shared variable if the same variable is defined as a user variable', async () => {
  const { app } = require('../app')
  const agent = request.agent(app)

  const userValue = { hello: 'uservalue', useronly: true }
  await agent
    .put('/api/variable/user')
    .set('JWT', tokens.user)
    .type('json')
    .send(userValue)
    .expect(200)

  const sharedValue = { hello: 'sharedvalue', systemonly: true }
  await agent
    .put('/api/variable/shared')
    .set('JWT', tokens.author)
    .type('json')
    .send(sharedValue)
    .expect(200)
  await agent
    .get('/api/variable')
    .set('JWT', tokens.user)
    .expect(200)
    .expect(_.extend(userValue, sharedValue))
})
