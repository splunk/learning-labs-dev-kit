const fs = require('fs')
const minimist = require('minimist')
const { BuildRunner } = require('./build')
const { PublishRunner } = require('./publish')
const { AllRunner } = require('./all')
const { RecursiveRunner } = require('./recursive')

process.on('uncaughtException', (err) => {
  console.log(`CRITICAL : ${err.message}`)
  console.log(err.stack)
  process.exitCode = 1
})

const cwd = process.env.PATH_WORKSHOP
const command = process.argv[2]
const argv = minimist(process.argv.slice(3))
const version = fs.readFileSync('/kit/SDK_VERSION').toString()

function showUsage () {
  const usage = `
Usage: doc-hub <command> [options]

Workshop SDK version: ${version}

environment variables:

    DOCKER_USERNAME     Username for Docker registry
    DOCKER_PASSWORD     Password for Docker registry
    WORKSHOP_USERNAME   username for go/workshop
    WORKSHOP_PASSWORD   Password for go/workshop
    PATH_WORKSHOP       Sets default working directory

global options:

    --verbose   Show all log messages
        
    --dev       Skip pulling latest SDK

    --filter    Whitelists workshops for recursive mode. comma-separted string.

commands:

    build:
            
        Builds a Workshop Docker image

        option: 

        --recursive   This option allows building mutiple Workshop
                      Images at once by scanning all sub-directories.
                      Currently, this option only supports depth 1 search.

                      Default: false

        --noimage     Builds workshop without creating an image.

                      Default: false

        --buildTag    Sets tag of the workshop image. 
        
                      Default: local

    publish:

        Publishes previously built Workshop Docker Image to Artifactory

        options: 

        --tag         This option allows specifing a tag of an image to be 
                      pushed to a registry.

                      If this option is not set, a timebased tag will be
                      generated.

                      Default: build-YYYYMMDD-hhmmss

                      If --hub option is supplied with "production" or "staging",
                      the default value will be <hub option>-YYYYMMDD-hhmmss
                      instead.

        --sourceTag   This options allows overriding sourceTag. If this value 
                      is other than "local", the image provided by --sourceTag
                      will be pulled first.

                      Default: local

                      if --buildTag option is supplied, default value will be
                      the value from --buildTag instead.

        --hub         This option allows updating Docker Image on Workshop Hub. 
                      When using this option, URL to Workshop Hub should be 
                      provided.

                      Default: undefined

        --recursive   This option allows publishing mutiple Workshop Images at 
                      once by scanning all sub-directories. Currently, this 
                      option only supports depth 1 search.

                      Default : false

        --force       When this option is set, Workshop Hub will be updated with 
                      the latest version of the current Workshop even if current
                      Workshop image is up to date in Docker registry. This 
                      option is useful when a Workshop has to be pushed to more
                      than one Workshop Hub.

                      Default: false

        --result      When this option is set, saves results to a file specified
                      by this option. If the command fails, error messages
                      will be saved instead.

                      This option will be effective only under recursive mode.

                      Default: result.log
    
    all:

        Executes build command and publish command together
`
  console.log(usage)
}

async function run () {
  console.log(`Workshop SDK version: ${version}`)
  let commandRunner
  try {
    argv.buildTag = argv.buildTag || 'local'
    argv.sourceTag = argv.sourceTag || argv.buildTag

    const timeTag = (new Date()).toJSON().replace(/-|:|Z/g, '').replace('T', '-').split('.')[0]
    argv.tag = argv.tag || `build-${timeTag}`

    switch (command) {
      case 'build':
        if (!argv.recursive) {
          commandRunner = new BuildRunner(cwd, argv)
          await commandRunner.run()
        } else {
          commandRunner = new RecursiveRunner(cwd, argv)
          await commandRunner.run('build')
        }
        break
      case 'publish':
        if (!argv.recursive) {
          commandRunner = new PublishRunner(cwd, argv)
          await commandRunner.run()
        } else {
          commandRunner = new RecursiveRunner(cwd, argv)
          await commandRunner.run('publish')
        }
        break
      case 'all':
        if (!argv.recursive) {
          commandRunner = new AllRunner(cwd, argv)
          await commandRunner.run()
        } else {
          commandRunner = new RecursiveRunner(cwd, argv)
          await commandRunner.run('all')
        }
        break
      default :
        showUsage()
        process.exitCode = 1
        return
    }

    fs.writeFileSync(`${cwd}/published_tag`, argv.tag)
  } catch (err) {
    console.log(err.stack)
    process.exitCode = 1
  }
}

run()
