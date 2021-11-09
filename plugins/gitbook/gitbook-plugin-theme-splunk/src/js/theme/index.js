/* global fetch */

import * as keyboard from './keyboard'
import * as navigation from './navigation'
import * as sidebar from './sidebar'
import * as toolbar from './toolbar'
import * as login from './login'
import * as verify from './verify'
import * as progress from './progress'
import * as navbar from './navbar'

const gitbook = window.gitbook
const urlFeatures = 'api/features'

function init () {
  // Initialize Workshop front-end logic
  // This is exeucted only once after a workshop is loaded
  // When a browser is refreshed, this will be loaded again.

  // Init sidebar
  sidebar.init()

  // Init keyboard
  keyboard.init()

  // Init navigation
  navigation.init()

  // Init navbar
  navbar.init()

  // Add action to toggle sidebar
  toolbar.createButton({
    index: 0,
    icon: 'fa fa-align-justify',
    onClick: function (e) {
      e.preventDefault()
      sidebar.toggle()
    }
  })

  initFeatures()
}

async function fetchFeatures () {
  const data = await fetch(gitbook.getAbsoluteUrl(urlFeatures))
  const body = await data.json()
  return body
}

async function initFeatures () {
  gitbook.events.on('page.change', async function () {
    const features = await fetchFeatures()
    if (features.verify) {
      verify.init(features.verify)
    }
  })

  const features = await fetchFeatures()
  if (features.login) {
    // Init login
    login.init(features.login)
  }
  if (features.verify) {
    // Init progress
    await progress.init(features.verify)
  }
}

gitbook.events.on('start', init)

gitbook.keyboard = keyboard
gitbook.navigation = navigation
gitbook.sidebar = sidebar
gitbook.toolbar = toolbar
