/**
 * Remove duplicate questions introduced by re-running the seed script.
 *
 * Duplicates:
 *   Act 1 — same (act, film): keep the row with the lowest id
 *   Act 4 — same (act, question): keep the row with the lowest id
 *   Acts 2 & 3 — same (act, question): keep the row with the lowest id
 *
 * Usage:
 *   node scripts/dedupQuestions.js
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Need SUPABASE_URL + SUPABASE_SERVICE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function dedupAct(actNum, groupField) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, ' + groupField)
    .eq('act', actNum)
    .order('id', { ascending: true })

  if (error) { console.error(`Act ${actNum} fetch error:`, error.message); return }

  // Group by the field, collect all ids per group
  const groups = new Map()
  for (const row of data) {
    const key = (row[groupField] || '').toLowerCase().trim()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row.id)
  }

  const toDelete = []
  for (const [, ids] of groups) {
    if (ids.length > 1) {
      // keep lowest id, delete the rest
      toDelete.push(...ids.slice(1))
    }
  }

  if (toDelete.length === 0) {
    console.log(`Act ${actNum}: no duplicates found`)
    return
  }

  console.log(`Act ${actNum}: deleting ${toDelete.length} duplicate rows…`)
  const { error: delErr } = await supabase
    .from('questions')
    .delete()
    .in('id', toDelete)

  if (delErr) console.error(`Delete error:`, delErr.message)
  else console.log(`Act ${actNum}: ✓ deleted ${toDelete.length} rows`)
}

async function main() {
  console.log('Deduplicating questions table…\n')
  await dedupAct(1, 'film')       // one image per film
  await dedupAct(2, 'question')   // one trivia question per question text
  await dedupAct(3, 'question')   // one quote per quote text
  await dedupAct(4, 'question')   // one open-answer per question text
  console.log('\nDone.')
}

main().catch(console.error)
