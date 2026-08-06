/*
  The site's navigation model, in one place.

  Two headers render from this list — the fixed site header (Header/Header.jsx,
  visible once the hero is behind you) and the hero's own in-flow header
  (Hero/HeroHeader.jsx, visible while you are still in the hero). They are
  separate components on purpose, but they must never offer different links, so
  the array lives here rather than in either of them.

  All four entries now have a <Route> in App.jsx — /about was the first to get one,
  and the rest followed as their pages landed.
*/
/*
  `featured` marks the one entry that renders as the site's filled gold button rather
  than a plain link. It is a hint, not a requirement: HeroHeader honours it, and the
  fixed site header deliberately ignores it — a filled button inside that compact
  glass pill would fight the bar, and there may only ever be one filled call to action
  on the site (see shared/Button.module.css).
*/
const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Contact', to: '/contact', featured: true },
]

export default navLinks
