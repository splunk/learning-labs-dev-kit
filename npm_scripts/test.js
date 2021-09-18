const { spawnSync } = require('child_process')
const { join, normalize } = require('path')

const argv = process.argv.slice(2)
const isDev = argv[0] === 'dev'
const isRelease = argv[0] === 'release'
const workspaceDir = normalize(join(__dirname, '..'))

function spawn (cmd, args, options = {}) {
  options.stdio = 'inherit'
  const res = spawnSync(cmd, args, options)
  if (res.error) {
    throw res.error
  }
}

if (isDev) {
  console.log('Running Dev Mode')
  const testerImage = 'localhost/doc-hub/kit-tester-app:latest'

  // Build App tester image
  const dockerfile = 'Dockerfile.tester'
  const dockerfilePath = `${workspaceDir}/dockerfiles/${dockerfile}`
  const cmdBuildArgs = ['build', '-f', `${dockerfilePath}`, '-t',
    `${testerImage}`, `${workspaceDir}`]
  spawn('docker', cmdBuildArgs, { cwd: workspaceDir })

  // Start testing
  let cmdRunArgs = ['run', '--rm', '-t', '-v', `${workspaceDir}:/workspace`]
  cmdRunArgs.push(testerImage)
  cmdRunArgs = cmdRunArgs.concat(argv)
  spawn('docker', cmdRunArgs)
} else if (isRelease) {
  console.log('Running Release Mode')
  const testerImage = 'node:10-alpine'
  const internalCommand = 'npm install shelljs -g && shjs scripts/test.js'
  let cmdRunArgs = ['run', '--rm', '-t']
  cmdRunArgs = cmdRunArgs.concat(['-v', `${workspaceDir}:/workspace`])
  cmdRunArgs = cmdRunArgs.concat(['-w', '/workspace'])
  cmdRunArgs.push(testerImage)
  cmdRunArgs = cmdRunArgs.concat(['/bin/sh', '-c', internalCommand])
  spawn('docker', cmdRunArgs)
} else {
  spawn('npm', ['install', 'shelljs', '-g'])
  spawn('shjs', ['scripts/test.js'])
}
