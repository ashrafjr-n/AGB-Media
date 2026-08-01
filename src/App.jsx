import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'

/*
  FOUR ROUTES NOW, AND EVERY LINK IN navLinks.js HAS ONE. `/contact` was the last of
  the four to get a <Route>; the link was already wired ahead of it, so nothing in
  navLinks.js needed to change.

  No code splitting, deliberately. The app is one chunk, and none of the three
  secondary pages carries assets of its own — a lazy boundary here would cost a round
  trip to defer a few kilobytes.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
