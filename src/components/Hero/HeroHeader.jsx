import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import navLinks from '../../data/navLinks'
import buttonStyles from '../shared/Button.module.css'
import styles from './HeroHeader.module.css'

/*
  The hero's own header, and deliberately NOT the site header.

  It is an ordinary in-flow element at the top of the hero section: it sits over the
  video backdrop, scrolls away with the hero, and is gone once the Story section
  covers it. The fixed site header (Header/Header.jsx) is suppressed for exactly as
  long as this one is on screen, so the page never shows two headers at once — see
  the `data-hidden` handling there.

  It lives in the Hero directory rather than getting its own top-level component
  folder because it has no life outside the hero; both files sit beside Hero's, per
  the one-component-per-file layout in CLAUDE.md §4.

  Both headers render from src/data/navLinks.js. They look different on purpose, but
  they must never offer different destinations.

  There is no separate CTA element here. The nav's own "Contact" entry *is* the call to
  action — it carries `featured: true` in the nav data and renders as the site's filled
  gold button in place of a plain link, so the row is four items, not five. An earlier
  pass had both a "Contact" link and a "Contact Us" button side by side, which read as
  a duplicate.
*/

/*
  Entrance choreography, moved here from Hero.jsx along with the content it applies
  to: the logo, tagline, location label and CTA that used to fill the hero body are
  gone, and this header is now the only animated thing in the hero. Two elements, the
  second ~140ms behind the first — close enough to read as one gesture, far enough
  apart that they do not land together. Reveal order is left to right, matching the
  layout.
*/
const ENTRANCE_DELAY = {
  logo: 0.1,
  nav: 0.24,
}

/*
  Has the entrance already run in this session?

  Module scope rather than component state, and that is the whole point: it has to
  outlive the component. The animation is mount-triggered (`initial`/`animate`, never
  `whileInView`), so scrolling past the hero and back cannot retrigger it on its own —
  but *anything* that unmounts and remounts this would replay it from the top, and a
  flag inside the component would be reset by exactly that. Routing away to /contact
  and back is the obvious case. This survives all of it and resets only on a genuine
  page load, which is precisely "plays once, on first load".

  Latched on animation *completion*, not on mount, because StrictMode deliberately
  mounts, unmounts and remounts every component in development. A mount-latched flag
  would be set by that throwaway first mount and would suppress the animation before
  anyone ever saw it. Completion happens long after StrictMode is done.
*/
let entrancePlayed = false

const markEntrancePlayed = () => {
  entrancePlayed = true
}

function HeroHeader() {
  /*
    The prefers-reduced-motion block in global.css only governs CSS transitions;
    these animations are driven inline by Framer Motion, so the preference has to
    be honoured here. When reduced, every element renders in its final state.
  */
  const shouldReduceMotion = useReducedMotion()

  /*
    Read once per mount and held in a ref. Hero re-renders on every frame of a
    scroll (it watches viewportProgress to gate video playback) and re-renders this
    child with it, so a plain read would be re-evaluated mid-entrance.
  */
  const playEntrance = useRef(!entrancePlayed).current

  /*
    Returns no animation props at all when the entrance is not to play, which leaves
    each element rendering in its natural resting state: no `initial`, so nothing
    starts at opacity 0 and nothing has to animate back.
  */
  const rise = (delay) =>
    shouldReduceMotion || !playEntrance
      ? {}
      : {
          initial: { opacity: 0, y: -16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <div className={styles['hero-header']}>
      {/*
        The turbulence that distorts the Contact button's frozen texture, referenced by
        `filter: url(#hero-cta-turbulence)` on .button-featured in shared/Button.module.css.

        It lives here, at that variant's only call site, rather than being shared with the
        ticker's filter or the site header's. Sharing one definition would save nothing at
        render time — a filter is evaluated per element it is applied to, so two elements
        pointing at one id still pay twice — and it cannot be shared anyway: baseFrequency
        is in user-space pixels, so the value that gives this ~140px button visible
        structure would be a near-uniform push across a 1500px strip.

        Static seed, no <animate>: this texture is frozen by design. See FluidBar.jsx for
        why an animated seed would pop rather than flow even where motion is wanted.

        color-interpolation-filters="sRGB" is not optional — the default linearRGB
        reinterprets the displacement map's channels and both washes out the result and
        shifts where the field pushes.
      */}
      <svg className={styles['filter-defs']} aria-hidden="true" focusable="false">
        <filter
          id="hero-cta-turbulence"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            /* High, and anisotropic: at this box size a lower frequency has no room to
               show a second feature, and the taller vertical value keeps the warp from
               reading as horizontal banding across a short button. */
            baseFrequency="0.05 0.09"
            /* Two, not the ticker's three — the third octave's detail lands below a
               pixel at this scale and only costs time. */
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            /* ±4px. The ticker's 26 would tear a 40px-tall button apart. */
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/*
        Hard inline-start edge, and raised: the row is top-aligned and this is pulled
        further up still, so the mark sits high in the header rather than centred
        against the nav. See .logo in the stylesheet.
      */}
      <motion.div {...rise(ENTRANCE_DELAY.logo)} className={styles.logo}>
        <Link to="/" aria-label="AGB Media — home">
          <img src="/assets/images/agb-logo.png" alt="AGB Media" />
        </Link>
      </motion.div>

      {/*
        Hard inline-end edge. One element, not two: the nav is the whole right side,
        and its "Contact" entry is the call to action rather than a button sitting
        beside it.

        `markEntrancePlayed` latches here because the nav is now the last thing to
        animate — it moved off the CTA that used to follow it.
      */}
      <motion.nav
        {...rise(ENTRANCE_DELAY.nav)}
        onAnimationComplete={markEntrancePlayed}
        className={styles.nav}
        aria-label="Main"
      >
        {navLinks.map(({ label, to, featured }) =>
          /*
            The `featured` entry renders as the site's one filled button — solid gold,
            rounded, near-black label — instead of a plain nav link. Base plus exactly
            one variant from shared/Button.module.css, and a local class carrying only
            spacing; no visual property belongs here.

            A plain <Link>, not a motion one: the parent nav already animates the whole
            row, and a motion child would compound both transforms and multiply both
            opacities against its parent's own fade.
          */
          featured ? (
            <Link
              key={to}
              to={to}
              className={`${buttonStyles.button} ${buttonStyles['button-featured']} ${styles['nav-cta']}`}
            >
              {label}
            </Link>
          ) : (
            <Link key={to} to={to} className={styles['nav-link']}>
              {label}
            </Link>
          ),
        )}
      </motion.nav>
    </div>
  )
}

export default HeroHeader
