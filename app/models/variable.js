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
