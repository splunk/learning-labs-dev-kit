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

const fs = require('fs-extra')
const os = require('os')

class Logger {
  constructor (file, options) {
    options = options || {}
    this.file = file
    this.verbose = options.verbose || false
    this.stream = fs.createWriteStream(this.file)
    this.stream.write(new Date() + os.EOL)
  }

  log (text) {
    if (this.verbose) {
      console.log(text)
    }
    this.stream.write(text + os.EOL)
  }

  debug (text) {
    console.log(text)
    this.stream.write(text + os.EOL)
  }

  pipe (readableStream) {
    readableStream.pipe(this.stream, { end: false })
    if (this.verbose) {
      readableStream.pipe(process.stdout, { end: false })
    }
  }
}

exports.Logger = Logger
