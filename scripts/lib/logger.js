const fs = require('fs-extra')
const os = require('os')

class Logger {
  constructor (file, options) {
    options = options || {}
    this.file = file
    this.verbose = options.verbose || false
    this.stream = fs.createWriteStream(this.file)
    this.stream.write(new Date() + os.EOL)
  }

  log (text) {
    if (this.verbose) {
      console.log(text)
    }
    this.stream.write(text + os.EOL)
  }

  debug (text) {
    console.log(text)
    this.stream.write(text + os.EOL)
  }

  pipe (readableStream) {
    readableStream.pipe(this.stream, { end: false })
    if (this.verbose) {
      readableStream.pipe(process.stdout, { end: false })
    }
  }
}

exports.Logger = Logger
