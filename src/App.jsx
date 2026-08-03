import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import NaelPage from './pages/NaelPage'
import AbdullahPage from './pages/AbdullahPage'
import NotFoundPage from './pages/NotFoundPage'

/*
  SIX ROUTES PLUS A CATCH-ALL. The first four are every link in navLinks.js, each with one route;
  `/team/nael-al-jarabah` and `/founder` are the fifth and sixth and are deliberately NOT
  in that list — both are profile pages for one person, each reached only by clicking a
  specific element on the home page (Nael's circle in Team.jsx, the "Meet the Founder"
  button in Founder.jsx), not destinations either header's nav offers. See the note at the
  top of NaelPage.jsx and, for the second, AbdullahPage.jsx.

  THE WILDCARD MUST STAY LAST, and it is the one ordering constraint in this file. React
  Router 7 ranks routes by specificity rather than by source order, so `*` would lose to
  every literal path above it regardless — but keeping it at the foot is what makes that
  obvious to read, and it is the only route here whose position carries any meaning at
  all. It catches every unmatched URL, including a mistyped path and one of the two
  profile routes with a wrong slug; without it those render an empty document rather
  than a page. See the note at the top of NotFoundPage.jsx for why that route alone
  renders no site header.

  No code splitting, deliberately. The app is one chunk, and none of the secondary
  pages carries assets of its own beyond what is already bundled elsewhere (Nael's page
  reuses his existing Team-section portrait; Abdullah's reuses the Founder section's) —
  a lazy boundary here would cost a round trip to defer a few kilobytes.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/team/nael-al-jarabah" element={<NaelPage />} />
        <Route path="/founder" element={<AbdullahPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
