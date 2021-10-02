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
const { VerifierBase, errors } = require('./base')
const { copy, writeFile, ensureDir, remove, readdir, statSync } = require('fs-extra')
const { promisify } = require('util')
const logger = require('../logger').create('Workshop')
const _ = require('underscore')
const os = require('os')
const exec = promisify(require('child_process').exec)

class VerifierConfigError extends errors.LevelError {
}
errors.VerifierConfigError = VerifierConfigError

class VerifierTimeoutError extends errors.LevelWarning {
}
errors.VerifierTimeoutError = VerifierTimeoutError

class VerifierUserError extends errors.LevelWarning {
}
errors.VerifierUserError = VerifierUserError

exports.errors = errors

/**
 VerifierCodelab class Constructor
 **/

/**
 * VerifierCodelab class constructor
 *
 * @param {Object} targetDef - This is a target definition object passed
 *     from book.json.
 * @param {String} targetDef.name - This defines a name for a target. This
 *     must be unique per each workshop.
 * @param {String} targetDef.files - This defines the list of files needed
 * to verify workshop. The path is relative to the app directory defined in book.json.
 * @param {String} targetDef.command - This defines the command that the workshop author
 * wanted verification to execute.
 * @param {String} targetDef.userInputFile - This is the name of the file that the
 * code defined on the UI text editor will be saved as.
 */
class VerifierCodelab extends VerifierBase {
  /**
     * @param {Object} data - data to be used for execution of verification.
     * @param {Array} [data.input] - An array that contains environment
     *     variable key value pairs.
     */
  async _runVerification (data) {
    const result = await this._createVerifyProcess(data)
    return result
  }

  static verifyTargetFilePath (targetDef, filename) {
    if (!_.isString(filename)) {
      const message = 'target file definition must have a String property "file"'
      throw new VerifierConfigError(message)
    }
    const targetFileNamePath = join(targetDef.global.appDirectory, filename)
    const makefilestat = statSync(targetFileNamePath)
    if (!makefilestat.isFile()) {
      const message = 'specified tempMakefile in target definition is not found'
      throw new VerifierConfigError(message)
    }
    return targetFileNamePath
  }

  /** NOTE: Using Sync functions is only allowed within verifyTargetDef
   * Function is called before the Codelab verification actually takes place. */
  static verifyTargetDef (targetDef) {
    super.verifyTargetDef(targetDef)
    super.verifyLanguageDef(targetDef)
  }

  /** Creates temporary directory for the workshop user. **/
  async _prepareUserTempDir () {
    try {
      this.tempDir = join(this.targetDef.global.tempDirectory, `temp/${this.username}/`)
      await ensureDir(this.tempDir)
      logger.debug(`Created directory ${this.tempDir}`)
    } catch (e) {
      logger.debug('Internal Error : Failed to create a temporary directory. Please try again')
      throw e
    }
  }

  /** Grabs filelist that author provided in book.json and copies every file into temporary directory
   * made for user.
   * @param tempDir
   * @returns {Promise<void>}
   * @private
   */
  async _copyCodelabResources (tempDir) {
    let i
    try {
      for (i = 0; i < this.targetDef.files.length; i++) {
        const newFilePath = join(tempDir, this.targetDef.files[i])
        const filePath = VerifierCodelab.verifyTargetFilePath(this.targetDef, this.targetDef.files[i])
        await copy(filePath, newFilePath)
        logger.debug(`Copied ${this.targetDef.files[i]}.`)
      }
      const currFiles = await readdir(tempDir)
      logger.debug(`Files now available in temp user dir: ${currFiles}`)
    } catch (e) {
      logger.debug('An error occurred while copying files')
      throw e
    }
  }

  /** Creates a file into temporary directory made with the code that user wrote into workshop
   * text editor UI.
   * @param inputData
   * @returns {Promise<void>}
   * @private
   */
  async _createUserDataFile (inputData) {
    try {
      const userInputFile = join(this.tempDir, this.targetDef.userInputFile)
      await writeFile(userInputFile, inputData)
      logger.debug('Added user input file into directory.')
    } catch (e) {
      logger.debug('Error occurred when saving code into file')
      throw e
    }
  }

  /** Executes command provided by author in book.json in the user directory created.
   * Returns standard output and error. */
  async _runCodelab () {
    const cmdOptions = {
      cwd: this.tempDir,
      timeout: this.targetDef.timeout,
      stdio: 'inherit'
    }

    logger.debug(cmdOptions)
    const command = this.targetDef.command
    logger.debug(command)
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

  /** Deletes temporary directory made for the user recursively. */
  async _deleteUserTmpDir () {
    try {
      logger.debug(`Now deleting temp directory: ${this.tempDir}`)
      logger.debug('Files in directory before deleting:')
      logger.debug(await readdir(this.tempDir))
      await remove(this.tempDir)
    } catch (e) {
      logger.debug('An error occurred while deleting temp directory')
      throw e
    }
  }

  async _createVerifyProcess (data) {
    try {
      await this._prepareUserTempDir()
      logger.debug(this.tempDir)

      // Copy files into temp directory
      await this._copyCodelabResources(this.tempDir)

      // Creating a file with code that user typed into UI editor
      await this._createUserDataFile(data.input)

      // Creating child process
      const result = {}
      result.passed = await this._runCodelab()

      await this._deleteUserTmpDir()
      return result
    } catch (e) {
      logger.debug(e)
      logger.debug('Deleting any files made after catching error')
      await this._deleteUserTmpDir()
      // Rethrow exception because caller of this function catches error
      throw e
    }
  }
}

exports.VerifierCodelab = VerifierCodelab
