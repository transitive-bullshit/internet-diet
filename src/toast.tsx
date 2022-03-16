// NOTE: this entry script is imported dynamically by `content.ts` once the DOM
// has been initialized. All react-related features used by the content script
// should be kept within this module.

import React from 'react'
import { render } from 'react-dom'
import toast, { Toaster } from 'react-hot-toast'

// hacky way to share global with content script
;(window as any).toast = toast

const root = document.createElement('div')
document.body.appendChild(root)
render(
  <Toaster
    position='top-right'
    toastOptions={{
      success: {
        duration: 3000
      },
      error: {
        duration: 5000
      }
    }}
  />,
  root
)
