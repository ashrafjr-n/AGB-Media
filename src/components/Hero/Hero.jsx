import { Link } from 'react-router-dom'
import { HiOutlineMail } from 'react-icons/hi'

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
  return (
    <section className={styles.hero}>
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
