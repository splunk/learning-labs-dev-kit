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

// Assume this scripts runs at app_sub directory
global.user = process.env.USER
global.pathTempBase = process.env.PATH_TEMP
const displayStack = process.env.DEBUG &&
  process.env.DEBUG.toUpperCase() === 'TRUE'

if (displayStack) {
  console.stack = console.error
} else {
  console.debug = () => {}
  console.stack = () => {}
}

process.on('uncaughtException', (error) => {
  console.error('Internal Error : Unexpected Error')
  console.stack(error.stack)
  process.exit(1)
})

try {
  global.BaseClass = require('./verifier')
  global.lib = require('./built-in')
} catch (e) {
  console.error('Internal Error : Failed to load built-in library')
  console.stack(e.stack)
  process.exit(1)
}

try {
  const pathScript = process.env.FILE
  const VerifierClass = require(pathScript)
  const verifier = new VerifierClass()
  verifier.run()
} catch (e) {
  console.error('Internal Error : Failed to load Verifier script')
  console.stack(e.stack)
  process.exit(1)
}
