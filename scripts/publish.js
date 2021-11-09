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
const { join } = require('path')
const { BaseRunner } = require('./base')
const { pathExists } = require('fs-extra')
const catalog = require('./lib/catalog')
const deployment = require('./lib/deployment')
const { DockerLibrary } = require('./lib/docker')

const WORKSHOP_IMAGE_PREFIX = process.env.WORKSHOP_IMAGE_PREFIX || ''

/*
An example of manifest.json URL
*/

class PublishRunner extends BaseRunner {
  constructor (cwd, argv, logger) {
    super(cwd, argv, logger)
    this.docker = new DockerLibrary(this.logger)
  }

  async _login (username, password, imageName) {
    const registry = imageName.split('/')[0]
    if (!registry) {
      throw new Error(`A valid Docker registry is not found from ${imageName}`)
    }

    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' DOCKER LOGIN')
    this.logger.log('')
    this.logger.log('------------------------------------')

    const dockerConfigPath = `${process.env.HOME}/.docker/config.json`
    if (await pathExists(dockerConfigPath)) {
      this.logger.log(`Docker config file exists at ${dockerConfigPath}`)
      return
    }
    if (!username || !password) {
      throw new Error('Docker credentials not provided')
    }

    await this.docker.login(username, password, registry)
    this.logger.log(`successfully logged in at ${registry} as ${username}.`)
  }

  async _pull (title, image) {
    if (image.endsWith('local')) {
      return
    }

    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' PULL IMAGE FROM DOCKER REGISTRY')
    this.logger.log('')
    this.logger.log('------------------------------------')
    this.logger.debug(`Pulling docker image of ${title} from the registry`)
    const { stdout } = await this.docker.pull(image)
    this.logger.log(stdout)
  }

  async _test (imageName) {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' TEST IMAGE')
    this.logger.log('')
    this.logger.log('------------------------------------')
    const options = '-e "TEST_IMAGE=yes"'
    try {
      await this.docker.run(options, imageName)
      this.logger.debug(`Image test for "${imageName}" passed.`)
    } catch (e) {
      this.logger.log(e)
      throw new Error(`Image test for "${imageName}" failed.`)
    }
  }

  async _promote (title, imageSource, imageTarget) {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' PUSH IMAGE TO DOCKER REGISTRY')
    this.logger.log('')
    this.logger.log('------------------------------------')
    this.logger.debug(`Pushing docker image of ${title} to the registry.`)

    this.logger.log(`Tagging ${imageSource} to ${imageTarget}`)
    await this.docker.tag(imageSource, imageTarget)

    this.logger.log(`Pushing ${imageTarget} to the registry`)
    const { digest, stdout } = await this.docker.push(imageTarget)
    this.logger.log(stdout)

    this.logger.debug(`Successfully published ${title} to ${imageTarget}`)

    return { digest: digest }
  }

  async _deploy (config, imageName, digest, hub, force) {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' DEPLOY TO GO/WORKSHOP')
    this.logger.log('')
    this.logger.log('------------------------------------')
    this.logger.log(`Getting list of Workshop from ${hub}`)
    const catalogs = _.indexBy(await catalog.getAll(hub), 'image')

    const newCatalog = {
      title: config.title,
      description: config.description,
      maintainer: config.maintainer,
      image: config.tag,
      imageDigest: digest,
      features: config.features
    }

    const doc = catalogs[config.tag]
    let url
    if (_.isUndefined(doc)) {
      this.logger.debug(`Creating workshop for ${config.title}.`)
      const newDoc = await catalog.create(hub, newCatalog)
      const docId = newDoc._id
      url = `${hub}/doc/${docId}`
      this.logger.debug(`Starting deployment of ${config.title} to ${url}.`)
      try {
        await deployment.start(hub, docId, imageName, digest)
        this.logger.debug(`Successfully deployed ${config.title} to ${url}.`)
      } catch (err) {
        this.logger.debug(`Failed to deploy ${config.title} to ${url}.`)
      }
    } else if (doc.imageDigest !== digest || force) {
      this.logger.log(`Updating workshop for ${config.title}.`)
      const docId = doc._id
      url = `${hub}/doc/${docId}`
      await catalog.update(hub, docId, newCatalog)

      this.logger.debug(`Starting deployment of ${config.title} to ${url}.`)
      try {
        await deployment.delete(hub, docId)
        await deployment.start(hub, docId, imageName, digest)
        this.logger.debug(`Successfully deployed ${config.title} to ${url}.`)
      } catch (err) {
        this.logger.debug(`Failed to deploy ${config.title} to ${url}.`)
      }
    } else {
      const docId = doc._id
      url = `${hub}/doc/${docId}`
      this.logger.debug(`${config.title} is up to date. Skipping Deployment.`)
    }

    return { url }
  }

  async run () {
    const hub = this.argv.hub
    const force = this.argv.force
    const tag = this.argv.tag
    const sourceTag = this.argv.sourceTag
    const dockerUsername = process.env.DOCKER_USERNAME
    const dockerPassword = process.env.DOCKER_PASSWORD

    try {
      await this._parseConfig()
      const config = this.parsedConfig
      const imageName = join(WORKSHOP_IMAGE_PREFIX, this.parsedConfig.tag)
      const imageSource = `${imageName}:${sourceTag}`
      const imageTarget = `${imageName}:${tag}`

      await this._login(dockerUsername, dockerPassword, imageName)
      await this._pull(config.title, imageSource)
      await this._test(imageSource)
      const { digest } = await this._promote(config.title, imageSource, imageTarget)
      if (!hub) {
        return `Pushed workshop image for ${config.title} to ${imageTarget}`
      }
      const { url } = await this._deploy(config, imageName, digest, hub, force)
      return `Deployed workshop ${config.title} to ${url}`
    } catch (err) {
      this.logger.debug(err.message)
      this.logger.log(err.stack)
      throw err
    }
  }
}

exports.PublishRunner = PublishRunner
