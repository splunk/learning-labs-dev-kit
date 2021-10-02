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

const request = require('request-promise-native')

exports.getAll = async function (hubUrl) {
  const url = hubUrl + '/api/catalog'
  const options = {
    json: true,
    rejectUnauthorized: false
  }
  try {
    const body = await request.get(url, options)
    return body.data
  } catch (err) {
    throw new Error(`Failed to get catalogs from ${hubUrl}`)
  }
}

exports.update = async function (hubUrl, id, values) {
  const url = hubUrl + '/api/catalog/' + id
  const options = {
    json: true,
    rejectUnauthorized: false,
    body: values
  }
  const body = await request.put(url, options)
  return body.data
}

exports.create = async function (hubUrl, values) {
  const url = hubUrl + '/api/catalog'
  const options = {
    json: true,
    rejectUnauthorized: false,
    body: values
  }
  const body = await request.post(url, options)
  return body.data
}
