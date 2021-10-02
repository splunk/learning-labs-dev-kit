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
const { promisify } = require('util')
const os = require('os')
const exec = promisify(require('child_process').exec)
const _ = require('underscore')
const models = require('../../models')
const logger = require('../logger').create('Workshop')
const { VerifierBase, errors } = require('./base')

class VerifierTimeoutError extends errors.LevelWarning {
}
errors.VerifierTimeoutError = VerifierTimeoutError

class VerifierUserError extends errors.LevelWarning {
}
errors.VerifierUserError = VerifierUserError

exports.errors = errors

// NOTE : Intentially moved this function outside class definition because
// this function does not access any class instance properties
// This can be moved to base.js as a static method as well.
// We will see if we can adopt more functional designs compared to object
// oriented designs
function sanitizeInput (input) {
  if (!_.isArray(input)) {
    return []
  }
  return input.filter((item) => {
    if (!_.isObject(item) || !_.isString(item.name)) {
      return false
    }
    if (_.isObject(item.value)) {
      item.value = JSON.stringify(item.value)
    }
    // Ensure name can be used as an environment variable
    const matched = item.name.match(/[a-zA-Z_]+[a-zA-Z0-9_]*/)
    const valid = matched && matched[0] === item.name
    return valid
  })
}

/**
 * VerifierScript class constructor
 *
 * @param {Object} token - This is a parsed JWT token that contains username
 *     email address.
 * @param {Object} targetDef - This is a target definition object passed
 *     from book.json.
 * @param {String} targetDef.name - This defines a name for a target. This
 *     must be unique per each workshop.
 * @param {String} targetDef.file - This defines the path to a script file.
 *     The path is relative to the app directory defined in book.json.
 * @param {String} [targetDef.timeout] - This sets the script execution
 *     timeout in milliseconds
 * @param {Object[]} [targetDef.input] - If defined, a user provided data
 *     will be passed to a script as environment variables.
 * @param {String} targetDef.input[].name - This defines the environment
 *     variable to be set when running a script.
 * @param {String} targetDef.input[].desc - This will be displayed to a user
 *     when asking for inputs from a user.
 * @param {Array}  targets - This is used by the base class. Do not use
 *     this from a child class. TODO: remove this in the future.
 */
class VerifierScript extends VerifierBase {
  /**
   * @param {Object} data - data to be used for execution of verification.
   * @param {Array} [data.input] - An array that contains environment
   *     variable key value pairs.
   */
  async _runVerification (data) {
    const result = {}

    // Get variables from database
    const includeProtected = true
    const variables = await models.variable.getVariables(this.user, includeProtected)

    // Merge script input with variables
    if (data.input) {
      data.input.forEach((item) => {
        variables[item.name] = item.value
      })
    }

    // Convert variable object to array
    const inputs = []
    for (const name in variables) {
      inputs.push({ name: name, value: variables[name] })
    }
    data.input = inputs

    result.passed = await this._createVerifyProcess(data)
    return result
  }

  static verifyTargetDef (targetDef) {
    super.verifyTargetDef(targetDef)
    super.verifyTargetFileDef(targetDef)
    super.verifyTargetTimeoutDef(targetDef)
    super.verifyTargetInputDef(targetDef)
    targetDef.pathTemp = targetDef.global.tempDirectory
  }

  async _createVerifyProcess (data) {
    const cwd = join(__dirname, '../../lib-verify')
    const env = {
      PATH: process.env.PATH,
      FILE: this.targetDef.filepath,
      USER: this.username,
      PATH_TEMP: this.targetDef.pathTemp,
      DEBUG: this.targetDef.global.debug
    }

    if (data.input) {
      const sanitizedInputs = sanitizeInput(data.input)
      for (const item of sanitizedInputs) {
        env[item.name] = item.value
      }
    }

    const cmdOptions = {
      cwd: cwd,
      env: env,
      timeout: this.targetDef.timeout,
      stdio: 'inherit'
    }

    const command = 'node launcher.js'
    const debugMessage = `Creating a child process for verifier target "${this.targetDef.name}"`
    logger.debug({
      message: debugMessage,
      command: command,
      option: cmdOptions
    })

    let error = null
    let stdout = ''
    let stderr = ''
    try {
      const result = await exec(command, cmdOptions)
      stdout = result.stdout
      stderr = result.stderr
    } catch (err) {
      if (err && _.isObject(err) && err.killed) {
        const message = `Timeout Error, message: ${err.message}`
        error = new VerifierTimeoutError(message)
      } else if (err && !err.stderr) {
        const message = `Unexpected Error, message: ${err.message}`
        error = new errors.LevelError(message)
      } else {
        error = new VerifierUserError(err.stderr)
      }
      stdout = err.stdout
      stderr = err.stderr
    }

    if (this.targetDef.global.debug) {
      console.log('\n\n==============================================')
      console.log('Dumping STDOUT and STDERR from script verifier')
      console.log('----------------------------------------------')
      if (stdout) {
        console.log('STDOUT:')
        console.log(stdout)
      }
      if (stderr) {
        console.log('STDERR')
        console.log(stderr)
      }
      console.log('==============================================\n\n')
    }

    const passed = stdout.split(os.EOL).filter((str) => {
      return !!str
    })
    if (error) {
      error.passed = passed
      throw error
    } else {
      return passed
    }
  }
}

exports.VerifierScript = VerifierScript
