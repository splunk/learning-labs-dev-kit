/**
 * Copyright 2021 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
