import * as $ from 'jquery'

function isMobile () {
  return $(document).width() <= 600
}

function isSmallScreen () {
  return $(document).width() <= 1240
}

export { isMobile, isSmallScreen }
