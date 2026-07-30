import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
/* Outline set, matching the hero CTA's HiOutlineMail. */
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import buttonStyles from '../shared/Button.module.css'
import styles from './About.module.css'

/* Lets the CTA animate without wrapping the Link in an extra layout box. */
const MotionLink = motion.create(Link)

/*
  The short home-page blurb. The long-form version lives on /about — keep this
  to two paragraphs so the section holds its single-screen height.

  Copy lives here as data so it can move to /src/data or a CMS later without
  touching the layout.
*/
const paragraphs = [
  'AGB Media is a Doha-based arts and media production house specialising in theatre, television, film, and visual content. Built on decades of creative experience, we bring together carefully selected teams to transform ideas into high-quality productions from concept to final delivery.',
  'Led by veteran Qatari artist Abdullah Ghayfan and writer-director Nael Al-Jarabah, AGB Media combines artistic leadership with a strong regional network to deliver productions that meet international standards while staying true to Gulf culture.',
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

  /* Stagger by delaying each block against the same base transition. */
  const revealAt = (delay) =>
    shouldReduceMotion
      ? {}
      : { ...reveal, transition: { ...reveal.transition, delay } }

  return (
    <section className={styles.about} id="about">
      <div className={styles.inner}>
        <div className={styles.copy}>
          {/*
            Two-part opening: a tracked gold label, then the section title. The
            title replaces the pull-quote that used to anchor this section, and it
            is the section's h2 — previously the block had no heading at all.
          */}
          <motion.p className={styles.eyebrow} {...reveal}>
            Who We Are
          </motion.p>

          <motion.h2 className={styles.title} {...revealAt(0.08)}>
            Our <span className={styles['title-accent']}>Story</span>
          </motion.h2>

          <motion.div className={styles.body} {...revealAt(0.16)}>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 32)}>{text}</p>
            ))}
          </motion.div>

          {/*
            /about is not routed yet — the link is wired ahead of the page.
            Shared button visuals + a local class carrying only its spacing.
          */}
          <MotionLink
            to="/about"
            className={`${buttonStyles.button} ${buttonStyles['button-reveal']} ${styles.cta}`}
            {...revealAt(0.24)}
          >
            <span>Discover Our Story</span>
            <HiOutlineArrowNarrowRight size={20} aria-hidden="true" />
          </MotionLink>
        </div>

        {/*
          The mark anchoring the inline end of the section, large.

          Last in the reveal ladder so the copy lands first and the logo settles in
          behind it. It is also last in source order, which is what puts it *below*
          the copy on the stacked layout rather than above the heading — see the
          grid in About.module.css.

          alt="" because it is decorative here: the section is already titled by its
          h2, and the brand name is announced by the hero's h1 and the header logo.
          Giving it alt text would only make a screen reader say "AGB Media" a third
          time.
        */}
        <motion.div className={styles['logo-panel']} {...revealAt(0.32)}>
          <img src="/assets/images/agb-logo.png" alt="" />
        </motion.div>
      </div>
    </section>
  )
}

export default About
