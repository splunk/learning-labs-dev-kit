'use strict'

const { BuildRunner } = require('./build')
const { PublishRunner } = require('./publish')
const { BaseRunner } = require('./base')

class AllRunner extends BaseRunner {
  constructor (cwd, argv, logger, output) {
    super(cwd, argv, logger)
    this.output = output
  }

  async run () {
    const buildRunner = new BuildRunner(this.cwd, this.argv, this.logger, this.output)
    await buildRunner.run()
    const publishRunner = new PublishRunner(this.cwd, this.argv, this.logger)
    return publishRunner.run()
  }
}

exports.AllRunner = AllRunner
