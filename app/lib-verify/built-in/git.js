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

const { exec } = require('child_process')

exports.checkRepo = function (repo) {
  return new Promise((resolve, reject) => {
    const command = `git ls-remote ${repo}`
    const options = {
      env: {
        GIT_TERMINAL_PROMPT: 0
      }
    }
    exec(command, options, (err, stdout) => {
      if (err) {
        const error = new Error(`Repository ${repo} does not exist. Please check if the repository is public`)
        error.original = err
        reject(error)
      } else {
        console.log(`Repository ${repo} exists`)
        resolve()
      }
    })
  })
}

exports.clone = function (repo, cwd) {
  return new Promise((resolve, reject) => {
    const command = `git clone ${repo} .`
    const options = {
      cwd: cwd
    }
    exec(command, options, (err, stdout) => {
      if (err) {
        const error = new Error(`Failed to clone repository ${repo}`)
        error.original = err
        reject(error)
      } else {
        console.log(`Successfully cloned repository ${repo}`)
        resolve()
      }
    })
  })
}
