import { Link } from 'react-router-dom'

import navLinks from '../../data/navLinks'
import styles from './Footer.module.css'

/*
  The page's last element — one compact bar: the rights line on the inline start, a row of
  small links on the inline end.

  IT RENDERS INSIDE THE TEAM SECTION, as that section's final flex child, so it shares
  Team's screen and needs no scroll of its own to reach. It was a page-level element after
  <main> and moved deliberately; the placement note and its two consequences — the pane
  now has footage to sample, and this is no longer a `contentinfo` landmark — are at the
  call site in Team.jsx. It stays a component of its own rather than being inlined there,
  so moving it back out is one line in each of two files.

  THE RIGHT-HAND SIDE IS A PLACEHOLDER, and it is structured to be replaced rather than
  rewritten. `footerLinks` below is the swap point.
*/

/*
  THE LINKS, AND WHY THEY ARE THE NAV'S OWN DESTINATIONS RATHER THAN INVENTED ONES.

  The brief allowed social links or the wordmark here and left the choice open. Socials
  would mean writing four URLs the site does not have — placeholder hrefs that look real,
  which is the one kind of placeholder worth avoiding, since a dead link that looks live
  is worse than an obvious gap. The portrait logo mark is the other option and is the
  wrong shape for a bar this short: it is 360x672, so anything sizing it has to drive
  `block-size` (CLAUDE.md §1), and a tall mark in a compact footer either shrinks to
  illegibility or sets the bar's height for it.

  So the row is the site's own routes, read from src/data/navLinks.js — the same single
  source of truth both headers render from, and now this. No invented destinations, and
  every entry already goes exactly where the header sends you.

  TO SWAP IT LATER: replace this one array. An entry is `{ label, to }` for an in-app
  route and `{ label, href }` for anything external — the render below already branches on
  which of the two is present, so socials drop in without touching the markup. `Contact`
  is filtered out because it sits directly above this as a filled button in the Team
  section, and repeating it twelve pixels lower would read as an accident.

  The `featured` flag rides along on the nav data and is deliberately ignored here, the
  same way the fixed site header ignores it: a filled button in a bar this size would
  fight it, and the section above already carries that call to action.
*/
const footerLinks = navLinks.filter((link) => !link.featured)

/*
  The rights line, as a constant rather than inline in the markup, so the year is one
  edit and sits beside the links it is balanced against.

  The © is a literal U+00A9 in the string rather than the `&copy;` entity, because this is
  a JS string and not markup — an entity here would render as the six characters that spell
  it. There is no non-breaking space after it: the glyph and the phrase are one run of
  uppercase micro-type on a single line, and the flex row wraps as a whole rather than
  breaking inside this string.

  The year is fixed rather than computed from `new Date()`, and that is deliberate: a
  copyright line is a claim about a document, not a clock, and a computed year silently
  rewrites that claim on every visit — including on an archived or cached copy of the
  page, where it would then disagree with itself.
*/
const RIGHTS = '\u00A9 All Rights Reserved 2026'

function Footer() {
  return (
    <footer className={styles.footer}>
      {/*
        The pane, and it is the same `.pane` the Founder and WhyAgb take rather than the
        Team section's lighter one — this bar stacks over that section's pane, so two
        copies of the same value would composite past About's video treatment. See .glass
        in the stylesheet.
      */}
      <div className={styles.glass} aria-hidden="true" />

      <div className={styles.inner}>
        {/*
          A <p>, not a <small>. `small` is styled site-wide at --font-weight-light for
          captions and fine print (global.css), and this line is neither — it is the
          footer's own copy, set at the same meta-label register as the rest of the bar.
        */}
        <p className={styles.rights}>{RIGHTS}</p>

        <nav className={styles.links} aria-label="Footer">
          {footerLinks.map(({ label, to, href }) =>
            /*
              Two shapes, one row. `to` is an in-app route and goes through React Router;
              `href` is anything off-site and gets a plain anchor with the usual
              rel/target pair. Nothing in the list uses `href` today — it is here so the
              swap described above is a data edit rather than a markup one.
            */
            href ? (
              <a
                key={label}
                className={styles.link}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {label}
              </a>
            ) : (
              <Link key={label} className={styles.link} to={to}>
                {label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  )
}

export default Footer
