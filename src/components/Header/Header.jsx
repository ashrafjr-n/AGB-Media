import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

import navLinks from '../../data/navLinks'
import styles from './Header.module.css'

/*
  Mirrors --ease-in-out in variables.css. Framer Motion cannot read a CSS custom
  property, so the curve is duplicated here — change both together or the JS and
  CSS halves of the same movement drift apart. The CSS half is the bar's own
  border-radius transition in Header.module.css, which runs on the same token.

  IT WAS --ease-out (0.22, 1, 0.36, 1), AND THAT CURVE IS WHY THE PANEL READ AS A SNAP.
  --ease-out is close to exponential: it covers about 90% of its travel in the first
  quarter of the duration, so at 180ms the drawer had effectively finished opening within
  ~45ms and the remaining 135ms was a few pixels of settle nobody can see. That is the
  right curve for something *arriving* — a colour landing on a nav link, the header
  itself sliding in — and the wrong one for a panel whose whole gesture is the travel.

  --ease-in-out (0.65, 0, 0.35, 1) is symmetrical and spends its time in the middle, which
  is what makes the movement legible. Symmetry also matters because this is a reversible
  toggle: closing should take exactly as long as opening, which an ease-out curve does not
  do. The same argument the nav links' hover already made in Header.module.css.
*/
const MENU_EASE = [0.65, 0, 0.35, 1]

/*
  A PLAIN LINK, AND IT USED TO BE THREE NESTED MOTION ELEMENTS.

  The hover state was a colour change to --color-gold-light plus a gold hairline that
  swept out from the centre — a `motion.span` wrapper carrying `whileHover`, a second
  `motion.span` for the underline, and an `underlineVariants` map to drive it. The hover
  is now a single CSS colour transition on .nav-link (see Header.module.css), so all of
  that is gone and this component is a <Link> with a span inside it.

  The span stays because it carries the link's block padding — its hit area — not because
  anything is positioned against it any more.

  Losing the Framer layer is a real simplification rather than a like-for-like swap: a CSS
  transition is covered by the prefers-reduced-motion block in global.css, where a
  JS-driven animation needs its own gate, and `whileHover` on a re-rendering nav row was
  three subscriptions per link for one property.
*/
function NavLink({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className={styles['nav-link']}>
      <span className={styles['nav-link-inner']}>{label}</span>
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
    0.3s is --duration-base, the timing the bar's corner radius now runs at — the drawer
    and the corners are one gesture and must stay on one number, which is the whole reason
    this is stated here rather than left to each end.

    It was 0.18s (--duration-fast). Read alongside the curve change at MENU_EASE, because
    the two are one correction rather than two: under --ease-out, 180ms was not a fast
    animation but effectively no animation, since that curve had spent 90% of its travel
    in the first ~45ms. Under a symmetrical curve 180ms is a genuine 180ms — visible, and
    a little hurried for a panel this size. 300ms is where the movement reads as
    deliberate without lagging the tap that asked for it.
  */
  const motionDuration = shouldReduceMotion ? 0 : 0.3

  /*
    The list's own small slide, and it is the difference between a panel opening and a
    panel being uncovered. The drawer's height animation alone moves nothing — the links
    sit still while a clipping edge travels down past them, which reads as a mask rather
    than as a surface arriving. Eight pixels against the curve above is enough to say the
    content came with the box.

    Zero under reduced motion: the height and opacity are already collapsed to an instant
    by `motionDuration`, and an untweened 8px jump is exactly the kind of movement the
    preference exists to remove.
  */
  const listLift = shouldReduceMotion ? 0 : -8
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
          <Link
            to="/"
            className={styles.logo}
            onClick={closeMenu}
            aria-label="AGB Media — home"
          >
            <img src="/assets/images/agb-logo.png" alt="AGB Media" />
          </Link>

          <nav className={styles['desktop-nav']}>
            {navLinks.map((link) => (
              <NavLink key={link.to} {...link} />
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
              /*
                Per-property rather than one blanket transition, because the two are not
                doing the same job. Height is the gesture and takes the full duration on
                the shared curve. Opacity is only there to keep the links from being
                legible while they are half-clipped by a box that is still growing — it
                wants to be over well before the box has finished, and it wants to be
                linear, since an eased fade on top of an eased height reads as the panel
                hesitating.
              */
              transition={{
                height: { duration: motionDuration, ease: MENU_EASE },
                opacity: { duration: motionDuration * 0.55, ease: 'linear' },
              }}
              className={styles['mobile-nav']}
            >
              {/*
                The list slides the last few pixels into place rather than sitting still
                behind a travelling clip — see `listLift`. On the same curve and duration
                as the height above, so the two are one movement and not two.
              */}
              <motion.div
                className={styles['mobile-nav-list']}
                initial={{ y: listLift }}
                animate={{ y: 0 }}
                exit={{ y: listLift }}
                transition={{ duration: motionDuration, ease: MENU_EASE }}
              >
                {navLinks.map((link) => (
                  <NavLink key={link.to} {...link} onClick={closeMenu} />
                ))}
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header