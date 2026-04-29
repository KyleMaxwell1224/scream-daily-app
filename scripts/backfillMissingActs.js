/**
 * Stamp an unused question onto each past date that is missing an act.
 * Picks the LRU (lowest id) question with used_on IS NULL for the act.
 *
 * Usage: node scripts/backfillMissingActs.js
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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

async function main() {
  // 1. Find all dates with stamped questions
  const { data: stamped } = await supabase
    .from('questions')
    .select('id, act, used_on')
    .not('used_on', 'is', null)

  const byDate = {}
  for (const r of stamped || []) {
    if (!byDate[r.used_on]) byDate[r.used_on] = new Set()
    byDate[r.used_on].add(r.act)
  }

  // 2. Collect all missing (date, act) pairs
  const missing = []
  for (const [date, acts] of Object.entries(byDate).sort()) {
    for (const act of [1, 2, 3, 4]) {
      if (!acts.has(act)) missing.push({ date, act })
    }
  }

  if (missing.length === 0) {
    console.log('No missing acts found — all dates complete.')
    return
  }

  console.log(`Found ${missing.length} missing act(s):\n`)
  for (const m of missing) console.log(`  ${m.date}  act${m.act}`)
  console.log()

  // 3. Get all currently-unstamped questions, grouped by act
  const { data: pool } = await supabase
    .from('questions')
    .select('id, act')
    .is('used_on', null)
    .order('id', { ascending: true })

  // Build a mutable pool: act → [ids] (already sorted ASC = LRU-first)
  const available = {}
  for (const r of pool || []) {
    if (!available[r.act]) available[r.act] = []
    available[r.act].push(r.id)
  }

  // 4. For each missing pair, stamp the next available question
  for (const { date, act } of missing) {
    const ids = available[act]
    if (!ids || ids.length === 0) {
      console.warn(`  ⚠ No unused questions left for act${act} — skipping ${date}`)
      continue
    }
    const id = ids.shift() // consume LRU
    const { error } = await supabase
      .from('questions')
      .update({ used_on: date })
      .eq('id', id)
    if (error) {
      console.error(`  ✗ ${date} act${act} (id ${id}):`, error.message)
    } else {
      console.log(`  ✓ ${date}  act${act}  → stamped question ${id}`)
    }
  }

  console.log('\nDone.')
}

main().catch(console.error)
