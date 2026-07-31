import { useState } from 'react'

import useScrollPosition, {
  isPastFirstViewport,
} from '../hooks/useScrollPosition'
import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import About from '../components/About/About'
import Founder from '../components/Founder/Founder'
import WhyAgb from '../components/WhyAgb/WhyAgb'

function HomePage() {
  /*
    WHO STILL NEEDS THE HERO'S FIXED BACKDROP — and this page is the right owner of
    that question, because it is the only thing that knows which sections exist.

    Hero's video backdrop is `position: fixed` and About's ground is frosted glass
    over it, so the footage is genuinely on screen well past the hero: About is the
    one section that samples it, and it does so from its first visible pixel to its
    last. Below that — Founder, the placeholder, anything added after them — every
    section paints an opaque ground of its own, and the backdrop is a full-viewport
    composited layer holding a 4K texture for something nobody can see. Hero drops it
    entirely when this is false; the argument in full is at the gate in Hero.jsx.

    Starts `true`, which is the safe direction: the cost of being wrong here is one
    extra frame of a layer that is about to be needed anyway, where starting false
    would flash About's glass flat black for a frame on a reload part-way down the
    page (browsers restore scroll before an IntersectionObserver can report).

    Adding a section below Founder needs nothing here. Adding another *translucent*
    one does — it has to report itself the same way About does, or it will show a
    backdrop that is no longer there.
  */
  const [storyGlassVisible, setStoryGlassVisible] = useState(true)

  /*
    WHEN THE FIXED SITE HEADER IS DUE — the Story section's own halfway mark, reported
    from that section because it is measured against that section's box.

    It is wired here for the same reason the flag above is: Header and About are
    siblings that know nothing of each other, and this page is the only thing that knows
    they are on the same screen. Header used to answer this itself, from a scroll
    threshold; the note on its `visible` prop has the before and after.

    Starts `false`, the opposite of the flag above, because the two are wrong in
    opposite directions: an unwanted frame of a hidden video layer costs nothing, and an
    unwanted frame of the site header would flash it over the hero.
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
    Story section begins one viewport down, so it reaches half-visible at half a
    viewport of scrolling — before this flag flips at one — and it stays half-visible
    well past that point. Whatever the section's real height, the two windows overlap
    and the header cannot flicker in the seam between them.

    THE ONE THING THIS DELIBERATELY DOES NOT DO is latch permanently. Scrolling back up
    into the hero hides the header again, and that is not the bug being fixed here: the
    hero carries its own in-flow header, the fixed pill would land on top of its logo
    and nav, and "the two headers are never on screen together" is the invariant the
    whole arrangement exists to keep (CLAUDE.md §4). Once past the hero the header is
    visible for the remainder of the page, in both directions, which is what was asked.
  */
  const heroBehind = useScrollPosition(isPastFirstViewport)

  return (
    <>
      <Header visible={storyHalfVisible || heroBehind} />
      <main>
        <Hero sampledBelow={storyGlassVisible} />
        <About
          onGlassVisibilityChange={setStoryGlassVisible}
          onHalfVisibleChange={setStoryHalfVisible}
        />

        {/*
          A sibling of About rather than a child of it. It used to be rendered from inside
          About, pinned across that section's scroll-zoom stage and faded in over the
          finished transition; with the zoom gone it is simply the next section on the
          page and belongs here with the others.
        */}
        <Founder />

        {/*
          The closing section, in the slot the empty `.placeholder` used to hold — the
          one that existed so the Founder had somewhere to scroll away to. It has real
          content now, so the placeholder and its stylesheet are gone; WhyAgb carries the
          `position: relative` + --z-base that slot has always needed.
        */}
        <WhyAgb />
      </main>
    </>
  )
}

export default HomePage
