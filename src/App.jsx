import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import NaelPage from './pages/NaelPage'

/*
  FIVE ROUTES NOW. The first four are every link in navLinks.js, each with one route;
  `/team/nael-al-jarabaa` is the fifth and is deliberately NOT in that list — it is a
  profile page for one person, reached only by clicking his circle in the home page's
  Team section (Team.jsx), not a destination either header's nav offers. See the note
  at the top of NaelPage.jsx.

  No code splitting, deliberately. The app is one chunk, and none of the secondary
  pages carries assets of its own beyond what is already bundled elsewhere (Nael's
  page reuses his existing Team-section portrait) — a lazy boundary here would cost a
  round trip to defer a few kilobytes.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/team/nael-al-jarabaa" element={<NaelPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
