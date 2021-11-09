require(['gitbook', 'jQuery'], function (gitbook, $) {
  var timeouts = {}

  function addCopyButton (wrapper) {
    wrapper.append(
      $('<i class="fa fa-clone t-copy"></i>')
        .click(function () {
          copyCommand($(this))
        })
    )
  }

  function addCopyTextarea () {
    /* Add also the text area that will allow to copy */
    $('body').append('<textarea id="code-textarea" />')
  }

  function copyCommand (button) {
    const pre = button.parent()
    const textarea = $('#code-textarea')
    textarea.val(pre.text())
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    pre.focus()
    updateCopyButton(button)
  }

  function transformSpan (code) {
    $.each(code.children(), function () {
      if (!$(this).html().includes('\n')) {
        return
      }
      const lines = $(this).text().split('\n').map((line) => {
        const $temp = $($.clone(this))
        $temp.text(line)
        return $temp.html()
      })
      $(this).replaceWith(lines.join('\n'))
    })
  }

  function formatCodeBlock (block) {
    const code = block.children('code')

    // Show lines if -showlines option is used
    const showlines = code.attr('class') &&
      code.attr('class').split(' ').some((cls) => cls.includes('-showlines'))

    if (showlines) {
      transformSpan(code)

      let lines = code.html().split('\n')
      if (lines[lines.length - 1] === '') {
        lines.splice(-1, 1)
      }

      if (lines.length > 1) {
        lines = lines.map(line => '<span class="code-line">' + line + '</span>')
        code.html(lines.join('\n'))
      }
    }

    // Add wrapper to pre element
    const wrapper = block.wrap('<div class="code-wrapper"></div>')
    addCopyButton(wrapper)
  }

  function updateCopyButton (button) {
    const id = button.attr('data-command')
    button.removeClass('fa-clone').addClass('fa-check')

    // Clear timeout
    if (id in timeouts) {
      clearTimeout(timeouts[id])
    }
    timeouts[id] = window.setTimeout(function () {
      button.removeClass('fa-check').addClass('fa-clone')
    }, 1000)
  }

  gitbook.events.bind('start', function (e, config) {
    addCopyTextarea()
  })

  gitbook.events.bind('page.change', function () {
    $('pre').each(function () {
      $(this).addClass('hljs')
      formatCodeBlock($(this))
    })
  })
})
