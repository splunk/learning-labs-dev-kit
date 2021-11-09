import * as $ from 'jquery'

var gitbook = window.gitbook

// Toggle sidebar with or withour animation
function toggleSidebar (_state, animation) {
  if (gitbook.state != null && isOpen() === _state) return
  if (animation == null) animation = true

  gitbook.state.$book.toggleClass('without-animation', !animation)
  gitbook.state.$book.toggleClass('with-summary', _state)
}

// Return true if sidebar is open
function isOpen () {
  return gitbook.state.$book.hasClass('with-summary')
}

// Prepare sidebar: state and toggle button
function init () {}

// Filter summary with a list of path
function filterSummary (paths) {
  var $summary = $('.book-summary')

  $summary.find('li').each(function () {
    var path = $(this).data('path')
    var st = paths == null || paths.indexOf(path) !== -1

    $(this).toggle(st)
    if (st) {
      $(this)
        .parents('li')
        .show()
    }
  })
}

export { init, isOpen, toggleSidebar as toggle, filterSummary as filter }
