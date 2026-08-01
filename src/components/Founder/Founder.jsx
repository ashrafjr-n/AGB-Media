import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  HiOutlineFlag,
  HiOutlineMicrophone,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineSwitchHorizontal,
  HiOutlineUser,
  HiOutlineUserGroup,
} from 'react-icons/hi'
/*
  The one icon the hi (Heroicons outline) set has no equivalent for — no theatre-masks
  glyph anywhere in it. Reused for both the Theatre fact card and the career timeline's
  opening node, so the whole section reaches outside hi exactly once rather than per call
  site. Every other icon here stays in hi, matching Team's HiOutlineUser and the rest of
  the site (CLAUDE.md §1's icon table).
*/
import { TbMasksTheater } from 'react-icons/tb'

import useSectionReveal from '../../hooks/useSectionReveal'
import backdrop from '../../assets/images/founder.webp'
import buttonStyles from '../shared/Button.module.css'
import styles from './Founder.module.css'

/*
  .portrait is drawn at roughly 440x350 CSS px, so its 1280x720 source is about right
  for a 2x screen.

  This used to share the file with a second sourcing note, for the two LogoLoop strips
  that ran below the intro block — a photo filmstrip and a scrolling line of production
  titles. Both are gone, removed 2026-08-01 to free the section's height for the
  remaining content to centre in; LogoLoop, its six work stills and the 31-title credits
  list all went with them. Nothing here imports react-icons for those roles or the strip
  crop any more.
*/
import portrait from '../../assets/abdullah/abdullah.jpg'

/*
  The founder's page-within-a-section, and an ordinary section of the home page: it sits
  after the Story section in HomePage.jsx and scrolls up past the viewport like anything
  else.

  It used to be a tenant of About's scroll-zoom stage — pinned across the Story section's
  runway and faded up over the finished zoom, painting no ground of its own because the
  blurred frozen frame behind it *was* its background. That whole transition is gone, so
  this now owns its own ground, and its areas arrive one after another on the ladder the
  Story section uses — see useSectionReveal. Three areas now (intro, career timeline,
  closing button), down from four before the two scrolling strips were removed
  2026-08-01 — see the note on that below.

  THE GROUND IS A STILL IMAGE, and it used to be footage.

  It was a second <video> element pointing at story.webm — the same file the Story circle
  shows — under the same 0.75 fill and 20px blur About lays over the hero. All of that is
  gone: the ground is a studio still under the LIGHT glass pair,
  --section-glass-fill-light and --section-glass-blur-light, because the two grounds are
  doing opposite jobs. The strong pair exists to make moving footage into atmosphere
  behind text; this image has a subject in it, and at 0.75 and 20px it was an amber
  smear. It is now softened just enough to read over.

  THE IMAGE IS HALF OF A PAIR. founder.webp and WhyAgb's why.webp are one continuous
  piece cut in two — same source width, different heights — and the bottom edge of this
  one is the top edge of that one. Everything about how the ground is laid out follows
  from keeping that join invisible; the arithmetic is in .backdrop in the stylesheet, and
  the matching half is in WhyAgb.module.css. The two grounds carry the same glass at the
  same values for the same reason: a difference in fill or blur across the seam would
  draw the line the images exist to hide.

  What went with the video, and none of it is missed: this section no longer registers a
  claim with useExclusiveVideo, no longer watches its own visibility to decide when to
  play, and no longer warms a preload 400px early. There is one <video> left below the
  hero — the Story circle's — so the page-wide arbitration now has a single claimant; see
  the note at the top of useExclusiveVideo.js for why the registry is kept anyway.
*/

const bio =
  'A veteran Qatari artist whose presence across theatre, television drama, and radio spans decades, and a recognized name among audiences in Qatar and the Gulf. His experience extends well beyond acting — he is a leading voice in developing the local theatre movement and in preparing young talent for careers in performance, directing, and production.'

/*
  Copy as data rather than markup, so it can move to /src/data or a CMS later without
  touching the layout — the same reasoning About.jsx uses for its story paragraph.

  Each fact now carries an Icon, one per card — see the metadata grid in the markup below.
*/
const facts = [
  { label: 'Nationality', value: 'Qatari', Icon: HiOutlineFlag },
  {
    label: 'Standing',
    value: 'Pioneer of Qatari theatre and drama',
    Icon: HiOutlineStar,
  },
  { label: 'Role', value: 'Founder, AGB Media', Icon: HiOutlineUser },
  {
    label: 'Theatre',
    value: 'General Director, Al Watan Theatre Company',
    Icon: TbMasksTheater,
  },
]

/*
  The same five milestones the condensed line used to carry, split back into a
  title/description pair each — a timeline node needs a short label to sit under it and a
  clause is too long for that job. The wording is unchanged; only where the sentence
  breaks is new. Each carries an Icon, rendered INSIDE its node circle — every node does
  this the same way now, the first one included, so there is no per-item branching left
  in the markup below.
*/
const milestones = [
  {
    title: 'Stage and screen actor',
    description: 'since the golden age of local theatre',
    Icon: TbMasksTheater,
  },
  {
    title: 'General Director',
    description: 'of Al Watan Theatre Company',
    Icon: HiOutlineUserGroup,
  },
  {
    title: 'Narrator',
    description: "at Qatar's 2019 World Beach Games",
    Icon: HiOutlineMicrophone,
  },
  {
    title: 'Transitioned',
    description: 'from acting to production',
    Icon: HiOutlineSwitchHorizontal,
  },
  {
    title: 'Today leads AGB Media',
    description: 'as founder and creative visionary',
    Icon: HiOutlineSparkles,
  },
]

function Founder() {
  /*
    The reveal ladder, one rung per area: the intro block, the career timeline, then the
    closing button. It used to be four — a photo filmstrip and a scrolling line of
    thirty-one production titles sat between the timeline and the end — both removed
    2026-08-01 to let the section's remaining content centre in the space they freed
    rather than leaving a gap where they used to be (see .founder in the stylesheet).
    Nothing here replaced them; the section is genuinely shorter now.

    It replaces a single reveal on the section itself, and the swap is worth stating
    because the old comment argued for that: several areas arriving in sequence would
    supposedly read as "the page assembling itself".

    What made that true was the *distance* — the section moved 24px as one slab. At the
    12px this ladder travels, in 0.09s steps that overlap each other, the areas land as
    one gesture with a direction to it rather than as several separate events. The
    shared hook is what keeps it identical to About's; see useSectionReveal for the
    timings and for the reduced-motion branch, which is why there is no preference
    check in this file.

    It also takes the entrance off the section element itself, which is a small win the
    glass cares about: an animating `opacity` on <section> isolates the whole subtree
    while it runs, and the ground below is now the only thing in here that never fades.
  */
  const revealAt = useSectionReveal('founder')

  return (
    <section
      className={styles.founder}
      id="founder"
      aria-labelledby="founder-name"
    >
      {/*
        The ground: a studio still, filling the section behind everything else, and the
        upper half of the pair it forms with WhyAgb's — see the note at the top of this
        file and the crop arithmetic at .backdrop.

        `alt=""` rather than a description, and that is the correct markup rather than a
        shortcut — an empty alt is what marks an image as decorative, and this one carries
        no information the section does not already state in words. It needs no
        aria-hidden alongside it; the empty alt is the whole announcement.

        `loading="lazy"` still defers it — the section is three viewports below the fold on
        every path — but it no longer has much to defer: this is 21KB of WebP where the PNG
        it replaced was 3.3MB, so it has stopped being the largest thing on the page after
        the two videos. `decoding="async"` keeps the decode off the frame it lands on.
      */}
      <img
        className={styles.backdrop}
        src={backdrop}
        alt=""
        loading="lazy"
        decoding="async"
      />

      {/*
        The frosted pane between the image and the copy — the LIGHT pair of the section
        glass tokens, not the pair About uses. The two grounds want opposite things: About
        is filtering moving footage down into atmosphere, and this is a still with a
        subject in it that is meant to stay readable. See .glass in the stylesheet.
      */}
      <div className={styles.glass} aria-hidden="true" />

      {/*
        --- Hero block: eyebrow, name, bio and the metadata cards, against the
        portrait ---------------------------------------------------------------

        ONE COLUMN OF TEXT, THE PORTRAIT ALONE BESIDE IT — corrected 2026-08-01. The name
        and portrait used to share one column (.identity) while the eyebrow, bio and facts
        shared another (.profile); the two read as a heading-with-photo paired against a
        block of notes, rather than as one column of copy next to a plain portrait. There
        is no more .identity: .profile now carries all four text pieces in reading order
        (eyebrow, name, bio, facts), and .portrait-frame is a direct second grid child.
      */}
      <motion.div className={styles.intro} {...revealAt(0)}>
        <div className={styles.profile}>
          <p className={styles.eyebrow}>The Founder</p>

          {/*
            An h2, matching About's — both are top-level sections under the hero's
            sr-only h1, and neither is subordinate to the other.

            ONE LINE, with a real space in the markup rather than two block spans — the
            surname is simply the second word of the heading and the only thing it needs
            is the accent colour. It now sets in the wider of .intro's two columns (see
            .name in the stylesheet), which is more room than it had while it shared the
            narrower column with the portrait.
          */}
          <h2 className={styles.name} id="founder-name">
            Abdullah <span className={styles['name-accent']}>Ghayfan</span>
          </h2>

          {/*
            A wrapper around the paragraph rather than a styled paragraph, so the gold
            hairline can span the block's full height as a pseudo-element — the same
            construction as About's .body, and for the same reason: a border cannot fade.
          */}
          <div className={styles.bio}>
            <p>{bio}</p>
          </div>

          {/*
            A description list, because these are label/value pairs and nothing else. The
            div wrappers are the standard HTML5 grouping and are what the grid lays out —
            dt and dd cannot be grid items in a pair on their own.

            Each card's icon lives INSIDE its dt, beside the label text, rather than as a
            sibling of dt/dd in the wrapping div — a dl's content model only allows dt/dd
            (optionally wrapped in div) per group, and a bare decorative icon alongside
            them would not be. dt is flow content, so the icon sits there instead, sized
            and positioned by .fact-label to read as sitting above the label text.
          */}
          <dl className={styles.facts}>
            {facts.map(({ label, value, Icon }) => (
              <div className={styles.fact} key={label}>
                <dt className={styles['fact-label']}>
                  <Icon className={styles['fact-icon']} aria-hidden="true" />
                  <span>{label}</span>
                </dt>
                <dd className={styles['fact-value']}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/*
          THE FRAME IS WHAT CLIPS THE PORTRAIT, and it exists for that alone — the image
          used to carry its own height and radius with nothing around it.

          It is there to close a hairline of dark ground that showed down one edge of the
          image. The cause is that this column is an `fr` track, so its width is
          routinely fractional (~361.6px at a 1024px window), and an image sized at 100%
          of it can end on a half pixel: the browser antialiases that column, the image's
          own alpha falls off across it, and the section shows through as a thin dark
          line.

          The fix is to let the image overhang its box by 1px on every side and have this
          element clip it back (see .portrait-frame / .portrait). The clip then cuts
          through opaque pixels instead of landing on the image's own edge, which is the
          difference between a soft edge and a see-through one. Nothing about the
          portrait's size or position changes — the frame is exactly the box the image
          used to be.

          Plain photograph, no ring behind it — a halo lived here briefly (2026-08-01)
          and is gone: at this size, against this little clearance above the section, its
          glow bled past .founder's own top edge into the Story section above. See
          .portrait-frame in the stylesheet.

          Lazy and async-decoded. The section is in normal flow well below the fold on
          every path now, so `loading="lazy"` genuinely defers the fetch until it is near
          the viewport; `decoding="async"` keeps the 205KB decode off the frame it lands
          on.
        */}
        <div className={styles['portrait-frame']}>
          <img
            className={styles.portrait}
            src={portrait}
            alt="Abdullah Ghayfan"
            loading="lazy"
            decoding="async"
          />
        </div>
      </motion.div>

      {/*
        --- Career: an icon timeline --------------------------------------

        SAT SECOND, THEN FOURTH, NOW SECOND AGAIN — but for a different reason each time.
        It opened directly after the intro; the 2026-08-01 correction pass moved it to
        close the section, below two scrolling strips; those strips are gone as of the
        same day's later pass, so this is once again the last thing in the section — not
        because the order was reverted, but because there is nothing left after the intro
        to put it after.
      */}
      <motion.div className={styles.career} {...revealAt(1)}>
        <p className={`${styles.eyebrow} ${styles['career-label']}`}>
          Career Highlights
        </p>

        {/*
          An ordered list of five sequential milestones, each a node on one continuous
          rail — horizontal here, vertical on a phone (see the media query in the
          stylesheet), but always a single connected line rather than five independent
          markers.

          EVERY NODE RENDERS ITS ICON THE SAME WAY NOW: inside the circle
          (.timeline-node), never floating above it. The first node is still visually
          distinct — larger, filling its whole rail slot rather than sitting centred
          within it — but that is the only thing data-first still changes; there is no
          per-item branching left here.
        */}
        <ol className={styles.timeline}>
          {milestones.map(({ title, description, Icon }, index) => (
            <li
              className={styles['timeline-item']}
              data-first={index === 0 ? 'true' : undefined}
              key={title}
            >
              <div className={styles['timeline-node-row']}>
                <span className={styles['timeline-node']}>
                  <Icon aria-hidden="true" />
                </span>
              </div>

              <div className={styles['timeline-copy']}>
                <p className={styles['timeline-title']}>{title}</p>
                <p className={styles['timeline-description']}>
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </motion.div>

      {/*
        --- The closing call to action -------------------------------------

        A solid gold button, deliberately not glass — CLAUDE.md §2's one-material rule is
        about the site's raised surfaces, and this is the one place the site wants a
        button to read as a plain, warm, unmissable stop rather than another pane of the
        same glass everything else is built from. `.button-solid` is the new variant in
        shared/Button.module.css that carries that; nothing about it is styled here.

        NO ROUTE YET. `to="#"` is a placeholder — there is no founder bio page for this
        to open, so it goes nowhere rather than to somewhere wrong. Wire it up when that
        page exists rather than guessing at its path now.

        Wrapped in its own motion.div rather than being the reveal target itself, the
        same construction Team's Contact button uses and for the same reason: Link is a
        plain anchor here, not a motion.create(Link), so there is only one thing writing
        transform to this subtree.
      */}
      <motion.div className={styles.cta} {...revealAt(2)}>
        <Link
          to="#"
          className={`${buttonStyles.button} ${buttonStyles['button-solid']}`}
        >
          Discover More
        </Link>
      </motion.div>
    </section>
  )
}

export default Founder
