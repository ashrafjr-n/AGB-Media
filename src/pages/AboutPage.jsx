import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Header from '../components/Header/Header'
import { intro, chapters } from '../data/aboutPage'
import styles from './AboutPage.module.css'

/*
  THE /about PAGE — the company profile, and the site's second route.

  NAMING, BECAUSE THERE ARE NOW TWO ABOUTS. `components/About/About.jsx` is the home
  page's Story section and always has been (CLAUDE.md calls that one "About" and "the
  Story section" interchangeably). This is the page its CTA has been pointing at since
  before the page existed. They share no code and no styles; the only thing that links
  them is that link.

  WHAT MAKES IT ITS OWN PLACE. Four things, and each is argued where it is written:

  - A DIFFERENT GROUND. Deep warm brown (--about-ground) rather than the site's
    --color-black, lit by a fixed warm bleed and closed by a vignette. This is the one
    route allowed to break the single-tone rule — see the token block in variables.css
    for why a separate route can and a section could not.
  - ONE ASYMMETRIC AXIS DOWN THE WHOLE PAGE. The masthead and all three chapters run on
    the same two-column grid: a narrow rail on the inline start, the copy on a wider
    track beside it. That single repeated shape is what holds a page of fourteen
    paragraphs together without a card, a border or a box anywhere on it.
  - ROMAN NUMERALS, not the 01/02/03 the home page's WhyAgb grid uses. Same device
    family, different register: three chapters rather than six enumerated reasons.
  - A STICKY RAIL on wide windows, so a chapter's numeral and heading stay with the copy
    they belong to while it scrolls past.

  WHAT IT DELIBERATELY REUSES: the fixed site header, the shared reveal ladder, the
  site's micro-label eyebrow, and Clash Display throughout. A distinct page is not a
  different design system.

  NO VIDEO, NO GLASS, NO BACKDROP-FILTER. Nothing here claims a playback slot or blurs a
  backdrop — the page is type on a painted ground, so it costs a fraction of the home
  page and needs nothing from useExclusiveVideo.
*/

/*
  A chapter — the numeral and its heading on the rail, the copy beside it.

  IT IS A COMPONENT RATHER THAN A LOOP BODY, and that is required rather than tidy: each
  chapter runs its OWN reveal ladder, so each needs its own useSectionReveal call, and a
  hook cannot be called from inside a `.map()`. Lifting the chapter into a component is
  the standard answer and it is what `react/rules-of-hooks` is checking for.

  One scope per chapter, keyed off the heading's id. Sharing one scope across all three
  would let the first chapter's completed rungs latch the other two before they had ever
  been on screen, which on this page — where the chapters are a screen apart — would
  render the second and third flat. That is the collision documented at useSectionReveal.
*/
function Chapter({ id, marker, title, body, closing }) {
  const revealAt = useSectionReveal(id)

  return (
    <section className={styles.chapter} aria-labelledby={id}>
      {/*
        The rail reveals as one element rather than as numeral-then-heading. They are a
        single mark — a chapter number and the word it numbers — and staggering them
        against each other would read as two events where the reader sees one.
      */}
      <motion.div className={styles.rail} {...revealAt(0)}>
        <span className={styles.marker} aria-hidden="true">
          {marker}
        </span>
        <h2 className={styles.title} id={id}>
          {title}
        </h2>
      </motion.div>

      {/*
        The copy reveals as ONE block, not paragraph by paragraph. Each rung of the ladder
        carries its own viewport trigger, so a per-paragraph stagger on a chapter this tall
        would fire each one late AND then delay it again — the third paragraph would sit
        blank for a quarter-second after it had already scrolled well into view. One rung
        for the whole column arrives with it.
      */}
      <motion.div className={styles.body} {...revealAt(1)}>
        {body.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}

        {/*
          The sign-off, on the one chapter that has one. A short gold rule, then two lines
          set a tier above the body copy — the copy turns there, and the layout turns with
          it. Rendered from its own field rather than from the tail of `body`, so the
          treatment cannot drift onto a paragraph that was never meant to carry it.
        */}
        {closing && (
          <div className={styles.closing}>
            {closing.map((line, index) => (
              <p className={styles['closing-line']} key={index}>
                {line}
              </p>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}

function AboutPage() {
  const revealAt = useSectionReveal('about-page')

  /*
    ROUTE ENTRY STARTS AT THE TOP, and this is a real bug rather than a nicety. The link
    that reaches this page is the Story section's CTA, roughly a viewport and a half down
    the home page; React Router changes the URL without touching scroll, so without this
    the reader arrives at /about already scrolled past the masthead and into the middle of
    the Vision chapter.

    On mount only. It deliberately does not run on every render, and there is no route
    parameter here for it to key off — this page is the whole route.
  */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      {/*
        Always visible, where the home page hands this the Story section's midpoint. There
        is no in-flow hero header on this route to collide with, and the prop defaults to
        false — a page that simply rendered <Header /> would have no navigation at all.
      */}
      <Header visible />

      <main className={styles.page}>
        {/*
          THE LIGHT AND THE VIGNETTE, in one fixed element rather than two or three.

          Stacked radial-gradients on a single layer: the vignette is written first and so
          paints on top of the two warm masses beneath it, which is what lets the light
          bleed through the middle of the page and still be closed in at the corners.

          `position: fixed` on purpose. The light is the room, not the content — it holds
          still while fourteen paragraphs scroll through it, which is both the effect that
          reads as depth and the cheap option: a fixed, unanimated, unfiltered layer is
          composited once and never re-rasterised.

          aria-hidden and pointer-events: none — it is atmosphere, and it sits over the
          page's own background colour with all the copy above it.
        */}
        <div className={styles.atmosphere} aria-hidden="true" />

        <div className={styles.inner}>
          {/*
            The masthead. A <header> rather than a <div>: it is this page's own banner,
            and it is inside <main>, so it is a generic header rather than a second site
            banner landmark.
          */}
          <header className={styles.masthead}>
            <div className={styles['masthead-rail']}>
              {/*
                The site's micro-label, at the same 0.65rem / 0.28em with a leading gold
                dot that About, WhyAgb and the Founder open with. Identical on purpose —
                it is how a block starts on this site, and a page that invented its own
                would stop reading as the same site.
              */}
              <motion.p className={styles.eyebrow} {...revealAt(0)}>
                AGB Media
              </motion.p>

              <motion.h1 className={styles['page-title']} {...revealAt(1)}>
                About
              </motion.h1>
            </div>

            <div className={styles['masthead-body']}>
              {/*
                The opening paragraph, set as a lead — larger, at full --color-text, on its
                own shorter measure. It is the copy exactly as written; only its size and
                colour separate it from the two below.
              */}
              <motion.p className={styles.lead} {...revealAt(2)}>
                {intro[0]}
              </motion.p>

              <motion.div className={styles.body} {...revealAt(3)}>
                {intro.slice(1).map((paragraph, index) => (
                  <p className={styles.paragraph} key={index}>
                    {paragraph}
                  </p>
                ))}
              </motion.div>
            </div>
          </header>

          {chapters.map((chapter) => (
            <Chapter key={chapter.id} {...chapter} />
          ))}
        </div>
      </main>
    </>
  )
}

export default AboutPage
