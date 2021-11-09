import React from 'react'
import styled from 'styled-components'

const NavBarBack = styled.a`
  color: white;
  padding: 0 1.4rem;
  margin-right: 0;
  &:hover {
    color: #65A637;
  }
`

const NavBarTitle = styled.span`
  font-family: sans-serif;
  color: white;
  font-size: 1.1rem;
`

const NavBarBackIcon = styled.i`
  font-size: 2rem;
`

function NavBar ({ href, title }) {
  return (
    <>
      <NavBarBack className='navbar-back' href={href}>
        <NavBarBackIcon className='fa fa-angle-left' />
      </NavBarBack>
      <NavBarTitle className='navbar-title'>
        {title}
      </NavBarTitle>
    </>
  )
}

export { NavBar }
