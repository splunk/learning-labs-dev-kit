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

const CONST = require('../../constant')
const { Router } = require('express')
const { pathExists, stat } = require('fs-extra')
const { resolve, join } = require('path')

const router = Router()

router.get('*', async (req, res) => {
  const filePath = resolve(join(CONST.PATH.RESOURCES, req.path))
  if (!await pathExists(filePath)) {
    return res.sendStatus(404)
  }
  if (!(await stat(filePath)).isFile()) {
    return res.sendStatus(404)
  }
  res.download(filePath)
})

module.exports = router
