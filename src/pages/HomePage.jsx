import { useState } from 'react'

import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import About from '../components/About/About'
import Founder from '../components/Founder/Founder'
import styles from './HomePage.module.css'

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

  return (
    <>
      <Header />
      <main>
        <Hero sampledBelow={storyGlassVisible} />
        <About onGlassVisibilityChange={setStoryGlassVisible} />

        {/*
          A sibling of About rather than a child of it. It used to be rendered from inside
          About, pinned across that section's scroll-zoom stage and faded in over the
          finished transition; with the zoom gone it is simply the next section on the
          page and belongs here with the others.
        */}
        <Founder />

        {/*
          Placeholder for the section after the founder.

          aria-hidden while there is nothing in it: an empty landmark announces itself for
          no reason. Drop that along with the placeholder class when real content arrives.
        */}
        <section
          className={styles.placeholder}
          id="next-section"
          aria-hidden="true"
        />
      </main>
    </>
  )
}

export default HomePage
