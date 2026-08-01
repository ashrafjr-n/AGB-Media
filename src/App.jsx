import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'

/*
  THREE ROUTES NOW. `/contact` is still linked from data/navLinks.js without a <Route>
  of its own — that link is deliberately wired ahead of its page, and following it
  renders an empty page until it exists. `/services` was the second of the three to get
  one; navLinks.js needed no change, since it was already pointing here.

  No code splitting, deliberately. The app is one chunk, and neither AboutPage nor
  ServicesPage carries assets of its own — a lazy boundary here would cost a round trip
  to defer a few kilobytes.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
