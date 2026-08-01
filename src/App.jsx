import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'

/*
  TWO ROUTES NOW. `/services` and `/contact` are still linked from data/navLinks.js
  without a <Route> of their own — those links are deliberately wired ahead of their
  pages, and following one renders an empty page until it exists. Adding one means adding
  it here and checking whether navLinks.js needs anything.

  No code splitting, deliberately. The app is one chunk, and AboutPage is type on a
  painted ground with no assets of its own — a lazy boundary here would cost a round trip
  to defer a few kilobytes.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
