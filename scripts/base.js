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

const path = require('path')
const fs = require('fs-extra')
const { Logger } = require('./lib/logger')

class BaseRunner {
  constructor (cwd, argv, logger) {
    this.cwd = cwd
    this.argv = argv || {}
    if (logger instanceof Logger) {
      this.logger = logger
    } else {
      const logFile = path.normalize(path.join(cwd, 'doc-hub-cli.log'))
      this.logger = new Logger(logFile, { verbose: argv.verbose })
    }
  }

  async _getJsonFile (pathFile) {
    let stat
    try {
      stat = await fs.stat(pathFile)
    } catch (err) {
      const error = new Error(`${pathFile} is not found`)
      error.original = err
      throw error
    }

    if (!stat.isFile()) {
      const error = new Error(`${pathFile} is not a file`)
      throw error
    }

    try {
      const data = await fs.readFile(pathFile)
      return JSON.parse(data.toString())
    } catch (err) {
      const error = new Error(`${pathFile} is not a valid JSON file`)
      error.original = err
      throw error
    }
  }

  async _createJsonFile (pathFile, data) {
    try {
      await fs.writeFile(pathFile, JSON.stringify(data))
    } catch (err) {
      const error = new Error(`Failed to create ${pathFile}`)
      error.original = err
      throw error
    }
  }

  async _parseConfig () {
    const configFile = path.normalize(path.join(this.cwd, 'book.json'))
    this.parsedConfig = await this._getJsonFile(configFile)
  }

  async waitForLog () {
    console.log('in waitForLog')
    return this.logger.waitFlush()
  }
}

exports.BaseRunner = BaseRunner
