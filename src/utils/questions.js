import { supabase } from '../supabaseClient'

export async function getTodaysQuestions() {
  const { data, error } = await supabase.rpc('get_todays_questions')
  if (error || !data) return { act1: null, act2: [], act3: null, act4: null }
  return {
    act1: data.act1 || null,
    act2: data.act2 || [],
    act3: data.act3 || null,
    act4: data.act4 || null,
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
  if (!input) return { grade: 'wrong', xp: 0 }
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
