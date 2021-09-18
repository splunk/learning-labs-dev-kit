const logger = require('./lib/logger').create('Workshop')

/*

List of Environment Variables

DOC_ID - Workshop ID
AUTH_TEST_TOKEN - Path to test token
AUTH_REDIRECT - URL for login, Default is /auth
AUTH_LOGOUT_URL - URL for logout, Default is /logout
AUTH_SECRET - JWT secret
HUB_REDIRECT - URL of workshop hub, Default is /
SERVICE_PROGRESS - API endpoint for progress API.
SERVICE_CATALOG - API endpoint for catalog API.
TEST_IMAGE - Exit after loading the server.
TEST_MEMDB - Use in-memory DB
*/

// Register uncaught exception handler
process.once('uncaughtException', (err) => {
  logger.critical(err)
  process.exit(1)
})

// built-in modules
const http = require('http')

// External dependencies
const minimist = require('minimist')

// Internal dependencies
const { app, init } = require('./app')
const CONST = require('./constant')

// Argument Parsing
const argv = minimist(process.argv.slice(2))
const port = argv.port || 80

async function initialize () {
  // Start Iniitalization
  await init()

  // Create Express app
  const server = http.createServer(app)
  server.listen(port, async () => {
    logger.info({
      message: `Started server at port ${port}`,
      sdkVersion: CONST.CONFIG.SDK_VERSION,
      docId: CONST.CONFIG.DOC_ID,
      title: CONST.CONFIG.TITLE
    })
  })
}

function terminate () {
  logger.info({ message: 'Received termination request, terminating...' })
  process.exit(0)
}

process.once('SIGTERM', terminate)

process.once('SIGINT', terminate)

initialize()
  .then(() => {
    if (process.env.TEST_IMAGE) {
      logger.info({ message: 'Successfully launched container' })
      process.exit(0)
    }
  })
  .catch((err) => {
    logger.critical(err)
    process.exit(1)
  })
