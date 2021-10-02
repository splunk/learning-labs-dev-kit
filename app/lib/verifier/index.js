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

const { join } = require('path')
const { statSync, existsSync } = require('fs')
const _ = require('underscore')
const { errors } = require('./base')
const { VerifierConfirm } = require('./type_confirm')
const { VerifierQuiz } = require('./type_quiz')
const { VerifierScript } = require('./type_script')
const { VerifierSurvey } = require('./type_survey')
const { VerifierCodelab } = require('./type_codelab')

const VERIFY_TYPE = {
  CONFIRM: 'confirm',
  SCRIPT: 'script',
  QUIZ: 'quiz',
  SURVEY: 'survey',
  CODE_LAB: 'codelab'
}

class VerifierFactoryInitError extends errors.LevelError {
}
errors.VerifierFactoryInitError = VerifierFactoryInitError

class VerifierTargetNameError extends errors.LevelError {
}
errors.VerifierTargetNameError = VerifierTargetNameError

class VerifierFactory {
  constructor () {
    this.classes = {}
    this.classes[VERIFY_TYPE.CONFIRM] = VerifierConfirm
    this.classes[VERIFY_TYPE.QUIZ] = VerifierQuiz
    this.classes[VERIFY_TYPE.SCRIPT] = VerifierScript
    this.classes[VERIFY_TYPE.SURVEY] = VerifierSurvey
    this.classes[VERIFY_TYPE.CODE_LAB] = VerifierCodelab
    this.initalized = false
    this.config = {
      targets: []
    }
  }

  async _verifyConfigDef (config, globalConfig) {
    // Check configuration for 'verify' feature
    if (!_.isObject(config) && !_.isBoolean(config)) {
      throw new errors.VerifierConfigError('Verification feature not configured correctly')
    }
    if (_.isBoolean(config) && !config) {
      throw new errors.VerifierConfigError('Verification feature is disabled')
    }

    // Set default targets for backward compatibility
    // When verify feature set set to 'true', default verification type
    // will be set to 'confirm'.
    if (_.isBoolean(config)) {
      const SCRIPT_TARGET = 'verify'
      const SCRIPT_FILE = 'verify.js'
      const CONFIRM_TARGET = 'confirm'

      // Check if script file exists
      const pathScript = join(globalConfig.appDirectory, SCRIPT_FILE)
      const foundScript = existsSync(pathScript) &&
                (statSync(pathScript).isFile())

      config = {}
      if (foundScript) {
        config.targets = [
          {
            name: SCRIPT_TARGET,
            type: VERIFY_TYPE.SCRIPT,
            file: SCRIPT_FILE
          }
        ]
      } else {
        config.targets = [
          {
            name: CONFIRM_TARGET,
            type: VERIFY_TYPE.CONFIRM
          }
        ]
      }
    }

    // Check verify.targets contain valid target definitions
    if (!_.isArray(config.targets)) {
      throw new errors.VerifierConfigError('verify.targets must be type of Array')
    }
    if (config.targets.length <= 0) {
      throw new errors.VerifierConfigError('verify.targets must have at least one element')
    }

    // Verify each target
    for (const targetDef of config.targets) {
      if (!_.isObject(targetDef)) {
        throw new errors.VerifierConfigError('target definition must be type of Object')
      }
      if (!_.isString(targetDef.type)) {
        throw new errors.VerifierConfigError('target definition must have a String property "type"')
      }
      const classDef = this.classes[targetDef.type]
      if (!classDef) {
        const message = `"${targetDef.type}" is not a valid target type`
        throw new errors.VerifierConfigError(message)
      }
      targetDef.global = globalConfig
      classDef.verifyTargetDef(targetDef)
      targetDef.classDef = classDef
      this.config.targets.push(targetDef)
    }

    // Check target names are unique
    const targetNames = this.config.targets.map(target => target.name)
    const uniqueTargetNames = _.unique(targetNames)
    if (targetNames.length !== uniqueTargetNames.length) {
      throw new errors.VerifierConfigError('Found targets with duplicated names')
    }
  }

  async init (config, globalConfig) {
    if (this.initalized) {
      return
    }
    await this._verifyConfigDef(config, globalConfig)
    this.initalized = true
  }

  create (token, targetName) {
    targetName = targetName.split('.')[0]
    if (!this.initalized) {
      const message = 'VerifierFactory is not inialized'
      throw new VerifierFactoryInitError(message)
    }
    const targetDef = this.config.targets.find((targetDef) => {
      return targetDef.name === targetName
    })
    if (!targetDef) {
      const message = `there is no verification target named as "${targetName}"`
      throw new VerifierTargetNameError(message)
    }
    const Class = targetDef.classDef
    return new Class(token, targetDef, this.config.targets)
  }
}

exports.verifierFactory = new VerifierFactory()
exports.errors = errors
