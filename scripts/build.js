'use strict'

const fs = require('fs-extra')
const { join } = require('path')

// Internal library
const { BaseRunner } = require('./base')
const { Utilities } = require('./lib/utilities')
const { Gitbook } = require('./lib/gitbook')
const { DockerLibrary } = require('./lib/docker')

const GITBOOK_VERSION = process.env.GITBOOK_VER
const WORKSHOP_BASE_IMAGE = process.env.WORKSHOP_BASE_IMAGE || 'node:10-alpine'
const WORKSHOP_IMAGE_PREFIX = process.env.WORKSHOP_IMAGE_PREFIX || ''

class BuildRunner extends BaseRunner {
  constructor (cwd, argv, logger, output) {
    super(cwd, argv, logger)
    this.docker = new DockerLibrary(this.logger)
    this.gitbook = new Gitbook(this.logger)
    this.utilities = new Utilities(this.logger)
    this.pathMount = cwd
    this.pathBookConfig = `${this.pathMount}/book.json`
    this.pathOutputOriginal = '/kit'
    this.pathOutput = output || this.pathOutputOriginal
    this.pathStatic = `${this.pathOutput}/static`
    this.pathBook = `${this.pathOutput}/plugins/gitbook`
    this.pathBookConfigBase = `${this.pathOutput}/plugins/gitbook/book.json`
    this.pathContentDest = `${this.pathOutput}/plugins/gitbook/content`
    this.pathSubAppDest = `${this.pathOutput}/app_sub`
    this.pathResourcesDest = `${this.pathOutput}/resources`
    this.pathDockerfile = `${this.pathOutput}/Dockerfile`
  }

  async _preBuild () {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' PRE-BUILD')
    this.logger.log('')
    this.logger.log('------------------------------------')
    this.logger.log(`pathMount : ${this.pathMount}`)
    this.logger.log(`pathOutput : ${this.pathOutput}`)

    // Check if book.json exists
    this.logger.log('Detect configuration files')
    const bookConfig = await fs.readJson(this.pathBookConfig)

    // Read book.json
    if (!await this.gitbook.writeMergedConfig(bookConfig, this.pathBookConfigBase)) {
      return new Error('Failed to merge configs')
    }

    // Copy Contents
    const pathContentSrc = join(this.pathMount, bookConfig.root)
    if (!await this.utilities.copyFiles(pathContentSrc, this.pathContentDest)) {
      return new Error('Failed to copy contents')
    }

    // Copy resources
    const pathResourceSrc = join(this.pathMount, bookConfig.resources || 'resources')
    if (await fs.pathExists(pathResourceSrc)) {
      if (!await this.utilities.copyFiles(pathResourceSrc, this.pathResourcesDest)) {
        return new Error('Failed to copy resources')
      }
    } else {
      await fs.ensureDir(this.pathResourcesDest)
    }

    // Copy Sub App if available
    const pathSubAppSrc = join(this.pathMount, bookConfig.app || 'app')
    if (await fs.pathExists(pathSubAppSrc)) {
      const options = { blacklist: ['node_modules'] }
      if (!await this.utilities.copyFiles(pathSubAppSrc, this.pathSubAppDest, options)) {
        return new Error('Failed to copy sub-app')
      }
    }
  }

  async _buildStatic () {
    // Assumes only Gitbook at this moment;
    return this.gitbook.build(GITBOOK_VERSION, this.pathBook, this.pathStatic)
  };

  async _buildImage () {
    this.logger.log('------------------------------------')
    this.logger.log('')
    this.logger.log(' BUILD WORKSHOP DOCKER IMAGE')
    this.logger.log('')
    this.logger.log('------------------------------------')

    const publishConfig = await fs.readJson(this.pathBookConfig)

    this.logger.log(JSON.stringify(publishConfig, null, 4))

    const imageName = join(WORKSHOP_IMAGE_PREFIX, publishConfig.tag)
    this.tag = `${imageName}:${this.buildTag}`

    const options = {
      tag: this.tag,
      file: this.pathDockerfile,
      extraBuildArgs: [
        `WORKSHOP_BASE_IMAGE=${WORKSHOP_BASE_IMAGE}`
      ]
    }

    this.extraPkg = publishConfig.features.extraPackages
    if (this.extraPkg && this.extraPkg.length > 0) {
      options.extraBuildArgs.push('EXTRA_PKG=' + this.extraPkg.join(' ').toString())
    }

    this.logger.log(options)

    return this.docker.build(options, this.pathOutput)
  };

  async run () {
    this.buildTag = this.argv.buildTag

    try {
      await this._parseConfig()
      if (this.argv.noimage) {
        this.logger.debug(`Building static files for ${this.parsedConfig.title}`)
      } else {
        this.logger.log(`Build Tag: ${this.buildTag}`)
        this.logger.debug(`Building image for ${this.parsedConfig.title}`)
      }

      if (this.argv.recursive) {
        this.logger.log(`Copying files from ${this.pathOutputOriginal} to ${this.pathOutput}`)
        await fs.copy(this.pathOutputOriginal, this.pathOutput)
      }
      await this._preBuild()
      await this._buildStatic()
      if (this.argv.noimage) {
        this.logger.debug(`Successfully built static files for ${this.parsedConfig.title}`)
        return true
      } else {
        await this._buildImage()
        this.logger.debug(`Successfully built an image for ${this.parsedConfig.title} at ${this.tag}`)
        return { image: this.tag }
      }
    } catch (err) {
      this.logger.debug(err.message)
      this.logger.log(err.stack)
      throw new Error('Failed to build')
    }
  }
}

exports.BuildRunner = BuildRunner
