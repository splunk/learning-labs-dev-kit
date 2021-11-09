'use strict'
const ejs = require('ejs')

const template = `
    <div class="hide-verify-start" target="<%= target %>"></div>`

exports.process = function (block) {
  const verify = this.options.features.verify
  if (!verify) {
    throw new Error('Cannot use "verify" block if verify feature is not enabled')
  }
  const target = block.kwargs.target
  if (!target) {
    throw new Error('"target" must be provided when using hidestart block')
  }
  const context = {
    target: target
  }
  const element = ejs.compile(template)(context)
  return element
}
