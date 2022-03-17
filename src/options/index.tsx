import React from 'react'
import { render } from 'react-dom'
import { ChakraProvider } from '@chakra-ui/react'

import { Options } from './Options'
import './index.css'

render(
  <ChakraProvider>
    <Options />
  </ChakraProvider>,
  document.querySelector('#root')
)
