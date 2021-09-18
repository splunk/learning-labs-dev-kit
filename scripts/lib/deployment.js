const request = require('request-promise-native')

exports.delete = async function (hubUrl, id) {
  const url = hubUrl + '/deployment/' + id
  const options = {
    timeout: 180 * 1000,
    json: true,
    rejectUnauthorized: false
  }
  const body = await request.delete(url, options)
  if (body.error) {
    throw new Error(body.error)
  }
  return body.data
}

exports.start = async function (hubUrl, id, image, imageDigest) {
  const url = hubUrl + '/deployment/' + id
  const options = {
    timeout: 180 * 1000,
    json: true,
    rejectUnauthorized: false,
    body: {
      image: image,
      imageDigest: imageDigest
    }
  }
  await request.get(url)
  const body = await request.post(url, options)
  if (body.error) {
    throw new Error(body.error)
  }
  return body.data
}
