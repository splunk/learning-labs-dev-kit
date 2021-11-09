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
const { statSync } = require('fs')
const _ = require('underscore')
const models = require('../../models')
const errors = require('../errors')
const logger = require('../logger').create('Workshop')
const CONST = require('../../constant')

class VerifierConfigError extends errors.LevelError {
}
errors.VerifierConfigError = VerifierConfigError

class VerifierRetryLimitError extends errors.LevelWarning {
}
errors.VerifierRetryLimitError = VerifierRetryLimitError

class VerifierBase {
  /**
     *
     * @param {Object} token
     * @param {Object} targetDef
     * @param {Array}  targets,
     */
  constructor (token, targetDef, targets) {
    this.targetDef = targetDef
    this.targets = targets
    this.user = token.user
    this.username = token.user.split('@')[0]
    this.retryLimit = targetDef.retryLimit || 0
  }

  async run (data = {}) {
    logger.debug({ message: `checking verify retry limit for user ${this.user}` })
    await this._checkRetryLimit()

    const message = `running verification target ${this.targetDef.name}` +
            ` for user ${this.user}`
    logger.debug({ message: message })
    const result = await this._runVerification(data)

    if (result.pending) {
      const message = `updated target status of ${this.targetDef.name}` +
                ` to pending for user ${this.user}`
      logger.debug({ message: message })
      await this._setTargetToPending(result.pending)
    } else {
      const message = `updated target status of ${this.targetDef.name}` +
                ` to completed for user ${this.user}`
      logger.debug({ message: message })
      await this._setTargetToCompleted()

      // Add a log for each completed target
      const logObj = {
        docId: CONST.CONFIG.DOC_ID,
        title: CONST.CONFIG.TITLE,
        user: this.user,
        message: 'Verify Target Completed',
        target: this.targetDef.name,
        type: CONST.EVENT.VERIFY_TARGET,
        status: 'Completed'
      }
      if (result.data) {
        logObj.data = data
      }
      logger.event(logObj)
    }

    result.final = await this._isFinal()
    if (result.final) {
      const message = `updating workshop progress of ${this.targetDef.name}` +
                ` to completed for user ${this.user}`
      logger.debug({ message: message })
      await this._setProgresToCompleted()
    }

    logger.debug({ message: `sending success response for user ${this.user}` })
    return result
  }

  async _checkRetryLimit () {
    if (!this.retryLimit) {
      return models.userState.updateLastVerified(this.user, new Date())
    }

    const state = await models.userState.get({ user: this.user })
    if (!state.lastVerified) {
      return models.userState.updateLastVerified(this.user, new Date())
    }

    const retryInterval = new Date() - state.lastVerified
    if (retryInterval > this.retryLimit) {
      return models.userState.updateLastVerified(this.user, new Date())
    }

    const retryWait = ((this.retryLimit - retryInterval) / 1000).toFixed(1)
    const message = `Please wait ${retryWait} s to submit your solution again`
    throw new VerifierRetryLimitError(message)
  }

  async _setProgresToCompleted () {
    await models.userState.updateProgress(this.user, 'completed')
  }

  async _setTargetToPending (pendingData) {
    await models.userState.updateTargetStatus(this.user,
      this.targetDef.name, pendingData)
  }

  async _setTargetToCompleted () {
    await models.userState.updateTargetStatus(this.user,
      this.targetDef.name, 'completed')
  }

  async _getTargetStatus () {
    const query = { user: this.user }
    const projection = { targetStatus: 1 }
    const userState = await models.userState.get(query, projection)
    if (!_.isObject(userState.targetStatus)) {
      return {}
    }
    const targetStatus = userState.targetStatus[this.targetDef.name] || {}
    return targetStatus
  }

  async _isFinal () {
    const data = await models.userState.getUserProgress(this.user)
    const isFinal = this.targets.every((targetDef) => {
      return data.targetsCompleted[targetDef.name]
    })
    return isFinal
  }

  /** This function should be implemented by a child class whenever a new verifier class
   * is created. When extending this VerifierBase class, this function is inherited but
   * should be overridden. This function is expected to throw an error when verification
   * fails otherwise a result array with a passed attribute should be returned.
   * Example return object when verification PASSED:
   * return {
                "passed" : [
                    "message",
                    "message2",
                    ...
                ]
            }
   * Example when verification FAILED:
   *  const error = new Error('error message')
   *  error.passed = ['msg1', 'msg2', ... ] // This is optional
   *  throw error
   *
   * */
  async _runVerification () {
    throw new errors.LevelCritical('Not Implemented')
  }

  static verifyTargetDef (targetDef) {
    if (!_.isString(targetDef.name)) {
      const message = 'target definition must have a String property "name"'
      throw new VerifierConfigError(message)
    }
    if (!targetDef.name.match(/^[a-zA-Z0-9]+$/)) {
      const message = 'target name must be alphanumeric'
      throw new VerifierConfigError(message)
    }
  }

  static verifyTargetFileDef (targetDef) {
    if (!_.isString(targetDef.file)) {
      const message = 'target definition must have a String property "file"'
      throw new VerifierConfigError(message)
    }
    targetDef.filepath = join(targetDef.global.appDirectory, targetDef.file)
    const filestat = statSync(targetDef.filepath)
    if (!filestat.isFile()) {
      const message = 'specified file in target definition is not found'
      throw new VerifierConfigError(message)
    }
  }

  static verifyTargetTimeoutDef (targetDef) {
    // verify timeout
    if (!_.isUndefined(targetDef.timeout) && !_.isNumber(targetDef.timeout)) {
      const message = '"timeout" property in target definition must be type of Number'
      throw new VerifierConfigError(message)
    } else if (_.isUndefined(targetDef.timeout)) {
      targetDef.timeout = targetDef.global.timeout
    }
  }

  static verifyLanguageDef (targetDef) {
    // verify language
    if (!_.isUndefined(targetDef.language) && !_.isString(targetDef.language)) {
      const message = '"language" property in target definition must be type of String'
      throw new VerifierConfigError(message)
    }
  }

  static verifyTargetInputDef (targetDef) {
    if (_.isUndefined(targetDef.input)) {
      targetDef.input = []
      return
    }
    if (!_.isArray(targetDef.input)) {
      const message = '"timeout" property in target definition must be type of Number'
      throw new VerifierConfigError(message)
    }
    const nameSet = new Set()
    targetDef.input.forEach((inputItem) => {
      if (!_.isObject(inputItem)) {
        const message = '"input" property in target definition must contains only Objects'
        throw new VerifierConfigError(message)
      }
      if (!_.isString(inputItem.name)) {
        const message = '"input[].name" property in target definition must by type of String'
        throw new VerifierConfigError(message)
      }
      if (!_.isString(inputItem.desc)) {
        const message = '"input[].desc" property in target definition must be type of String'
        throw new VerifierConfigError(message)
      }
      const matched = inputItem.name.match(/[a-zA-Z_]+[a-zA-Z0-9_]*/)
      if (!matched || matched[0] !== inputItem.name) {
        const message = '"input[].name" property in must be valid as an environment variable name'
        throw new VerifierConfigError(message)
      }
      if (!nameSet.has(inputItem.name)) {
        nameSet.add(inputItem.name)
      } else {
        const message = 'each "input[].name" property in target definition must be unique'
        throw new VerifierConfigError(message)
      }
    })
  }

  static verifyValue (value, type, text, defaultValue) {
    if (_.isUndefined(value) && !_.isUndefined(defaultValue)) {
      return defaultValue
    } else if ((_.isUndefined(value) && _.isUndefined(defaultValue)) ||
            (!_.isUndefined(value) && !_['is' + type](value))) {
      const message = `${text} must be type of ${type}`
      throw new errors.VerifierConfigError(message)
    } else {
      return value
    }
  }
}

exports.VerifierBase = VerifierBase

exports.errors = errors
