import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import buttonStyles from '../components/shared/Button.module.css'
import styles from './NotFoundPage.module.css'

/*
  THE 404 PAGE — the catch-all route in App.jsx, rendered for any URL that matches none
  of the six real ones. Before it existed an unmatched path rendered a bare white-on-
  nothing screen, which is the one state on this site that looks broken rather than
  designed.

  IT RENDERS NO HEADER, and that is the deliberate difference from every other route
  here. Every other page mounts `<Header visible />`; this one is a standalone
  full-screen moment with exactly one way out of it. Two reasons, and the second is the
  real one:

    - A 404 is not a destination in the site's own structure. Putting the nav on it
      frames a dead URL as a page of the site with a menu, rather than as the site
      catching a mistake.
    - There is nothing to navigate *within*. The whole screen is one centred column
      with a single call to action, and a nav offering four more destinations directly
      above it would make the one deliberate way out — "Back Home" — the fifth-most
      prominent thing on a page with four elements. The button IS the navigation.

  A visitor is never stranded: the CTA goes to `/`, and every route the headers offer
  is one click from there.

  NOTHING HERE COSTS ANYTHING. No video, no glass, no backdrop-filter, no observer of
  its own — the page is a flex column on the site's ground with a vignette and the
  shared grain over it, so it needs nothing from useExclusiveVideo and claims no
  compositing layer beyond what global.css already puts on every route.
*/
function NotFoundPage() {
  /*
    THE SHARED LADDER, scoped like every other one on the site. Three rungs, and they
    arrive in reading order: label, heading, way out.

    `whileInView` on a page that is entirely in view at mount fires immediately, so this
    reads as an entrance rather than as a scroll reveal — the same thing the Contact and
    Services pages' first blocks already do. Using the shared hook rather than writing an
    `initial`/`animate` pair inline is what keeps this page's arrival the same gesture as
    the rest of the site's, and it carries the prefers-reduced-motion branch, which is
    why nothing here checks the preference.
  */
  const revealAt = useSectionReveal('not-found')

  /*
    ROUTE ENTRY STARTS AT THE TOP, the same three lines every secondary route carries —
    React Router changes the URL without touching scroll, and there is no scroll
    restoration anywhere in this router. It matters more here than elsewhere: a 404 is
    most often reached by a *client-side* navigation to a wrong path, so without this the
    page opens at whatever offset the bad link was clicked at, showing an empty screen
    below its own centred content. On mount only.
  */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className={`${styles.page} noise-overlay`}>
      <div className={styles.inner}>
        {/*
          The error itself, for a screen reader only. "OOPS" and the sentence below it
          are the visual treatment and deliberately never print a status code — but a
          reader arriving here without the layout deserves to be told plainly what
          happened, which neither of those does on its own. `sr-only` is a global
          utility from global.css, so a literal string rather than a module class
          (CLAUDE.md §4).
        */}
        <p className="sr-only">Error 404 — page not found.</p>

        <motion.p className={styles.eyebrow} {...revealAt(0)}>
          Oops
        </motion.p>

        <motion.h1 className={styles.heading} {...revealAt(1)}>
          The story you’re looking for hasn’t been written yet.
        </motion.h1>

        {/*
          The gold hairline rides the heading's own rung rather than taking one of its
          own. It is a mark under the sentence, not a third piece of content, and a
          stagger step between the two would make it read as one — the eye would watch
          it arrive.
        */}
        <motion.div
          className={styles.rule}
          aria-hidden="true"
          {...revealAt(1)}
        />

        {/*
          .button-solid — the flat gold fill, and the right one of the three variants
          here for the reason Button.module.css gives: the two glass variants are built
          to sit over footage or over the Story section's frosted ground, and this page
          has neither. A glass pane needs something behind it to be glass *of*; on a flat
          ground it is a slightly lighter rectangle. The solid fill is also the site's
          warm, plain stop, which is what a single way off a dead end should be.

          It does not violate §2's one-emphatic-button rule: this route renders exactly
          one button and shares a viewport with nothing.

          A plain Link inside its own motion.div, matching the Founder's .button-solid
          call site rather than the `motion.create(Link)` the two glass variants use.
          Those two need to BE the animated element because their pseudo-element material
          has to survive an inline transform on the host; a flat fill has no
          pseudo-elements to protect, so the wrapper is simpler and does the same job.
        */}
        <motion.div className={styles.cta} {...revealAt(2)}>
          <Link
            to="/"
            className={`${buttonStyles.button} ${buttonStyles['button-solid']}`}
          >
            Back Home
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

export default NotFoundPage
