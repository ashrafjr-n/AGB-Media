/*
  The /services page's copy, as data — matching the convention data/aboutPage.js and
  data/naelPage.js established: copy lives here rather than inline in the component
  because this page now runs a masthead, an 11-item grid, a four-unit "Specialised
  Units" section and a long-form featured essay, and burying that much text inside the
  layout would make ServicesPage.jsx unreadable for anyone editing the grid rather than
  the words.

  EVERY FIELD BELOW IS VERBATIM from the brief that commissioned this update —
  transcribed directly, not reworded, not reordered. Straight apostrophes throughout,
  matching the brief's own punctuation; U+2014 (—) for phrase-separating dashes and
  U+2013 (–) for the one numeral range ("2010–2015"), the same typographic convention
  data/naelPage.js documents for the same reason.
*/

export const pageTitle = 'Our Services'

export const pageIntro =
  'We cover the full spectrum of visual production — from cinema to drama, and from concept development to final delivery. The following are some of our key services, not an exhaustive list.'

/*
  THE MAIN GRID — 11 services now, down from the previous 12 (Consultancy is gone,
  Line Production and Post Production are renamed and re-worded per the brief). The
  grid itself needs no structural change for the count: ServicesPage.module.css's
  three-column breakpoint reflows 11 items into rows of 3/3/3/2 on its own, which reads
  as a clean, deliberately asymmetric close rather than a gap needing a filler card.
*/
export const services = [
  {
    title: 'Content Development',
    description:
      'Building ideas and transforming them into executable projects.',
  },
  {
    title: 'Creative Development',
    description:
      'Dramatic treatment, character building, and visual identity for the work.',
  },
  {
    title: 'Scriptwriting',
    description: 'Scripts and dialogue for television, cinema, and theatre.',
  },
  {
    title: 'Executive Production',
    description: 'Budgeting, scheduling, contracting, and daily follow-up.',
  },
  {
    title: 'Television Production',
    description: 'Series, programmes, and Ramadan seasonal works.',
  },
  {
    title: 'Film Production',
    description: 'Feature films, short films, and documentaries.',
  },
  {
    title: 'Production Management',
    description: 'Organising resources, locations, teams, and schedules.',
  },
  {
    title: 'On-Location Production',
    description: 'Executing shoots on the ground inside Qatar and abroad.',
  },
  {
    title: 'Post-Production',
    description: 'Editing, colour correction, and final delivery.',
  },
  {
    title: 'Music & Sound',
    description: 'Music composition, mixing, sound design, and dubbing.',
  },
  {
    title: 'Motion Graphics & Visual Effects',
    description: 'Animated graphics, visual effects, and compositing.',
  },
]

/*
  SPECIALISED UNITS — a new section below the grid. Four units, each a heading plus a
  flat bullet list, in the brief's own order. `items` stays a plain array of strings —
  the same shape data/naelPage.js's list-form categories use — because every bullet
  here is one capability, not a title needing its own sub-fields.
*/

export const specialisedUnitsIntro =
  'In addition to full production services, AGB Media operates specialised units that can be engaged individually or as part of an integrated project. These represent some of our capabilities, not a complete list of the company\'s divisions.'

export const specialisedUnits = [
  {
    name: 'Animation Studio',
    items: [
      '2D and 3D animated series and films',
      'Character and visual world design',
      'Storyboard and Animatic',
      'Educational and awareness content for children and families',
      'Training local talent in animation production',
    ],
  },
  {
    name: 'Post Production & VFX',
    items: [
      'Drama and programme editing',
      'Colour Grading',
      'Visual effects, compositing, and motion graphics',
      'Sound design, mixing, and original scores',
      'Translation, encoding, and delivery to broadcast standards',
    ],
  },
  {
    name: 'AI Production',
    items: [
      'Early visual concepts: Concept Art and Previsualization',
      'Generating supporting shots and scenes for production',
      'Restoring and enhancing archival and older materials',
      'Fast, cost-effective advertising and digital content',
      'AI-generated media and awareness campaigns',
    ],
  },
  {
    name: 'Writing & Theatre Academy',
    items: [
      'Scriptwriting for television and cinema',
      'Playwriting and dramatic text development',
      'Customised programmes for institutions, cultural bodies, and schools',
    ],
  },
]

/*
  THE ANIMATION FEATURE — a long-form essay closing the page, given more visual weight
  than anything above it (see .animation in ServicesPage.module.css). `animationBody`
  is an array of paragraphs rather than one joined string, the same construction
  data/founderPage.js's `bio` uses, so ServicesPage.jsx can render each as its own <p>
  in the site's usual paragraph rhythm.

  THE ATTRIBUTION SPELLS THE NAME "Al-Jarabaa" — data/naelPage.js's own spelling, which
  that file documents as the source of record over Team.jsx's differently-spelled
  "Al-Jarabah". This byline follows the source of record for the same reason.
*/

export const animationEyebrow = 'Featured'

export const animationTitle = 'Animation'

export const animationByline = 'Written by CEO Nael Al-Jarabaa'

export const animationBody = [
  'Our experience in the field of animation dates back to 1999 with the Salah al-Din al-Ayyubi animated project produced by Reman Continuous Development Company. This was followed by the film Al-La\'na (The Curse), produced by Nared Animation in 2002, during which we trained 21 animators — many of whom have since become leading figures in Arab animation production.',
  'We participated in the production of the animated series Abu Mahjoub for Jordanian Television, as well as the cartoon Farkash, produced by Nared Animation Company. We also contributed to awareness campaigns for the Sihi program under the Jordanian Ministry of Health.',
  'We played a major role in founding the first specialized children\'s channel broadcasting in the Kurdish language, and in producing its content (Belestank Children\'s Channel) for more than 2,000 television hours — covering writing, directing, supervision, and animation execution.',
  'As one of the founders of Waar TV, one of the largest satellite channels in Iraqi Kurdistan, particularly within its graphics and children\'s departments, we established the first children\'s programming block that produced all of its content in-house, with teams trained by us. This amounted to more than 3,500 television hours over five years (2010–2015), including live programs, recorded programs, and animation (with no less than half of the content being animated). During that period, the children\'s slot ranked among the most watched and received widespread popularity and acclaim across all levels.',
  'In the Sultanate of Oman, we authored, executed, and directed the program Studio Ulfa, produced by the Omani Ministry of Information and the Ain platform. It is an educational and pedagogical 2D animated series.',
  'We have also executed media and awareness campaigns for the Omani Ministry of Interior, the Ministry of Culture, the Ministry of Health, and the Ministry of Labor. The continued trust of these institutions has established us as their preferred partner for artistic and creative productions.',
]
