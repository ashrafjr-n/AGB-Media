/*
  The /about page's copy, as data.

  IT LIVES HERE RATHER THAN IN THE COMPONENT, which is the opposite of what every home
  page section does — About.jsx, WhyAgb.jsx and Founder.jsx all keep their copy local.
  That convention holds because those sections carry a paragraph or six short lines each.
  This page is fourteen paragraphs of running prose, and inlining it would bury a hundred
  lines of layout under a wall of text that nobody editing the layout ever wants to read.
  CLAUDE.md §4 names src/data/ as the place for exactly this.

  TYPOGRAPHIC PUNCTUATION IS DELIBERATE: U+2019 for apostrophes, U+2014 for the dashes,
  U+2026 for the ellipsis. These are strings rather than markup, so an HTML entity would
  render as the characters that spell it — the same reason Footer.jsx writes its © as a
  literal. Nothing else about the wording is changed.
*/

/*
  The opening block, and it takes no heading of its own.

  The first paragraph is set apart from the other two in the layout — larger, brighter,
  its own measure — so the page opens on a statement rather than on a block of body copy.
  That is a typographic decision made in AboutPage.module.css, not an editorial one: the
  three run in the order they were written and none of them is abridged.
*/
export const intro = [
  'AGB Media is an arts and media production house based in Doha, guided by a long and distinguished track record of experience in theatre, drama, television, and visual production. We take every idea from concept to screen or stage through teams carefully assembled for each individual project, ensuring the highest standards of quality and flexibility.',
  'Our true capital lies in the artistic career of our founder, the veteran Qatari artist Abdullah Ghayfan, the expertise of our CEO, writer and director Nael Al-Jarabaa, and the extensive professional network both have cultivated across Qatar, the Gulf region, and the wider Arab world.',
  'We provide a comprehensive spectrum of visual services — from cinema, television drama, and theatre to animation, visual effects, and motion graphics, as well as full production, execution, post-production, and professional training programmes. The departments listed in this profile represent only a selection of our capabilities and are not an exhaustive description of the company’s structure. We deliver every aspect of visual content according to the specific requirements of each project.',
]

/*
  The three chapters, in order.

  `id` is the DOM id of the chapter's own <h2>, used twice: by `aria-labelledby` on the
  chapter's <section>, so each is a named region rather than an anonymous block, and as
  the reveal ladder's scope key (see useSectionReveal — one scope per ladder, and each
  chapter runs its own).

  `marker` is a Roman numeral rather than the 01/02/03 the home page's WhyAgb grid uses,
  and the difference is the point: this page shares the site's devices without copying a
  section outright. Three chapters read as chapters; six reasons read as an enumerated
  list. Each is drawn as text and marked aria-hidden, since the heading beside it already
  says what the block is.

  `closing` is the one chapter that has one — the last two paragraphs of Our Capital are
  a two-line sign-off rather than more body copy, and the layout sets them as such. It is
  a separate field rather than the last two entries of `body` because the split is
  editorial: the copy was written with that turn in it, and the layout only honours it.
*/
export const chapters = [
  {
    id: 'about-vision',
    marker: 'I',
    title: 'Vision',
    body: [
      'To stand at the forefront of Qatari and Gulf content creators, and to transform Doha into a global production hub that exports its own stories rather than importing them.',
      'We aspire to lead animation production in Qatar and the region — so that the minds of our children are no longer shaped by imported series and programmes foreign to our values. Instead, we will plant within them our principles, traditions, language, and identity through original, creative works written and produced here, and watched far beyond our borders.',
      'We also aim to rank among the pioneers of world cinema and drama, telling our story in its finest form and most refined artistic expression. We will turn the Qatari and Gulf narrative into works that compete on screens, platforms, and festivals — proving that we are capable of creating beauty worthy of us and worthy of the world.',
    ],
  },
  {
    id: 'about-mission',
    marker: 'II',
    title: 'Mission',
    body: [
      'To create purposeful and authentic visual content that begins with an idea and reaches the screen or stage at the highest standards of artistic and professional excellence.',
      'We are committed to nurturing a new generation of Qatari and Gulf writers, directors, and technicians through production, training, and strategic partnerships. We ensure that every piece of content we deliver remains an extension of our values and identity, while speaking to global audiences in an elevated artistic language that matches our ambition.',
    ],
  },
  {
    id: 'about-capital',
    marker: 'III',
    title: 'Our Capital',
    body: [
      'Our true capital is not what we possess today, but what we have accomplished along the demanding path of art through decades of experience and dedication.',
      'The journey began with the artist Abdullah Ghayfan in 1976, when he entered the world of art through its widest gates. It continues today through the expertise of our teams, under an executive leadership headed by the writer and director Nael Al-Jarabaa, who has been part of the artistic production field since 1999.',
      'It has been a journey across countries and cities, writing diverse stories of success and leaving a clear mark wherever we went. We established channels that became a qualitative landmark in their time, trained artistic cadres who became pillars of the content industry, and founded animation projects that succeeded and continued to succeed.',
    ],
    closing: [
      'We do not merely participate…',
      'We establish, we build, we plan, we train, and we leave a lasting positive impact that endures beyond us.',
    ],
  },
]
