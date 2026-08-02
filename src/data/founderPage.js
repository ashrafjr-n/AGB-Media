/*
  The /founder page's copy, as data — mirroring the convention data/naelPage.js
  established for the site's other dedicated profile page: copy lives here rather than
  inline in the component because this is a dense multi-section profile (a name plate, a
  three-paragraph biography, and four further categories of credited work), and burying
  that much text inside the layout would make the JSX unreadable for anyone editing the
  grid rather than the words.

  EVERY FIELD BELOW IS VERBATIM from the brief that commissioned this page — transcribed
  directly, not reworded, not reordered.

  UNLIKE naelPage.js, THE MASTHEAD HAS THREE SEPARATE FIELDS RATHER THAN ONE SPLIT STRING.
  Nael's masthead comes from one "Name — Title — Title" source line because that is the
  shape the brief gave it in; this brief instead gave three already-distinct lines — an
  eyebrow, a name, and a subtitle — so there is nothing to split here and no `nameTitle`
  equivalent. See `eyebrow`, `name` and `subtitle` below.

  TYPOGRAPHIC PUNCTUATION IS DELIBERATE: U+2014 (—) for phrase-separating dashes, and
  straight apostrophes (') throughout, matching the brief's own punctuation exactly rather
  than substituting a curly quote it did not use. These are strings, not markup, so an
  HTML entity would render as the characters that spell it.

  THE ONLY STRUCTURING THIS FILE DOES BEYOND STORING STRINGS is grouping the biography's
  three paragraphs into an array (`bio`) and the four "Selected Works" categories into
  their own arrays, where the brief itself already presented them as bullet lists. Neither
  operation changes a word.
*/

/*
  THE MASTHEAD, AS THREE VERBATIM LINES — see the top-of-file note on why this page has
  three separate fields rather than Nael's single split string.
*/
export const eyebrow = 'The Founder — Abdullah Ghayfan'
export const name = 'Abdullah Ghayfan'
export const subtitle = 'Founder · Abdullah Ghayfan'

/*
  THE BIOGRAPHY, AS THREE PARAGRAPHS — an array rather than one joined string so
  AbdullahPage.jsx can render each as its own <p>, the same paragraph rhythm the rest of
  the site's running copy uses rather than one dense block.
*/
export const bio = [
  'Abdullah Ghayfan entered the world of art in 1976 with the play Min Fawq Hallah Allah. He later became known for his powerful portrayals of villainous roles. Among his most celebrated works is the series Al-Dana, in which he played the role of the Nokhda alongside Widad Al-Kawari, Abdulaziz Jassim, and Saad Bursheed. The series won several international and Arab awards. One of his later works was the Qatari film Aqrab Al-Sa\'a (2010).',
  'In 2009, he was chosen by the Qatari director Khalifa Al-Muraikhi to play the role of the great jinn "Adsan" in the first Qatari feature-length film. This was considered one of the most challenging roles, as the character of the jinn Adsan is complex and requires great skill and depth. Abdullah Ghayfan rose to the occasion. His return to the screen after a long absence was widely praised by audiences, fellow artists, and critics alike.',
  'Abdullah Ghayfan has a rich body of work in both theatre and television and has participated in most major Arab festivals. He carefully selected his roles and performed them with precision. Although many of his appearances were relatively short, they were consistently striking and memorable. He is known for his high moral character, a quality attested to by everyone who has worked with him in television, theatre, and cinema. We hope to see him return to the silver screen, as television needs artists of his calibre.',
]

/*
  SELECTED WORKS — four categories, each a flat list in the brief's own order. No
  category here carries an intro sentence (unlike Nael's `theatre`, which does); the
  brief gave these four as plain bullet lists with no lead-in prose, so none is invented.
*/

export const television = [
  'Al-Dana — as the Nokhda (with Widad Al-Kawari, Abdulaziz Jassim, and Saad Bursheed)',
  'Fayez Al-Tosh — three parts (1984, 1985, 1989)',
  'Al-Ta\'iha',
  'The Adventures of Saadoun — children\'s series starring Abdulaziz Jassim and Faleh Fayez',
  'Mohsen Minkum wa Feekum',
  'Al-Nas Al-Tayyibeen',
  'Ahlam Al-Busata\'',
  'Afwan Sayidi Al-Walid',
  '29 Salefa wa Salefa',
  'Al-Daloub',
  'Jameela',
  'Bayt Al-Mughtani',
  'Al-Sidra',
]

export const theatre = [
  'Min Fawq Hallah Allah',
  'Boudriya — two productions (1981, 1988) in the role of Bin Saadoun',
  'Al-Mahara: Queen of Ancient Times — as Al-Majdami',
  'The Missing Treasure in the Land of Wonders',
  'Al-Mutaraqishoun',
  'Man Yadhhak Akhiran',
  'Ya Layl Ya Layl',
  'The Golden Shoe',
  'Antar wa Abla — starring Ghanem Al-Sulaiti, Abdulaziz Jassim, and Mazhar Abu Al-Naga',
  'Al-Munaqasha',
  'Mawal Al-Farah wal-Huzn',
]

export const officialRecords = [
  'Mazloum Zulum Mazloum',
  'Hammam Al-Mahabba',
  'Al-Feel Ya Malik Al-Zaman',
  'Rahma and the Enchanted Forest',
  'Hal Shakl Ya Za\'faran — Al-Adwaa Troupe production (1983)',
]

export const cinema = ['Aqrab Al-Sa\'a — as the jinn Adsan']
