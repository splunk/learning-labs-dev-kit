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

const { copy, outputJson, pathExists } = require('fs-extra')
const { join } = require('path')
const { spawn } = require('child_process')

const PATH_SRC = '/src'
const PATH_DEST = '/kit'
const PATH_DOC = process.argv[2] || 'test_doc'

async function copyFiles () {
  console.log('Copying mounted files to /kit')
  const options = {
    filter: (src, dest) => {
      if (src.includes('node_modules')) {
        return false
      }
      return true
    }
  }
  const dirs = ['scripts', 'app', 'app_sub', 'plugins']
  for (const dir of dirs) {
    await copy(join(PATH_SRC, dir), join(PATH_DEST, dir), options)
  }
  await copy(join(PATH_SRC, 'tests', PATH_DOC), '/mount', options)
  console.log('Completed copying mounted files')
}

function spawnWrapped (command, params, cwd) {
  return new Promise((resolve, reject) => {
    const options = {
      cwd: cwd,
      stdio: ['ignore', 'inherit', 'inherit']
    }
    const cp = spawn(command, params, options)
    let failed = false
    cp.on('error', (err) => {
      if (!failed) {
        failed = true
        const error = new Error(`Failed to execute ${command}`)
        error.original = err
        reject(error)
      }
    })
    cp.on('exit', (code) => {
      if (code) {
        if (!failed) {
          failed = true
          reject(new Error(`Failed to execute ${command}`))
        }
      } else {
        resolve()
      }
    })
  })
}

async function buildTheme () {
  console.log('Building Plugin Theme')
  const cwd = '/kit/plugins/gitbook/gitbook-plugin-theme-splunk'
  const cmd = 'npm'
  const params = ['run', 'build']
  await spawnWrapped(cmd, params, cwd)
}

async function buildDoc () {
  console.log('Building Doc')
  const cwd = '/kit/scripts'
  const cmd = 'node'
  const params = ['launch.js', 'build', '--noimage', '--verbose']
  await spawnWrapped(cmd, params, cwd)
  await copy('/kit/plugins/gitbook/book.json', '/kit/app/config.json')
  await copy('/kit/static', '/doc/static')
  await copy('/kit/SDK_VERSION', '/doc/SDK_VERSION')
  if (await pathExists('/kit/resources')) {
    await copy('/kit/resources', '/doc/resources')
  }
}

async function createTestToken () {
  const pathToken = join('/mount', 'token.json')
  console.log('Creating a test token')
  const data = {
    user: 'test_user@example.com',
    name: 'Test User'
  }
  await outputJson(pathToken, data)
  console.log(`Successfully create auth token at ${pathToken}`)
}

async function launchAppServer () {
  console.log('Run Doc at http://localhost:4000')
  process.env.AUTH_TEST_TOKEN = 'token.json'
  const cwd = '/'
  const cmd = 'node'
  const params = ['/kit/app/server.js', '--port', '4000']
  await spawnWrapped(cmd, params, cwd)
}

async function main () {
  await copyFiles()
  await buildTheme()
  await buildDoc()
  await createTestToken()
  await launchAppServer()
}

main().then(() => {
  console.log('completed')
}).catch((e) => {
  console.log(e)
})
