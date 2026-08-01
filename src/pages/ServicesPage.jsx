import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Header from '../components/Header/Header'
import backdrop from '../assets/images/services.webp'
import styles from './ServicesPage.module.css'

/*
  THE /services PAGE — the site's third route.

  THE GROUND IS A PHOTOGRAPH under the site's standard section glass — the same
  `.pane` (--section-glass-fill-light / --section-glass-blur-light) Founder and
  WhyAgb compose from shared/SectionGlass.module.css, not a new treatment invented
  for this page. See `.backdrop` / `.glass` in the stylesheet for why they are
  `position: fixed` here rather than pinned to one section the way Founder's are —
  this page is a full-length scroll, and the photo is meant to sit still behind it
  the way About's ground used to, not scroll away with the cards.

  The cards borrow the Contact button's glass DNA — the same --glass-fill-light /
  --glass-border-bright / --glass-blur-tight tokens, and a conic-gradient rim in the
  same two-mask-xor construction .button-featured's edge light uses — but neither
  Button.module.css nor any call site of it is touched. The ring here triggers on
  hover rather than running continuously, which is both the right read for twelve
  boxes at once (an always-on version would be twelve simultaneous re-rasters) and a
  fair adaptation of "reveal" at card scale.
*/

const services = [
  {
    title: 'Content Development',
    description:
      'Building ideas and turning them into executable projects.',
  },
  {
    title: 'Creative Development',
    description:
      'Dramatic treatment, character development, and visual identity for the work.',
  },
  {
    title: 'Script Writing',
    description:
      'Screenplay and dialogue for television, cinema, and theatre.',
  },
  {
    title: 'Executive Production',
    description:
      'Budgeting, scheduling, contracting, and daily follow-up.',
  },
  {
    title: 'Television Production',
    description:
      'Series, programmes, and Ramadan-season productions.',
  },
  {
    title: 'Film Production',
    description: 'Feature, short, and documentary films.',
  },
  {
    title: 'Production Management',
    description:
      'Organising resources, locations, teams, and schedules.',
  },
  {
    title: 'Line Production',
    description:
      'On-ground shoot execution inside and outside Qatar.',
  },
  {
    title: 'Post Production',
    description: 'Editing, colour correction, and final delivery.',
  },
  {
    title: 'Music & Sound',
    description:
      'Music composition, mixing, sound design, and dubbing.',
  },
  {
    title: 'Motion & VFX',
    description: 'Motion graphics, visual effects, and compositing.',
  },
  {
    title: 'Consultancy',
    description:
      'Technical feasibility studies, script and plan evaluation.',
  },
]

function ServicesPage() {
  const revealAt = useSectionReveal('services-page')

  /*
    A second scope for the grid, restarting the stagger the way WhyAgb's does — and
    keyed by column position (`index % 3`) rather than by the flat index, so the delay
    resets every row instead of climbing to just over a second by the last card. Rows
    enter the viewport together regardless, so a per-row stagger reads the same as a
    flat one while keeping the tail short.
  */
  const revealCard = useSectionReveal('services-grid')

  /*
    Same reason AboutPage resets its own scroll on mount: this route has no scroll
    restoration of its own, so a visitor arriving from a mid-page link would otherwise
    land partway down it.
  */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Header visible />

      {/*
        `noise-overlay` — the global utility from global.css, applied as a literal
        string per CLAUDE.md. Gives this page its own grain layer on top of the
        site-wide one `body::after` already paints everywhere; see the
        `--noise-opacity` override on `.page` in the stylesheet.
      */}
      <main className={`${styles.page} noise-overlay`}>
        {/*
          THE GROUND, and it must stay FIRST — it and the pane below it are both at
          z-index 0, so document order is the only thing putting the photo behind the
          glass. `alt=""` marks it decorative, matching Founder's and WhyAgb's grounds.
        */}
        <img
          className={styles.backdrop}
          src={backdrop}
          alt=""
          loading="eager"
          decoding="async"
        />

        {/* The shared section pane — see the note at the top of this file. */}
        <div className={styles.glass} aria-hidden="true" />

        <div className={styles.inner}>
          <header className={styles.masthead}>
            <motion.p className={styles.eyebrow} {...revealAt(0)}>
              AGB Media
            </motion.p>

            <motion.h1 className={styles['page-title']} {...revealAt(1)}>
              Our Services
            </motion.h1>
          </header>

          <ol className={styles.grid}>
            {services.map((service, index) => (
              <motion.li
                className={styles.card}
                key={service.title}
                {...revealCard(index % 3)}
              >
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <h2 className={styles['card-title']}>{service.title}</h2>
                <p className={styles['card-description']}>
                  {service.description}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </main>
    </>
  )
}

export default ServicesPage
