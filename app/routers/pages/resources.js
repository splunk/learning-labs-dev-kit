'use strict'

const CONST = require('../../constant')
const { Router } = require('express')
const { pathExists, stat } = require('fs-extra')
const { resolve, join } = require('path')

const router = Router()

router.get('*', async (req, res) => {
  const filePath = resolve(join(CONST.PATH.RESOURCES, req.path))
  if (!await pathExists(filePath)) {
    return res.sendStatus(404)
  }
  if (!(await stat(filePath)).isFile()) {
    return res.sendStatus(404)
  }
  res.download(filePath)
})

module.exports = router
