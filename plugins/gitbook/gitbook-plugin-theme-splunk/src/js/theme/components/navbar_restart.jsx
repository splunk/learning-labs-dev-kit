import React from 'react'
import { RestartModal } from './restart_modal.jsx'

function NavbarRestart ({ onRestart }) {
  const [show, setShow] = React.useState(false)
  const onClose = () => {
    setShow(false)
  }
  const onClick = () => {
    setShow(true)
  }
  return (
    <>
      <a className='nav-link' href='javascript:void(0)' onClick={onClick}>
        <i className='fa fa-clock-o mr-2' />Restart Workshop
      </a>
      <RestartModal show={show} onRestart={onRestart} onClose={onClose} />
    </>
  )
}

export { NavbarRestart }
