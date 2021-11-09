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
