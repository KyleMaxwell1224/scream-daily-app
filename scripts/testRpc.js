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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const date = process.argv[2] || '2026-04-27'
console.log(`\nTesting get_questions_for_date for ${date}...\n`)

const { data, error } = await supabase.rpc('get_questions_for_date', { target_date: date })
if (error) {
  console.error('RPC ERROR:', error.message, error.code)
} else {
  console.log('data type:', typeof data, Array.isArray(data) ? '(array)' : '')
  if (data && typeof data === 'object') {
    console.log('keys:', Object.keys(data))
    console.log('act1:', data.act1 ? `present (${data.act1.correct_answer})` : 'NULL')
    console.log('act2:', data.act2?.length ? `${data.act2.length} questions` : 'EMPTY/NULL')
    console.log('act3:', data.act3 ? `present` : 'NULL')
    console.log('act4:', data.act4 ? `present` : 'NULL')
  } else {
    console.log('raw data:', JSON.stringify(data, null, 2))
  }
}

console.log('\nAlso checking used_on for that date:')
const { data: rows } = await supabase.from('questions').select('id, act, correct_answer, used_on').eq('used_on', date)
console.log(`Questions with used_on=${date}:`, rows?.length ?? 0)
if (rows?.length) {
  for (const r of rows) console.log(`  act${r.act}: ${r.correct_answer}`)
}
