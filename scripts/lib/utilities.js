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

const { spawn } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const toml = require('toml')

class Utilities {
  constructor (logger) {
    this.logger = logger
  }

  async copyContents (pathSrc, pathDest) {
    return this.copyFiles(pathSrc, pathDest)
  };

  async copyScripts (pathSrc, pathDest) {
    const options = {
      extList: ['.json', '.js'],
      blacklist: ['node_modules']
    }
    return this.copyFiles(pathSrc, pathDest, options)
  };

  async copyFiles (pathSrc, pathDest, options = {}) {
    try {
      const extList = options.extList || []
      const blacklist = options.blacklist || []

      this.logger.log(`Copying files from ${pathSrc} to ${pathDest}`)
      await fs.copy(pathSrc, pathDest, {
        filter: (src, dest) => {
          const stat = fs.statSync(src)
          const parsedPath = path.parse(src)
          const include = (stat.isDirectory() && blacklist.indexOf(parsedPath.base) < 0) ||
                    (stat.isFile() && (extList.length <= 0 || extList.indexOf(parsedPath.ext) >= 0))
          if (include) {
            this.logger.log(` * copying ${src} to ${dest}`)
          }
          return include
        }
      })
      return true
    } catch (e) {
      this.logger.log(e)
      this.logger.log('Failed to copy files')
      return false
    }
  };

  async readToml (pathConfig) {
    try {
      await fs.ensureFile(pathConfig)
      const config = toml.parse(await fs.readFile(pathConfig))
      return config
    } catch (e) {
    }
    return null
  };

  async readJson (pathConfig) {
    try {
      await fs.ensureFile(pathConfig)
      const config = JSON.parse(await fs.readFile(pathConfig))
      return config
    } catch (e) {
    }
    return null
  };

  installNpm (path) {
    const command = 'npm'
    const params = ['install', '-d']
    const options = { stdio: 'inherit', cwd: path }
    return new Promise((resolve, reject) => {
      const cp = spawn(command, params, options)
      cp.on('error', (err) => {
        this.logger.log(err.message)
      })
      cp.on('exit', (code) => {
        if (code) {
          const message = `Failed to install npm modules at ${path}`
          return reject(new Error(message))
        } else {
          return resolve()
        }
      })
    })
  }

  spawn (command, params) {
    return new Promise((resolve, reject) => {
      const options = { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] }
      this.logger.log(`spawning process : ${command} ${params.join(' ')}`)
      const cp = spawn(command, params, options)
      this.logger.pipe(cp.stdout)
      this.logger.pipe(cp.stderr)
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
}

exports.Utilities = Utilities
