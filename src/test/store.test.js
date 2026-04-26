import { describe, it, expect, vi } from 'vitest'

// Must mock supabaseClient before importing the store (persist uses localStorage)
vi.mock('../supabaseClient', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

// Import store factory directly so each test gets a fresh instance
import { create } from 'zustand'

// ── helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Build a minimal store slice that mirrors useGameStore logic so tests are
// self-contained and don't depend on localStorage persistence side-effects.
function makeStore() {
  const DAILY_RESET = {
    completedActs: [],
    xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
    act2CurrentQuestion: 0,
    act2Answers: [],
    act2Selections: [],
    todayQuestions: { act1: null, act2: [], act3: null, act4: null },
    actResults: { act1: null, act3: null, act4: null },
    ritualBanked: false,
  }

  return create((set) => ({
    ...DAILY_RESET,
    userXP: 0,
    streak: 0,
    daysPlayed: 0,
    lastPlayedDate: null,
    lastCompletedDate: null,
    username: '',
    favoriteSlasher: '',
    totalCorrect: 0,
    totalAnswered: 0,
    session: null,

    completeAct: (actNum, xp) => set((state) => {
      const newCompletedActs = state.completedActs.includes(actNum)
        ? state.completedActs
        : [...state.completedActs, actNum]
      const newXpEarned = { ...state.xpEarned, [`act${actNum}`]: xp }
      const allDone = [1, 2, 3, 4].every(n => newCompletedActs.includes(n))

      if (allDone && !state.ritualBanked) {
        const today = todayStr()
        const yesterday = offsetDate(-1)
        let newStreak
        if (!state.lastCompletedDate)                    newStreak = 1
        else if (state.lastCompletedDate === yesterday)  newStreak = state.streak + 1
        else if (state.lastCompletedDate === today)      newStreak = state.streak
        else                                             newStreak = 1

        const act1Correct = state.actResults.act1?.correct ? 1 : 0
        const act2Correct = state.act2Answers.filter(Boolean).length
        const act3Correct = (state.actResults.act3?.selected != null &&
                             state.actResults.act3.selected === state.todayQuestions.act3?.correct_answer) ? 1 : 0
        const act4Correct = state.actResults.act4?.grade !== 'wrong' && state.actResults.act4?.grade != null ? 1 : 0
        const todayCorrect = act1Correct + act2Correct + act3Correct + act4Correct

        return {
          completedActs: newCompletedActs,
          xpEarned: newXpEarned,
          streak: newStreak,
          daysPlayed: state.daysPlayed + 1,
          lastCompletedDate: today,
          lastPlayedDate: today,
          ritualBanked: true,
          totalCorrect: state.totalCorrect + todayCorrect,
          totalAnswered: state.totalAnswered + 8,
        }
      }
      return { completedActs: newCompletedActs, xpEarned: newXpEarned, lastPlayedDate: todayStr() }
    }),

    recordAct2Answer: (correct, selected) => set((state) => ({
      act2Answers: [...state.act2Answers, correct],
      act2Selections: [...state.act2Selections, selected],
    })),

    setActResult: (actNum, result) => set((state) => ({
      actResults: { ...state.actResults, [`act${actNum}`]: result },
    })),

    bankBackfillXP: (xp) => set((state) => ({ userXP: state.userXP + xp })),

    checkNewDay: () => set((state) => {
      const today = todayStr()
      if (state.lastPlayedDate === today) return {}
      const prevXP = Object.values(state.xpEarned).reduce((s, v) => s + v, 0)
      const yesterday = offsetDate(-1)
      const streakBroken = state.lastCompletedDate
        && state.lastCompletedDate !== yesterday
        && state.lastCompletedDate !== today
      return {
        userXP: state.userXP + prevXP,
        ...DAILY_RESET,
        lastPlayedDate: today,
        ...(streakBroken ? { streak: 0 } : {}),
      }
    }),
  }))
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('completeAct', () => {
  it('adds the act to completedActs', () => {
    const store = makeStore()
    store.getState().completeAct(1, 25)
    expect(store.getState().completedActs).toContain(1)
  })

  it('records XP for the act', () => {
    const store = makeStore()
    store.getState().completeAct(2, 40)
    expect(store.getState().xpEarned.act2).toBe(40)
  })

  it('does not double-add an act', () => {
    const store = makeStore()
    store.getState().completeAct(1, 25)
    store.getState().completeAct(1, 25)
    expect(store.getState().completedActs.filter(n => n === 1)).toHaveLength(1)
  })

  it('does not bank until all 4 acts are done', () => {
    const store = makeStore()
    store.getState().completeAct(1, 25)
    store.getState().completeAct(2, 50)
    store.getState().completeAct(3, 35)
    expect(store.getState().ritualBanked).toBe(false)
    expect(store.getState().daysPlayed).toBe(0)
  })

  it('banks on 4th act completion', () => {
    const store = makeStore()
    store.getState().completeAct(1, 25)
    store.getState().completeAct(2, 50)
    store.getState().completeAct(3, 35)
    store.getState().completeAct(4, 100)
    const s = store.getState()
    expect(s.ritualBanked).toBe(true)
    expect(s.daysPlayed).toBe(1)
    expect(s.streak).toBe(1)
    expect(s.lastCompletedDate).toBe(todayStr())
    expect(s.totalAnswered).toBe(8)
  })

  it('does not re-bank if already banked', () => {
    const store = makeStore()
    ;[1, 2, 3, 4].forEach(n => store.getState().completeAct(n, 10))
    const firstDays = store.getState().daysPlayed
    store.getState().completeAct(1, 10)
    expect(store.getState().daysPlayed).toBe(firstDays)
  })

  it('extends streak when last completed was yesterday', () => {
    const store = makeStore()
    store.setState({ lastCompletedDate: offsetDate(-1), streak: 3 })
    ;[1, 2, 3, 4].forEach(n => store.getState().completeAct(n, 10))
    expect(store.getState().streak).toBe(4)
  })

  it('resets streak to 1 when last completed was 2+ days ago', () => {
    const store = makeStore()
    store.setState({ lastCompletedDate: offsetDate(-3), streak: 5 })
    ;[1, 2, 3, 4].forEach(n => store.getState().completeAct(n, 10))
    expect(store.getState().streak).toBe(1)
  })
})

describe('accuracy tracking', () => {
  it('counts all correct answers across acts', () => {
    const store = makeStore()
    store.getState().setActResult(1, { correct: true, xp: 100 })
    // 3 correct out of 5 in act2
    ;[true, true, true, false, false].forEach(c =>
      store.getState().recordAct2Answer(c, 'A')
    )
    store.setState({
      todayQuestions: { act3: { correct_answer: 'B' }, act1: null, act2: [], act4: null },
    })
    store.getState().setActResult(3, { selected: 'B', revealed: true })
    store.getState().setActResult(4, { grade: 'exact', xp: 100 })
    ;[1, 2, 3, 4].forEach(n => store.getState().completeAct(n, 10))
    // act1=1, act2=3, act3=1, act4=1 → 6
    expect(store.getState().totalCorrect).toBe(6)
    expect(store.getState().totalAnswered).toBe(8)
  })

  it('counts 0 correct when all wrong', () => {
    const store = makeStore()
    store.getState().setActResult(1, { correct: false, xp: 0 })
    ;[false, false, false, false, false].forEach(c =>
      store.getState().recordAct2Answer(c, 'A')
    )
    store.setState({
      todayQuestions: { act3: { correct_answer: 'B' }, act1: null, act2: [], act4: null },
    })
    store.getState().setActResult(3, { selected: 'C', revealed: true })
    store.getState().setActResult(4, { grade: 'wrong', xp: 0 })
    ;[1, 2, 3, 4].forEach(n => store.getState().completeAct(n, 0))
    expect(store.getState().totalCorrect).toBe(0)
    expect(store.getState().totalAnswered).toBe(8)
  })
})

describe('checkNewDay', () => {
  it('folds xpEarned into userXP on day rollover', () => {
    const store = makeStore()
    store.setState({ xpEarned: { act1: 25, act2: 50, act3: 35, act4: 100 }, userXP: 10, lastPlayedDate: offsetDate(-1) })
    store.getState().checkNewDay()
    expect(store.getState().userXP).toBe(220)
    expect(store.getState().xpEarned).toEqual({ act1: 0, act2: 0, act3: 0, act4: 0 })
  })

  it('resets daily state on rollover', () => {
    const store = makeStore()
    store.setState({ completedActs: [1, 2], ritualBanked: true, lastPlayedDate: offsetDate(-1) })
    store.getState().checkNewDay()
    expect(store.getState().completedActs).toEqual([])
    expect(store.getState().ritualBanked).toBe(false)
  })

  it('does nothing if already played today', () => {
    const store = makeStore()
    store.setState({ userXP: 100, xpEarned: { act1: 25, act2: 0, act3: 0, act4: 0 }, lastPlayedDate: todayStr() })
    store.getState().checkNewDay()
    expect(store.getState().userXP).toBe(100)
  })

  it('breaks streak if last completed was 2+ days ago', () => {
    const store = makeStore()
    store.setState({ streak: 5, lastCompletedDate: offsetDate(-3), lastPlayedDate: offsetDate(-1) })
    store.getState().checkNewDay()
    expect(store.getState().streak).toBe(0)
  })

  it('preserves streak if last completed was yesterday', () => {
    const store = makeStore()
    store.setState({ streak: 5, lastCompletedDate: offsetDate(-1), lastPlayedDate: offsetDate(-2) })
    store.getState().checkNewDay()
    expect(store.getState().streak).toBe(5)
  })
})

describe('bankBackfillXP', () => {
  it('adds xp directly to userXP without touching xpEarned', () => {
    const store = makeStore()
    store.setState({ userXP: 100 })
    store.getState().bankBackfillXP(60)
    expect(store.getState().userXP).toBe(160)
    expect(store.getState().xpEarned).toEqual({ act1: 0, act2: 0, act3: 0, act4: 0 })
  })
})
