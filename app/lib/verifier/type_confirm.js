'use strict'

const { VerifierBase } = require('./base')

class VerifierConfirm extends VerifierBase {
  async _runVerification () {
    const result = {
      passed: []
    }
    return result
  }
}

exports.VerifierConfirm = VerifierConfirm
