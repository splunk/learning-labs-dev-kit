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

exports.delete = async function (hubUrl, id) {
  const url = hubUrl + '/deployment/' + id
  const options = {
    timeout: 180 * 1000,
    json: true,
    rejectUnauthorized: false
  }
  const body = await request.delete(url, options)
  if (body.error) {
    throw new Error(body.error)
  }
  return body.data
}

exports.start = async function (hubUrl, id, image, imageDigest) {
  const url = hubUrl + '/deployment/' + id
  const options = {
    timeout: 180 * 1000,
    json: true,
    rejectUnauthorized: false,
    body: {
      image: image,
      imageDigest: imageDigest
    }
  }
  await request.get(url)
  const body = await request.post(url, options)
  if (body.error) {
    throw new Error(body.error)
  }
  return body.data
}
