'use strict'

const { exec } = require('child_process')

exports.checkRepo = function (repo) {
  return new Promise((resolve, reject) => {
    const command = `git ls-remote ${repo}`
    const options = {
      env: {
        GIT_TERMINAL_PROMPT: 0
      }
    }
    exec(command, options, (err, stdout) => {
      if (err) {
        const error = new Error(`Repository ${repo} does not exist. Please check if the repository is public`)
        error.original = err
        reject(error)
      } else {
        console.log(`Repository ${repo} exists`)
        resolve()
      }
    })
  })
}

exports.clone = function (repo, cwd) {
  return new Promise((resolve, reject) => {
    const command = `git clone ${repo} .`
    const options = {
      cwd: cwd
    }
    exec(command, options, (err, stdout) => {
      if (err) {
        const error = new Error(`Failed to clone repository ${repo}`)
        error.original = err
        reject(error)
      } else {
        console.log(`Successfully cloned repository ${repo}`)
        resolve()
      }
    })
  })
}
