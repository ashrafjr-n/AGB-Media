import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

import navLinks from '../../data/navLinks'
import styles from './Header.module.css'

/*
  Mirrors --ease-out in variables.css. Framer Motion cannot read a CSS custom
  property, so the curve is duplicated here — change both together or the JS and
  CSS halves of the same movement drift apart.
*/
const EASE_OUT = [0.22, 1, 0.36, 1]

/* The underline sweeps out from the center on hover. */
const underlineVariants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1 },
}

function NavLink({ to, label, onClick, duration }) {
  return (
    <Link to={to} onClick={onClick} className={styles['nav-link']}>
      <motion.span
        initial="rest"
        whileHover="hover"
        animate="rest"
        className={styles['nav-link-inner']}
      >
        {label}
        <motion.span
          variants={underlineVariants}
          transition={{ duration, ease: EASE_OUT }}
          style={{ originX: 0.5 }}
          className={styles['nav-link-underline']}
        />
      </motion.span>
    </Link>
  )
}

/**
 * @param {object} props
 * @param {boolean} [props.visible]
 *   Whether the header is due on screen. It is **the Story section's midpoint**,
 *   observed against that section's own box and handed down through HomePage.jsx —
 *   see HEADER_REVEAL_AMOUNT in About.jsx for why the cue lives there.
 *
 *   This used to be read here, from `useScrollPosition(isPastFirstViewport)`: one
 *   scrolled viewport, which is the end of the hero. The header consequently arrived
 *   only once the Story section had taken the screen outright, and it now arrives at
 *   that section's halfway mark instead — earlier, and tied to a real element rather
 *   than to a multiple of the viewport that only matches while nothing overflows.
 *
 *   Defaults to `false` so a header rendered without the prop stays hidden rather
 *   than appearing over the hero, which is the one arrangement this site never has.
 */
function Header({ visible = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  /*
    A drawer left open while the header is hidden would reopen mid-air on the way
    back down, so scrolling back up past the cue closes it.
  */
  useEffect(() => {
    if (!visible) setIsMenuOpen(false)
  }, [visible])

  /*
    0.18s is --duration-fast, the timing the bar's corner radius now runs at —
    the drawer, the corners, and the hover underline are one gesture, and any
    slower here makes the drawer trail the pill it opens out of.
  */
  const motionDuration = shouldReduceMotion ? 0 : 0.18
  const closeMenu = () => setIsMenuOpen(false)

  return (
    /*
      The hide/reveal is a two-state CSS transition keyed off `data-hidden`, not a
      Framer animation, for two reasons: it is a toggle rather than choreography,
      and CSS transitions are already covered by the prefers-reduced-motion block
      in global.css, so it needs no separate reduced-motion branch. It follows the
      same attribute-driven pattern `data-menu-open` already uses for the pill's
      corners.

      `inert` does what pointer-events: none cannot — it takes the hidden header's
      links out of the tab order and hides them from assistive tech, so an
      invisible nav is never focusable over the hero.
    */
    <header
      className={styles.header}
      data-hidden={visible ? 'false' : 'true'}
      data-menu-open={isMenuOpen ? 'true' : 'false'}
      inert={!visible}
    >
      <div className={styles.bar}>
        {/*
          The turbulence that distorts the pill's frosted texture, referenced by
          `filter: url(#site-header-turbulence)` on .bar::before in Header.module.css.

          Its own definition rather than a shared one, for the same reason the hero's CTA
          has its own: baseFrequency is in user-space pixels, so a wide pill and a small
          button need different values, and a shared id would save nothing at render time
          — filters are evaluated per element, not per definition. This is one of exactly
          three (the others in HeroHeader.jsx and FluidBar.jsx); they are meant to stay
          separate, and each one's numbers are commented where they differ.

          Static seed, no <animate>: this texture is frozen by design.
        */}
        <svg className={styles['filter-defs']} aria-hidden="true" focusable="false">
          <filter
            id="site-header-turbulence"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              /* Low and wide, for a box that is ~1500px across and ~50 tall — this puts
                 features around 80px, so the pill carries several of them rather than one
                 gradient's worth of push. */
              baseFrequency="0.012 0.03"
              numOctaves="3"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              /* ±7px, against a 50px-tall pill. */
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <div className={styles.inner}>
          <Link to="/" className={styles.logo} onClick={closeMenu}>
            <img src="/assets/images/agb-logo.png" alt="AGB Media" />
          </Link>

          <nav className={styles['desktop-nav']}>
            {navLinks.map((link) => (
              <NavLink key={link.to} {...link} duration={motionDuration} />
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={styles['menu-toggle']}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: motionDuration, ease: EASE_OUT }}
              className={styles['mobile-nav']}
            >
              <div className={styles['mobile-nav-list']}>
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    {...link}
                    onClick={closeMenu}
                    duration={motionDuration}
                  />
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header