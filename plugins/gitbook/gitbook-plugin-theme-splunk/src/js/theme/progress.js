/* global fetch */

'use strict'

import { reportError } from './error_report'
import * as $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'
import { NavbarRestart } from './components/navbar_restart.jsx'

const gitbook = window.gitbook
const urlVerify = 'api/verify'

async function clearProgress () {
  try {
    const response = await fetch(gitbook.getAbsoluteUrl(urlVerify), {
      method: 'DELETE'
    })
    const body = await response.json()
    if (!body.data) {
      const error = new Error('clear progress request failed from server')
      await reportError({ message: error.message, stack: error.stack })
    }
  } catch (err) {
    const error = new Error(`Unexpected error, message: ${err.message}`)
    await reportError({ message: error.message, stack: error.stack })
  }
}

async function getProgress () {
  const response = await fetch(gitbook.getAbsoluteUrl(urlVerify))
  const body = await response.json()
  if (body.error) {
    throw new Error('failed to get progress')
  }
  const res = body.data
  return res.progress
}

function renderRestartButton () {
  const onRestart = async () => {
    await clearProgress()
    await window.location.reload()
  }

  // Render Nav Item
  ReactDOM.render(
    <NavbarRestart onRestart={onRestart} />,
    $('#navbar-contents')
      .append('<li></li>')
      .get(0)
  )
}

async function insertModal () {
  try {
    const progress = await getProgress()
    if (progress === 'completed' || progress === 'started') {
      renderRestartButton()
    } else if (progress !== 'started') {
      await clearProgress()
    }
  } catch (err) {
    const message = `Unexpected Error, message: ${err.message}`
    await reportError({ message: message, stack: err.stack })
  }
}

async function init () {
  await insertModal()
}

export { init }
