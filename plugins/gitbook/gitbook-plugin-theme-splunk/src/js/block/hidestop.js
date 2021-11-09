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
const ejs = require('ejs')

const template = `
    <div class="hide-verify-stop" target="<%= target %>"></div>`

exports.process = function (block) {
  const verify = this.options.features.verify
  if (!verify) {
    throw new Error('Cannot use "verify" block if verify feature is not enabled')
  }
  const target = block.kwargs.target
  if (!target) {
    throw new Error('"target" must be provided when using hidestart block')
  }
  const context = {
    target: target
  }
  const element = ejs.compile(template)(context)
  return element
}
