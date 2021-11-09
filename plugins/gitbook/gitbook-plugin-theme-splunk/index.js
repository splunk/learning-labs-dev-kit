const jsdom = require('jsdom')
const { JSDOM } = jsdom

function processContentBlocker (page) {
  try {
    const dom = new JSDOM(page.content)
    const $ = require('jquery')(dom.window)
    const $start = $('.hide-verify-start')
    $start.each((index, elem) => {
      const $elem = $(elem)
      const target = $elem.attr('target')
      if (!target) {
        console.log('target not found')
        return
      }

      const $end = $(`.hide-verify-stop[target=${target}]`)
      if ($end.length <= 0) {
        console.log('end not found')
        return
      }

      // Create a new div
      const $div = $(`<div class="hide-verify collapse" target="${target}"></div>`)
      $elem.before($div)

      // Move elements between start and stop under a new div
      $elem.nextUntil($end).appendTo($div)

      // Remove start and stop markers
      $elem.remove()
      $end.remove()
    })

    const html = $('body').html()
    page.content = html
  } catch (e) {
    console.log(e.message)
    console.log(e.stack)
  }
}

module.exports =
{
  hooks:
    {
      config: function (config) {
        console.log(config)
        config.styles = config.styles || config.pluginsConfig['theme-splunk'].styles
        return config
      },
      page: function (page) {
        processContentBlocker(page)
        return page
      }
    },
  blocks: require('./src/js/block'),
  filters:
    {
      getprop: function (obj, prop) {
        return obj[prop]
      }
    }
}
