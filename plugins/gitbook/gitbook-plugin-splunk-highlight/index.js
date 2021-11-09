var hljs = require('highlight.js')

var MAP = {
  py: 'python',
  js: 'javascript',
  json: 'javascript',
  rb: 'ruby',
  csharp: 'cs'
}

function normalize (lang) {
  if (!lang) { return null }

  var lower = lang.toLowerCase()
  return MAP[lower] || lower
}

function highlight (lang, code) {
  if (!lang) {
    return {
      body: code,
      html: false
    }
  }

  lang = lang.split('-')[0]

  // Normalize lang
  lang = normalize(lang)

  try {
    return hljs.highlight(lang, code, true).value
  } catch (e) { }

  return {
    body: code,
    html: false
  }
}

module.exports = {
  book: {
    assets: './assets',
    css: [
      'plugin.css',
      'monokai-sublime.css'
    ],
    js: [
      'plugin.js'
    ]
  },
  blocks: {
    code: function (block) {
      return highlight(block.kwargs.language, block.body)
    }
  }
}
