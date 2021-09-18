const request = require('request-promise-native')
const _ = require('underscore')
const CONST = require('../constant')
const errors = require('./errors')
const logger = require('./logger').create('Workshop')

class HttpRequestError extends errors.LevelError {
}
errors.HttpRequestError = HttpRequestError

exports.errors = errors

async function getUserProgress (user) {
  const method = 'GET'
  const url = `${CONST.SERVICE.PROGRESS}/${user}`
  try {
    const options = {
      method: method,
      rejectUnauthorized: false,
      json: true
    }
    const body = await request(url, options)
    return body.data
  } catch (err) {
    const error = new HttpRequestError(`${method} request to ${url} failed`)
    error.original = err
    throw error
  }
}

async function createUserProgress (user) {
  const method = 'POST'
  const url = CONST.SERVICE.PROGRESS
  try {
    const options = {
      method: method,
      rejectUnauthorized: false,
      json: true,
      body: { _id: user }
    }
    await request(url, options)
    logger.debug({ message: `Created user progress document for ${user}` })
  } catch (err) {
    const error = new HttpRequestError(`${method} request to ${url} failed`)
    error.original = err
    throw error
  }
}

async function setUserProgress (user, progress) {
  const method = 'PUT'
  const url = `${CONST.SERVICE.PROGRESS}/${user}/${progress}`
  logger.debug({ message: `Send progress update request to ${url}` })
  try {
    const options = {
      method: method,
      rejectUnauthorized: false,
      json: true,
      body: { docId: CONST.CONFIG.DOC_ID }
    }
    await request(url, options)
  } catch (err) {
    const error = new HttpRequestError(`${method} request to ${url} failed`)
    error.original = err
    throw error
  }
}

exports.setUserProgressAttempted = async function (user) {
  if (!CONST.SERVICE.PROGRESS) {
    return
  }
  if (_.isEmpty(await getUserProgress(user))) {
    await createUserProgress(user)
  }
  return setUserProgress(user, 'attempted')
}

exports.setUserProgressCompleted = async function (user) {
  if (!CONST.SERVICE.PROGRESS) {
    return
  }
  if (_.isEmpty(await getUserProgress(user))) {
    await createUserProgress(user)
  }
  return setUserProgress(user, 'completed')
}

exports.setCatalogRating = async function (docId, rating) {
  const method = 'PUT'
  const url = `${CONST.SERVICE.CATALOG}/${docId}`
  logger.debug({ message: `Send rating update request to ${url}` })
  try {
    const options = {
      method: method,
      rejectUnauthorized: false,
      json: true,
      body: { rating: rating }
    }
    await request(url, options)
  } catch (err) {
    const error = new HttpRequestError(`${method} request to ${url} failed`)
    error.original = err
    throw error
  }
}
