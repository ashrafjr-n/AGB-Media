import { useEffect, useRef, useState } from 'react'
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa6'
import { HiOutlineDownload, HiOutlineMail } from 'react-icons/hi'

import Seo from '../components/shared/Seo'
import buttonStyles from '../components/shared/Button.module.css'
import { SITE_URL, buildBreadcrumb } from '../data/siteMeta'
import backdrop from '../assets/images/contact.webp'
import styles from './ContactPage.module.css'

/*
  THE /contact PAGE — the site's fourth route.

  THE GROUND IS A PHOTOGRAPH under the site's standard section glass — the same
  `.pane` Founder and WhyAgb compose from shared/SectionGlass.module.css, fixed to
  the viewport the way Services' ground is (see the note on `.backdrop` in the
  stylesheet). It used to be the /about page's painted brown ground; that
  construction is gone from this file entirely.

  THE PAGE IS NOT A SCROLLING COLUMN — it is one card, centred in the viewport on
  both axes, and on desktop the section holding it is exactly one screen tall (see
  `.page` in the stylesheet for the Founder/WhyAgb technique this borrows). There is
  no masthead above the card and no reveal ladder: the card is the first and only
  thing on screen, so there is nothing for a scroll-triggered entrance to trigger on.

  Social hrefs are placeholders (`#`) by design — see `socialLinks` below — and the
  form has no backend: submitting it validates natively (`required` + `type="email"`)
  and swaps in a confirmation message, nothing is sent anywhere.
*/

/*
  Structured the way navLinks.js structures the nav, so filling in a real profile URL
  later is editing one field rather than touching markup. Email is deliberately last,
  matching the brief's own order, and points at the one address the page lists in
  full just below the row.
*/
/*
  `label` IS THE ICON'S ONLY ACCESSIBLE NAME — each link renders nothing but the
  glyph (`aria-hidden`, see the map below), so this string is what a screen
  reader announces, not decoration. It reads as a full sentence fragment
  ("Visit our Facebook page") rather than the bare platform name, per an
  accessibility pass: a bare "Facebook" announces the destination but not the
  action, where sighted users get both from the icon plus its position in a
  "find us on social media" row.
*/
const socialLinks = [
  {
    id: 'facebook',
    label: 'Visit our Facebook page',
    href: '#',
    Icon: FaFacebookF,
  },
  {
    id: 'instagram',
    label: 'Visit our Instagram page',
    href: '#',
    Icon: FaInstagram,
  },
  {
    id: 'youtube',
    label: 'Visit our YouTube channel',
    href: '#',
    Icon: FaYoutube,
  },
  {
    id: 'email',
    label: 'Email AGB Media',
    href: 'mailto:ceo@agb-media.net',
    Icon: HiOutlineMail,
  },
]

const CONTACT_EMAIL = 'ceo@agb-media.net'

function ContactPage() {
  const formRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  /*
    Native validation does the "required fields, valid email format" work — `required`
    and `type="email"` on the fields below trigger the browser's own check (and its own
    inline messaging) before this ever runs, since the form is not `noValidate`. There
    is nowhere to send the data yet, so a submit that passes validation only flips a
    confirmation on and resets the fields.
  */
  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    formRef.current?.reset()
  }

  const breadcrumbSchema = buildBreadcrumb('Contact', '/contact')

  return (
    <>
      <Seo
        title="Contact AGB Media | Doha, Qatar"
        description="Get in touch with AGB Media in Doha, Qatar. Reach out to discuss film, television, theatre, or animation productions across Qatar and the wider Gulf region."
        path="/contact"
        image={`${SITE_URL}/assets/og/og-contact.jpg`}
        structuredData={[breadcrumbSchema]}
      />

      {/*
        No local `<Header>` here — App.jsx (AnimatedRoutes) mounts one instance above every
        route, defaulted to visible on every route but the home page and the 404 wildcard.
      */}

      <main className={`${styles.page} noise-overlay`}>
        {/*
          THE GROUND, and it must stay FIRST — it and the pane below it are both at
          z-index 0, so document order is the only thing putting the photo behind the
          glass. `alt=""` marks it decorative, matching Founder's and WhyAgb's grounds.
        */}
        <img
          className={styles.backdrop}
          src={backdrop}
          alt=""
          loading="eager"
          decoding="async"
        />

        {/* The shared section pane — see the note at the top of this file. */}
        <div className={styles.glass} aria-hidden="true" />

        <div className={styles.inner}>
          <div className={styles.card}>
            {/*
              --- Left half: identity ---------------------------------------
              One vertically centred, horizontally centred stack: heading, then the
              mark, then the social row. Nothing in it grows to fill its half — the
              half is sized generously and the stack sits centred inside it, which is
              what stops the extra room reading as dead space rather than as air.
            */}
            <div className={styles.identity}>
              <h1 className={styles['identity-title']}>Contact Us</h1>

              <img
                className={styles.logo}
                src="/assets/images/agb-logo.png"
                alt="AGB Media"
              />

              <ul className={styles['social-list']}>
                {socialLinks.map(({ id, label, href, Icon }) => (
                  <li key={id}>
                    <a
                      className={styles['social-link']}
                      href={href}
                      aria-label={label}
                      /*
                        Placeholders open in place rather than a new tab — a `#` href
                        has nowhere else to go yet, and a real profile URL dropped in
                        later should decide its own `target` rather than inherit one.
                      */
                    >
                      <Icon aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/*
              THE COLUMN DIVIDER — a real grid track rather than a percentage-positioned
              pseudo-element, because the two halves are deliberately not identical in
              width (see the grid-template-columns in the stylesheet). WhyAgb's grid
              divider can afford to sit at a literal 50% because its two columns are
              equal; these are not, so the line has to be an actual middle track for its
              position to follow the halves rather than assume them.
            */}
            <div className={styles.divider} aria-hidden="true" />

            {/* --- Right half: the form -------------------------------------- */}
            <div className={styles.form}>
              {/*
                THE EMAIL, FIRST AND LEFT-ALIGNED — it shares the inline start of every
                field label below it, so the address and the form read as one left rail
                rather than as a centred header sitting on top of a left-aligned form.
              */}
              <div className={styles['contact-email']}>
                <p className={styles.eyebrow}>Get In Touch</p>
                <a
                  className={styles['email-address']}
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>

              <form
                ref={formRef}
                className={styles['form-body']}
                onSubmit={handleSubmit}
              >
                <div className={styles.field}>
                  <label className={styles['field-label']} htmlFor="contact-name">
                    Name *
                  </label>
                  <input
                    className={styles['field-control']}
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles['field-label']} htmlFor="contact-email">
                    Email *
                  </label>
                  <input
                    className={styles['field-control']}
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles['field-label']} htmlFor="contact-message">
                    Message *
                  </label>
                  <textarea
                    className={`${styles['field-control']} ${styles['field-textarea']}`}
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`${buttonStyles.button} ${buttonStyles['button-glass']} ${styles.submit}`}
                >
                  {submitted ? 'Sent' : 'Send Message'}
                </button>

                {/*
                  `role="status"` + `aria-live="polite"`, not a visual-only swap: a
                  screen-reader user submitting the form gets no other signal that
                  anything happened, since focus stays on the button.
                */}
                {submitted && (
                  <p className={styles.confirmation} role="status" aria-live="polite">
                    Thanks — your message has been sent. We&rsquo;ll be in touch
                    shortly.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/*
            THE PROFILE DOWNLOAD — its own local style in the stylesheet, not a call
            site of Button.module.css and not styled to match either of that file's
            variants or the Services cards' border-reveal: a hairline pill with no
            fill at rest, gold rather than glass, and (per the brief) no box-shadow in
            any state. It reads as a document action rather than a call to action,
            which is the distinction that earns it a different family.
          */}
          <a
            className={styles['profile-download']}
            href="/files/agb-media.pdf"
            download="AGB-Media-Profile.pdf"
          >
            <HiOutlineDownload aria-hidden="true" />
            Download Company Profile
          </a>
        </div>
      </main>
    </>
  )
}

export default ContactPage
