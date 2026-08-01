import { useState } from 'react'

import useScrollPosition, {
  isPastFirstViewport,
} from '../hooks/useScrollPosition'
import Header from '../components/Header/Header'
import HeroBackdrop from '../components/Hero/HeroBackdrop'
import Hero from '../components/Hero/Hero'
import About from '../components/About/About'
import Founder from '../components/Founder/Founder'
import WhyAgb from '../components/WhyAgb/WhyAgb'
import Team from '../components/Team/Team'
import styles from './HomePage.module.css'

function HomePage() {
  /*
    WHEN THE FIXED SITE HEADER IS DUE — the Story section's own halfway mark, reported
    from that section because it is measured against that section's box.

    It is wired here because Header and About are siblings that know nothing of each
    other, and this page is the only thing that knows they are on the same screen. Header
    used to answer this itself, from a scroll threshold; the note on its `visible` prop
    has the before and after.

    Starts `false`: an unwanted frame of the site header would flash it over the hero,
    where a late arrival costs nothing.
  */
  const [storyHalfVisible, setStoryHalfVisible] = useState(false)

  /*
    THE SECOND HALF OF THE HEADER'S ANSWER, and the fix for it vanishing again at the
    Founder.

    `storyHalfVisible` is an intersection, which is a WINDOW and not a threshold: it is
    true while at least half of the Story section is on screen, so it turns true on the
    way in — and false again the moment that section has scrolled away, which is exactly
    where the Founder begins. On its own it hides the header for the whole rest of the
    page.

    Or-ing it with "the hero is behind us" turns the pair into a threshold. The union is
    continuous rather than merely adjacent, and that is worth being explicit about: the
    Story section begins one viewport down, so it reaches half-visible at half a viewport
    of scrolling — before this flag flips at one — and it stays half-visible well past
    that point. Whatever the section's real height, the two windows overlap and the header
    cannot flicker in the seam between them.

    THE ONE THING THIS DELIBERATELY DOES NOT DO is latch permanently. Scrolling back up
    into the hero hides the header again: the hero carries its own in-flow header, the
    fixed pill would land on top of its logo and nav, and "the two headers are never on
    screen together" is the invariant the whole arrangement exists to keep (CLAUDE.md §4).

    Note this is a *scroll* threshold and always was — it has nothing to do with how the
    footage behind the hero is pinned, so it is untouched by that becoming sticky.
  */
  const heroBehind = useScrollPosition(isPastFirstViewport)

  return (
    <>
      <Header visible={storyHalfVisible || heroBehind} />
      <main>
        {/*
          THE STAGE: the hero, the Story section, and the footage behind both.

          This wrapper is not a layout device — it is the boundary. HeroBackdrop is a
          `position: sticky` layer, and a sticky box cannot be offset past its own
          containing block, so putting the two sections that need the footage inside one
          box is what makes "the video does not exist below the Story section" a fact of
          the layout instead of a scroll threshold. Everything that used to compute that
          threshold is gone: Hero's `sampledBelow` prop, the `storyGlassVisible` state
          that lived here, and About's `onGlassVisibilityChange` observer.

          ORDER MATTERS. The backdrop is first so that both sections, which are positioned
          at `z-index: auto`, paint over it in document order — the same relationship it
          had as a fixed child of the hero, and the one About's `backdrop-filter` depends
          on to find the footage underneath itself.

          The stylesheet is mostly a list of things this box must never be given; read it
          before adding a property here.
        */}
        <div className={styles.stage}>
          <HeroBackdrop />

          {/*
            The inner wrapper is not decoration: it carries the negative margin that gives
            back the screen of layout height the sticky backdrop claims. That margin cannot
            live on the backdrop, because a sticky box's own margins change how far it is
            allowed to travel — see the note in HomePage.module.css.
          */}
          <div className={styles['stage-content']}>
            <Hero />
            <About onHalfVisibleChange={setStoryHalfVisible} />
          </div>
        </div>

        {/*
          Outside the stage, and that is the whole guarantee. There is no scroll position
          at which the hero's footage can be painted here — not because a flag says so,
          but because the element that draws it is confined to a box that ends above this
          one. Their own opaque grounds at --z-base remain correct on their own terms and
          stay as they are.

          Team closes the page, and it brings back a `<video>` below the stage — the first
          since the Founder's ground became a still image. It needs nothing from this file:
          it registers its own claim with useExclusiveVideo and gates on its own box, so
          the page-wide "one video decodes at a time" rule holds without HomePage knowing
          there are two claimants.
        */}
        <Founder />
        <WhyAgb />
        {/*
          Team closes the page, and the footer is INSIDE it — see the note in Team.jsx.
          There is no page-level element after this one.
        */}
        <Team />
      </main>
    </>
  )
}

export default HomePage
