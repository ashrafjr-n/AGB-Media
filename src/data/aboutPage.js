/*
  The /about page's copy, as data — full redesign, 2026-08-02.

  IT LIVES HERE RATHER THAN IN THE COMPONENT, for the reason it always has: this is
  many hundreds of words of running prose across a masthead and five sections, and
  inlining it would bury the layout under a wall of text nobody editing the grid ever
  wants to scroll past. CLAUDE.md §4 names src/data/ as the place for exactly this.

  EVERY PARAGRAPH BELOW IS VERBATIM from the brief that commissioned this redesign —
  transcribed directly, not reworded and not merged with the previous version of this
  page's copy (which was a different translation of similar themes and would have been
  an easy, silent way to corrupt this). Nothing here is abridged, and the only editorial
  liberty taken anywhere is each section's `stats` field and `networkGroups` below,
  which pull short, already-exact substrings out of `sections` to drive a stat callout
  and a chip list — never new wording, never a paraphrase standing in for the paragraph
  it is drawn from.

  TYPOGRAPHIC PUNCTUATION IS DELIBERATE: U+2019 for apostrophes, U+2014 for the dashes,
  U+2026 for the ellipsis, matching the brief's own text exactly. These are strings
  rather than markup, so an HTML entity would render as the characters that spell it.
*/

/*
  THE MASTHEAD'S PULL-QUOTE. Its own field, not folded into `sections`, because it
  belongs to the page's opening rather than to any one chapter — it sits beside the
  logo, above every numbered section, and is styled as a single oversized editorial
  statement rather than as a paragraph in a column.

  Structurally identical in form to Our Record's closing line below (both are a "we do
  not X … we do Y" statement) and NOT the same line — do not merge or swap them. This
  one opens the page; that one closes the fourth section, and they are worded
  differently on purpose by whoever wrote the brief.
*/
export const pullQuote =
  'We do not merely participate… We establish, we build, we plan, we train, and we leave a lasting positive impact that endures beyond us.'

/*
  THE FIVE SECTIONS, in the order the brief specifies: Who We Are, Vision, Mission, Our
  Record, Strategic Network.

  `id` is the DOM id of the section's own heading — used by `aria-labelledby` on the
  <section> so each is a named region, and as the reveal ladder's scope key (one scope
  per section; see useSectionReveal's own note on why a shared scope across siblings
  that fire at very different scroll depths would let the first latch the rest before
  they had ever been on screen).

  NO `numeral` AND NO `Icon` FIELD HERE — a two-digit index and a per-section
  react-icons glyph both existed in the first version of this redesign and both were
  removed the same day, on request, along with the markup and CSS that rendered them
  (see AboutPage.jsx). Nothing in this data model replaced them; a section's identity
  is `eyebrow` plus `title` alone now.

  `eyebrow` is a short kicker distinct from `title` — the site's usual micro-label
  device (About, WhyAgb and Founder each open with one of these), populated per
  section rather than with a repeated "AGB Media" the way those three are, since five
  sections sitting in one scroll need their own kickers to read as distinct rather than
  as one label copy-pasted five times. Invented UI chrome, not sourced prose — unlike
  `body`, it carries no obligation to be verbatim from anything.

  `body` is the section's paragraphs, verbatim and in the order given. Each section's
  LAYOUT is deliberately different in AboutPage.module.css — a rail-and-copy axis, a
  lead-plus-two-column split, a side-by-side diptych, a stat-led asymmetric grid, and a
  full-width column closed by a chip cloud — so the five read as a designed sequence
  rather than as one template repeated five times with the words swapped. Nothing about
  that layout variation lives here; this file is content only.
*/
export const sections = [
  {
    id: 'about-who',
    eyebrow: 'Company Profile',
    title: 'Who We Are',
    body: [
      'An arts and media production house based in Doha, driven by a long record of experience in theatre, drama, television and visual production. We begin with the idea and carry it through to the screen or the stage, working through teams assembled specifically for each project to secure the highest standards of quality and flexibility.',
      'Our real capital is the artistic career of our founder, the veteran Qatari artist Abdullah Ghayfan; the expertise of our Chief Executive Officer, writer and director Nael Al-Jarabah; and the professional network the two of them have built across Qatar, the Gulf and the wider Arab world.',
      'We offer the full spectrum of visual services: from cinema, television drama and theatre, to animation, visual effects and motion graphics, through production, execution and post-production, as well as professional training programmes. The divisions presented in this profile represent part of our capabilities rather than a complete account of the company; we work across everything related to visual content, according to what each project requires.',
    ],
  },
  {
    id: 'about-vision',
    eyebrow: 'Looking Forward',
    title: 'Vision',
    body: [
      'To stand at the forefront of Qatari and Gulf content creation, and to make Doha a global production platform that exports its own story instead of importing it.',
      'We aim to lead animation production in Qatar and the region, so that the minds of our children are not left to imported series and programmes that shape their sensibilities without us. Instead, we plant our values, customs, language and identity in them through original, imaginative work written and produced here, and watched everywhere.',
      'And to be among the pioneers of cinema and drama on the world stage — telling our story in its finest form and through its highest art, turning the Qatari and Gulf narrative into work that competes on screens, platforms and at festivals, and proving that we are capable of creating beauty worthy of us and worthy of the world.',
    ],
  },
  {
    id: 'about-mission',
    eyebrow: 'Our Purpose',
    title: 'Mission',
    body: [
      'To create purposeful, authentic visual content that begins with an idea and ends on the screen or the stage, at the highest standards of artistic quality and professionalism.',
      'We are committed to building a new generation of Qatari and Gulf writers, directors and technicians through production, training and partnership — and to keeping the content we make an extension of our values and identity, while remaining able to address a global audience in a refined artistic language equal to our ambition.',
    ],
  },
  {
    id: 'about-record',
    eyebrow: 'Since 1976',
    title: 'Our Record',
    body: [
      'Our true record lies not in what we own today, but in what we have achieved along the demanding road of art, across decades of practice and dedication.',
      'The journey began with the artist Abdullah Ghayfan in 1976, when he entered the world of art through its widest gate. It continues today through the expertise of our team, under an executive management led by writer and director Nael Al-Jarabah, who entered arts production in 1999.',
      'It has been a journey across countries and cities — one that has written a number of different success stories and left a clear mark everywhere we have set foot. We have founded channels that were a landmark in their time, trained technical teams that went on to become a mainstay of content production, and established animation projects that succeeded and kept on succeeding.',
    ],
    /*
      THE ONE CLOSING LINE ON THE PAGE THAT ISN'T THE MASTHEAD'S. A different statement
      from `pullQuote` above — same rhetorical shape ("we do not X … we do Y"), different
      wording, and it closes THIS section rather than opening the page. Kept as its own
      field rather than folded into the end of `body` because the layout treats it as a
      pulled statement (a short gold rule, larger type) rather than as a fourth
      paragraph — see `.closing` in the stylesheet.
    */
    closing:
      'We do not settle for taking part. We found, we build, we set the plans, we train — and we leave behind a good mark that outlasts us.',
    /*
      TWO DATES, PULLED OUT OF THE PARAGRAPH ABOVE AS A STAT CALLOUT — not new copy. Both
      `label` values are exact substrings of `body[1]` ("entered the world of art" /
      "entered arts production"), just capitalised as a caption; nothing here says
      anything the paragraph does not already say in the same words.
    */
    stats: [
      { year: '1976', label: 'Entered the world of art' },
      { year: '1999', label: 'Entered arts production' },
    ],
  },
  {
    id: 'about-network',
    eyebrow: 'Global Reach',
    title: 'Strategic Network',
    body: [
      'Over decades of work in theatre, drama, and media, a wide professional network of content creators and service providers has formed around AGB Media across Qatar, the Gulf, and the Arab world.',
      'This network enables us to assemble a complete team for a new project within days, and to access the studios, equipment, and specialized talent that each production requires.',
      'Our strategic relationships have been built over many years through long-standing partnerships and lasting trust. Today, this network extends across borders and continents. We maintain strong strategic relationships with Hollywood production companies in Los Angeles, as well as production companies in France, Sweden, Denmark, and Germany. We also have strategic partnerships in the Sultanate of Oman, Jordan, and Syria, in addition to production companies in India.',
      'These partnerships and professional relationships are leveraged to serve the best interests of the productions we undertake or execute.',
    ],
  },
]

/*
  THE CHIP CLOUD FOR STRATEGIC NETWORK — every place-name in that section's copy above,
  grouped the way the paragraphs themselves group them (Qatar/Gulf/Arab world as the
  home network; the rest as the international one) and pulled out for scanability, per
  the brief's own suggestion. Each `label` is the place name as written in the prose
  above; "Los Angeles · Hollywood" is the one composite, matching the source sentence
  ("Hollywood production companies in Los Angeles") rather than inventing a label the
  paragraph doesn't use.
*/
export const networkGroups = [
  {
    id: 'regional',
    title: 'Regional Presence',
    tags: ['Qatar', 'The Gulf', 'The Arab World'],
  },
  {
    id: 'international',
    title: 'International Partners',
    tags: [
      'Los Angeles · Hollywood',
      'France',
      'Sweden',
      'Denmark',
      'Germany',
      'Oman',
      'Jordan',
      'Syria',
      'India',
    ],
  },
]
