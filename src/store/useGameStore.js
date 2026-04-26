import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function todayStr() {
  return new Date().toISOString().slice(0, 10) // "2026-04-25"
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const DAILY_RESET = {
  completedActs: [],
  xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
  act2CurrentQuestion: 0,
  act2Answers: [],      // bool[] — whether each answer was correct
  act2Selections: [],   // string[] — the actual option picked for each question
  todayQuestions: { act1: null, act2: [], act3: null, act4: null },
  // Per-act answer snapshots — keeps result visible after refresh
  // act1: { answer, correct, xp }
  // act3: { selected, revealed }
  // act4: { answer, grade, xp }
  actResults: { act1: null, act3: null, act4: null },
  ritualBanked: false,
}

const useGameStore = create(
  persist(
    (set, get) => ({
      // ── Daily session state (resets each new day) ─────────────────
      todayQuestions: { act1: null, act2: [], act3: null, act4: null },
      completedActs: [],
      xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
      act2CurrentQuestion: 0,
      act2Answers: [],
      act2Selections: [],
      actResults: { act1: null, act3: null, act4: null },
      ritualBanked: false,

      // ── Long-term stats ───────────────────────────────────────────
      // userXP = XP from all PREVIOUS days (never includes today's xpEarned)
      // displayXP = userXP + sum(xpEarned) — computed in components
      userXP: 0,
      streak: 0,
      daysPlayed: 0,
      lastPlayedDate: null,    // ISO date of last app visit
      lastCompletedDate: null, // ISO date of last fully completed ritual

      // ── Profile ───────────────────────────────────────────────────
      username: '',
      favoriteSlasher: '',

      // ── Accuracy ─────────────────────────────────────────────────
      totalCorrect: 0,
      totalAnswered: 0,

      // ── Auth (not persisted) ──────────────────────────────────────
      session: null,

      // ── Actions ───────────────────────────────────────────────────

      setTodayQuestions: (questions) => set({ todayQuestions: questions }),
      setUsername: (username) => set({ username }),
      setFavoriteSlasher: (favoriteSlasher) => set({ favoriteSlasher }),

      setActResult: (actNum, result) => set((state) => ({
        actResults: { ...state.actResults, [`act${actNum}`]: result },
      })),

      completeAct: (actNum, xp) => set((state) => {
        const newCompletedActs = state.completedActs.includes(actNum)
          ? state.completedActs
          : [...state.completedActs, actNum]

        const newXpEarned = { ...state.xpEarned, [`act${actNum}`]: xp }
        const allDone = [1, 2, 3, 4].every(n => newCompletedActs.includes(n))

        // Bank streak/daysPlayed as soon as all 4 acts are done
        if (allDone && !state.ritualBanked) {
          const today = todayStr()
          const yesterday = yesterdayStr()
          let newStreak
          if (!state.lastCompletedDate)                    newStreak = 1
          else if (state.lastCompletedDate === yesterday)  newStreak = state.streak + 1
          else if (state.lastCompletedDate === today)      newStreak = state.streak
          else                                             newStreak = 1

          // Tally accuracy for today's ritual
          const act1Correct  = state.actResults.act1?.correct ? 1 : 0
          const act2Correct  = state.act2Answers.filter(Boolean).length
          const act3Correct  = (state.actResults.act3?.selected != null &&
                                state.actResults.act3.selected === state.todayQuestions.act3?.correct_answer) ? 1 : 0
          const act4Correct  = state.actResults.act4?.grade !== 'wrong' && state.actResults.act4?.grade != null ? 1 : 0
          const todayCorrect  = act1Correct + act2Correct + act3Correct + act4Correct
          const todayAnswered = 8 // 1 + 5 + 1 + 1

          return {
            completedActs: newCompletedActs,
            xpEarned: newXpEarned,
            streak: newStreak,
            daysPlayed: state.daysPlayed + 1,
            lastCompletedDate: today,
            lastPlayedDate: today,
            ritualBanked: true,
            totalCorrect: state.totalCorrect + todayCorrect,
            totalAnswered: state.totalAnswered + todayAnswered,
          }
        }

        return {
          completedActs: newCompletedActs,
          xpEarned: newXpEarned,
          lastPlayedDate: todayStr(),
        }
      }),

      advanceAct2Question: () => set((state) => ({
        act2CurrentQuestion: state.act2CurrentQuestion + 1,
      })),

      recordAct2Answer: (correct, selected) => set((state) => ({
        act2Answers: [...state.act2Answers, correct],
        act2Selections: [...state.act2Selections, selected],
      })),

      getTotalXP: () => {
        const { xpEarned } = get()
        return Object.values(xpEarned).reduce((sum, v) => sum + v, 0)
      },

      bankBackfillXP: (xp) => set((state) => ({ userXP: state.userXP + xp })),

      setSession: (session) => set({ session }),

      // Called on every app mount — rolls over to a new day when needed
      checkNewDay: () => set((state) => {
        const today = todayStr()
        if (state.lastPlayedDate === today) return {} // nothing to do

        // Fold yesterday's earned XP into the permanent total
        const prevXP = Object.values(state.xpEarned).reduce((s, v) => s + v, 0)

        // If the last completed ritual was before yesterday, streak is broken
        const yesterday = yesterdayStr()
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

      reset: () => set({ ...DAILY_RESET }),
    }),
    {
      name: 'scream-daily-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist everything except the live Supabase session
      partialize: (state) => {
        const { session, ...rest } = state
        return rest
      },
    }
  )
)

export default useGameStore
