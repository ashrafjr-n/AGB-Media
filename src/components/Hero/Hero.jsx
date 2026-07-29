import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMail } from 'react-icons/hi'

import heroVideo from '../../assets/videos/hero.mp4'
import styles from './Hero.module.css'

/* Lets the CTA animate without wrapping the Link in an extra layout box. */
const MotionLink = motion.create(Link)

/*
  Entrance choreography. The reveal order is not DOM order — the logo leads,
  then the tagline, then the left column top-to-bottom — so each element carries
  an explicit delay instead of a parent `staggerChildren`, which would follow
  the markup. Delays are spaced ~120ms apart: close enough to read as one
  gesture, far enough apart that nothing lands simultaneously.
*/
const ENTRANCE_DELAY = {
  logo: 0.1,
  tagline: 0.24,
  location: 0.38,
  title: 0.5,
  cta: 0.64,
}

/*
  Metadata rendered as a single line along the bottom of the hero.
  Separators are drawn in CSS (a gold dot before every item but the first), so
  this array stays pure data — add or reorder entries freely.
*/
const tickerItems = [
  { label: 'Company', value: 'AGB Media' },
  { label: 'Founded', value: '2025' },
  { label: 'HQ', value: 'Doha, Qatar' },
  { label: 'Founder', value: 'Abdullah Ghifan' },
  { label: 'CEO', value: 'Nael Al-Jarabaa' },
  { label: 'Scope', value: 'Qatar · Gulf · Arab World' },
]

function Hero() {
  /*
    The prefers-reduced-motion block in global.css only governs CSS transitions;
    these animations are driven inline by Framer Motion, so the preference has to
    be honoured here. When reduced, every element renders in its final state.
  */
  const shouldReduceMotion = useReducedMotion()

  const rise = (delay) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section className={styles.hero}>
      {/*
        Full-viewport, fixed video backdrop with a very light black layer on
        top to keep the foreground text legible.

        Note: browsers block autoplay-with-sound unless the user has already
        interacted with the page (or the site), so on first load most browsers
        will still start this muted regardless of the `muted={false}` below.
        Sound will play once the visitor interacts with the tab/page.
      */}
      <div className={styles.backdrop} aria-hidden="true">
        <video
          className={styles['backdrop-video']}
          src={heroVideo}
          autoPlay
          loop
          muted={false}
          playsInline
        />
        <div className={styles['backdrop-overlay']} />
      </div>

      <div className={styles.content}>
        {/* Left column — location, wordmark, call to action. */}
        <div className={styles.intro}>
          <motion.p {...rise(ENTRANCE_DELAY.location)} className={styles.location}>
            Doha · Qatar
          </motion.p>

          <motion.h1 {...rise(ENTRANCE_DELAY.title)} className={styles.title}>
            AGB Media
          </motion.h1>

          <MotionLink
            {...rise(ENTRANCE_DELAY.cta)}
            to="/contact"
            className={styles['contact-button']}
          >
            <HiOutlineMail size={20} aria-hidden="true" />
            <span>Contact Us</span>
          </MotionLink>
        </div>

        {/* Right column — logo and gradient tagline. */}
        <div className={styles.brand}>
          <motion.img
            {...rise(ENTRANCE_DELAY.logo)}
            src="/assets/images/agb-logo.png"
            alt="AGB Media"
            className={styles.logo}
          />
          <motion.p {...rise(ENTRANCE_DELAY.tagline)} className={styles.tagline}>
            Arts &amp; Media Production
          </motion.p>
        </div>
      </div>

      <ul className={styles.ticker}>
        {tickerItems.map(({ label, value }) => (
          <li key={label} className={styles['ticker-item']}>
            <span className={styles['ticker-label']}>{label}</span>
            <span className={styles['ticker-dash']}>—</span>
            <span className={styles['ticker-value']}>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Hero