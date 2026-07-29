import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Single global stylesheet — it imports the design tokens itself.
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
