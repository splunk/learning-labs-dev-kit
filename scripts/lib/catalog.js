const request = require('request-promise-native')

exports.getAll = async function (hubUrl) {
  const url = hubUrl + '/api/catalog'
  const options = {
    json: true,
    rejectUnauthorized: false
  }
  try {
    const body = await request.get(url, options)
    return body.data
  } catch (err) {
    throw new Error(`Failed to get catalogs from ${hubUrl}`)
  }
}

exports.update = async function (hubUrl, id, values) {
  const url = hubUrl + '/api/catalog/' + id
  const options = {
    json: true,
    rejectUnauthorized: false,
    body: values
  }
  const body = await request.put(url, options)
  return body.data
}

exports.create = async function (hubUrl, values) {
  const url = hubUrl + '/api/catalog'
  const options = {
    json: true,
    rejectUnauthorized: false,
    body: values
  }
  const body = await request.post(url, options)
  return body.data
}
