/**
 * Backfill missing past dates with a diverse ritual (8 questions).
 *
 * For each of the last N days without any questions stamped:
 *   - Picks 1 act1, 5 act2, 1 act3, 1 act4 from the unused pool
 *   - Ensures the 4 acts reference 4 different films (best-effort)
 *   - Stamps used_on = date on all 8
 *
 * Only touches questions with used_on IS NULL — never overwrites existing stamps.
 * If the unused pool runs dry, prints a warning and stops.
 *
 * Usage:
 *   node scripts/backfillPastDates.js               # 60 days back
 *   node scripts/backfillPastDates.js --days 30     # 30 days back
 *   node scripts/backfillPastDates.js --dry-run     # preview without writing
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
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

function getArg(name) {
  const idx = process.argv.findIndex(a => a === name || a.startsWith(`${name}=`))
  if (idx === -1) return null
  return process.argv[idx].includes('=') ? process.argv[idx].split('=')[1] : process.argv[idx + 1]
}

const DAYS_BACK = parseInt(getArg('--days') || '60', 10)
const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in .env (need service-role key to bypass RLS).')
  process.exit(1)
}

const PER_ACT_NEEDED = { 1: 1, 2: 5, 3: 1, 4: 1 }

async function main() {
  // 1. Compute the target date range (yesterday going back)
  const dates = []
  for (let i = 1; i <= DAYS_BACK; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }

  // 2. Find dates that already have any question stamped — skip those
  const { data: stamped, error: stampedErr } = await supabase
    .from('questions')
    .select('used_on')
    .not('used_on', 'is', null)
  if (stampedErr) { console.error('Failed to load stamped dates:', stampedErr.message); process.exit(1) }

  const stampedSet = new Set((stamped || []).map(r => r.used_on))
  const missing = dates.filter(d => !stampedSet.has(d))

  if (missing.length === 0) {
    console.log(`No missing dates in the last ${DAYS_BACK} days.`)
    return
  }

  console.log(`Range: ${DAYS_BACK} days back (${dates[dates.length - 1]} → ${dates[0]})`)
  console.log(`Missing ${missing.length} of ${dates.length} dates.\n`)

  // 3. Load unused pool per act (id ASC = arbitrary but stable)
  const pools = {}
  for (const act of [1, 2, 3, 4]) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, film')
      .eq('act', act)
      .is('used_on', null)
      .order('id', { ascending: true })
    if (error) { console.error(`Failed to load act${act} pool:`, error.message); process.exit(1) }
    pools[act] = data || []
    console.log(`  act${act} unused pool: ${pools[act].length}`)
  }

  // 4. Capacity check
  const capacity = Math.min(...[1, 2, 3, 4].map(a => Math.floor(pools[a].length / PER_ACT_NEEDED[a])))
  console.log(`\nCapacity: ${capacity} full rituals from the current unused pool.`)
  if (capacity < missing.length) {
    console.log(`⚠ Only enough for ${capacity} of ${missing.length} missing dates — the rest will be skipped.\n`)
  }

  if (DRY_RUN) {
    console.log('\n(dry-run: no writes) — remove --dry-run to backfill.')
    return
  }

  // 5. For each missing date (oldest first), pick a diverse set and stamp
  let stampedCount = 0
  for (const date of [...missing].reverse()) {
    if (pools[1].length < 1 || pools[2].length < 5 || pools[3].length < 1 || pools[4].length < 1) {
      console.warn(`  ⚠ Pool exhausted — stopping at ${date}`)
      break
    }

    // Act 1 — take first
    const a1 = pools[1].shift()
    const films = new Set()
    if (a1.film) films.add(a1.film)

    // Act 2 — 5 questions, prefer distinct films (from a1 and among themselves)
    const a2 = []
    for (let i = 0; i < pools[2].length && a2.length < 5; i++) {
      const q = pools[2][i]
      if (q.film && films.has(q.film)) continue
      a2.push(q); pools[2].splice(i, 1); i--
      if (q.film) films.add(q.film)
    }
    // Fill remaining slots without diversity constraint if we couldn't hit 5
    while (a2.length < 5 && pools[2].length > 0) a2.push(pools[2].shift())

    // Act 3 — first available whose film isn't already used (fallback: any)
    let a3Idx = pools[3].findIndex(q => !q.film || !films.has(q.film))
    if (a3Idx === -1) a3Idx = 0
    const a3 = pools[3].splice(a3Idx, 1)[0]
    if (a3?.film) films.add(a3.film)

    // Act 4 — same treatment
    let a4Idx = pools[4].findIndex(q => !q.film || !films.has(q.film))
    if (a4Idx === -1) a4Idx = 0
    const a4 = pools[4].splice(a4Idx, 1)[0]

    const ids = [a1.id, ...a2.map(q => q.id), a3?.id, a4?.id].filter(Boolean)

    const { error } = await supabase
      .from('questions')
      .update({ used_on: date })
      .in('id', ids)
    if (error) {
      console.error(`  ✗ ${date}: ${error.message}`)
    } else {
      const filmList = [...films].slice(0, 3).join(', ') + (films.size > 3 ? `, +${films.size - 3}` : '')
      console.log(`  ✓ ${date}  (${ids.length} q) — films: ${filmList}`)
      stampedCount++
    }
  }

  console.log(`\nBackfilled ${stampedCount} date${stampedCount === 1 ? '' : 's'}.`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
