/*
  The /team/nael-al-jarabah page's copy, as data — matching the convention
  data/aboutPage.js established: copy lives here rather than inline in the component
  because this is a dense multi-section profile (a name plate, a biography, and five
  further categories of credits), and burying that much text inside the layout would
  make the JSX unreadable for anyone editing the grid rather than the words.

  EVERY FIELD BELOW IS VERBATIM from the brief that commissioned this page —
  transcribed directly, not reworded, not reordered, and not cross-checked against
  Team.jsx's own (differently spelled) "Nael Al-Jarabah" — this file uses the
  spelling the brief gives throughout, "Al-Jarabah", because that is what was
  supplied as the source of record for this page. The two spellings are a pre-existing
  inconsistency in the codebase (Team.jsx predates this page) and are not reconciled
  here; that is a separate edit if the site ever wants one spelling everywhere.

  TYPOGRAPHIC PUNCTUATION IS DELIBERATE: U+2014 (—) for phrase-separating dashes,
  U+2013 (–) for the one numeral range ("2010–2014"), and the exact apostrophes and
  parentheses as given. These are strings, not markup, so an HTML entity would render
  as the characters that spell it.

  THE ONLY STRUCTURING THIS FILE DOES BEYOND STORING STRINGS is splitting the single
  "Name — Title — Title" line the brief gave into `name` and `titles` at runtime (see
  `nameTitle` below) and grouping the list-form categories (Theatre, Cinema/Drama,
  Workshops) into arrays where the brief itself already presented them as bullet
  lists. Neither operation changes a word.
*/

/*
  THE NAME PLATE, AS ONE VERBATIM STRING. "Nael Al-Jarabah — Writer, Director &
  Executive Producer — CEO of AGB Media" is exactly the brief's own "Name & Title"
  line, split on ' — ' at render time in NaelPage.jsx rather than retyped as separate
  fields — a single source string is what guarantees the page can never drift from
  what was supplied, where three hand-typed fields could silently diverge from it one
  edit at a time.
*/
export const nameTitle =
  'Nael Al-Jarabah — Writer, Director & Executive Producer — CEO of AGB Media'

export const bio =
  'His experience in artistic production has extended since 1999. He combines dramatic and theatrical writing, television directing, and channel management — a blend that gives the company a production vision that begins with the text and ends at final delivery. His work spans Jordan, Iraq, Ukraine, Romania, the Sultanate of Oman, Qatar, the UAE, and Jordan.'

export const publications =
  'Among his publications is the book What If the Orange Were Deleted? — a study in theatrical and cinematic criticism and aesthetic schools (published by Awarq for Publishing and Distribution), as well as the poetry collections Buddhist Inscriptions on the Stele of the Last Nabataean, The Body and the Other, and Shawakhthrīm. Some of his works have been translated into several languages, including English, Romanian, and French. He has participated in numerous Arab and international cultural festivals, including the Jerash Festival for Culture and Arts, the Shabib Festival, the Al-Mirbad Festival, and the Odessa International Festival in Romania. His poems were selected for inclusion in an anthology of Arabic poetry featuring leading poets from the Arab world (100 Arabic poems), and were translated into five languages.'

export const channelFounding =
  "He is a co-founder of PlayStation (Bilistank) Satellite Channel in Iraqi Kurdistan and a co-founder of Waar Satellite Channel, where he served as Artistic Director, Head of the Children's Department, and a member of the Programming Committee."

/*
  THEATRE — an intro sentence, then six items exactly as listed in the brief and in
  the same order. Items 5 and 6 (jury chair, evaluation committee) are not "works" in
  the sense the first four are, but the brief lists all six as one flat bullet list
  under "Theatre (list)" with no sub-grouping — this file keeps that grouping exactly
  rather than inventing a Works/Honours split the brief did not draw.
*/
export const theatre = {
  intro:
    'His theatrical works have participated in and won awards at numerous Arab festivals. Among his works:',
  items: [
    'Land of Drought — Sharjah Theatre Days 2026, produced by Fujairah Theatre, directed by Fares Al-Balushi',
    'The Poisons — opened the Dhofar Theatre Festival 2024, directed by Omar Naji',
    'The Surprise Maker — performed at the Kuwait and Zarqa Monodrama Festivals and the Omani Actor Festival, receiving multiple awards',
    'Ball of Yarn, Ghayoub Al-Ahaimer, Desire, A Drop of Wheat, Rayinka, Stillness',
    'Chairman of the Jury — Arab Open University Theatre Festival 2025, Sultanate of Oman',
    'Member of the Evaluation Committee — Duhok Cultural Festival',
  ],
}

export const cinemaDrama = [
  'Screenplays for feature films: Salma, Resonance, Dialogue of the Wall',
  "Television drama works, including: dramatic treatment for the series Scattered Barriers (Netflix), dramatic treatment for the series When the Wind Plays, theatrical adaptation of the play Madq Al-Henna directed by Yousef Al-Balushi, and dramatic treatment for the series Sidra",
]

export const workshops = [
  'Workshops in playwriting and dramatic text development — Salalah 2023 and 2025, and Duhok 2010–2014',
]

/*
  THERE IS NO `sections` EXPORT ANY MORE. It once fed a sticky "On This Page" index
  beside the six content sections — one `{ id, label }` entry per section, `id`
  doubling as the anchor both the index link and the section heading used. The index
  was removed from NaelPage.jsx outright on request, along with the two-column body
  grid and sticky rail it needed, and this array went with it as its only consumer —
  the six section ids and titles are written directly at each `<Section>` call site
  in NaelPage.jsx now, the same way data/aboutPage.js's five sections never had a
  separate index array of their own either.
*/
