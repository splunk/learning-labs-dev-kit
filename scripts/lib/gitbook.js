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

const fs = require('fs-extra')
const _ = require('underscore')
const { Utilities } = require('./utilities')

class Gitbook {
  constructor (logger) {
    this.logger = logger
    this.utilities = new Utilities(this.logger)
  }

  async writeMergedConfig (customConfig, pathConfig) {
    this.logger.log('Updating Gitbook configuration file')
    let baseConfig
    try {
      baseConfig = await fs.readJson(pathConfig)
    } catch (e) {
      this.logger.log(`Failed to read Gitbook configuration file from ${pathConfig}`)
      this.logger.log(e)
      return false
    }

    try {
      baseConfig.title = customConfig.title
      baseConfig.features = customConfig.features || {}
      baseConfig.author = customConfig.maintainer.join(';')
      _.extend(baseConfig.pluginsConfig, customConfig.pluginsConfig)
      await fs.writeFile(pathConfig, JSON.stringify(baseConfig, null, 4))
      this.logger.log(` * Succesfully updated Gitbook configuration file at ${pathConfig}`)
      return true
    } catch (e) {
      this.logger.log(`Failed to update Gitbook configuration file at ${pathConfig}`)
      this.logger.log(e)
      return false
    }
  };

  async build (version, pathBook, pathOutput) {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' BUILD STATIC SITE USING GITBOOK')
    this.logger.log('')
    this.logger.log('------------------------------------')
    const command = 'gitbook'
    let args = []
    if (version) {
      args = args.concat(['--gitbook', version])
    }
    args = args.concat(['build', '--log', 'debug', pathBook, pathOutput])

    await this.utilities.spawn(command, args)
  };
}

exports.Gitbook = Gitbook
