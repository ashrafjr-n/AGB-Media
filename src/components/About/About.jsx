import { motion, useReducedMotion } from 'framer-motion'

import styles from './About.module.css'

/*
  Body copy lives here as data so the paragraphs can move to /src/data or a CMS
  later without touching the layout.
*/
const paragraphs = [
  'AGB Media is an arts and media production house based in Doha, guided by a long and distinguished track record of experience in theatre, drama, television, and visual production. We take every idea from concept to screen or stage through teams carefully assembled for each individual project, ensuring the highest standards of quality and flexibility.',
  'Our true capital lies in the artistic career of our founder, the veteran Qatari artist Abdullah Ghayfan, the expertise of our CEO, writer and director Nael Al-Jarabaa, and the extensive professional network both have cultivated across Qatar, the Gulf region, and the wider Arab world.',
  'We provide a comprehensive spectrum of visual services — from cinema, television drama, and theatre to animation, visual effects, and motion graphics, as well as full production, execution, post-production, and professional training programmes. The departments listed in this profile represent only a selection of our capabilities and are not an exhaustive description of the company’s structure. We deliver every aspect of visual content according to the specific requirements of each project.',
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