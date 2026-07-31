import { motion } from 'framer-motion'

import useSectionReveal from '../../hooks/useSectionReveal'
import styles from './WhyAgb.module.css'

/*
  The case for the company: six reasons in a 2 x 3 grid, over a drifting field of
  outlined wordmarks.

  STILL NOT A GRID OF CARDS, and the distinction is worth keeping straight now that it
  genuinely is a grid. Nothing here is a container: no fill, no radius, no border, no
  shadow. The cells are held together by two things only — a single hairline down the
  middle, and the oversized numeral sitting behind each title. That matters on this site
  because every raised surface elsewhere is glass over footage, and a card on flat black
  would be the one surface the design system has no answer for.
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

/*
  THE BACKGROUND FIELD — three rows of the wordmark, drawn as outlines and drifting.

  WHY DOM TEXT WITH `-webkit-text-stroke` RATHER THAN SVG `<text>`, since both were on the
  table. The deciding factor is the seamless loop, not the stroke quality — both render a
  clean 1px outline.

  The loop works by putting two identical copies of the run side by side in a track and
  translating the track by exactly -50%: at that offset the second copy sits precisely
  where the first began, so the wrap is invisible. That is exact only if -50% of the track
  is exactly one copy, which is true for free when the track is a flex box sized by its own
  content — the browser measures the text and the percentage follows. An SVG would need a
  `viewBox` and a `width`, and neither can be written without knowing how wide "AGB MEDIA"
  sets in Clash Display at the current clamp — a number that changes with the font's
  metrics, the viewport, and whether the webfont has loaded yet. Getting it wrong by a few
  pixels is a visible stutter every cycle. DOM text moves that measurement into layout,
  where it cannot drift.

  The trade, stated: `-webkit-text-stroke` is a non-standard property. It is implemented in
  every current engine, and where it is not, the text is `color: transparent` with no
  stroke to replace it — the field simply does not appear, which is the right failure for a
  layer this decorative.

  Each copy is one text node ending in its separator, so the two spans are identical in
  width by construction. Building the run from an array of words with a flex `gap` would
  not be: a gap falls *between* items, so the last word of a copy would have no trailing
  space and -50% would land half a gap out.
*/
const WORDMARK_REPEATS = 6
const WORDMARK_RUN = 'AGB MEDIA    '.repeat(WORDMARK_REPEATS)

/*
  Three rows, and the middle one runs the other way. Opposed directions are what make the
  field read as two planes at different depths rather than as one sheet sliding past — the
  same reasoning the Founder's two LogoLoops are deliberately opposed.

  The durations are all different and none is a multiple of another, so the three rows
  never resynchronise into a visible pattern. They are long: at this size the motion should
  be something a reader notices only if they look for it.
*/
const WORDMARK_ROWS = [
  { direction: 'reverse', duration: '64s' },
  { direction: 'forward', duration: '81s' },
  { direction: 'reverse', duration: '73s' },
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
  const revealAt = useSectionReveal()

  return (
    <section className={styles.why} id="why-agb" aria-labelledby="why-agb-title">
      {/*
        Purely atmospheric, and marked so: aria-hidden because a screen reader reaching
        eighteen copies of the company name between the heading and the list would be
        reading furniture, and pointer-events: none in the stylesheet because this covers
        the whole section and would otherwise swallow every selection drag over it.
      */}
      <div className={styles.field} aria-hidden="true">
        {WORDMARK_ROWS.map(({ direction, duration }, row) => (
          <div className={styles['field-row']} key={row}>
            <div
              className={styles['field-track']}
              data-direction={direction}
              style={{ animationDuration: duration }}
            >
              {/*
                Two identical copies, and they must stay identical — the loop translates
                the track by exactly -50%, which is one copy's width only while the two
                are the same string. See the note on WORDMARK_RUN.

                An inline style for the duration alone: it is the one value that differs
                per row, and three near-identical keyframe-bearing classes to carry three
                numbers would be worse than the exception. The animation itself, including
                its direction, is entirely in CSS.
              */}
              <span>{WORDMARK_RUN}</span>
              <span>{WORDMARK_RUN}</span>
            </div>
          </div>
        ))}
      </div>

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
          rather than left to a list-style marker — they are a display element in their
          own right now, set large and behind the title — so each is aria-hidden and the
          <ol> carries the enumeration semantically.
        */}
        <ol className={styles.grid}>
          {reasons.map(({ title, description }, index) => (
            <motion.li className={styles.item} key={title} {...revealAt(index)}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/*
                `.body` is positioned so it paints over the numeral behind it. Both are
                positioned boxes at z-index auto inside this cell, so document order is
                what decides — the numeral is first, this is second, and nothing needs a
                z-index or a stacking context to keep them in that order.
              */}
              <div className={styles.body}>
                <h3 className={styles.name}>{title}</h3>
                <p className={styles.description}>{description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhyAgb
