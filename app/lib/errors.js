class LevelWarning extends Error {
  constructor (message) {
    super(message)
    this.name = 'LevelWarning'
  }
}

class LevelError extends Error {
  constructor (message) {
    super(message)
    this.name = 'LevelWarning'
  }
}

class LevelCritical extends Error {
  constructor (message) {
    super(message)
    this.name = 'LevelWarning'
  }
}

exports.LevelWarning = LevelWarning
exports.LevelError = LevelError
exports.LevelCritical = LevelCritical
