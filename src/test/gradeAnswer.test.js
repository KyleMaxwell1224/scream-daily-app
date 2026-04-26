import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabaseClient', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { gradeAnswer, levenshtein } from '../utils/questions'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('halloween', 'halloween')).toBe(0)
  })

  it('returns 1 for single insertion', () => {
    expect(levenshtein('jason', 'jason ')).toBe(1)
  })

  it('returns 1 for single deletion', () => {
    expect(levenshtein('freddy', 'fredy')).toBe(1)
  })

  it('returns 1 for single substitution', () => {
    expect(levenshtein('myers', 'myerz')).toBe(1)
  })

  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('', '')).toBe(0)
  })
})

describe('gradeAnswer', () => {
  it('exact match returns exact grade', () => {
    expect(gradeAnswer('Halloween', 'Halloween')).toEqual({ grade: 'exact', xp: 100 })
  })

  it('is case-insensitive for exact match', () => {
    expect(gradeAnswer('HALLOWEEN', 'halloween')).toEqual({ grade: 'exact', xp: 100 })
  })

  it('trims whitespace before grading', () => {
    expect(gradeAnswer('  Halloween  ', 'Halloween')).toEqual({ grade: 'exact', xp: 100 })
  })

  it('matches accepted variant exactly', () => {
    expect(gradeAnswer('mike myers', 'michael myers', ['mike myers'])).toEqual({ grade: 'exact', xp: 100 })
  })

  it('substring match (correct inside input) returns close', () => {
    // user typed more than the answer
    expect(gradeAnswer('michael myers kills', 'michael myers')).toEqual({ grade: 'close', xp: 60 })
  })

  it('substring match (input inside correct) returns close', () => {
    expect(gradeAnswer('michael', 'michael myers')).toEqual({ grade: 'close', xp: 60 })
  })

  it('variant substring match returns close', () => {
    expect(gradeAnswer('mike', 'michael myers', ['mike myers'])).toEqual({ grade: 'close', xp: 60 })
  })

  it('typo within distance 2 returns close', () => {
    // "Halloween" — 1 char off
    expect(gradeAnswer('Hallowen', 'Halloween')).toEqual({ grade: 'close', xp: 60 })
  })

  it('typo within distance 4 returns partial', () => {
    // "hallowing" is 3 substitutions from "halloween", no substring overlap
    expect(gradeAnswer('hallowing', 'halloween')).toEqual({ grade: 'partial', xp: 20 })
  })

  it('completely wrong answer returns wrong', () => {
    expect(gradeAnswer('Friday the 13th', 'Halloween')).toEqual({ grade: 'wrong', xp: 0 })
  })

  it('empty input returns wrong', () => {
    expect(gradeAnswer('', 'Halloween')).toEqual({ grade: 'wrong', xp: 0 })
  })

  it('checks variants for levenshtein distance too', () => {
    // "mikes" is 1 away from variant "myers" — wait, no, let's do a real one
    // variant: "mike" — input: "miki" — dist 1 → close
    expect(gradeAnswer('miki', 'michael myers', ['mike'])).toEqual({ grade: 'close', xp: 60 })
  })
})
