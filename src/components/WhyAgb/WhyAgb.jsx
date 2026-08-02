import { motion } from 'framer-motion'
import {
  HiOutlineGlobeAlt,
  HiOutlinePencilAlt,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi'
/*
  Two icons the hi (Heroicons outline) set has no equivalent for. PiFilmSlateLight is
  Phosphor's "light" weight — a thin single-path glyph rather than a true stroke icon,
  but the thinnest of Phosphor's weights and the closest visual match to the 2px stroke
  the hi/tb icons draw at. TbShieldStar is a genuine stroke icon, matching Founder's own
  precedent of reaching into `tb` for a glyph hi does not carry (its shield-plus-star
  combination is not in hi at all). Every other icon here stays in hi.
*/
import { PiFilmSlateLight } from 'react-icons/pi'
import { TbShieldStar } from 'react-icons/tb'

import useSectionReveal from '../../hooks/useSectionReveal'
import backdrop from '../../assets/images/why.webp'
import styles from './WhyAgb.module.css'

/*
  The case for the company: six reasons in one row, over the second half of the
  Founder's photograph.

  SIX SMALL GLASS PANELS NOW, not the divider-only row this opened as. Each item carries
  its own thin hairline border and a frosted fill composed from the site's shared glass
  system (see `.item` in the stylesheet) — the separation between reasons is each card's
  own edge rather than a rule drawn in the gap between them, which is why there is no
  divider between items any more (removed 2026-08-02 along with the tokens that fed it).

  THE ICON IS CENTRED, THE NUMERAL IS NOT — also 2026-08-02. Every card keeps its 01–06
  mark pinned to the top-left corner as a small tag, while the icon, the title, the short
  rule and the description below it are all centred as one block. See the note at
  `.icon-ring` for why the two alignments coexist on one card rather than the whole thing
  picking one.

  THERE IS NO CTA BANNER HERE ANY MORE. One shipped 2026-08-02 alongside the row — a
  bordered card below it with a headline and a "Start a Conversation" button — and was
  removed the same day on request, along with the `.button-outline` variant it was the
  only call site of (see Button.module.css). The section now closes with the row itself;
  Founder's and Team's own CTAs already close the page, and this was a third that was
  not wanted.
*/

/*
  Copy as data, so it can move to /src/data or a CMS later without touching the layout —
  the same reasoning About.jsx and Founder.jsx use for their own text. Icon added
  per-reason for the new circular mark under each numeral; titles and descriptions are
  unchanged from the grid version.
*/
const reasons = [
  {
    title: 'Creative Leadership',
    description: 'Artistic decisions rest with artists, not management alone.',
    Icon: HiOutlinePencilAlt,
  },
  {
    title: 'Industry Network',
    description:
      'Direct access to drama and content makers across Qatar, the Gulf, and the Arab world.',
    Icon: HiOutlineUsers,
  },
  {
    title: 'Flexible Production Teams',
    description:
      'We build the team around the project, so you never pay for a fixed structure you do not need.',
    Icon: HiOutlineUserGroup,
  },
  {
    title: 'Integrated Production Management',
    description:
      'From the first line of the script to the final broadcast-ready cut.',
    Icon: PiFilmSlateLight,
  },
  {
    title: 'Deep Understanding of Gulf Culture',
    description:
      'We know what resonates with audiences here, and what does not.',
    Icon: HiOutlineGlobeAlt,
  },
  {
    title: 'High Quality Standards',
    description:
      'Written technical and artistic specifications we commit to at every stage.',
    Icon: TbShieldStar,
  },
]

function WhyAgb() {
  /*
    The same ladder the Story section and the Founder reveal on — see useSectionReveal
    for the timings, and for the reduced-motion branch that is why nothing here checks
    the preference.

    TWO RUNGS: the eyebrow, then the title. It briefly carried a third for the CTA
    banner's own reveal; that block is gone (see the note at the top of this file) and
    the ladder is back to what the grid version used.
  */
  const revealAt = useSectionReveal('why-agb')

  /*
    A SECOND LADDER, AND THEREFORE A SECOND SCOPE. The row restarts the stagger at 0 (see
    above), so its rungs 0 and 1 would otherwise share keys with the eyebrow and the title —
    and a shared key means the first of the pair to finish latches the other before it has
    played, leaving a cell rendered flat while its neighbours animate. On a window where the
    whole section is on screen the two ladders fire together and the collision would never
    show; on a phone, where the row is a screen below the heading, it would.
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
          ONE ROW OF SIX, not a grid — see the note at the top of this file. Still an
          ordered list for the same reason it was a grid of six: the numerals are the
          design, and the index is what a reader counts, so each is aria-hidden and the
          <ol> carries the enumeration semantically.

          NUMERAL, THEN ICON, THEN TITLE, THEN A SHORT RULE, THEN DESCRIPTION — normal
          flow, top to bottom, same order the reference lays out per item. The icon sits
          in a plain circle with a gold stroke and no fill (.icon-ring), matching the
          "outlined, not filled" material every other raised mark on this site avoids
          being a solid shape.
        */}
        <ol className={styles.row}>
          {reasons.map(({ title, description, Icon }, index) => (
            <motion.li className={styles.item} key={title} {...revealCell(index)}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className={styles['icon-ring']} aria-hidden="true">
                <Icon className={styles.icon} />
              </span>

              <h3 className={styles.name}>{title}</h3>
              <span className={styles.rule} aria-hidden="true" />
              <p className={styles.description}>{description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhyAgb
