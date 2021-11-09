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

const CONST = require('../constant')
const { BaseModel } = require('./base')
const _ = require('underscore')

class ModelVariable extends BaseModel {
  constructor () {
    super(CONST.MODEL.VARIABLE)
    this._schema = [
      { name: '_id', type: 'String', required: false },
      { name: 'scope', type: 'String', required: true },
      { name: 'variables', type: 'Object', required: true }
    ]
  }

  async updateVariables (scope, variables) {
    const query = { scope: scope }
    const update = { variables: variables }
    return this.update(query, update, { upsert: true })
  }

  async getVariables (user, includeProtected = false) {
    const resultVars = {}

    const userVars = (await this.get({ scope: user })).variables || {}
    _.extend(resultVars, userVars)

    if (includeProtected) {
      const protectedVars = (await this.get({ scope: 'protected' })).variables || {}
      _.extend(resultVars, protectedVars)
    }

    const sharedVars = (await this.get({ scope: 'shared' })).variables || {}
    _.extend(resultVars, sharedVars)

    return resultVars
  }
}

module.exports = new ModelVariable()
