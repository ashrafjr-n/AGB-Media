import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

import useScrollPosition from '../../hooks/useScrollPosition'
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

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  /*
    This header is suppressed for the whole of the first screen: the hero carries
    its own in-flow header over the footage (Hero/HeroHeader.jsx), and the two must
    never be on screen together. It slides in only once the hero is fully behind
    the viewport.

    `viewportProgress >= 1` is the same threshold Hero.jsx uses to decide the hero
    is covered and pause the video — the hero is exactly 100svh, so one scrolled
    viewport *is* the end of the hero. Reusing the identical comparison keeps the
    reveal and the video pause from ever disagreeing by a frame.
  */
  const { viewportProgress } = useScrollPosition()
  const isPastHero = viewportProgress >= 1

  /*
    A drawer left open while the header is hidden would reopen mid-air on the way
    back down, so scrolling back into the hero closes it.
  */
  useEffect(() => {
    if (!isPastHero) setIsMenuOpen(false)
  }, [isPastHero])

  /*
    The header no longer morphs with scroll — it always renders in the floating
    pill state (previously the "docked" look). Kept as a data attribute purely
    so the menu-open styling in Header.module.css (which targets
    [data-docked='true'][data-menu-open='true']) still applies.
  */
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
      data-docked="true"
      data-hidden={isPastHero ? 'false' : 'true'}
      data-menu-open={isMenuOpen ? 'true' : 'false'}
      inert={!isPastHero}
    >
      <div className={styles.bar}>
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