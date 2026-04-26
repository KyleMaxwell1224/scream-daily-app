import { describe, it, expect } from 'vitest'
import { getRankForXP, getNextRank, RANKS } from '../utils/ranks'

describe('getRankForXP', () => {
  it('returns first rank at 0 XP', () => {
    expect(getRankForXP(0).name).toBe('The Babysitter')
  })

  it('returns first rank just below second threshold', () => {
    expect(getRankForXP(99).name).toBe('The Babysitter')
  })

  it('advances rank at exact threshold', () => {
    expect(getRankForXP(100).name).toBe('Camp Counselor')
  })

  it('stays in rank between thresholds', () => {
    expect(getRankForXP(250).name).toBe('Camp Counselor')
  })

  it('returns highest rank beyond max threshold', () => {
    expect(getRankForXP(99999).name).toBe('The Entity')
  })

  it('returns correct rank at each threshold', () => {
    for (const rank of RANKS) {
      expect(getRankForXP(rank.minXP).name).toBe(rank.name)
    }
  })
})

describe('getNextRank', () => {
  it('returns second rank when at 0 XP', () => {
    expect(getNextRank(0).name).toBe('Camp Counselor')
  })

  it('returns next rank just below threshold', () => {
    expect(getNextRank(99).name).toBe('Camp Counselor')
  })

  it('returns rank after the one just entered', () => {
    expect(getNextRank(100).name).toBe('The Final Girl')
  })

  it('returns null at max rank', () => {
    expect(getNextRank(5000)).toBeNull()
    expect(getNextRank(99999)).toBeNull()
  })
})
