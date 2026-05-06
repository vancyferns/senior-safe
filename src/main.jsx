import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import NeonAuthProvider from './components/NeonAuthProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NeonAuthProvider>
      <App />
    </NeonAuthProvider>
  </StrictMode>,
)
