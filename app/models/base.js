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

const path = require('path')
const Datastore = require('nedb')
const _ = require('underscore')
const CONST = require('../constant')
const errors = require('../lib/errors')

class DbPropertyError extends errors.LevelError {
}
errors.DbPropertyError = DbPropertyError

class DbInsertError extends errors.LevelError {
}
errors.DbInsertError = DbInsertError

class DbDocNotFoundError extends errors.LevelError {
}
errors.DbDocNotFoundError = DbDocNotFoundError

class DbGenericError extends errors.LevelError {
}
errors.DbGenericError = DbGenericError

class BaseModel {
  /**
     * Creates a new datastore model
     *
     * @param {String} modelName
     */
  constructor (modelName) {
    this._schema = []
    const options = {}
    if (!CONST.CONFIG.MEMDB) {
      const databasePath = path.join(CONST.DATASTORE.URL, `${modelName}.db`)
      options.filename = databasePath
      options.autoload = true
    }
    this.collection = new Datastore(options)
  }

  /**
     * Filter values by schema
     *
     * @param {Object} values
     */
  _validate (values) {
    const filteredValues = {}
    function isCorrectType (type, value) {
      return _[`is${type}`](value)
    }
    for (const schemaItem of this._schema) {
      const name = schemaItem.name
      const type = schemaItem.type
      const value = values[name]
      if (schemaItem.required && _.isUndefined(value)) {
        throw new DbPropertyError(`property "${name}" is required`)
      }
      if (!_.isUndefined(value) && !isCorrectType(type, value)) {
        throw new DbPropertyError(`property "${name}" should be type of ${type}`)
      }
      if (!_.isUndefined(value)) {
        filteredValues[name] = value
      }
    }
    return filteredValues
  }

  /**
     *
     * @param {String|Object} query
     */
  async get (query, projection = {}) {
    if (_.isString(query)) {
      query = { _id: query }
    }
    return new Promise((resolve, reject) => {
      this.collection.findOne(query, projection, function (err, doc) {
        if (err) {
          const error = new DbGenericError('Failed to get document')
          error.original = err
          reject(err)
        } else if (doc === null) {
          resolve({})
        } else {
          resolve(doc)
        }
      })
    })
  }

  /**
     *
     * @param {Object} query
     * @param {Object} projection
     * @param {Object} sort
     * @param {Number} skip
     * @param {Number} limit
     */
  getAll (query = {}, projection = {}, sort = {}, skip = 0, limit = 50) {
    return new Promise((resolve, reject) => {
      this.collection.find(query, projection).skip(skip).limit(limit).sort(sort).exec((err, docs) => {
        if (err) {
          const error = new DbGenericError('Failed to get documents')
          error.original = err
          reject(err)
        } else if (docs === null) {
          resolve([])
        } else {
          resolve(docs)
        }
      })
    })
  }

  /**
     * Creates a new document
     *
     * @param {Object} values
     */
  async create (values) {
    const filteredValues = this._validate(values)
    return new Promise((resolve, reject) => {
      this.collection.insert(filteredValues, (err, doc) => {
        if (err) {
          const error = new DbInsertError('Failed to insert a new document')
          error.original = err
          reject(error)
        } else {
          resolve(doc)
        }
      })
    })
  }

  /**
     * Updates a document for a given query
     * @param {String|Object} query
     * @param {Object} values
     * @param {Object} options
     */
  async update (query, values, options = {}) {
    if (_.isString(query)) {
      query = { _id: query }
    }
    return new Promise((resolve, reject) => {
      options.returnUpdatedDocs = true
      options.command = options.command || '$set'
      const update = {}
      update[options.command] = values
      this.collection.update(query, update, options, function (err, numUpdated, updatedDoc) {
        if (err) {
          const error = new DbGenericError('Encountered unexpeted error while updating document')
          error.original = err
          reject(error)
        } else if (numUpdated <= 0) {
          const error = new DbDocNotFoundError(`A document is not found for query = ${JSON.stringify(query)}`)
          reject(error)
        } else {
          resolve(updatedDoc)
        }
      })
    })
  }

  /**
     * Removes a document for a given query
     * @param {Number} query
     */
  async remove (query) {
    if (_.isString(query)) {
      query = { _id: query }
    }
    return new Promise((resolve, reject) => {
      this.collection.remove(query, {}, function (err, numRemoved) {
        if (err) {
          const error = new DbGenericError('Encountered unexpeted error while removing a document')
          error.original = err
          reject(error)
        } else if (numRemoved <= 0) {
          const error = new DbDocNotFoundError(`A document is not found for query = ${JSON.stringify(query)}`)
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}

exports.BaseModel = BaseModel
