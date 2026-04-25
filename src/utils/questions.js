import { supabase } from '../supabaseClient'

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

export async function getTodaysQuestions() {
  const d = getDayOfYear()

  const act1Offset = d % 10
  const act2Offset = (d * 5) % 50
  const act3Offset = d % 50
  const act4Offset = d % 10

  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from('questions').select('*').eq('act', 1).range(act1Offset, act1Offset),
    supabase.from('questions').select('*').eq('act', 2).range(act2Offset, act2Offset + 4),
    supabase.from('questions').select('*').eq('act', 3).range(act3Offset, act3Offset),
    supabase.from('questions').select('*').eq('act', 4).range(act4Offset, act4Offset),
  ])

  return {
    act1: r1.data?.[0] || null,
    act2: r2.data || [],
    act3: r3.data?.[0] || null,
    act4: r4.data?.[0] || null,
  }
}

export function getDayNumber() {
  const launch = new Date('2025-06-28')
  const today = new Date()
  const diff = Math.floor((today - launch) / 86400000)
  return Math.max(1, diff + 1)
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function gradeAnswer(userInput, correctAnswer, acceptedVariants = []) {
  const input = userInput.trim().toLowerCase()
  const correct = correctAnswer.toLowerCase()
  const variants = acceptedVariants.map(v => v.toLowerCase())

  if (input === correct || variants.includes(input)) return { grade: 'exact', xp: 100 }

  if (input.includes(correct) || correct.includes(input)) return { grade: 'close', xp: 60 }
  if (variants.some(v => input.includes(v) || v.includes(input))) return { grade: 'close', xp: 60 }

  const dist = levenshtein(input, correct)
  if (dist <= 2) return { grade: 'close', xp: 60 }
  if (dist <= 4) return { grade: 'partial', xp: 20 }

  for (const v of variants) {
    const vd = levenshtein(input, v)
    if (vd <= 2) return { grade: 'close', xp: 60 }
    if (vd <= 4) return { grade: 'partial', xp: 20 }
  }

  return { grade: 'wrong', xp: 0 }
}
