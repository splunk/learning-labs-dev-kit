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

/* globals mkdir, cp */

const { spawnSync } = require('child_process')
const { join } = require('path')
const argv = process.argv.slice(2)
const isDev = argv[0] === 'dev'

const workspaceDir = process.env.WORKSPACE || '/workspace'
const destDir = '/kit'
const sourceDirs = ['app', 'scripts']
const sourceList = sourceDirs.map(dir => join(workspaceDir, dir))
const destList = sourceDirs.map(dir => join(destDir, dir))

function spawn (cmd, args, options = {}) {
  options.stdio = 'inherit'
  const res = spawnSync(cmd, args, options)
  if (res.error) {
    throw res.error
  }
}

if (!isDev) {
  // Create app directories
  console.log(`Creating directory ${destDir}`)
  mkdir('-p', destDir)
}

// Copy files
for (const source of sourceList) {
  console.log(`Copy files from ${source} to ${destDir}`)
  cp('-r', source, destDir)
}

if (!isDev) {
  // Build npm dependencies
  for (const dest of destList) {
    console.log(`Install NPM dependencies at ${dest}`)
    spawn('npm', ['install'], { cwd: dest })
  }
}

// Start app testing
const appDir = join(destDir, 'app')
spawn('npm', ['test'], { cwd: appDir })
