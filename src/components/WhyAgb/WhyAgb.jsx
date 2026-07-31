import { motion } from 'framer-motion'

import useSectionReveal from '../../hooks/useSectionReveal'
import styles from './WhyAgb.module.css'

/*
  The case for the company, as a numbered editorial list.

  It occupies the slot the empty `.placeholder` section held — after the Founder, last
  on the page — and it is the first thing in that slot with content in it.

  NOT A GRID OF CARDS, deliberately. Six reasons is exactly the count that invites three
  boxes by two, and a box with a fill, a radius and a shadow is the one surface this site
  does not have: everything raised here is glass over footage, and a card sitting on flat
  black would be neither. The list is set as six full-width rows divided by hairlines
  instead — the same editorial register as the Founder's career line, given room to
  breathe — with the index numerals carrying the gold. Nothing here is a container.
*/

/*
  Copy as data, so it can move to /src/data or a CMS later without touching the layout —
  the same reasoning About.jsx and Founder.jsx use for their own text.

  `label` is the small tag above each title; `title` is the row's heading. The two are
  the same string on the first two entries, and that is not an oversight in the data —
  it is what the source says. The render below drops the tag wherever it would merely
  repeat the heading, which is a comparison rather than a hand-maintained flag so that
  editing a title cannot leave a duplicate behind.
*/
const reasons = [
  {
    label: 'Creative Leadership',
    title: 'Creative Leadership',
    description: 'Artistic decisions rest with artists, not management alone.',
  },
  {
    label: 'Industry Network',
    title: 'Industry Network',
    description:
      'Direct access to drama and content makers across Qatar, the Gulf, and the Arab world.',
  },
  {
    label: 'Flexible Teams',
    title: 'Flexible Production Teams',
    description:
      'We build the team around the project, so you never pay for a fixed structure you do not need.',
  },
  {
    label: 'End-to-End',
    title: 'Integrated Production Management',
    description:
      'From the first line of the script to the final broadcast-ready cut.',
  },
  {
    label: 'Gulf Culture',
    title: 'Deep Understanding of Gulf Culture',
    description:
      'We know what resonates with audiences here, and what does not.',
  },
  {
    label: 'Quality Standards',
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

    The list restarts the ladder at 0 rather than continuing from the heading's two
    rungs, and that is a timing decision rather than an oversight. Eight rungs at 0.09s
    would put the last row 0.63s behind its own trigger, and these rows are far enough
    apart that the bottom ones scroll in long after the heading has left — a delay that
    size reads as the page lagging the scroll rather than as a stagger. Six rungs cap
    the tail at 0.45s, and every row still arrives on its own `whileInView`.
  */
  const revealAt = useSectionReveal()

  return (
    <section className={styles.why} id="why-agb" aria-labelledby="why-agb-title">
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
          deliberate order, and the index is what a reader counts down. The numbers are
          drawn rather than left to a list-style marker — they need to be a display
          element in their own right — so each is aria-hidden and the <ol> carries the
          enumeration semantically.
        */}
        <ol className={styles.list}>
          {reasons.map(({ label, title, description }, index) => (
            <motion.li className={styles.item} key={title} {...revealAt(index)}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className={styles.heading}>
                {/*
                  Dropped where it would only repeat the heading below it — see the
                  note on the data above.
                */}
                {label !== title && <p className={styles.label}>{label}</p>}
                <h3 className={styles.name}>{title}</h3>
              </div>

              <p className={styles.description}>{description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhyAgb
