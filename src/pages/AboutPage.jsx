import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Seo from '../components/shared/Seo'
import Header from '../components/Header/Header'
import { pullQuote, sections, networkGroups } from '../data/aboutPage'
import styles from './AboutPage.module.css'

/*
  THE /about PAGE — full restructure and redesign, 2026-08-02. This replaces the page's
  previous form outright (a masthead of three short intro paragraphs, then three long
  chapters — Vision, Mission, Our Capital — on one fixed rail-and-copy axis). Nothing
  from that version survives except what this file's own comments call out as reused on
  purpose: the fixed site header, the shared reveal ladder, the site's micro-label
  eyebrow device, and Manrope throughout. A distinct page is not a different
  design system, but this IS a different page — see the brief this was built against
  for the full brief; the short version is that the previous version's own account of
  itself ("one repeated shape... no card, no border, no filled panel") is exactly what
  was asked to change.

  WHAT THIS VERSION IS. A masthead pairing a large pull-quote against the AGB logo,
  followed by five sections — Who We Are, Vision, Mission, Our Record, Strategic
  Network — that share one identity device (an eyebrow, then a heading) but
  deliberately do NOT share one body layout. Each section's copy is arranged
  differently: Who We Are runs a single asymmetric column; Vision opens on a large lead
  statement and splits its remaining two paragraphs into a pair; Mission sets its two
  short paragraphs side by side as a diptych; Our Record pairs a stat callout against
  its copy and closes on a pulled statement; Strategic Network closes on a grouped chip
  cloud instead of more prose. The point of the variation is stated in the brief this
  was built against: a designed editorial sequence, not five stacked paragraphs with a
  number next to each one.

  NO SECTION NUMERAL AND NO PER-SECTION ICON, as of a correction pass the same day this
  page shipped — both were in the first version (Arabic numerals 01–05, one react-icons
  glyph per section in a stroke ring) and were removed on request. `eyebrow` is what is
  left to give each section its identity beyond the heading itself, matching the device
  About, WhyAgb and the Founder each already use on the home page.

  EVERY WORD OF BODY COPY BELOW IS DATA, TRANSCRIBED VERBATIM — see the long comment at
  the top of data/aboutPage.js for how carefully that was checked against the previous
  page's own (different) wording on the same three themes. Nothing in this file
  rewords, trims or reorders a sentence of it. The only content this file adds beyond
  that data is UI chrome — the eyebrow kickers, the network chip groupings — which the
  data file's own comments mark as invented rather than sourced.

  STILL NO VIDEO, NO GLASS, NO BACKDROP-FILTER, AND NOW NO GRADIENT EITHER. The previous
  version of this route painted one fixed layer of stacked radial gradients — a vignette
  plus two warm bleeds — behind the copy. That layer is gone outright, also on request:
  the ground is a flat, dark, unlit fill now (`--about-ground` alone), and nothing on
  this route composites a second background layer at all. What is left is flat bordered
  surfaces for the stat cards and the chip cloud. Nothing here claims a compositing
  layer or a playback slot, so the page costs a fraction of the home page and needs
  nothing from useExclusiveVideo.
*/

/*
  A SINGLE SECTION'S IDENTITY ROW — the eyebrow, then the heading — shared by all five
  sections below. It is a plain function rather than a component with its own reveal
  call: the ladder rung it animates on belongs to whichever section calls it, since two
  independent useSectionReveal scopes on one heading would be the same collision the
  hook's own docs warn against.
*/
function SectionHead({ eyebrow, title, id, revealAt }) {
  return (
    <motion.div className={styles.head} {...revealAt}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title} id={id}>
        {title}
      </h2>
    </motion.div>
  )
}

/*
  01 — WHO WE ARE. The baseline section: identity row, then a single column of copy.
  Deliberately the simplest of the five, so the page opens on a plain statement of fact
  before the layout starts varying — the same reason the old masthead opened on a lead
  paragraph rather than straight into a chapter.

  THE ASYMMETRY IS IN WHAT THE COLUMN DOES NOT DO, rather than in a second track beside
  it: `.who-body` caps its own measure and does NOT centre itself in the container, so it
  hugs the inline start and leaves open air down the right side of the page — the same
  asymmetric-negative-space idea the site's other one-column blocks use, without
  inventing a second grid track that would have nothing to hold.
*/
function WhoWeAre({ section }) {
  const revealAt = useSectionReveal(section.id)

  return (
    <section
      className={`${styles.section} ${styles.who}`}
      aria-labelledby={section.id}
    >
      <SectionHead
        eyebrow={section.eyebrow}
        title={section.title}
        id={section.id}
        revealAt={revealAt(0)}
      />

      <motion.div className={styles['who-body']} {...revealAt(1)}>
        {section.body.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}
      </motion.div>
    </section>
  )
}

/*
  02 — VISION. The one section that opens on a lead statement rather than straight into
  running copy — the brief's own first sentence ("to stand at the forefront...") is the
  section's thesis, so it is set apart exactly the way the old masthead's own opening
  paragraph used to be: larger, brighter, its own shorter measure. The remaining two
  paragraphs then split into a two-column pair beneath it, which is a genuinely different
  grid from Who We Are's single column above and Mission's below — not a recolouring of
  the same shape.
*/
function Vision({ section }) {
  const revealAt = useSectionReveal(section.id)
  const [lead, ...rest] = section.body

  return (
    <section
      className={`${styles.section} ${styles.vision}`}
      aria-labelledby={section.id}
    >
      <SectionHead
        eyebrow={section.eyebrow}
        title={section.title}
        id={section.id}
        revealAt={revealAt(0)}
      />

      <motion.p className={styles.lead} {...revealAt(1)}>
        {lead}
      </motion.p>

      <motion.div className={styles['vision-pair']} {...revealAt(2)}>
        {rest.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}
      </motion.div>
    </section>
  )
}

/*
  03 — MISSION. The shortest section, and laid out to read as one — two short paragraphs
  set side by side as a diptych rather than stacked, so the section reads as a single
  compact statement in two parts instead of a scaled-down copy of Who We Are's column.
  Both paragraphs reveal as one block: they are two halves of one thought, and staggering
  them against each other would split what the brief wrote as a pair.
*/
function Mission({ section }) {
  const revealAt = useSectionReveal(section.id)

  return (
    <section
      className={`${styles.section} ${styles.mission}`}
      aria-labelledby={section.id}
    >
      <SectionHead
        eyebrow={section.eyebrow}
        title={section.title}
        id={section.id}
        revealAt={revealAt(0)}
      />

      <motion.div className={styles.diptych} {...revealAt(1)}>
        {section.body.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}
      </motion.div>
    </section>
  )
}

/*
  04 — OUR RECORD. The one asymmetric two-column section on the page: a narrow stat
  column carrying the two dates the copy itself names (1976, 1999 — see the note in
  data/aboutPage.js on why those captions are exact substrings of the paragraph beside
  them, not new wording) against a wider column of the three paragraphs. It closes on
  the section's own pulled statement — a short gold rule then larger type, the same
  device the previous version of this page used for its one sign-off, reused here
  because it is still the right device for a short closing statement and there is no
  reason to invent a second one.
*/
function OurRecord({ section }) {
  const revealAt = useSectionReveal(section.id)

  return (
    <section
      className={`${styles.section} ${styles.record}`}
      aria-labelledby={section.id}
    >
      <SectionHead
        eyebrow={section.eyebrow}
        title={section.title}
        id={section.id}
        revealAt={revealAt(0)}
      />

      <div className={styles['record-grid']}>
        <motion.dl className={styles.stats} {...revealAt(1)}>
          {section.stats.map(({ year, label }) => (
            <div className={styles.stat} key={year}>
              <dt className={styles['stat-year']}>{year}</dt>
              <dd className={styles['stat-label']}>{label}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div className={styles['record-body']} {...revealAt(2)}>
          {section.body.map((paragraph, index) => (
            <p className={styles.paragraph} key={index}>
              {paragraph}
            </p>
          ))}
        </motion.div>
      </div>

      <motion.p className={styles.closing} {...revealAt(3)}>
        {section.closing}
      </motion.p>
    </section>
  )
}

/*
  05 — STRATEGIC NETWORK. Copy in one column, matching Who We Are's register so the page
  closes on the same plain-statement footing it opened on — and then a chip cloud below
  it, grouped Regional / International exactly as `data/aboutPage.js` groups them,
  because the brief specifically asked for the place-names in this section's prose to
  get a scannable pulled-out treatment rather than staying buried in paragraph four. The
  chips are drawn from `networkGroups`, not typed again here.
*/
function StrategicNetwork({ section }) {
  const revealAt = useSectionReveal(section.id)

  return (
    <section
      className={`${styles.section} ${styles.network}`}
      aria-labelledby={section.id}
    >
      <SectionHead
        eyebrow={section.eyebrow}
        title={section.title}
        id={section.id}
        revealAt={revealAt(0)}
      />

      <motion.div className={styles['network-body']} {...revealAt(1)}>
        {section.body.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}
      </motion.div>

      <motion.div className={styles['chip-cloud']} {...revealAt(2)}>
        {networkGroups.map((group) => (
          <div className={styles['chip-group']} key={group.id}>
            <p className={styles['chip-group-title']}>{group.title}</p>
            <ul className={styles['chip-list']}>
              {group.tags.map((tag) => (
                <li className={styles.chip} key={tag}>
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

function AboutPage() {
  const revealAt = useSectionReveal('about-masthead')

  /*
    ROUTE ENTRY STARTS AT THE TOP — unchanged from the previous version and for the same
    reason: this route is reached from the Story section's CTA a viewport and a half down
    the home page, and React Router does not touch scroll on navigation. On mount only.
  */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Seo
        title="About AGB Media | Qatar Arts & Media Production House"
        description="AGB Media is a Doha-based arts and media production house built on Abdullah Ghayfan's artistic legacy and Nael Al-Jarabah's production expertise in the Gulf."
        path="/about"
      />

      {/*
        Always visible on this route — there is no in-flow hero header here to collide
        with, unlike the home page's HeroHeader/Header handoff.
      */}
      <Header visible />

      {/*
        `noise-overlay` — the global utility from global.css, applied as a literal string
        per CLAUDE.md (it is not a module class). Unchanged from the previous version.
      */}
      <main className={`${styles.page} noise-overlay`}>
        <div className={styles.inner}>
          {/*
            THE MASTHEAD — a pull-quote against the logo, replacing the previous
            version's three-paragraph opening entirely. `<header>` rather than `<div>`:
            this page's own banner, inside <main>, so a generic header landmark rather
            than a second site banner.

            THE PAGE'S H1 IS VISUALLY HIDDEN, the same device Hero.jsx uses for the same
            reason: the masthead's real content is the quote and the logo, and a literal
            printed word "About" would compete with both for no reason a sighted reader
            needs. A screen reader still gets a correctly named document.
          */}
          <header className={styles.masthead}>
            <h1 className="sr-only">About</h1>

            <motion.div className={styles['quote-col']} {...revealAt(0)}>
              <span className={styles['quote-mark']} aria-hidden="true">
                “
              </span>
              <blockquote className={styles['quote-text']}>
                {pullQuote}
              </blockquote>
            </motion.div>

            <motion.div className={styles['logo-col']} {...revealAt(1)}>
              {/*
                CLAUDE.md §1: because the logo is portrait, anything sizing it must drive
                block-size and leave inline-size auto — see .logo in the stylesheet. Never
                recoloured or redrawn, per §5 rule 5.
              */}
              <img
                className={styles.logo}
                src="/assets/images/agb-logo.png"
                alt="AGB Media"
              />
            </motion.div>
          </header>

          <div className={styles.sections}>
            <WhoWeAre section={sections[0]} />
            <Vision section={sections[1]} />
            <Mission section={sections[2]} />
            <OurRecord section={sections[3]} />
            <StrategicNetwork section={sections[4]} />
          </div>
        </div>
      </main>
    </>
  )
}

export default AboutPage
