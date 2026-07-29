import { motion, useReducedMotion } from 'framer-motion'

import styles from './About.module.css'

/*
  Body copy lives here as data so the paragraphs can move to /src/data or a CMS
  later without touching the layout.
*/
const paragraphs = [
  'AGB Media is an arts and media production house based in Doha, founded in 2025 by creators with decades of work behind them across theater, drama, and television.',
  "Its real currency is inheritance and direction: the artistic legacy of founder Abdullah Ghifan, a veteran Qatari artist, the creative command of CEO Nael Al-Jarabaa, a writer and director, and the network the two have built across Qatar, the Gulf, and the wider Arab world.",
  'AGB makes work that speaks to local audiences in their own voice while holding to international production standards — television drama, film, theater, animation, AI-enhanced production, post-production, and screenwriting training.',
]

function About() {
  /*
    The global prefers-reduced-motion rule in global.css only governs CSS
    animations; Framer Motion drives these inline, so the preference has to be
    honoured in JS. When reduced, the section simply renders in place.
  */
  const shouldReduceMotion = useReducedMotion()

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section className={styles.about} id="about">
      <div className={styles.inner}>
        <motion.p className={styles.eyebrow} {...reveal}>
          The Story
        </motion.p>

        {/* The sharpest line in the copy, pulled out as the visual anchor. */}
        <motion.blockquote
          className={styles.quote}
          {...reveal}
          transition={{ ...reveal.transition, delay: shouldReduceMotion ? 0 : 0.1 }}
        >
          The company is new.
          <span className={styles['quote-accent']}> The hands behind it are not.</span>
        </motion.blockquote>

        <motion.div
          className={styles.body}
          {...reveal}
          transition={{ ...reveal.transition, delay: shouldReduceMotion ? 0 : 0.2 }}
        >
          {paragraphs.map((text) => (
            <p key={text.slice(0, 32)}>{text}</p>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default About
