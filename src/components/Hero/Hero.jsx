import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { HiOutlineMail } from 'react-icons/hi'

import Grainient from '../shared/Grainient'
import useScrollPosition from '../../hooks/useScrollPosition'
import styles from './Hero.module.css'

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
  const { viewportProgress } = useScrollPosition()
  const shouldReduceMotion = useReducedMotion()

  /*
    The backdrop is a fixed layer, so it does not scroll away with the hero — it
    has to be faded out instead. Tied straight to scroll rather than to a
    threshold: full strength at the top of the hero, gone by the time a whole
    viewport has passed, which is exactly when About takes over the screen.

    Inline because the value is continuous and computed per frame — the one case
    CLAUDE.md allows an inline style for.
  */
  const backdropOpacity = 1 - viewportProgress

  return (
    <section className={styles.hero}>
      {/*
        Decorative. Reduced motion is honoured by stopping the shader's clock
        rather than by dropping the layer: at timeSpeed 0 the gradient renders as
        a still image, so the composition survives and only the drift goes away.
      */}
      <div
        className={styles.backdrop}
        style={{ opacity: backdropOpacity }}
        aria-hidden="true"
      >
        <Grainient
          color1="#000000"
          color2="#7A4A18"
          color3="#050810"
          timeSpeed={shouldReduceMotion ? 0 : 0.25}
        />
      </div>

      <div className={styles.content}>
        {/* Left column — location, wordmark, call to action. */}
        <div className={styles.intro}>
          <p className={styles.location}>Doha · Qatar</p>

          <h1 className={styles.title}>AGB Media</h1>

          <Link to="/contact" className={styles['contact-button']}>
            <HiOutlineMail size={20} aria-hidden="true" />
            <span>Contact Us</span>
          </Link>
        </div>

        {/* Right column — logo and gradient tagline. */}
        <div className={styles.brand}>
          <img
            src="/assets/images/agb-logo.png"
            alt="AGB Media"
            className={styles.logo}
          />
          <p className={styles.tagline}>Arts &amp; Media Production</p>
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
