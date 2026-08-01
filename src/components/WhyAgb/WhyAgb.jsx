import { motion } from 'framer-motion'

import useSectionReveal from '../../hooks/useSectionReveal'
import backdrop from '../../assets/images/why.webp'
import styles from './WhyAgb.module.css'

/*
  The case for the company: six reasons in a 2 x 3 grid, over the second half of the
  Founder's photograph.

  STILL NOT A GRID OF CARDS, and the distinction is worth keeping straight now that it
  genuinely is a grid. Nothing here is a container: no fill, no radius, no border, no
  shadow. The cells are held together by two things only — a single hairline down the
  middle, and the numeral labelling each title. That matters on this site because every
  raised surface elsewhere is glass over footage, and a card on a photograph would be the
  one surface the design system has no answer for.

  THERE IS NO WORDMARK FIELD ANY MORE. Three rows of outlined "AGB MEDIA" used to drift
  behind this content — two on pure CSS keyframes, the middle one carrying a second
  pointer-driven offset on a wrapper outside its animated track. All of it is gone: the
  markup, the keyframes, the follow loop and its refs, and the reduced-motion branch that
  existed only to switch that loop off. Nothing in this file animates outside the shared
  reveal ladder now, which is why it no longer calls useReducedMotion — useSectionReveal
  carries that check for the reveals. The ground carries the section on its own.
*/

/*
  Copy as data, so it can move to /src/data or a CMS later without touching the layout —
  the same reasoning About.jsx and Founder.jsx use for their own text.

  ONE TITLE PER ENTRY. Each row used to carry a `label` as well, a small tag above the
  heading, and on two of the six the tag and the heading were the same string — so the
  render carried a `label !== title` comparison to suppress the repeat. The tags are gone
  rather than deduplicated: the numeral is the row's mark now, and a micro-label above a
  title that already says the same thing was a second mark for one item.
*/
const reasons = [
  {
    title: 'Creative Leadership',
    description: 'Artistic decisions rest with artists, not management alone.',
  },
  {
    title: 'Industry Network',
    description:
      'Direct access to drama and content makers across Qatar, the Gulf, and the Arab world.',
  },
  {
    title: 'Flexible Production Teams',
    description:
      'We build the team around the project, so you never pay for a fixed structure you do not need.',
  },
  {
    title: 'Integrated Production Management',
    description:
      'From the first line of the script to the final broadcast-ready cut.',
  },
  {
    title: 'Deep Understanding of Gulf Culture',
    description:
      'We know what resonates with audiences here, and what does not.',
  },
  {
    title: 'High Quality Standards',
    description:
      'Written technical and artistic specifications we commit to at every stage.',
  },
]

function WhyAgb() {
  /*
    The same ladder the Story section and the Founder reveal on — see useSectionReveal
    for the timings, and for the reduced-motion branch that is why nothing here checks
    the preference.

    The grid restarts the ladder at 0 rather than continuing from the heading's two rungs.
    Eight rungs at 0.09s would put the last cell 0.63s behind its own trigger; six caps
    the tail at 0.45s. The cells reveal in reading order, which across two columns means
    the stagger runs left-to-right then down rather than straight down a single column.
  */
  const revealAt = useSectionReveal('why-agb')

  /*
    A SECOND LADDER, AND THEREFORE A SECOND SCOPE. The grid restarts the stagger at 0 (see
    above), so its rungs 0 and 1 would otherwise share keys with the eyebrow and the title —
    and a shared key means the first of the pair to finish latches the other before it has
    played, leaving a cell rendered flat while its neighbours animate. On a window where the
    whole section is on screen the two ladders fire together and the collision would never
    show; on a phone, where the grid is a screen below the heading, it would.
  */
  const revealCell = useSectionReveal('why-agb-grid')

  return (
    <section className={styles.why} id="why-agb" aria-labelledby="why-agb-title">
      {/*
        THE GROUND, and it must stay FIRST — it and the pane below it are both at z-index
        0, so document order is the only thing putting the image behind the glass.

        IT IS THE LOWER HALF OF A PAIR. why.webp continues the Founder's founder.webp: the
        two share a source width and differ in height, and the first row of this file is the
        row below the last row of that one. It replaces four radial gradients and a grain
        layer that dithered them — that whole system is gone rather than layered under this,
        because a photograph does not band and the gradients were an invented light where
        there is now a real one. The crop arithmetic that keeps the join invisible is at
        `.backdrop` in the stylesheet, and the matching half is in Founder.module.css.

        `alt=""` marks it decorative, which it is — the section says everything it means to
        say in words. `loading="lazy"` on a section four viewports down, `decoding="async"`
        to keep the decode off the frame it lands on; the file is 25KB, so neither is
        carrying much weight, but both are free.
      */}
      <img
        className={styles.backdrop}
        src={backdrop}
        alt=""
        loading="lazy"
        decoding="async"
      />

      {/*
        The frosted pane, and it is the Founder's pane at the Founder's values — the same
        --section-glass-fill-light over the same --section-glass-blur-light. It has two jobs
        and they happen to want the same number: it holds the copy above off a photograph
        that has a lit wordmark through the middle of it, and it makes this side of the
        section boundary the same material as the other side. See .glass in the stylesheet.
      */}
      <div className={styles.glass} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.opening}>
          {/*
            The site's micro-label, matching About's and the Founder's: tiny, widely
            tracked, dimmed, with the gold dot leading rather than trailing because the
            tracking adds a space after the final letter that CSS cannot trim.
          */}
          <motion.p className={styles.eyebrow} {...revealAt(0)}>
            Why AGB Media
          </motion.p>

          <motion.h2
            className={styles.title}
            id="why-agb-title"
            {...revealAt(1)}
          >
            We don&rsquo;t measure ourselves by the company&rsquo;s age, but by
            what our team can deliver today.
          </motion.h2>
        </div>

        {/*
          An ordered list, because the numerals are the design: six reasons in a
          deliberate order, and the index is what a reader counts. The numbers are drawn
          rather than left to a list-style marker — a marker cannot be styled to this
          size, colour and position — so each is aria-hidden and the <ol> carries the
          enumeration semantically.

          THE NUMERAL IS NORMAL FLOW: numeral, then title, then description, stacked. It
          used to be absolutely positioned behind the title as decorative depth, at 8% of
          the accent, which needed the cell to be a positioning context and a `.body`
          wrapper to hold the copy in front of it. Both are gone with it — the numeral is
          a label above its title, and a label is just the first line of the cell.
        */}
        <ol className={styles.grid}>
          {reasons.map(({ title, description }, index) => (
            <motion.li className={styles.item} key={title} {...revealCell(index)}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className={styles.name}>{title}</h3>
              <p className={styles.description}>{description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhyAgb
