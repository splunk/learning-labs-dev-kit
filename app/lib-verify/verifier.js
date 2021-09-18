/* global lib, pathTempBase, user */

'use strict'

class VerifierBase {
  async run () {
    let error
    try {
      this.pathTemp = await lib.utilities.createUserTempDir(pathTempBase, user)
      await this.execute()
    } catch (err) {
      error = err
    }

    try {
      await lib.utilities.deleteUserTempDir(pathTempBase, user)
    } catch (err) {

    }

    if (error) {
      console.error(error.message)
      process.exit(1)
    } else {
      process.exit(0)
    }
  }

  execute () {
    return Promise.reject(new Error('method "execute" is not implemented!'))
  }
}

module.exports = VerifierBase
