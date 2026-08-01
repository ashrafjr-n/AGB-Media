import { motion } from 'framer-motion'
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
import LogoLoop from '../shared/LogoLoop'
import styles from './Founder.module.css'

/*
  The portrait comes from the full-size originals; the strip does not.

  .portrait is drawn at roughly 440x350 CSS px, so its 1280x720 source is about right
  for a 2x screen. The strip is a different case entirely: LogoLoop sizes each still by
  height alone, at most clamp(5rem, 15vh, 9.5rem) — 152px, so around 270px wide — and
  the track holds two or three copies of the set. Feeding it the 1280x720 originals meant
  1.8MB of JPEG over the wire and, worse, a dozen images decoded to full size and held in
  a permanently composited layer: about 44MB of pixels to draw a strip 152px tall.

  src/assets/abdullah/strip/ holds 640x360 copies — 2x the largest size they are ever
  drawn at, so nothing is visibly softer — for 368KB and around 11MB decoded. The
  originals are kept where they are; nothing imports them, so Vite does not bundle them,
  and they are there to re-cut from if the strip ever grows.
*/
import portrait from '../../assets/abdullah/abdullah.jpg'
import work002 from '../../assets/abdullah/strip/002.jpg'
import work003 from '../../assets/abdullah/strip/003.jpg'
import work004 from '../../assets/abdullah/strip/004.jpg'
import work005 from '../../assets/abdullah/strip/005.jpg'
import work006 from '../../assets/abdullah/strip/006.jpg'
import work007 from '../../assets/abdullah/strip/007.jpg'

/*
  The founder's page-within-a-section, and an ordinary section of the home page: it sits
  after the Story section in HomePage.jsx and scrolls up past the viewport like anything
  else.

  It used to be a tenant of About's scroll-zoom stage — pinned across the Story section's
  runway and faded up over the finished zoom, painting no ground of its own because the
  blurred frozen frame behind it *was* its background. That whole transition is gone, so
  this now owns its own ground, and its four areas arrive one after another on the ladder
  the Story section uses — see useSectionReveal.

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

/*
  The body of work, as one continuous line of titles — television first, then theatre,
  then cinema, which is the order the work was given in and roughly its weight.

  It replaces the "Awards & Honours" / "Contribution" pair that used to close the
  section. Those were two labels over two summaries of things not actually listed; this
  is the list, and a scrolling line holds thirty-one titles in the height the two notes
  took.

  TITLES ARE TRANSLITERATED OR TRANSLATED, never both, and the choice is per title
  rather than by rule: a name carries over (Al Dana, Jameela, Boudariya) and a phrase
  translates (The Golden Shoe, Who Laughs Last), because a transliterated phrase reads as
  noise to an English reader and a translated name stops being the name of the work. The
  site is English throughout (CLAUDE.md §1) — there is no Arabic anywhere in this file.

  Categories are deliberately not labelled. The strip is a single flowing line and a
  heading inside it would break the rhythm for information the titles carry well enough
  in aggregate; if the sections ever need naming, they want a different component.
*/
const works = [
  /* Television */
  'Al Dana',
  'Fayez Al-Toosh',
  "Al Ta'iha",
  'Adventures of Saadoun',
  'Mohsen Minkum wa Fikum',
  'Al Nas Al Tayyebin',
  'Ahlam Al Busata',
  'Afwan Sayyidi Al-Walid',
  '29 Salfa wa Salfa',
  'Al Dalloub',
  'Jameela',
  'Bait Al Mughtani',
  'Al Sidra',

  /* Theatre */
  'Min Fawq Ha Allah Allah',
  'Boudariya',
  'Al Mahara: Queen of Ancient Times',
  'The Lost Treasure in the Land of Wonders',
  'Al Mutaraqishoon',
  'Who Laughs Last',
  'Ya Layl Ya Layl',
  'The Golden Shoe',
  'Antar and Abla',
  'Al Munaqasha',
  'Mawwal Al Farah wal Huzn',
  'Official Records',
  'Mazloum Dhulm Mazloum',
  'Hammam Al Mahabba',
  'The Elephant O King of Time',
  'Rahma and the Enchanted Forest',
  "Hal Al Shakl Ya Za'faran",

  /* Cinema */
  'Aqarib Al Saa',
].map((title) => ({ label: title }))

/*
  Alt text is deliberately generic: these are production stills whose subjects are not
  documented here, and a specific claim about each would be a guess. The strip announces
  itself once through LogoLoop's own label.
*/
const workImages = [work002, work003, work004, work005, work006, work007].map(
  (src, index) => ({ src, alt: `AGB Media production still ${index + 1}` }),
)

function Founder() {
  /*
    The reveal ladder, one rung per area: the intro block, the photo strip, the titles,
    then the career timeline — the timeline moved to close the section (2026-08-01), so
    it is the last rung now rather than the second. It replaces a single reveal on the
    section itself, and the swap is worth stating because the old comment argued for
    that: four areas arriving in sequence would supposedly read as "the page assembling
    itself".

    What made that true was the *distance* — the section moved 24px as one slab. At the
    12px this ladder travels, in 0.09s steps that overlap each other, the areas land as
    one gesture with a direction to it rather than as four events. The shared hook is
    what keeps it identical to About's; see useSectionReveal for the timings and for the
    reduced-motion branch, which is why there is no preference check in this file.

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

      {/* --- The work: bordered card, continuously scrolling ------------------- */}
      <motion.div className={styles.strip} {...revealAt(1)}>
        <LogoLoop
          logos={workImages}
          speed={60}
          /*
            LEFT TO RIGHT, and it is the opposite of the titles below on purpose: two
            strips running the same way read as one mechanism repeated, where two running
            against each other read as a page with depth to it. This is the one that
            changed direction; keep them opposed if either is ever retuned.
          */
          direction="right"
          /*
            A CSS length rather than a number, which LogoLoop accepts so that a strip
            inside a fixed-height section can scale with the viewport instead of pinning
            itself to one figure. Tops out at 152px, inside the 140–160 asked for.
          */
          logoHeight="clamp(5rem, 15vh, 9.5rem)"
          gap={16}
          /*
            NEVER pauses. The photographs are the section's one piece of continuous
            motion and the cursor spends most of its time in the middle of the page,
            which is exactly where this strip is — so pausing on hover stopped it for
            reasons that had nothing to do with wanting it stopped. The titles below keep
            the behaviour, where it is useful: they are text, and stopping to read one is
            a real intent.
          */
          pauseOnHover={false}
          /*
            fadeOut stays off. The strip sits inside a bordered card and is meant to be
            clipped cleanly by it rather than dissolve at the edges — LogoLoop's own
            `.loop { overflow: hidden }` already does that clip on its own, with nothing
            further required at this call site. See .strip in the stylesheet.
          */
          ariaLabel="AGB Media productions"
        />
      </motion.div>

      {/* --- The body of work, as a line of titles ---------------------------- */}
      <motion.div className={styles.works} {...revealAt(2)}>
        <LogoLoop
          logos={works}
          /*
            Slower than the photographs, because these are words. 60px/s is a comfortable
            pace for a picture arriving and leaving; at that speed a title is gone before
            it can be read, and a strip nobody can read is decoration wearing the clothes
            of information.
          */
          speed={30}
          /* Right to left, against the photo strip above — see the note there. */
          direction="left"
          /*
            Wider than the photo strip's, and it sets the rhythm of the whole line: the
            gap sits on both sides of each separator dot (LogoLoop.module.css), so this
            is the space around the dot rather than merely between titles.
          */
          gap={20}
          /* Text, so stopping to read one is a real intent — see the strip above. */
          pauseOnHover={true}
          ariaLabel="Selected works of Abdullah Ghayfan"
        />
      </motion.div>

      {/*
        --- Career: an icon timeline, closing the section --------------------

        MOVED TO THE END, 2026-08-01 — it used to sit directly after the intro block; it
        now closes the section, below both scrolling strips, per the corrected order.
      */}
      <motion.div className={styles.career} {...revealAt(3)}>
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
    </section>
  )
}

export default Founder
