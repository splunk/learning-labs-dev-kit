import * as $ from 'jquery'

function init (initObj) {
  $('#login-name').text(initObj.name)
  $('a.logout').attr('href', initObj.urlLogout)
  $('.navbar-login').removeClass('invisible')
}

export { init }
