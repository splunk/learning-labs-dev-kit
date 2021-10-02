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

const { BuildRunner } = require('./build')
const { PublishRunner } = require('./publish')
const { AllRunner } = require('./all')
const { BaseRunner } = require('./base')
const { Logger } = require('./lib/logger')
const LockManager = require('./lib/lock_manager')
const { join, isAbsolute } = require('path')
const { ensureDir, stat, readdir, writeFile } = require('fs-extra')

const runners = {
  build: BuildRunner,
  publish: PublishRunner,
  all: AllRunner
}

class RecursiveRunner extends BaseRunner {
  constructor (cwd, argv, logger) {
    super(cwd, argv, logger)
    this.lockManager = new LockManager()
    if (argv.filter) {
      this.filter = argv.filter.split(',')
    } else {
      this.filter = null
    }
  }

  async _getWorkshipDirs () {
    const rootPath = this.cwd
    const files = await readdir(rootPath)

    // Create list of promises
    const promises = files.map(file => {
      // Helper function for checking valid workshop directory
      return (async childPath => {
        if (this.filter && !this.filter.includes(childPath)) {
          return null
        }
        const workshopPath = join(rootPath, childPath)
        try {
          const statInfo = await stat(workshopPath)
          if (statInfo.isFile()) {
            return null
          }
          const pathConfig = join(workshopPath, 'book.json')
          await stat(pathConfig)
          return childPath
        } catch (err) {
          return null
        }
      })(file)
    })

    // Execute promises and filter out valid workshop directories
    const validDirs = (await Promise.all(promises)).filter(file => {
      return file
    })

    if (validDirs.length <= 0) {
      throw new Error(`workshops not found at ${rootPath}`)
    }
    return validDirs
  }

  async run (command, limit = 10) {
    const rootPath = this.cwd
    const resultFile = this.argv.result || 'result.log'
    const resultFilePath = isAbsolute(resultFile)
      ? resultFile
      : join(rootPath, resultFile)

    const RunnerClass = runners[command]
    if (!RunnerClass) {
      throw new Error(`Invalid Command : ${command}`)
    }

    const workshopDirs = await this._getWorkshipDirs()

    // Create Log Dir
    const rootLog = join(rootPath, 'logs')
    await ensureDir(rootLog)

    // Create list of promises
    const promises = workshopDirs.map(file => {
      // Helper function for executing a command for each workshop
      return (async childPath => {
        return this.lockManager.waitSharedLimit(command, limit, async () => {
          const logPath = join(rootLog, childPath)
          const workshopPath = join(rootPath, childPath)
          this.logger.log(`Creating a log file at ${workshopPath}`)
          const logger = new Logger(logPath, { verbose: this.argv.verbose })
          const output = join('/temp-build', workshopPath)
          const runner = new RunnerClass(
            workshopPath,
            this.argv,
            logger,
            output
          )
          try {
            const result = await runner.run()
            return { passed: result }
          } catch (err) {
            const error = `Failed to ${command} ${workshopPath}. Error = ${err.message}`
            this.logger.debug(error)
            return { failed: error }
          }
        })
      })(file)
    })

    // Execute promises
    this.logger.log('Executing commands recursively')
    const results = await Promise.all(promises)
    const passed = []
    const failed = []
    results.forEach(result => {
      if (result.passed) {
        passed.push(result.passed)
      } else {
        failed.push(result.failed)
      }
    })

    // Create result file
    if (failed.length > 0) {
      const message = `${command} --recursive failed`
      await writeFile(resultFilePath, failed.join('\n'))
      this.logger.log(`created result file at ${resultFilePath}`)
      throw new Error(message)
    } else {
      this.logger.log(`created result file at ${resultFilePath}`)
      await writeFile(resultFilePath, passed.join('\n'))
      this.logger.log(`${command} --recursive succeed`)
    }
  }
}

exports.RecursiveRunner = RecursiveRunner
