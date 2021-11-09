/* global fetch */

'use strict'

const gitbook = window.gitbook
const urlErrorReport = 'api/error_report'

async function reportError (data) {
  try {
    const postObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    }
    await fetch(gitbook.getAbsoluteUrl(urlErrorReport), postObj)
  } catch (err) {}
}

export { reportError }
