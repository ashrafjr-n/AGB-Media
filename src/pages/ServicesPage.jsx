import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Seo from '../components/shared/Seo'
import Header from '../components/Header/Header'
import { SITE_URL } from '../data/siteMeta'
import backdrop from '../assets/images/services.webp'
import {
  pageTitle,
  pageIntro,
  services,
  specialisedUnitsIntro,
  specialisedUnits,
  animationEyebrow,
  animationTitle,
  animationByline,
  animationBody,
} from '../data/servicesPage'
import styles from './ServicesPage.module.css'

/*
  THE /services PAGE — the site's third route.

  THE GROUND IS UNCHANGED — a photograph under the site's standard section glass, the
  same `.pane` (--section-glass-fill-light / --section-glass-blur-light) Founder and
  WhyAgb compose from shared/SectionGlass.module.css. See `.backdrop` / `.glass` in the
  stylesheet for why they are `position: fixed` here rather than pinned to one section.
  This update touches content and adds two sections below the grid; the ground, the
  masthead's mechanics and the card recipe are all untouched.

  THE CARDS borrow the Contact button's glass DNA — the same --glass-fill-light /
  --glass-border-bright / --glass-blur-tight tokens, and a conic-gradient rim in the
  same two-mask-xor construction .button-featured's edge light uses — but neither
  Button.module.css nor any call site of it is touched. The ring here triggers on
  hover rather than running continuously, which is both the right read for eleven
  boxes at once (an always-on version would be eleven simultaneous re-rasters) and a
  fair adaptation of "reveal" at card scale.

  COPY LIVES IN data/servicesPage.js NOW, matching the convention data/aboutPage.js and
  data/naelPage.js set: this page is dense enough (a masthead, an 11-item grid, a
  four-unit section and a six-paragraph essay) that inlining it here would bury the
  layout.

  TWO SECTIONS BELOW THE GRID, EACH WITH ITS OWN REVEAL SCOPE — "Specialised Units"
  (four cards, a lighter structural cousin of the numbered grid above) and "Animation"
  (a single wide feature panel, deliberately heavier than everything above it: a
  bordered pane, a larger heading and generous padding, the same order of visual
  weight the Founder section and About's pull-quote carry on their own pages). Three
  independent ladders live on this page now — `services-page` for the masthead,
  `services-grid` for the numbered cards, `services-units` for the unit cards — plus
  one more rung on `services-page` itself for the feature panel, since it is a single
  block rather than a repeating list and does not need a ladder of its own.
*/

function ServicesPage() {
  const revealAt = useSectionReveal('services-page')

  /*
    A second scope for the grid, restarting the stagger the way WhyAgb's does — and
    keyed by column position (`index % 3`) rather than by the flat index, so the delay
    resets every row instead of climbing across all eleven cards. Rows enter the
    viewport together regardless, so a per-row stagger reads the same as a flat one
    while keeping the tail short.
  */
  const revealCard = useSectionReveal('services-grid')

  /*
    A third scope for the Specialised Units cards, for the same reason the grid gets
    its own: four cards arriving in their own short stagger reads as one row of equals
    rather than picking up wherever the eleven-card grid's rung count left off.
  */
  const revealUnit = useSectionReveal('services-units')

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
      <Seo
        title="Production Services | AGB Media"
        description="AGB Media's production services span film, TV drama, theatre, animation, post-production, visual effects, and AI-assisted production across Qatar and the Gulf."
        path="/services"
        image={`${SITE_URL}/assets/og/og-services.jpg`}
      />

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
              {pageTitle}
            </motion.h1>

            <motion.p className={styles['page-lead']} {...revealAt(2)}>
              {pageIntro}
            </motion.p>
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

          {/* --- Specialised Units ------------------------------------------- */}
          <section
            className={styles.units}
            aria-labelledby="units-title"
          >
            <motion.div className={styles['units-head']} {...revealAt(3)}>
              <p className={styles.eyebrow}>Capabilities</p>
              <h2 id="units-title" className={styles['section-title']}>
                Specialised Units
              </h2>
              <p className={styles['section-lead']}>{specialisedUnitsIntro}</p>
            </motion.div>

            <ul className={styles['units-grid']}>
              {specialisedUnits.map((unit, index) => (
                <motion.li
                  className={styles.unit}
                  key={unit.name}
                  {...revealUnit(index)}
                >
                  <h3 className={styles['unit-title']}>{unit.name}</h3>
                  <ul className={styles['unit-list']}>
                    {unit.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* --- Animation: the featured essay -------------------------------- */}
          <motion.section
            className={styles.animation}
            aria-labelledby="animation-title"
            {...revealAt(4)}
          >
            <p className={styles.eyebrow}>{animationEyebrow}</p>
            <h2 id="animation-title" className={styles['animation-title']}>
              {animationTitle}
            </h2>
            <p className={styles.byline}>{animationByline}</p>

            <div className={styles['animation-body']}>
              {animationBody.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </>
  )
}

export default ServicesPage
