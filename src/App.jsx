import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import Loader from './components/Loader/Loader'
import Header from './components/Header/Header'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import NaelPage from './pages/NaelPage'
import AbdullahPage from './pages/AbdullahPage'
import NotFoundPage from './pages/NotFoundPage'

/*
  THE ROUTE TABLE, as bare paths rather than buried inside six `<Route>` tags — so the
  same list can decide both what `<Routes>` renders and, in AnimatedRoutes below, whether
  the current pathname is one of these six rather than the wildcard. Keep it in sync with
  the SIX ROUTES comment at the foot of this file; that comment explains what each path is
  and why it exists, this one only needs the paths themselves.
*/
const ROUTE_PATHS = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/team/nael-al-jarabah',
  '/founder',
]

/*
  THE ROUTE TRANSITION, and it is deliberately the smallest thing that could work.

  A route change swaps one page for another with nothing between them, which reads as a
  cut in a site whose every other entrance is a slow decelerating fade. This restores the
  continuity: the outgoing page fades out, then the incoming one fades in.

  `mode="wait"` — the two never overlap. Two full pages composited at once would put two
  viewport-wide backdrop-filters on screen simultaneously (the home page alone carries
  three), and the scroll reset each page performs on mount would land while the previous
  one was still visible at its own offset. Waiting costs the two durations end to end and
  buys a transition with exactly one page on screen at any moment.

  `initial={false}` — the FIRST page of a session does not fade in. That frame belongs to
  the first-visit loader above, which lifts to reveal a hero that is already fully painted;
  fading the page in underneath it would be a second entrance competing with the first. It
  is also why the two features share no state: this one is off precisely when that one is
  on, by construction rather than by a flag.

  OPACITY ONLY. NO SCALE, NO TRANSFORM, NO FILTER, NO MASK — and this is a hard constraint
  rather than a taste call, because the wrapper below is an ancestor of every page:

    - a `transform` (or `will-change: transform`) on it becomes the containing block for
      `position: fixed` descendants — the site header itself no longer risks this, since it
      now mounts above this wrapper rather than inside a page (see AnimatedRoutes), but a
      page-local fixed element (ContactPage and ServicesPage both have one) would still
      scroll away with the page instead of staying put;
    - a `filter`, a `mask` or a lingering `opacity < 1` makes it a BACKDROP ROOT, which is
      what the home page's frosted grounds sample through (see CLAUDE.md §7 on `.stage` and
      `.stage-content`, which are forbidden the same properties for the same reason).

  A plain opacity fade avoids all of it: at rest the wrapper is `opacity: 1`, which creates
  neither a containing block nor a backdrop root, and the brief window where it is mid-fade
  is a route change during which the page has just mounted at scroll 0 — the frosted Story
  ground is a screen below the fold and cannot be seen flattened.

  IT TOUCHES NO IN-PAGE ANIMATION. The scroll reveals (useSectionReveal), the Hero->Story
  sticky backdrop and the WhyAgb->Team closing pin are all scroll-driven inside a mounted
  page; this only ever runs on a change of URL, adds no scroll listener, and adds no
  property to the wrapper that a sticky descendant can be re-scoped by (`overflow`,
  `transform`, `filter`, `perspective` and `contain` are all absent, which is what keeps
  both sticky pairings sticking to the viewport exactly as they did).
*/
/*
  180ms out, 240ms in — the same 3:4 ratio these carried at 300/400, taken down by two
  fifths. Under `mode="wait"` they run back to back, so the pair is what the visitor
  actually waits through: 420ms end to end rather than 700ms. That is the difference
  between a navigation that feels considered and one that feels like latency, and it is
  the only thing about the transition that changed — the shape, the curves and the
  opacity-only constraint below are untouched.
*/
const TRANSITION_OUT = 0.18
const TRANSITION_IN = 0.24

/*
  A local component, in the same file as the routes it wraps, for one reason: `useLocation`
  only works inside the router, so this cannot be App itself — and splitting the route table
  into its own file to satisfy that would move the site's URL map away from the place
  everyone looks for it. Same precedent as AboutPage's local `Chapter`.
*/
function AnimatedRoutes() {
  const reduceMotion = useReducedMotion()

  /*
    Keyed on the pathname rather than on `location` itself. A change of hash or query
    string is not a page change and must not replay the fade — an in-page anchor would
    otherwise blink the whole document.
  */
  const location = useLocation()

  /*
    HEADER VISIBILITY, ACROSS A ROUTE CHANGE.

    Every route wants the fixed site header at a flat `true` EXCEPT two: the home page,
    where it is a scroll-derived boolean owned by HomePage (the Story section's midpoint
    or-ed with "the hero is behind us" — see HomePage.jsx and the note on Header's
    `visible` prop), and the wildcard, which renders no nav on purpose (see the note at
    the top of NotFoundPage.jsx). `homeHeaderVisible` is the one piece of that state that
    cannot be derived from the route alone, so it is the one piece lifted here; HomePage
    reports into it through the setter handed to its route element below.

    Deriving the flag from `ROUTE_PATHS` rather than resetting it on unmount is what keeps
    this correct with no timing window: there is no frame where a stale value from the
    page just left is shown, because a route that is not home or the wildcard never reads
    `homeHeaderVisible` at all.
  */
  const [homeHeaderVisible, setHomeHeaderVisible] = useState(false)
  const isKnownRoute = ROUTE_PATHS.includes(location.pathname)
  const headerVisible = !isKnownRoute
    ? false
    : location.pathname === '/'
      ? homeHeaderVisible
      : true

  /*
    Reduced motion gets an instant cut: no fade in either direction, and a zero duration so
    AnimatePresence still resolves the exit and swaps the page without waiting. The
    preference is honoured here in JS because Framer writes these values inline, where the
    `prefers-reduced-motion` block in global.css cannot reach them.
  */
  const fade = reduceMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 1, transition: { duration: 0 } },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        /*
          The exit carries its OWN transition inline, because the `transition` prop below
          is the one the entrance uses and an exit has to be quicker: the outgoing page
          clears fast, the incoming one arrives on the site's usual decelerating curve.
          See the note at the two constants for what the pair costs end to end.
        */
        exit: {
          opacity: 0,
          transition: { duration: TRANSITION_OUT, ease: [0.4, 0, 1, 1] },
        },
      }

  return (
    <>
      {/*
        OUTSIDE the AnimatePresence wrapper below, and that is the whole fix: the header
        used to be mounted per-page, inside the fading `motion.div`, so it faded out and
        back in on every navigation along with the page beneath it — a flicker on an
        element that is meant to read as constant chrome, not as page content. Rendered
        here it mounts once for the life of the router and never unmounts on a route
        change; only its own `data-hidden` CSS transition (Header.module.css) shows or
        hides it, exactly as it already did within a single page.
      */}
      <Header visible={headerVisible} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={fade.initial}
          animate={fade.animate}
          exit={fade.exit}
          transition={{
            duration: reduceMotion ? 0 : TRANSITION_IN,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/*
            `location` is passed explicitly. Without it <Routes> reads the CURRENT location
            on every render, so the outgoing page would re-render as the new route mid-exit
            and the fade would play over the wrong content.
          */}
          <Routes location={location}>
            <Route
              path="/"
              element={<HomePage onHeaderVisibleChange={setHomeHeaderVisible} />}
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/team/nael-al-jarabah" element={<NaelPage />} />
            <Route path="/founder" element={<AbdullahPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

/*
  SIX ROUTES PLUS A CATCH-ALL (in AnimatedRoutes above). The first four are every link in
  navLinks.js, each with one route; `/team/nael-al-jarabah` and `/founder` are the fifth and
  sixth and are deliberately NOT in that list — both are profile pages for one person, each
  reached only by clicking a specific element on the home page (Nael's circle in Team.jsx,
  the "Meet the Founder" button in Founder.jsx), not destinations either header's nav offers.
  See the note at the top of NaelPage.jsx and, for the second, AbdullahPage.jsx.

  THE WILDCARD MUST STAY LAST, and it is the one ordering constraint in this file. React
  Router 7 ranks routes by specificity rather than by source order, so `*` would lose to
  every literal path above it regardless — but keeping it at the foot is what makes that
  obvious to read, and it is the only route here whose position carries any meaning at
  all. It catches every unmatched URL, including a mistyped path and one of the two
  profile routes with a wrong slug; without it those render an empty document rather
  than a page. `ROUTE_PATHS` above does not list `*` for exactly this reason — it is
  the "known route" list, and the wildcard is what a pathname falls through to when it
  matches none of them, which is also how the header knows to hide itself there. See
  the note at the top of NotFoundPage.jsx for why that route alone shows no site header.

  No code splitting, deliberately. The app is one chunk, and none of the secondary
  pages carries assets of its own beyond what is already bundled elsewhere (Nael's page
  reuses his existing Team-section portrait; Abdullah's reuses the Founder section's) —
  a lazy boundary here would cost a round trip to defer a few kilobytes.

  THE LOADER IS OUTSIDE THE ROUTER, ON PURPOSE. It belongs to the session rather than to a
  page: inside, a route change would unmount it and the transition above would animate it.
  It is also FIRST in this tree so it lands in the same commit as the page beneath it —
  see the note at the top of Loader.jsx. The two features share no state and must not
  start to; the loader runs once before any navigation, the transition never runs on the
  first paint.
*/
function App() {
  return (
    <>
      <Loader />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </>
  )
}

export default App
