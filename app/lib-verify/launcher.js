// Assume this scripts runs at app_sub directory
global.user = process.env.USER
global.pathTempBase = process.env.PATH_TEMP
const displayStack = process.env.DEBUG &&
  process.env.DEBUG.toUpperCase() === 'TRUE'

if (displayStack) {
  console.stack = console.error
} else {
  console.debug = () => {}
  console.stack = () => {}
}

process.on('uncaughtException', (error) => {
  console.error('Internal Error : Unexpected Error')
  console.stack(error.stack)
  process.exit(1)
})

try {
  global.BaseClass = require('./verifier')
  global.lib = require('./built-in')
} catch (e) {
  console.error('Internal Error : Failed to load built-in library')
  console.stack(e.stack)
  process.exit(1)
}

try {
  const pathScript = process.env.FILE
  const VerifierClass = require(pathScript)
  const verifier = new VerifierClass()
  verifier.run()
} catch (e) {
  console.error('Internal Error : Failed to load Verifier script')
  console.stack(e.stack)
  process.exit(1)
}
