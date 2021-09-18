'use strict'

const fs = require('fs-extra')
const path = require('path')
const klawSync = require('klaw-sync')
const fm = require('front-matter')

// Internal library
const utilities = require('./utilities')

function convertHugoShortCode (pathFile) {
  console.log(' * converting ' + pathFile)
  let regex
  let textStr
  try {
    textStr = fs.readFileSync(pathFile).toString()
  } catch (e) {
    console.log(`Failed to read from file ${pathFile}`)
    console.log(e)
    return false
  }

  // Transform ref
  regex = new RegExp('{{<ref "((\\w|[.#_-]|/)*)">}}', 'g')
  textStr = textStr.replace(regex, (match, $1) => {
    return $1
  })

  // Transform mermaid
  regex = new RegExp('{{<[ ]*mermaid[ ]*>}}', 'g')
  textStr = textStr.replace(regex, '{% mermaid %}')
  regex = new RegExp('{{</[ ]*mermaid[ ]*>}}', 'g')
  textStr = textStr.replace(regex, '{% endmermaid %}')

  // Transform notice
  regex = new RegExp('{{%[ ]*notice info[ ]*%}}', 'g')
  textStr = textStr.replace(regex, "{% hint style='info' %}")
  regex = new RegExp('{{%[ ]*/notice[ ]*%}}', 'g')
  textStr = textStr.replace(regex, '{% endhint %}')

  try {
    fs.writeFileSync(pathFile, textStr)
    return true
  } catch (e) {
    console.log(`Failed to write to file ${pathFile}`)
    console.log(e)
    return false
  }
}

function transformHugoContents (pathContents) {
  console.log('Transforming Hugo Contents')
  let paths
  try {
    paths = klawSync(pathContents, { nodir: true })
  } catch (e) {
    console.log(`Failed to walk files under ${pathContents}`)
    console.log(e)
    return false
  }

  paths.forEach((walkObj) => {
    const currentFilePath = walkObj.path
    const parsed = path.parse(currentFilePath)

    // convert Hugo shortcode into Gitbook block
    convertHugoShortCode(currentFilePath)

    // convert Hugo _index into Gitbook README
    if (parsed.name === '_index') {
      const newFilePath = path.join(parsed.dir, 'README.md')
      fs.moveSync(currentFilePath, newFilePath)
    }
  })

  return true
}

function createSummary (pathContents, pathConfig, config) {
  console.log('Creating SUMMARY.md')

  function collectFrontMatter (root, treeList) {
    // Walk directory to get Front Matter
    const paths = klawSync(root, { depthLimit: 0 })
    paths.forEach((walkObj) => {
      const currentFilePath = walkObj.path
      const relativePath = path.relative(pathContents, currentFilePath)
      const node = {}
      let frontMatterPath = currentFilePath

      if (walkObj.stats.isDirectory()) {
        frontMatterPath = path.join(currentFilePath, 'README.md')
        node.children = []
        node.path = relativePath + '/README.md'
        collectFrontMatter(currentFilePath, node.children)
      } else if (relativePath.indexOf('README.md') >= 0) {
        return
      } else {
        node.path = relativePath
      }

      const frontMatter = fm(fs.readFileSync(frontMatterPath).toString())
      node.weight = frontMatter.attributes.weight || 0
      node.title = frontMatter.attributes.title || relativePath
      treeList.push(node)
    })

    // Sort list
    treeList.sort((left, right) => {
      if (left.weight > right.weight) {
        return 1
      } else if (left.weight < right.weight) {
        return -1
      }
      return 0
    })

    return true
  }

  function writeSummary (map, depth) {
    let text = ''
    const depthStr = (new Array(depth + 1)).join('\t')
    map.forEach((item) => {
      text += `${depthStr}* [${item.title}](${item.path})\n`
      if (item.children) {
        text += writeSummary(item.children, depth + 1)
      }
    })
    return text
  }

  // Walk each file to get Front Matter
  console.log(' * Collecting Front Matters')
  const map = []
  collectFrontMatter(pathContents, map)

  // Generate SUMMARY.md
  console.log(' * Generating SUMMARY.md')
  let textSummary = '# Summary\n\n'
  textSummary += writeSummary(map, 0)
  fs.writeFileSync(path.join(pathContents, 'SUMMARY.md'), textSummary)

  // Generate README.md
  const textDescription = config.params ? (config.params.description || '') : ''
  const textReadme = `# ${config.title || 'Book'}\n${textDescription}`
  fs.writeFileSync(path.join(pathContents, 'README.md'), textReadme)

  // Generate book.json
  const bookConfig = { title: config.title, root: '_temp' }
  fs.writeFileSync(pathConfig, JSON.stringify(bookConfig, null, 4))

  return true
}

function transformHugoBook (pathContentSrc, pathMount, config) {
  console.log('Starting Hugo Book conversion')
  const pathContentDest = path.normalize(path.join(pathMount, '_temp'))
  const pathConfig = path.normalize(path.join(pathMount, 'book.json'))
  try {
    fs.removeSync(pathContentDest)
  } catch (e) {
    console.log(`Failed to remove temporary directory ${pathContentDest}`)
    console.log(e)
    return false
  }
  if (!utilities.copyContents(pathContentSrc, pathContentDest)) {
    return false
  }
  if (!transformHugoContents(pathContentDest)) {
    return false
  }
  if (!createSummary(pathContentDest, pathConfig, config)) {
    return false
  }
  return true
}

exports.convert = transformHugoBook
