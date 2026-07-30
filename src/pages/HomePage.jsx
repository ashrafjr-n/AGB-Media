import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import About from '../components/About/About'
import styles from './HomePage.module.css'

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />

        {/*
          Placeholder for the section after the founder. It is what the founder and its
          frozen backdrop scroll away to reveal, so it is load-bearing for that handoff
          even while it is empty — without something below the stage there is nowhere for
          the pinned surfaces to release into.

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
