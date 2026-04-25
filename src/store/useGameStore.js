import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  todayQuestions: {
    act1: null,
    act2: [],
    act3: null,
    act4: null,
  },

  completedActs: [],
  xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },

  act2CurrentQuestion: 0,
  act2Answers: [],

  userXP: 0,
  streak: 0,
  daysPlayed: 0,
  session: null,

  setTodayQuestions: (questions) => set({ todayQuestions: questions }),

  completeAct: (actNum, xp) => set((state) => ({
    completedActs: state.completedActs.includes(actNum)
      ? state.completedActs
      : [...state.completedActs, actNum],
    xpEarned: { ...state.xpEarned, [`act${actNum}`]: xp },
  })),

  advanceAct2Question: () => set((state) => ({
    act2CurrentQuestion: state.act2CurrentQuestion + 1,
  })),

  recordAct2Answer: (correct) => set((state) => ({
    act2Answers: [...state.act2Answers, correct],
  })),

  getTotalXP: () => {
    const { xpEarned } = get()
    return Object.values(xpEarned).reduce((sum, v) => sum + v, 0)
  },

  setSession: (session) => set({ session }),

  reset: () => set({
    completedActs: [],
    xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
    act2CurrentQuestion: 0,
    act2Answers: [],
    todayQuestions: { act1: null, act2: [], act3: null, act4: null },
  }),
}))

export default useGameStore
