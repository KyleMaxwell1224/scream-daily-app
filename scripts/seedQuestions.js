/**
 * Seed Act 1 (Scene of the Crime) and Act 4 (Final Reckoning) questions.
 *
 * Usage:
 *   node scripts/seedQuestions.js
 *
 * Requires in .env (or set as env vars):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY   (service role key — bypasses RLS)
 *   TMDB_TOKEN             (v4 read-access token)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const raw = readFileSync(join(__dir, '../.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.+)$/)
      if (m) process.env[m[1]] = m[2].trim()
    }
  } catch {}
}
loadEnv()

const SUPABASE_URL    = process.env.SUPABASE_URL    || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const TMDB_TOKEN      = process.env.TMDB_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials'); process.exit(1) }
if (!TMDB_TOKEN)                    { console.error('Missing TMDB_TOKEN'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// ACT 1 FILMS
// Each entry: { title, year, director, subgenre, decade, variants }
// ---------------------------------------------------------------------------
const ACT1_FILMS = [
  { title: 'The Shining',                  year: 1980, director: 'Stanley Kubrick',    subgenre: 'psychological', decade: '1980s', variants: ['Shining'] },
  { title: 'Halloween',                    year: 1978, director: 'John Carpenter',     subgenre: 'slasher',       decade: '1970s', variants: [] },
  { title: 'A Nightmare on Elm Street',    year: 1984, director: 'Wes Craven',         subgenre: 'slasher',       decade: '1980s', variants: ['Nightmare on Elm Street', 'A Nightmare on Elm St'] },
  { title: 'Scream',                       year: 1996, director: 'Wes Craven',         subgenre: 'slasher',       decade: '1990s', variants: [] },
  { title: 'The Silence of the Lambs',     year: 1991, director: 'Jonathan Demme',     subgenre: 'psychological', decade: '1990s', variants: ['Silence of the Lambs'] },
  { title: 'Hereditary',                   year: 2018, director: 'Ari Aster',          subgenre: 'supernatural',  decade: '2010s', variants: [] },
  { title: 'Get Out',                      year: 2017, director: 'Jordan Peele',       subgenre: 'psychological', decade: '2010s', variants: [] },
  { title: 'It',                           year: 2017, director: 'Andy Muschietti',    subgenre: 'supernatural',  decade: '2010s', variants: ['It Chapter One', 'It (2017)'] },
  { title: 'The Conjuring',                year: 2013, director: 'James Wan',          subgenre: 'supernatural',  decade: '2010s', variants: ['Conjuring'] },
  { title: 'Midsommar',                    year: 2019, director: 'Ari Aster',          subgenre: 'folk horror',   decade: '2010s', variants: [] },
  { title: 'The Witch',                    year: 2015, director: 'Robert Eggers',      subgenre: 'folk horror',   decade: '2010s', variants: ['The VVitch', 'VVitch'] },
  { title: 'The Exorcist',                 year: 1973, director: 'William Friedkin',   subgenre: 'supernatural',  decade: '1970s', variants: ['Exorcist'] },
  { title: 'Psycho',                       year: 1960, director: 'Alfred Hitchcock',   subgenre: 'psychological', decade: '1960s', variants: [] },
  { title: 'The Texas Chain Saw Massacre', year: 1974, director: 'Tobe Hooper',        subgenre: 'slasher',       decade: '1970s', variants: ['Texas Chain Saw Massacre', 'The Texas Chainsaw Massacre', 'Texas Chainsaw Massacre'] },
  { title: 'Alien',                        year: 1979, director: 'Ridley Scott',       subgenre: 'sci-fi horror', decade: '1970s', variants: [] },
  { title: 'The Thing',                    year: 1982, director: 'John Carpenter',     subgenre: 'sci-fi horror', decade: '1980s', variants: ['The Thing (1982)'] },
  { title: 'Carrie',                       year: 1976, director: 'Brian De Palma',     subgenre: 'supernatural',  decade: '1970s', variants: [] },
  { title: 'Jaws',                         year: 1975, director: 'Steven Spielberg',   subgenre: 'creature',      decade: '1970s', variants: [] },
  { title: 'The Blair Witch Project',      year: 1999, director: 'Daniel Myrick',      subgenre: 'found footage', decade: '1990s', variants: ['Blair Witch Project', 'Blair Witch'] },
  { title: 'Saw',                          year: 2004, director: 'James Wan',          subgenre: 'torture horror',decade: '2000s', variants: ['Saw (2004)'] },
  { title: 'The Ring',                     year: 2002, director: 'Gore Verbinski',     subgenre: 'supernatural',  decade: '2000s', variants: ['Ring'] },
  { title: '28 Days Later',                year: 2002, director: 'Danny Boyle',        subgenre: 'zombie',        decade: '2000s', variants: ['28 Days Later...'] },
  { title: 'Rosemary\'s Baby',             year: 1968, director: 'Roman Polanski',     subgenre: 'supernatural',  decade: '1960s', variants: ["Rosemary's Baby"] },
  { title: 'Suspiria',                     year: 1977, director: 'Dario Argento',      subgenre: 'supernatural',  decade: '1970s', variants: [] },
  { title: 'Evil Dead II',                 year: 1987, director: 'Sam Raimi',          subgenre: 'splatter',      decade: '1980s', variants: ['Evil Dead 2', 'Evil Dead II: Dead by Dawn'] },
  { title: 'Misery',                       year: 1990, director: 'Rob Reiner',         subgenre: 'psychological', decade: '1990s', variants: [] },
  { title: 'Us',                           year: 2019, director: 'Jordan Peele',       subgenre: 'psychological', decade: '2010s', variants: [] },
  { title: 'Annihilation',                 year: 2018, director: 'Alex Garland',       subgenre: 'sci-fi horror', decade: '2010s', variants: [] },
  { title: 'Friday the 13th',              year: 1980, director: 'Sean S. Cunningham', subgenre: 'slasher',       decade: '1980s', variants: ['Friday the 13th (1980)'] },
  { title: 'Paranormal Activity',          year: 2007, director: 'Oren Peli',          subgenre: 'found footage', decade: '2000s', variants: [] },
]

// ---------------------------------------------------------------------------
// ACT 4 QUESTIONS (open-answer trivia)
// ---------------------------------------------------------------------------
const ACT4_QUESTIONS = [
  {
    film: 'The Shining',
    question: 'In The Shining (1980), what is the number of the room that Jack Torrance is warned never to enter?',
    correct_answer: '237',
    accepted_variants: ['Room 237', 'room 237'],
    explanation: 'Room 237 is the forbidden room at the Overlook Hotel. In Stephen King\'s novel it was Room 217 — Kubrick changed it at the request of the hotel used for filming.',
    subgenre: 'psychological', decade: '1980s', difficulty: 'medium',
  },
  {
    film: 'Halloween',
    question: 'In Halloween (1978), what is the name of the fictional Illinois town where Michael Myers returns to kill?',
    correct_answer: 'Haddonfield',
    accepted_variants: ['Haddonfield, Illinois'],
    explanation: 'Haddonfield, Illinois is named after Haddonfield, New Jersey — the hometown of co-writer Debra Hill.',
    subgenre: 'slasher', decade: '1970s', difficulty: 'easy',
  },
  {
    film: 'The Silence of the Lambs',
    question: 'In The Silence of the Lambs (1991), what is Hannibal Lecter\'s professional title prior to his incarceration?',
    correct_answer: 'Psychiatrist',
    accepted_variants: ['psychiatrist', 'Dr. Lecter', 'doctor', 'physician'],
    explanation: 'Hannibal Lecter was a respected forensic psychiatrist before his crimes were discovered. His credentials made his victims all the more trusting.',
    subgenre: 'psychological', decade: '1990s', difficulty: 'medium',
  },
  {
    film: 'Hereditary',
    question: 'In Hereditary (2018), what is the name of the demon that the family unwittingly summons throughout the film?',
    correct_answer: 'Paimon',
    accepted_variants: ['King Paimon', 'paimon'],
    explanation: 'Paimon is a demon from the Ars Goetia who requires a female host but is ultimately moved into Peter\'s body. The cult worships him to gain his power.',
    subgenre: 'supernatural', decade: '2010s', difficulty: 'hard',
  },
  {
    film: 'Get Out',
    question: 'In Get Out (2017), what name is given to the hypnotic trance state that Rose\'s mother uses to control her victims?',
    correct_answer: 'The Sunken Place',
    accepted_variants: ['Sunken Place', 'the sunken place'],
    explanation: 'The Sunken Place is a void-like state of paralysis induced via hypnosis — the victim is conscious but unable to control their body, imprisoned in their own mind.',
    subgenre: 'psychological', decade: '2010s', difficulty: 'medium',
  },
  {
    film: 'The Exorcist',
    question: 'In The Exorcist (1973), what is the name of the demon possessing Regan MacNeil?',
    correct_answer: 'Pazuzu',
    accepted_variants: ['pazuzu'],
    explanation: 'Pazuzu is an ancient Assyrian wind demon. Its statue is found by Father Merrin at a dig in Iraq in the film\'s opening, foreshadowing the possession.',
    subgenre: 'supernatural', decade: '1970s', difficulty: 'hard',
  },
  {
    film: 'Psycho',
    question: 'In Psycho (1960), what is the name of the motel where Marion Crane meets Norman Bates?',
    correct_answer: 'Bates Motel',
    accepted_variants: ['the bates motel', 'bates'],
    explanation: 'The Bates Motel sits off a bypassed highway, struggling for business — which is why Marion Crane\'s appearance seems like a gift to the lonely Norman.',
    subgenre: 'psychological', decade: '1960s', difficulty: 'easy',
  },
  {
    film: 'Alien',
    question: 'In Alien (1979), what is the name of the corporate entity that secretly orders the Nostromo crew to investigate the distress signal?',
    correct_answer: 'Weyland-Yutani',
    accepted_variants: ['Weyland Yutani', 'the company', 'Wayland-Yutani'],
    explanation: 'Weyland-Yutani — nicknamed "The Company" — views the alien organism as a potential biological weapon, prioritising it over the crew\'s survival.',
    subgenre: 'sci-fi horror', decade: '1970s', difficulty: 'hard',
  },
  {
    film: 'The Thing',
    question: 'In The Thing (1982), what is the name of the Antarctic research station where the crew discovers the alien life form?',
    correct_answer: 'Outpost 31',
    accepted_variants: ['US Outpost 31', 'outpost 31', 'the outpost'],
    explanation: 'The isolated US Outpost 31 becomes ground zero for the shape-shifting alien — the remoteness ensuring no rescue and no escape.',
    subgenre: 'sci-fi horror', decade: '1980s', difficulty: 'hard',
  },
  {
    film: 'Scream',
    question: 'In Scream (1996), what is the name of the fictional town where the Ghostface murders take place?',
    correct_answer: 'Woodsboro',
    accepted_variants: ['woodsboro, california', 'woodsboro ca'],
    explanation: 'Woodsboro, California is the fictional small town at the heart of the Scream franchise. Its mundane name contrasts sharply with the horrors that unfold there.',
    subgenre: 'slasher', decade: '1990s', difficulty: 'easy',
  },
  {
    film: 'Midsommar',
    question: 'In Midsommar (2019), what is the name of the Swedish folk commune the characters visit?',
    correct_answer: 'Hårga',
    accepted_variants: ['Harga', 'hårga', 'harga'],
    explanation: 'The Hårga commune holds a midsummer festival every 90 years. What appears to be a utopian celebration conceals ancient ritual sacrifice.',
    subgenre: 'folk horror', decade: '2010s', difficulty: 'hard',
  },
  {
    film: 'Carrie',
    question: 'In Carrie (1976), what substance is dumped on Carrie at the prom, triggering her telekinetic rampage?',
    correct_answer: 'Pig blood',
    accepted_variants: ["pig's blood", 'blood', 'pigs blood'],
    explanation: 'A bucket of pig blood rigged above the stage is tipped onto Carrie after she is crowned prom queen. It catalyses the most iconic scene in Brian De Palma\'s adaptation.',
    subgenre: 'supernatural', decade: '1970s', difficulty: 'easy',
  },
  {
    film: 'The Ring',
    question: 'In The Ring (2002), how many days does the victim have to live after watching the cursed videotape?',
    correct_answer: '7',
    accepted_variants: ['seven', 'seven days', '7 days'],
    explanation: 'The dying curse gives the viewer exactly seven days — announced by a phone call immediately after watching. The countdown drives the entire film\'s tension.',
    subgenre: 'supernatural', decade: '2000s', difficulty: 'easy',
  },
  {
    film: 'Saw',
    question: 'In Saw (2004), what is the name of the serial killer who designs the elaborate death traps?',
    correct_answer: 'Jigsaw',
    accepted_variants: ['The Jigsaw Killer', 'John Kramer', 'jigsaw killer'],
    explanation: 'John Kramer adopts the Jigsaw moniker because he cuts jigsaw-shaped pieces of flesh from victims he deems ungrateful for life.',
    subgenre: 'torture horror', decade: '2000s', difficulty: 'easy',
  },
  {
    film: 'The Blair Witch Project',
    question: 'In The Blair Witch Project (1999), in what real-world Maryland town does the legend of the Blair Witch originate?',
    correct_answer: 'Burkittsville',
    accepted_variants: ['burkittsville, maryland'],
    explanation: 'Burkittsville, Maryland — formerly Blair — is the real town used in the film\'s lore. The name Blair comes from the old name for the area.',
    subgenre: 'found footage', decade: '1990s', difficulty: 'hard',
  },
  {
    film: '28 Days Later',
    question: 'In 28 Days Later (2002), what is the name of the virus that causes the infected to enter a violent rage?',
    correct_answer: 'Rage',
    accepted_variants: ['the rage virus', 'rage virus'],
    explanation: 'The Rage virus spreads through blood and saliva, turning victims into frenzied, violent hosts within seconds — making it far faster-acting than traditional zombie lore.',
    subgenre: 'zombie', decade: '2000s', difficulty: 'medium',
  },
  {
    film: 'Hereditary',
    question: 'In Hereditary (2018), what is the name of the mysterious woman who befriends Annie at a grief support group?',
    correct_answer: 'Joan',
    accepted_variants: ['joan'],
    explanation: 'Joan is revealed to be a member of the Paimon cult who deliberately targets Annie\'s family, manipulating them into completing the ritual.',
    subgenre: 'supernatural', decade: '2010s', difficulty: 'medium',
  },
  {
    film: 'The Witch',
    question: 'In The Witch (2015), what is the name of the family\'s black goat who is later revealed to be the Devil in disguise?',
    correct_answer: 'Black Phillip',
    accepted_variants: ['Black Philip', 'black phillip', 'black philip'],
    explanation: 'Black Phillip speaks to Thomasin at the film\'s end, offering her his book to sign. His calm demeanour throughout masks his true nature as a manifestation of the Devil.',
    subgenre: 'folk horror', decade: '2010s', difficulty: 'medium',
  },
  {
    film: 'Misery',
    question: 'In Misery (1990), what is the term that Annie Wilkes uses to describe Paul Sheldon\'s character who she believes was cheapened by his writing?',
    correct_answer: 'Dirty bird',
    accepted_variants: ['dirty bird', 'dirty-bird'],
    explanation: 'Annie uses the eccentric phrase "dirty bird" as a substitute expletive throughout the film, a quirk that underscores her unhinged and unpredictable nature.',
    subgenre: 'psychological', decade: '1990s', difficulty: 'hard',
  },
  {
    film: 'Us',
    question: 'In Us (2019), what are the shadowy underground doubles called?',
    correct_answer: 'The Tethered',
    accepted_variants: ['Tethered', 'the tethered'],
    explanation: 'The Tethered are government-created shadow clones bound to their surface counterparts, forced to mirror their movements for years beneath the earth.',
    subgenre: 'psychological', decade: '2010s', difficulty: 'medium',
  },
]

// ---------------------------------------------------------------------------
// TMDB helpers
// ---------------------------------------------------------------------------
async function tmdbGet(path) {
  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

async function getBestBackdrop(movieId) {
  const data = await tmdbGet(`/movie/${movieId}/images?include_image_language=en,null`)
  const backdrops = data.backdrops || []
  if (backdrops.length === 0) return null
  // Prefer high-vote-average backdrops with English language
  const sorted = [...backdrops].sort((a, b) => b.vote_average - a.vote_average)
  return `https://image.tmdb.org/t/p/w1280${sorted[0].file_path}`
}

async function findMovie(title, year) {
  const encoded = encodeURIComponent(title)
  const data = await tmdbGet(`/search/movie?query=${encoded}&year=${year}`)
  const results = data.results || []
  // Prefer exact title match in same year ± 1
  const match = results.find(r =>
    Math.abs((r.release_date || '').slice(0, 4) - year) <= 1
  )
  return match || results[0] || null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('--- Seeding Act 1 questions ---')

  const act1Rows = []

  for (const film of ACT1_FILMS) {
    process.stdout.write(`  ${film.title} (${film.year}) … `)
    try {
      const movie = await findMovie(film.title, film.year)
      if (!movie) { console.log('NOT FOUND on TMDB, skipping'); continue }

      const imageUrl = await getBestBackdrop(movie.id)
      if (!imageUrl) { console.log('no backdrop, skipping'); continue }

      act1Rows.push({
        act: 1,
        difficulty: 'medium',
        subgenre: film.subgenre,
        decade: film.decade,
        film: film.title,
        question: `Identify this horror film from the still image.`,
        options: [],
        correct_answer: film.title,
        accepted_variants: film.variants,
        explanation: `${film.title} (${film.year}), directed by ${film.director}.`,
        image_url: imageUrl,
        authored_by: film.director,
        attribution: `Directed by ${film.director}`,
      })
      console.log(`✓ ${imageUrl.split('/').pop()}`)
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
    }
    // Be polite to TMDB rate limits
    await new Promise(r => setTimeout(r, 250))
  }

  if (act1Rows.length > 0) {
    console.log(`\nInserting ${act1Rows.length} act 1 rows…`)
    const { error } = await supabase.from('questions').insert(act1Rows)
    if (error) {
      console.error('Insert error:', error.message)
      if (error.message.includes('policy')) {
        console.error('\n⚠ RLS blocked insert. Add SUPABASE_SERVICE_KEY= to .env and retry.')
      }
    } else {
      console.log('✓ Act 1 inserted')
    }
  }

  console.log('\n--- Seeding Act 4 questions ---')

  const act4Rows = ACT4_QUESTIONS.map(q => ({
    act: 4,
    difficulty: q.difficulty,
    subgenre: q.subgenre,
    decade: q.decade,
    film: q.film,
    question: q.question,
    options: [],
    correct_answer: q.correct_answer,
    accepted_variants: q.accepted_variants,
    explanation: q.explanation,
    image_url: null,
    authored_by: 'ai',
  }))

  const { error: e4 } = await supabase.from('questions').insert(act4Rows)
  if (e4) {
    console.error('Insert error:', e4.message)
    if (e4.message.includes('policy')) {
      console.error('\n⚠ RLS blocked insert. Add SUPABASE_SERVICE_KEY= to .env and retry.')
    }
  } else {
    console.log(`✓ ${act4Rows.length} act 4 questions inserted`)
  }

  console.log('\nDone.')
}

main().catch(console.error)
