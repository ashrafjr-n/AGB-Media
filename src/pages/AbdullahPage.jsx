import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Header from '../components/Header/Header'
import portrait from '../assets/abdullah/abdullah.jpg'
import {
  eyebrow as mastheadEyebrow,
  name as founderName,
  subtitle,
  bio,
  television,
  theatre,
  officialRecords,
  cinema,
} from '../data/founderPage'
import styles from './AbdullahPage.module.css'

/*
  /founder — THE SITE'S SIXTH ROUTE, and the second (after /team/nael-al-jarabah) that is
  not linked from navLinks.js. It is a close structural clone of NaelPage.jsx — same
  masthead treatment, same --about-ground background, same section layout, same portrait
  framing — built for the Founder's own profile the same way that page was built for the
  CEO's. Read NaelPage.jsx's own top-of-file comment first; everything argued there about
  the shell, the ground and the flat single-column body applies here without needing to be
  re-derived, and this comment only calls out where the two pages differ.

  IT IS REACHED ONE WAY: the "Meet the Founder →" button closing the home page's Founder
  section (components/Founder/Founder.jsx). That button used to be a `to="#"` placeholder
  — its own comment said "wire it up when that page exists" — and this is that page.

  THE ROUTE IS `/founder`, NOT `/team/<slug>`. Nael's route carries the `/team/` prefix
  because his page is reached from the home page's Team section specifically (see that
  page's own comment). This one is reached from the Founder section, so it takes the
  matching top-level slug instead — the same relationship /about has to the About section,
  rather than a copy of a prefix that would misdescribe where the link actually lives.

  THE MASTHEAD IS SHAPED DIFFERENTLY FROM NAEL'S, because the brief gave three already-
  distinct lines (an eyebrow, a name, a subtitle) rather than one "Name — Title — Title"
  string to split. There is no `titles` list here — see data/founderPage.js — so the
  masthead's identity column renders the subtitle as a single stacked credit line inside
  the same `.titles` treatment Nael's page uses for its (there, plural) title lines. The
  markup and styling are identical; only the count of <li> differs.

  BIOGRAPHY IS THREE PARAGRAPHS, NOT ONE — data/founderPage.js's `bio` is an array, mapped
  to three <p> elements inside the same `.section-body` a single paragraph would occupy on
  Nael's page. "Since 1976" is this page's biography eyebrow, matching Nael's "Since 1999"
  — both name the year the subject's professional record the section describes begins.

  SELECTED WORKS IS FOUR CATEGORIES, NOT THREE — Television, Theatre, Official Records,
  Cinema, in that order, each its own Section using the same CreditList glass-panel
  treatment Nael's Theatre/Cinema-Drama/Workshops sections use. None carries an intro
  sentence (unlike Nael's Theatre, which does): the brief gave all four as flat bullet
  lists with no lead-in prose, so none is invented here either.
*/
function AbdullahPage() {
  const revealAt = useSectionReveal('abdullah-masthead')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [givenName, ...familyNameParts] = founderName.split(' ')
  const familyName = familyNameParts.join(' ')

  return (
    <>
      <Header visible />

      <main className={`${styles.page} noise-overlay`}>
        <div className={styles.inner}>
          {/* --- Masthead: portrait against the name plate ---------------------- */}
          <header className={styles.masthead}>
            <motion.div className={styles['portrait-col']} {...revealAt(0)}>
              {/*
                THE FRAME CLIPS; THE IMAGE OVERHANGS IT BY 1PX ON EVERY SIDE — the same
                construction NaelPage.module.css and Founder.module.css both document at
                .portrait-frame / .portrait, for the same `fr`-track fractional-width
                reason (see either file).
              */}
              <div className={styles['portrait-frame']}>
                <img
                  className={styles.portrait}
                  src={portrait}
                  alt="Abdullah Ghayfan"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </motion.div>

            <motion.div className={styles.identity} {...revealAt(1)}>
              {/*
                THE FULL EYEBROW LINE, VERBATIM FROM THE BRIEF — "The Founder — Abdullah
                Ghayfan" rather than Nael page's bare role label, because that is the
                exact line the brief specified for this field.
              */}
              <p className={styles.eyebrow}>{mastheadEyebrow}</p>

              <h1 className={styles.name}>
                {givenName}{' '}
                <span className={styles['name-accent']}>{familyName}</span>
              </h1>

              {/*
                THE SUBTITLE — one stacked credit line, in the same `.titles` treatment
                Nael's (plural) title lines use. See the top-of-file note on why this page
                has one line where his has two.
              */}
              <ul className={styles.titles}>
                <li>{subtitle}</li>
              </ul>
            </motion.div>
          </header>

          {/* --- Content sections, in one flowing column -------------------------- */}
          <div className={styles.content}>
            <Section id="biography" eyebrow="Since 1976" title="Biography">
              {bio.map((paragraph, index) => (
                <p className={styles.paragraph} key={index}>
                  {paragraph}
                </p>
              ))}
            </Section>

            <Section id="television" eyebrow="On Screen" title="Television">
              <CreditList items={television} />
            </Section>

            <Section id="theatre" eyebrow="On Stage" title="Theatre">
              <CreditList items={theatre} />
            </Section>

            <Section
              id="official-records"
              eyebrow="Civic & Educational"
              title="Official Records"
            >
              <CreditList items={officialRecords} />
            </Section>

            <Section id="cinema" eyebrow="On Film" title="Cinema">
              <CreditList items={cinema} />
            </Section>
          </div>
        </div>
      </main>
    </>
  )
}

/*
  ONE CONTENT SECTION — identical to NaelPage.jsx's own `Section`, down to the plain-
  function-not-component reasoning in its comment there: the ladder rung belongs to
  whichever call site renders it.
*/
function Section({ id, eyebrow, title, children }) {
  const revealAt = useSectionReveal(id)

  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
      <motion.div className={styles.head} {...revealAt(0)}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles['section-title']} id={`${id}-title`}>
          {title}
        </h2>
      </motion.div>

      <motion.div className={styles['section-body']} {...revealAt(1)}>
        {children}
      </motion.div>
    </section>
  )
}

/*
  THE CREDIT LIST — identical to NaelPage.jsx's own `CreditList`: the glass-panel surface
  applied to enumerable credits, flat rather than blurred because there is no photograph
  behind this page for a backdrop-filter to blur.
*/
function CreditList({ items }) {
  return (
    <ul className={styles.credits}>
      {items.map((item) => (
        <li className={styles.credit} key={item}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default AbdullahPage
