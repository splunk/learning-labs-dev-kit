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
import { highlight, languages } from 'prismjs/components/prism-core'
import Editor from 'react-simple-code-editor'
import '../languages'

function CodeEditor ({ text, onChange, language, height }) {
  const languageObject = languages[language] || languages.cpp
  return (
    <>
      <Editor
        value={text}
        onValueChange={onChange}
        placeholder='Type your code here'
        highlight={code => highlight(code, languageObject)}
        padding={10}
        tabSize={4}
        preClassName='code-editor'
        style={{
          height: height,
          color: 'white',
          backgroundColor: '#404040',
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 15,
          marginBottom: 40
        }}
      />
    </>
  )
}

export { CodeEditor }
