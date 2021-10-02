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

const { BuildRunner } = require('./build')
const { PublishRunner } = require('./publish')
const { BaseRunner } = require('./base')

class AllRunner extends BaseRunner {
  constructor (cwd, argv, logger, output) {
    super(cwd, argv, logger)
    this.output = output
  }

  async run () {
    const buildRunner = new BuildRunner(this.cwd, this.argv, this.logger, this.output)
    await buildRunner.run()
    const publishRunner = new PublishRunner(this.cwd, this.argv, this.logger)
    return publishRunner.run()
  }
}

exports.AllRunner = AllRunner
