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

const util = require('util')
const os = require('os')
const { writeFile } = require('fs-extra')
const { exec } = require('child_process')
const _ = require('underscore')
const request = require('request-promise-native')
const { Utilities } = require('./utilities')

class DockerLibrary {
  constructor (logger) {
    this.logger = logger
    this.utilities = new Utilities(this.logger)
  }

  async _getDigestFromRegistry (image) {
    const registry = image.split('/')[0]
    const imagePath = image.replace(registry, '').replace(':', '/')
    const url = `http://${registry}/artifactory/docker${imagePath}/manifest.json`
    try {
      const manifest = await request(url, { json: true })
      return manifest.config.digest.trim()
    } catch (err) {
      throw new Error('Failed to download Mainfest from registry')
    }
  }

  async _getDigestFromLocalImage (image) {
    try {
      const cmd = `docker image inspect ${image} -f "{{ .Id }}"`
      const res = await util.promisify(exec)(cmd)
      return res.stdout.split(os.EOL)[0].trim()
    } catch (err) {
      const message = `Failed to get Docker Image Digest for ${image}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }

  async _getDigestFromDeployment (image) {
    try {
      const cmd = `docker image inspect ${image} -f "{{ .RepoDigests }}"`
      const res = await util.promisify(exec)(cmd)
      const resEolRemoved = res.stdout.split(os.EOL)[0]
      const digests = resEolRemoved.substr(1, resEolRemoved.length - 2).split(' ')
      return digests.pop().split('@')[1]
    } catch (err) {
      const message = `Failed to get Docker Image Digest for ${image}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }

  async run (options = '', image) {
    const cmd = `docker run ${options} ${image}`
    await util.promisify(exec)(cmd)
  }

  async build (options, path) {
    const command = 'docker'
    const { extraBuildArgs = [] } = options || {}

    // Build params
    let params = ['build']
    if (options.tag) {
      if (_.isString(options.tag)) {
        params = params.concat(['-t', options.tag])
      }
      if (_.isArray(options.tag)) {
        options.tag.forEach((item) => {
          params = params.concat(['-t', item])
        })
      }
    }
    if (options.file) {
      params = params.concat(['-f', options.file])
    }

    extraBuildArgs.forEach(buildArg => {
      params.push('--build-arg')
      params.push(buildArg)
    })

    this.logger.log(params)

    params.push(path)

    this.logger.log('Docker run command: ' + command)

    return this.utilities.spawn(command, params)
  };

  async getDigest (image, source) {
    const digestFunctions = {
      registry: this._getDigestFromRegistry.bind(this),
      local: this._getDigestFromLocalImage.bind(this),
      deployment: this._getDigestFromDeployment.bind(this)
    }
    const func = digestFunctions[source]
    if (!func) {
      const message = `Invalid Parameter : source = ${source}, ` +
        'valid values : registry, local, deployment'
      throw new Error(message)
    }

    return func(image)
  }

  async tag (source, target) {
    try {
      const cmd = `docker tag ${source} ${target}`
      return await util.promisify(exec)(cmd)
    } catch (err) {
      const message = `Failed to tag image ${source} to ${target}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }

  async push (image) {
    try {
      const cmd = `docker push ${image}`
      const res = await util.promisify(exec)(cmd)
      const digest = res.stdout.match(/digest: (sha256:\w+) size/)
      if (!digest) {
        throw new Error('Digest not found')
      }
      return { digest: digest[1], stdout: res.stdout }
    } catch (err) {
      const message = `Failed to push image ${image}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }

  async pull (image) {
    try {
      const cmd = `docker pull ${image}`
      const res = await util.promisify(exec)(cmd)
      const digest = res.stdout.match(/Digest: (sha256:\w+)/)
      if (!digest) {
        throw new Error('Digest not found')
      }
      return { digest: digest[1], stdout: res.stdout }
    } catch (err) {
      const message = `Failed to pull image ${image}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }

  async login (username, password, registry) {
    try {
      await writeFile('docker_password', password)
      const cmd = 'cat docker_password' +
        ` | docker login -u ${username} --password-stdin ${registry}`
      await util.promisify(exec)(cmd)
    } catch (err) {
      const message = `Failed to login at ${registry} as ${username}.\n` +
        `Docker Error = ${err.stderr}`
      throw new Error(message)
    }
  }
}

exports.DockerLibrary = DockerLibrary
