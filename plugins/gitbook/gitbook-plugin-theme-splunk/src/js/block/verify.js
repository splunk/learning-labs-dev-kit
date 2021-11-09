'use strict'
const ejs = require('ejs')

const template = `
    <div class="block-verify mt-5" target="<%= target %>" doneMessage="<%= doneMessage %>" readyMessage="<%= readyMessage %>" >
        <div class="verify"></div>
        <div class="rate"></div>
        <div class="complete"></div>
    </div>`

exports.process = function (block) {
  const verify = this.options.features.verify
  if (!verify) {
    throw new Error('Cannot use "verify" block if verify feature is not enabled')
  }
  const doneMessage = block.kwargs.doneMessage || 'Completed'
  const target = block.kwargs.target || 'confirm'
  const options = {
    target: target,
    readyMessage: block.body.trim(),
    doneMessage: doneMessage.trim()
  }
  const element = ejs.compile(template)(options)
  return element
}
