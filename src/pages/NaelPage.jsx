import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft } from 'react-icons/hi'

import useSectionReveal from '../hooks/useSectionReveal'
import Header from '../components/Header/Header'
import portrait from '../assets/nael/nael.webp'
import {
  nameTitle,
  bio,
  publications,
  channelFounding,
  theatre,
  cinemaDrama,
  workshops,
  sections,
} from '../data/naelPage'
import styles from './NaelPage.module.css'

/*
  /team/nael-al-jarabaa — THE SITE'S FIFTH ROUTE, and the first that is not linked
  from navLinks.js. It is reached one way only: clicking the CEO's circle in the home
  page's Team section (Team.jsx wraps his portrait and name in a <Link> to this path).
  That is deliberate rather than an oversight — this is a profile page for one person,
  not a section of the primary site map, and it does not belong in either header's nav.

  THE SHELL FOLLOWS THE SAME CONVENTION /about, /services AND /contact ALL SHARE:
  `<Header visible />` (no in-flow hero header on this route to hand off from), a
  mount-only `window.scrollTo(0, 0)` (this route has no scroll restoration of its
  own, the same reason every secondary page resets it), and `noise-overlay` on
  `<main>`.

  THE GROUND IS DIFFERENT FROM /services AND /contact ON PURPOSE. Those two are a
  fixed photograph under the shared section glass; this page has no photograph of its
  own to use for that (Nael's portrait is the content, not a room to read text over,
  and reusing Founder's studio still or one of the other two pages' photos behind a
  page about a *different* person would misattribute whose room this is). The ground
  here is flat `--color-black` — the site's main tone rather than /about's separate
  `--about-ground` — because this page is reached from the home page and reads as
  part of it, not as a third room. Depth instead comes from the portrait itself (shot
  on a dark studio backdrop that meets this ground almost seamlessly) and from local
  glass-panel surfaces on the credit lists further down, rather than from a
  viewport-wide backdrop-filter this page has nothing suitable to blur.

  THE STRUCTURE IS ITS OWN, NOT A COPY OF THE FOUNDER SECTION: a masthead pairing a
  large framed portrait against a name plate, then a sticky index rail beside six
  content sections (biography, publications, channel founding, theatre, cinema/drama,
  workshops) — the density the brief asked to be organised scannably. The index and
  the rail-plus-hairline device are drawn from /about's own vocabulary (a page that
  already had to solve "long, category-shaped prose, made to feel designed rather
  than dumped"), reused here because it is the right tool for the same problem, not
  because every page must look identical. No section numeral and no per-section icon
  — eyebrow-plus-heading only — matching /about's own corrected state rather than its
  first draft (see the note in data/aboutPage.js on why those were removed there).
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
          {/*
            THE WAY BACK. A plain, quiet link rather than a button — it is wayfinding,
            not a call to action, and the page already has none of the site's one
            high-emphasis button on it (CLAUDE.md §2 keeps that pair to the hero nav
            and Team's own CTA). Goes to `/` rather than `/#team`: React Router does
            not scroll to a hash fragment on a client-side navigation, so a link
            promising to land back on the Team section would not actually do that —
            better to say plainly where it goes.
          */}
          <Link className={styles.back} to="/">
            <HiArrowLeft aria-hidden="true" />
            Back to AGB Media
          </Link>

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
                  alt="Nael Al-Jarabaa"
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

          {/* --- The index, beside six content sections -------------------------- */}
          <div className={styles.body}>
            {/*
              THE INDEX — real anchor links, not decoration: CLAUDE.md's global.css
              already sets `scroll-padding-block-start: var(--header-height)` on
              <html>, so following one of these lands the target heading clear of the
              fixed pill with no extra handling needed here. Sticky above 64rem,
              matching the threshold /about's own chapter rail uses and for the same
              reason — a narrow window has nowhere near enough vertical room for a
              rail to have anything to hold onto.
            */}
            <nav className={styles.index} aria-label="Profile sections">
              <p className={styles['index-title']}>On This Page</p>
              <ul className={styles['index-list']}>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a className={styles['index-link']} href={`#${section.id}`}>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

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
