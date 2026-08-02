import { useEffect } from 'react'
import { motion } from 'framer-motion'

import useSectionReveal from '../hooks/useSectionReveal'
import Header from '../components/Header/Header'
import portrait from '../assets/nael/nael-profile/nael-profile.webp'
import {
  nameTitle,
  bio,
  publications,
  channelFounding,
  theatre,
  cinemaDrama,
  workshops,
} from '../data/naelPage'
import styles from './NaelPage.module.css'

/*
  /team/nael-al-jarabah — THE SITE'S FIFTH ROUTE, and the first that is not linked
  from navLinks.js. It is reached one way only: clicking the CEO's circle in the home
  page's Team section (Team.jsx wraps his portrait and name in a <Link> to this path).
  That is deliberate rather than an oversight — this is a profile page for one person,
  not a section of the primary site map, and it does not belong in either header's nav.

  THE SHELL FOLLOWS THE SAME CONVENTION /about, /services AND /contact ALL SHARE:
  `<Header visible />` (no in-flow hero header on this route to hand off from), a
  mount-only `window.scrollTo(0, 0)` (this route has no scroll restoration of its
  own, the same reason every secondary page resets it), and `noise-overlay` on
  `<main>`.

  THE GROUND IS --about-ground, THE SAME TOKEN /about PAINTS — a correction from this
  page's first draft, which used flat `--color-black` on the argument that this route
  reads as part of the home page rather than as a third room. That reasoning gave way
  to an explicit request to match /about's ground exactly rather than approximate it:
  same token, same flat unlit treatment, no vignette, no gradient bleed, no second
  layer (see the shared note at `--about-ground` in variables.css, which now names
  both routes as its consumers). Depth on this page still comes mostly from the
  portrait itself, shot on a dark studio backdrop that meets either ground almost
  seamlessly, and from the local glass-panel credit lists further down.

  THE STRUCTURE IS ITS OWN, NOT A COPY OF THE FOUNDER SECTION: a masthead pairing a
  large framed portrait against a name plate, then six content sections in a single
  flowing column — biography, publications, channel founding, theatre, cinema/drama,
  workshops. It carried a sticky "On This Page" index beside that column in an
  earlier pass, borrowed from /about's own rail device; it was removed on request,
  along with the two-column body grid it needed, so the six sections now read as one
  ordinary scroll rather than a page with working chrome down one side. No section
  numeral and no per-section icon — eyebrow-plus-heading only, and both centred —
  matching /about's own corrected state rather than its first draft (see the note in
  data/aboutPage.js on why numerals and icons were removed there).
*/
function NaelPage() {
  const revealAt = useSectionReveal('nael-masthead')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  /*
    ONE SOURCE STRING, SPLIT HERE RATHER THAN STORED AS THREE FIELDS — see the note at
    `nameTitle` in data/naelPage.js. `name` is everything before the first ' — ';
    `titles` is the one or two phrases after it, rendered as stacked credit lines
    rather than rejoined into a sentence.
  */
  const [name, ...titles] = nameTitle.split(' — ')
  const [givenName, ...familyNameParts] = name.split(' ')
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
                construction Founder.module.css documents at .portrait-frame /
                .portrait. This column is an `fr` grid track (see the 48rem block in
                the stylesheet), so its width is routinely fractional, and an image
                sized to exactly 100% of a fractional box can end on a half pixel that
                the browser antialiases — showing the page's own ground through as a
                thin dark line down one edge. Overhanging by 1px and clipping back
                cuts through opaque pixels instead.
              */}
              <div className={styles['portrait-frame']}>
                <img
                  className={styles.portrait}
                  src={portrait}
                  alt="Nael Al-Jarabah"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </motion.div>

            <motion.div className={styles.identity} {...revealAt(1)}>
              {/*
                "THE CEO", MIRRORING "THE FOUNDER" — Founder.jsx opens its own name
                plate with exactly that eyebrow; using the parallel construction here
                ties the site's two profile pages together as one pair rather than two
                unrelated designs.
              */}
              <p className={styles.eyebrow}>The CEO</p>

              {/*
                THE SITE'S NAME TREATMENT — given name in --color-text, family name in
                gold, on one line where the width allows it. The same pairing Founder's
                h2 and Team's own lead figure both use; a third instance of the same
                device rather than a new one for a page about a third person's name.
              */}
              <h1 className={styles.name}>
                {givenName}{' '}
                <span className={styles['name-accent']}>{familyName}</span>
              </h1>

              {/*
                THE TITLE LINES — the brief's own "Writer, Director & Executive
                Producer — CEO of AGB Media" rendered as a small stacked credit block
                (the register film credits use) rather than rejoined into prose,
                because the source line was already two roles separated by a dash
                rather than one sentence.
              */}
              <ul className={styles.titles}>
                {titles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </motion.div>
          </header>

          {/* --- Six content sections, in one flowing column --------------------- */}
          <div className={styles.content}>
            <Section id="biography" eyebrow="Since 1999" title="Biography">
              <p className={styles.paragraph}>{bio}</p>
            </Section>

            <Section
              id="publications"
              eyebrow="Words & Recognition"
              title="Publications & Festivals"
            >
              <p className={styles.paragraph}>{publications}</p>
            </Section>

            <Section
              id="channel-founding"
              eyebrow="Broadcast"
              title="Channel Founding"
            >
              <p className={styles.paragraph}>{channelFounding}</p>
            </Section>

            <Section id="theatre" eyebrow="On Stage" title="Theatre">
              <p className={styles.paragraph}>{theatre.intro}</p>
              <CreditList items={theatre.items} />
            </Section>

            <Section
              id="cinema-drama"
              eyebrow="On Screen"
              title="Cinema, Drama & Channel Management"
            >
              <CreditList items={cinemaDrama} />
            </Section>

            <Section id="workshops" eyebrow="Mentorship" title="Workshops">
              <CreditList items={workshops} />
            </Section>
          </div>
        </div>
      </main>
    </>
  )
}

/*
  ONE CONTENT SECTION — a hairline, an eyebrow, a heading, then whatever body the
  call site passes as children (a paragraph, a paragraph plus a credit list, or a
  credit list alone). A plain function rather than a component with its own reveal
  call for the same reason AboutPage.jsx's SectionHead is one: the ladder rung
  belongs to whichever call site renders it.
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
  THE CREDIT LIST — the "glass panel" surface the brief asked this page to draw on,
  applied to the one kind of content here that is genuinely enumerable (Theatre,
  Cinema/Drama, Workshops) rather than to the continuous prose above it, which stays
  plain paragraphs in the site's usual quiet body register. Each item is its own
  bordered, tinted panel — the same `--color-glass` / `--glass-border` pairing
  Founder's fact cards use, flat rather than blurred, because there is no photograph
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

export default NaelPage
