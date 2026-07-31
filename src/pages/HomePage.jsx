import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import About from '../components/About/About'
import Founder from '../components/Founder/Founder'
import styles from './HomePage.module.css'

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />

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
