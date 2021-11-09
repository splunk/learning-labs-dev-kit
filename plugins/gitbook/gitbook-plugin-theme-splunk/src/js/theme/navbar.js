/* global gitbook */

import { NavBar } from './components/nav_bar.jsx'
import * as $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'

function init () {
  // Save track and backUrl for others
  let track = ''
  if (window.location.search) {
    const parsed = new URLSearchParams(window.location.search)
    const paramTrack = parsed.get('track')
    if (paramTrack) {
      track = `track/${paramTrack}`
    }
  }
  const backUrl = '/' + track
  gitbook.storage.set('backUrl', backUrl)
  gitbook.storage.set('track', track)

  // Populate title
  const title = `Workshop: ${gitbook.state.config.title}`

  // Render NavBar
  ReactDOM.render(
    <NavBar href={backUrl} title={title} />,
    $('.navbar-brand').get(0)
  )
}

export { init }
