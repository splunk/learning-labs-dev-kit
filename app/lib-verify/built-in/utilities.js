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
const { parse, join } = require('path')
const fs = require('fs-extra')

exports.createUserTempDir = function (pathBase, user) {
  return new Promise((resolve, reject) => {
    const epochTime = (new Date()).getTime()
    const path = join(pathBase, `temp/${user}/${epochTime}`)
    fs.ensureDir(path, (err) => {
      if (err) {
        const error = new Error('Internal Error : Failed to create a temporary directory. Please try again')
        error.original = err
        reject(error)
      } else {
        console.debug(`Created directory ${path}`)
        resolve(path)
      }
    })
  })
}

exports.deleteUserTempDir = function (pathBase, user) {
  return new Promise((resolve, reject) => {
    const path = join(pathBase, `temp/${user}`)
    fs.remove(path, (err) => {
      if (err) {
        const error = new Error(`Internal Error : Failed to remove the directory ${path}`)
        error.original = err
        reject(error)
      } else {
        console.debug(`Successfully deleted ${path}`)
        resolve()
      }
    })
  })
}

exports.fileExists = function (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      const parsed = parse(path)
      if (err) {
        const error = new Error(`file ${parsed.base} does not exist`)
        error.original = err
        reject(error)
      } else if (!stat.isFile()) {
        const error = new Error(`${parsed.base} is not a file`)
        reject(error)
      } else {
        console.log(`File ${parsed.base} exists`)
        resolve()
      }
    })
  })
}

exports.verifyPublicKey = function (path) {
  return new Promise((resolve, reject) => {
    const command = `ssh-keygen -l -f ${path}`
    const parsed = parse(path)
    exec(command, (err, stdout) => {
      if (err) {
        const error = new Error(`${parsed.base} is not a valid RSA public key`)
        error.original = err
        reject(error)
      } else {
        console.log(`${parsed.base} is a valid RSA public key`)
        resolve()
      }
    })
  })
}
