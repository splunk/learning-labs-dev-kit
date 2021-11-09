/* global history, location, URL */

import * as $ from 'jquery'
import * as loading from './loading'
import * as platform from './platform'

var gitbook = window.gitbook

var usePushState = typeof history.pushState !== 'undefined'

/*
    Get current scroller element
*/
function getScroller () {
  if (platform.isSmallScreen()) {
    return $('.book-body')
  } else {
    return $('.body-inner')
  }
}

/*
    Scroll to a specific hash tag in the content
*/
function scrollToHash (hash) {
  var $scroller = getScroller()
  var dest = 0

  // Don't try to scroll if element doesn't exist
  if (!pageHasElement(hash)) {
    return
  }

  if (hash) {
    dest = getElementTopPosition(hash)
  }

  // Unbind scroll detection
  $scroller.unbind('scroll')
  $scroller.animate(
    {
      scrollTop: dest
    },
    800,
    'swing',
    function () {
      // Reset scroll binding when finished
      $scroller.scroll(handleScrolling)
    }
  )

  // Directly set chapter as active
  setChapterActive(null, hash)
}

/*
    Return wether the element exists on the page
 */
function pageHasElement (id) {
  var $scroller = getScroller()
  var $el = $scroller.find(id)

  return !!$el.length
}

/*
    Return the top position of an element
 */
function getElementTopPosition (id) {
  // Get actual position of element if nested
  var $scroller = getScroller()
  var $container = $scroller.find('.page-inner')
  var $el = $scroller.find(id)
  var $parent = $el.offsetParent()
  var dest = 0

  dest = $el.position().top

  while (!$parent.is($container)) {
    $el = $parent
    dest += $el.position().top
    $parent = $el.offsetParent()
  }

  // Return rounded value since
  // jQuery scrollTop() returns an integer
  return Math.floor(dest)
}

/*
    Handle updating summary at scrolling
*/
var $chapters, $activeChapter

// Set a chapter as active in summary and update state
function setChapterActive ($chapter, hash) {
  // No chapter and no hash means first chapter
  if (!$chapter && !hash) {
    $chapter = $chapters.first()
  }

  // If hash is provided, set as active chapter
  if (hash) {
    // Multiple chapters for this file
    if ($chapters.length > 1) {
      $chapter = $chapters
        .filter(function () {
          var titleId = getChapterHash($(this))
          return titleId === hash
        })
        .first()
    } else {
      // Only one chapter, no need to search
      $chapter = $chapters.first()
    }
  }

  // Don't update current chapter
  if ($chapter.is($activeChapter)) {
    return
  }

  // Update current active chapter
  $activeChapter = $chapter

  // Add class to selected chapter
  $chapters.removeClass('active')
  $chapter.addClass('active')

  // Update history state if needed
  hash = getChapterHash($chapter)

  var oldUri = window.location.pathname + window.location.hash
  var uri = window.location.pathname + hash

  if (uri !== oldUri) {
    history.replaceState({ path: uri }, null, uri)
  }
}

// Return the hash of link for a chapter
function getChapterHash ($chapter) {
  var $link = $chapter.children('a')
  var hash = $link.attr('href').split('#')[1]

  if (hash) hash = '#' + hash
  return hash || ''
}

// Handle user scrolling
function handleScrolling () {
  // Get current page scroll
  var $scroller = getScroller()
  var scrollTop = $scroller.scrollTop()
  var scrollHeight = $scroller.prop('scrollHeight')
  var clientHeight = $scroller.prop('clientHeight')
  var nbChapters = $chapters.length
  var $chapter = null

  // Find each title position in reverse order
  $($chapters.get().reverse()).each(function (index) {
    var titleId = getChapterHash($(this))
    var titleTop

    if (!!titleId && !$chapter) {
      titleTop = getElementTopPosition(titleId)

      // Set current chapter as active if scroller passed it
      if (scrollTop >= titleTop) {
        $chapter = $(this)
      }
    }
    // If no active chapter when reaching first chapter, set it as active
    if (index === nbChapters - 1 && !$chapter) {
      $chapter = $(this)
    }
  })

  // ScrollTop is at 0, set first chapter anyway
  if (!$chapter && !scrollTop) {
    $chapter = $chapters.first()
  }

  // Set last chapter as active if scrolled to bottom of page
  if (!!scrollTop && scrollHeight - scrollTop === clientHeight) {
    $chapter = $chapters.last()
  }

  setChapterActive($chapter)
}

function isPathAbsolute (path) {
  return /^(?:\/|[a-z]+:\/\/)/.test(path)
}

/*
    Handle a change of url withotu refresh the whole page
*/
var prevUri = location.href
async function handleNavigation (relativeUrl, push) {
  const prevUriParsed = new URL(prevUri)
  const search = prevUriParsed.search ? prevUriParsed.search : ''

  // Relative URL contain a relative pathname with optional hash.
  const uriParsed = new URL(relativeUrl, prevUri)
  const hash = uriParsed.hash

  // Copy search from old URL
  uriParsed.search = search
  const uri = uriParsed.toString()

  // Is it the same url (just hash changed?)
  const pathHasChanged = uriParsed.pathname !== prevUriParsed.pathname

  // Is it an absolute url
  const isAbsolute = isPathAbsolute(relativeUrl)
  const usePageRedirection = !usePushState || isAbsolute

  // Case 1 : Refresh Page if absoulte URL is used or push state is not used
  if (usePageRedirection) {
    location.href = uri
    return
  }

  // Case 2 : When page is not changed, do not fetch the URL.
  // This is mostly when a URL with different hash is used.
  if (!pathHasChanged) {
    if (push) history.pushState({ path: uri }, null, uri)
    return scrollToHash(hash)
  }

  // Fetch URL using HEAD. Validate if content-type is text/html
  let isHtmlPage = false
  try {
    const result = await window.fetch(uri, { method: 'HEAD' })
    isHtmlPage = result.headers.get('content-type').startsWith('text/html')
  } catch (e) {
    console.log(e)
    return
  }

  // Case 3: Resource at uri is not an HTML page
  if (!isHtmlPage) {
    location.href = uri
    return
  }

  // Case 4: Fetch Page dynamically using XHR.
  prevUri = uri
  const promise = $.Deferred(function (deferred) {
    $.ajax({
      type: 'GET',
      url: uri,
      cache: true,
      headers: {
        'Access-Control-Expose-Headers': 'X-Current-Location'
      },
      success: function (html, status, xhr) {
        // For GitBook.com, we handle redirection signaled by the server
        const responseURL = xhr.getResponseHeader('X-Current-Location') || uri
        // Replace html content
        html = html.replace(/<(\/?)(html|head|body)([^>]*)>/gi, function (
          a,
          b,
          c,
          d
        ) {
          return (
            '<' + b + 'div' + (b ? '' : ' data-element="' + c + '"') + d + '>'
          )
        })

        var $page = $(html)
        var $pageBody = $page.find('.book')
        var $pageHead

        // We only use history.pushState for pages generated with GitBook
        if ($pageBody.length === 0) {
          var err = new Error('Invalid gitbook page, redirecting...')
          return deferred.reject(err)
        }

        // Push url to history
        if (push) {
          history.pushState(
            {
              path: responseURL
            },
            null,
            responseURL
          )
        }

        // Force reparsing HTML to prevent wrong URLs in Safari
        $page = $(html)
        $pageHead = $page.find('[data-element=head]')
        $pageBody = $page.find('.book')

        // Merge heads
        // !! Warning !!: we only update necessary portions to avoid strange behavior (page flickering etc ...)

        // Update title
        document.title = $pageHead.find('title').text()

        // Reference to $('head');
        var $head = $('head')

        // Update next & prev <link> tags
        // Remove old
        $head.find('link[rel=prev]').remove()
        $head.find('link[rel=next]').remove()

        // Add new next * prev <link> tags
        $head.append($pageHead.find('link[rel=prev]'))
        $head.append($pageHead.find('link[rel=next]'))

        // Merge body
        var bodyClass = $('.book').attr('class')
        var scrollPosition = $('.book-summary').scrollTop()

        $pageBody.toggleClass(
          'with-summary',
          $('.book').hasClass('with-summary')
        )

        $('.book').replaceWith($pageBody)
        $('.book').attr('class', bodyClass)
        $('.book-summary').scrollTop(scrollPosition)

        // Update state
        gitbook.state.$book = $('.book')
        preparePage(!hash)

        // Scroll to hashtag position
        if (hash) {
          scrollToHash(hash)
        }

        deferred.resolve()
      }
    })
  }).promise()

  return loading.show(
    promise.fail(function (e) {
      console.log(e) // eslint-disable-line no-console
      // location.href = relativeUrl;
    })
  )
}

function updateNavigationPosition () {
  var bodyInnerWidth, pageWrapperWidth

  bodyInnerWidth = parseInt($('.body-inner').css('width'), 10)
  pageWrapperWidth = parseInt($('.page-wrapper').css('width'), 10)
  $('.navigation-next').css(
    'margin-right',
    bodyInnerWidth - pageWrapperWidth + 'px'
  )

  // Reset scroll to get current scroller
  var $scroller = getScroller()
  // Unbind existing scroll event
  $scroller.unbind('scroll')
  $scroller.scroll(handleScrolling)
}

function preparePage (resetScroll) {
  // Update navigation position
  updateNavigationPosition()

  // Get scroller
  var $scroller = getScroller()

  // Reset scroll
  if (resetScroll !== false) {
    $scroller.scrollTop(0)
  }

  // Get current page summary chapters
  $chapters = $('.book-summary .summary .chapter').filter(function () {
    var $link = $(this).children('a')
    var href = null

    // Chapter doesn't have a link
    if (!$link.length) {
      return false
    } else {
      href = $link.attr('href').split('#')[0]
    }

    var resolvedRef = new URL(href, location.href)
    return window.location.pathname === resolvedRef.pathname
  })

  // Bind scrolling if summary contains more than one link to this page
  if ($chapters.length > 1) {
    $scroller.scroll(handleScrolling)
  } else {
    // Else, set only chapter in summary as active
    $activeChapter = $chapters.first()
  }
}

function isLeftClickEvent (e) {
  return e.button === 0
}

function isModifiedEvent (e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}

/*
    Handle click on a link
*/
function handleLinkClick (e) {
  var $this = $(this)
  var hasTarget = $this.attr('target') !== undefined
  var hasDownload = $this.attr('download') !== undefined

  if (isModifiedEvent(e) || !isLeftClickEvent(e) || hasTarget || hasDownload) {
    return
  }

  e.stopPropagation()
  e.preventDefault()

  var url = $this.attr('href')
  if (url) handleNavigation(url, true)
}

function goNext () {
  var url = $('.navigation-next').attr('href')
  if (url) handleNavigation(url, true)
}

function goPrev () {
  var url = $('.navigation-prev').attr('href')
  if (url) handleNavigation(url, true)
}

function init () {
  // Prevent cache so that using the back button works
  // See: http://stackoverflow.com/a/15805399/983070
  $.ajaxSetup({
    cache: false
  })

  // Recreate first page when the page loads.
  history.replaceState({ path: window.location.href }, '')

  // Back Button Hijacking :(
  window.onpopstate = function (event) {
    if (event.state === null) {
      return
    }

    return handleNavigation(event.state.path, false)
  }

  $(document).on('click', '.navigation-prev', handleLinkClick)
  $(document).on('click', '.navigation-next', handleLinkClick)
  $(document).on('click', '.summary [data-path] a', handleLinkClick)
  $(document).on('click', '.page-inner a', handleLinkClick)

  $(window).resize(updateNavigationPosition)

  // // Prepare current page
  preparePage(true)
}

export { init, goNext, goPrev }
