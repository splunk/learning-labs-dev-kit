/* globals mkdir, cp */

const { spawnSync } = require('child_process')
const { join } = require('path')
const argv = process.argv.slice(2)
const isDev = argv[0] === 'dev'

const workspaceDir = process.env.WORKSPACE || '/workspace'
const destDir = '/kit'
const sourceDirs = ['app', 'scripts']
const sourceList = sourceDirs.map(dir => join(workspaceDir, dir))
const destList = sourceDirs.map(dir => join(destDir, dir))

function spawn (cmd, args, options = {}) {
  options.stdio = 'inherit'
  const res = spawnSync(cmd, args, options)
  if (res.error) {
    throw res.error
  }
}

if (!isDev) {
  // Create app directories
  console.log(`Creating directory ${destDir}`)
  mkdir('-p', destDir)
}

// Copy files
for (const source of sourceList) {
  console.log(`Copy files from ${source} to ${destDir}`)
  cp('-r', source, destDir)
}

if (!isDev) {
  // Build npm dependencies
  for (const dest of destList) {
    console.log(`Install NPM dependencies at ${dest}`)
    spawn('npm', ['install'], { cwd: dest })
  }
}

// Start app testing
const appDir = join(destDir, 'app')
spawn('npm', ['test'], { cwd: appDir })
