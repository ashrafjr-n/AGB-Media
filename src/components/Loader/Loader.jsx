import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import useFirstVisitLoader, {
  LOADER_MAX_MS,
} from '../../hooks/useFirstVisitLoader'
import styles from './Loader.module.css'

/*
  THE FIRST-VISIT LOADER — a full-screen overlay shown once per browser session, over the
  first paint, and never again until a new session starts.

  ALL OF THE TIMING IS IN hooks/useFirstVisitLoader.js. This file is the surface: what it
  looks like, and how it leaves. Read that hook before changing when it hides; read this
  one before changing what it shows.

  IT IS RENDERED FIRST, ABOVE THE ROUTER (App.jsx), and both halves of that matter. Above,
  because it must not be a child of any page — a route change would then unmount it, and
  the route transition would animate it. First, because it has to exist in the same commit
  as the page underneath rather than a frame later, which is what keeps a returning
  visitor from seeing a flash of it and a first visitor from seeing a flash of the hero.

  It costs nothing after that one session: `visible` is false from the very first render on
  every subsequent load, so nothing below mounts at all.

  NO LAYOUT SHIFT IS POSSIBLE FROM IT. The overlay is `position: fixed` and out of flow, it
  reserves no space, and it neither locks scroll nor touches the document's height — so the
  page beneath it lays out exactly as it would have without it, and revealing it is a pure
  opacity change with nothing to reflow.
*/

/*
  The logo, by literal public/ path — the same reference Header, HeroHeader and About use.
  It is a PORTRAIT mark (360x672), so the stylesheet drives `block-size` and leaves
  `inline-size: auto`; width has to derive from the capped height, never the reverse.
*/
const LOGO = '/assets/images/agb-logo.png'

function Loader() {
  const { visible, phase } = useFirstVisitLoader()
  const reduceMotion = useReducedMotion()

  return (
    /*
      AnimatePresence, because the whole point is that the overlay outlives the state that
      says to hide it — it has to fade before it unmounts. `initial` is not disabled here
      (unlike the route transition's): the loader is meant to be there on the first frame,
      and `initial={{ opacity: 1 }}` below states that rather than leaving it implicit.
    */
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          /*
            `.noise-overlay` is a GLOBAL utility from global.css, so it is a literal string
            and never `styles['noise-overlay']`. It is what gives this surface /about's
            film-stock grain — the module redeclares --noise-opacity to that page's 0.07.
          */
          className={`${styles.loader} noise-overlay`}
          /*
            The one value that has to exist in both JS and CSS — the bar's travel time is
            the loader's own maximum. Passing it as a custom property keeps a single source
            of truth in the hook instead of a duration written out twice.
          */
          style={{ '--loader-max': `${LOADER_MAX_MS}ms` }}
          role="status"
          aria-live="polite"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          /*
            A slow, flat-tailed fade rather than a cut — this is a curtain lifting off the
            hero, and the footage behind it is already playing. Reduced motion takes the
            same exit at zero duration, which is an instant reveal with no movement.
          */
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <img
            className={styles.logo}
            src={LOGO}
            /*
              Empty on purpose: the visually hidden status text below is what a screen
              reader should hear here. Announcing the company's mark as well would read the
              same moment out twice, and the mark is decorative in this context.
            */
            alt=""
            width="360"
            height="672"
            decoding="async"
          />

          <div className={styles.track}>
            <div className={styles.fill} data-phase={phase} />
          </div>

          <span className="sr-only">Loading AGB Media</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Loader
