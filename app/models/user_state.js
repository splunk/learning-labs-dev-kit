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

const _ = require('underscore')
const moment = require('moment')
const CONST = require('../constant')
const { BaseModel } = require('./base')

class ModelUserState extends BaseModel {
  constructor () {
    super(CONST.MODEL.USER_STATE)
    this._schema = [
      { name: '_id', type: 'String', required: false },
      { name: 'user', type: 'String', required: true },
      { name: 'progress', type: 'String', required: false },
      { name: 'scripts', type: 'Object', required: false }, // Obsolete
      { name: 'lastAccessed', type: 'Date', required: false },
      { name: 'lastVerified', type: 'Date', required: false },
      { name: 'rating', type: 'Number', required: false },
      { name: 'targetStatus', type: 'Object', required: false }
    ]
  }

  updateProgress (userEmail, progress) {
    const query = { user: userEmail }
    const update = { progress: progress }
    return this.update(query, update)
  }

  deleteProgress (userEmail) {
    const query = { user: userEmail }
    const update = { progress: 'started', targetStatus: {} }
    return this.update(query, update, { upsert: true })
  }

  updateTargetStatus (userEmail, target, status) {
    const query = { user: userEmail }
    const key = `targetStatus.${target}`
    const update = {}
    update[key] = status
    return this.update(query, update)
  }

  updateLastAccessed (userEmail) {
    const query = { user: userEmail }
    const update = { lastAccessed: new Date() }
    return this.update(query, update, { upsert: true })
  }

  updateLastVerified (userEmail) {
    const query = { user: userEmail }
    const update = { lastVerified: new Date() }
    return this.update(query, update)
  }

  updateRating (userEmail, rating) {
    const query = { user: userEmail }
    const update = { rating: rating }
    return this.update(query, update)
  }

  async getAverageRating () {
    const query = { rating: { $exists: true } }
    const projection = { rating: 1 }
    const ratings = await this.getAll(query, projection)
    if (ratings.length <= 0) {
      return 0
    }

    const averageRating = ratings.reduce((accum, value) => {
      return accum + value.rating
    }, 0) / ratings.length
    return averageRating
  }

  async getUserProgress (userEmail) {
    const query = { user: userEmail }
    const projection = {
      progress: 1,
      targetStatus: 1,
      rating: 1,
      lastVerified: 1
    }
    const state = await this.get(query, projection)
    const targetsCompleted = {}
    _.each(state.targetStatus, (value, key) => {
      if (value === 'completed') {
        targetsCompleted[key] = true
      }
    })
    const data = {
      progress: state.progress,
      targetsCompleted: targetsCompleted,
      rating: state.rating
    }
    if (state.progress === 'completed') {
      data.completionTime = moment(state.lastVerified).fromNow()
    }
    return data
  }
}

module.exports = new ModelUserState()
