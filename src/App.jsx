import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import AmbientLayer from './components/AmbientLayer'
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
import NotFound from './pages/NotFound'
import useGameStore from './store/useGameStore'
import { supabase } from './supabaseClient'
import { pushStats, pullStats, logRitual } from './utils/syncStats'

function getActivePage(pathname) {
  if (pathname === '/' || pathname.startsWith('/act/') || pathname.startsWith('/results') || pathname.startsWith('/past/') || pathname.startsWith('/history')) return 'ritual'
  if (pathname.startsWith('/leaderboard')) return 'leaderboard'
  if (pathname.startsWith('/profile'))     return 'profile'
  return 'ritual'
}

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

  const location = useLocation()
  const activePage = getActivePage(location.pathname)

  return (
    <>
      <AmbientLayer />
      <Header activePage={activePage} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location} key={location.pathname}>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <BottomNav activePage={activePage} />
    </>
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
