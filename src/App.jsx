import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import ActOne from './pages/ActOne'
import ActTwo from './pages/ActTwo'
import ActThree from './pages/ActThree'
import ActFour from './pages/ActFour'
import Results from './pages/Results'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'
import PastRitual from './pages/PastRitual'
import useGameStore from './store/useGameStore'
import { supabase } from './supabaseClient'
import { pushStats, pullStats, logRitual } from './utils/syncStats'

// Handles auth state changes app-wide so OAuth redirects (which land on /)
// always trigger setSession + pullStats regardless of which page is mounted.
function AuthInit() {
  const setSession = useGameStore((s) => s.setSession)
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await pullStats(session)
        // Send new OAuth users (no username yet) straight to profile setup
        const { username } = useGameStore.getState()
        if (!username) navigate('/profile')
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function AppInner() {
  const checkNewDay = useGameStore((s) => s.checkNewDay)
  const ritualBanked = useGameStore((s) => s.ritualBanked)
  const completedActs = useGameStore((s) => s.completedActs)
  const session = useGameStore((s) => s.session)

  useEffect(() => {
    checkNewDay()
    if (session) pushStats(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push XP to leaderboard after each act so rankings stay current
  useEffect(() => {
    if (completedActs.length > 0 && session) pushStats(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedActs])

  // Push stats and log ritual when the full ritual is banked
  useEffect(() => {
    if (ritualBanked && session) {
      pushStats(session)
      const state = useGameStore.getState()
      const total = Object.values(state.xpEarned).reduce((s, v) => s + v, 0)
      const today = new Date().toISOString().slice(0, 10)
      logRitual(session, today, total, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritualBanked])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/act/1" element={<ActOne />} />
      <Route path="/act/2" element={<ActTwo />} />
      <Route path="/act/3" element={<ActThree />} />
      <Route path="/act/4" element={<ActFour />} />
      <Route path="/results" element={<Results />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/past/:date" element={<PastRitual />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInit />
      <AppInner />
    </BrowserRouter>
  )
}
