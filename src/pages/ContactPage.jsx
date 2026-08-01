import { useEffect, useRef, useState } from 'react'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { HiOutlineMail } from 'react-icons/hi'

import Header from '../components/Header/Header'
import buttonStyles from '../components/shared/Button.module.css'
import styles from './ContactPage.module.css'

/*
  THE /contact PAGE — the site's fourth route, and it shares /about's and /services'
  ground (deep warm brown, lit and vignetted) rather than the home page's
  --color-black. See the note at `.atmosphere` in the stylesheet for why that CSS is a
  duplicate rather than a shared import.

  UNLIKE THOSE TWO, THE PAGE IS NOT A SCROLLING COLUMN — it is one card, centred in the
  viewport on both axes, and the card is the whole page. There is no masthead above it
  and no reveal ladder: the card is the first and only thing on screen, so there is
  nothing for a scroll-triggered entrance to trigger on.

  Social hrefs are placeholders (`#`) by design — see `socialLinks` below — and the
  form has no backend: submitting it validates natively (`required` + `type="email"`)
  and swaps in a confirmation message, nothing is sent anywhere.
*/

/*
  Structured the way navLinks.js structures the nav, so filling in a real profile URL
  later is editing one field rather than touching markup. Email is deliberately last,
  matching the brief's own order, and points at the general inbox — the three specific
  addresses are listed in full just below the row rather than hidden behind the icon.
*/
const socialLinks = [
  { id: 'facebook', label: 'Facebook', href: '#', Icon: FaFacebookF },
  { id: 'instagram', label: 'Instagram', href: '#', Icon: FaInstagram },
  { id: 'whatsapp', label: 'WhatsApp', href: '#', Icon: FaWhatsapp },
  { id: 'youtube', label: 'YouTube', href: '#', Icon: FaYoutube },
  {
    id: 'email',
    label: 'Email',
    href: 'mailto:contact@agb-media.net',
    Icon: HiOutlineMail,
  },
]

const emails = [
  { label: 'CEO', address: 'ceo@agb-media.net' },
  { label: 'General Contact', address: 'contact@agb-media.net' },
  { label: 'Info', address: 'info@agb-media.net' },
]

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

  return (
    <>
      <Header visible />

      <main className={`${styles.page} noise-overlay`}>
        {/*
          Identical construction to About's and Services' `.atmosphere` — see either
          stylesheet for why it is fixed, unfiltered and unblended. Duplicated rather
          than imported, per the note at the top of ContactPage.module.css.
        */}
        <div className={styles.atmosphere} aria-hidden="true" />

        <div className={styles.inner}>
          <div className={styles.card}>
            {/* --- Left column: identity ------------------------------------ */}
            <div className={styles.identity}>
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

              <ul className={styles['email-list']}>
                {emails.map(({ label, address }) => (
                  <li className={styles['email-row']} key={address}>
                    <span className={styles['email-label']}>{label}</span>
                    <a
                      className={styles['email-address']}
                      href={`mailto:${address}`}
                    >
                      {address}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- Right column: the form ------------------------------------ */}
            <div className={styles.form}>
              <p className={styles.eyebrow}>Get In Touch</p>
              <h1 className={styles['form-title']}>Contact Us Now</h1>

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
                    rows={5}
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
        </div>
      </main>
    </>
  )
}

export default ContactPage
