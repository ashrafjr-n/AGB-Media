import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

import useScrollPosition from '../../hooks/useScrollPosition'
import styles from './Header.module.css'

/*
  Navigation model. Extend this array to add routes — both the desktop bar and
  the mobile drawer render from it.
*/
const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Contact', to: '/contact' },
]

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
          transition={{ duration, ease: 'easeOut' }}
          style={{ originX: 0.5 }}
          className={styles['nav-link-underline']}
        />
      </motion.span>
    </Link>
  )
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { scrollY, viewportHeight } = useScrollPosition()
  const shouldReduceMotion = useReducedMotion()

  /*
    The header docks once the hero (100svh) has scrolled past. The morph itself
    is pure CSS on these data attributes — see Header.module.css. Doing it in CSS
    rather than JS means every property shares one transition declaration, so
    they cannot drift out of sync, and the global prefers-reduced-motion rule in
    global.css already collapses it to an instant state change.
  */
  const isDocked = viewportHeight > 0 && scrollY > viewportHeight

  /*
    These two animations are Framer Motion driven, so the CSS reduced-motion
    rule does not reach them — they have to be gated in JS. See CLAUDE.md §Motion.
  */
  const motionDuration = shouldReduceMotion ? 0 : 0.3
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header
      className={styles.header}
      data-docked={isDocked ? 'true' : 'false'}
      data-menu-open={isMenuOpen ? 'true' : 'false'}
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
              transition={{ duration: motionDuration, ease: 'easeInOut' }}
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
