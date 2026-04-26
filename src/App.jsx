import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ActOne from './pages/ActOne'
import ActTwo from './pages/ActTwo'
import ActThree from './pages/ActThree'
import ActFour from './pages/ActFour'
import Results from './pages/Results'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import useGameStore from './store/useGameStore'
import { pushStats } from './utils/syncStats'

export default function App() {
  const checkNewDay = useGameStore((s) => s.checkNewDay)
  const ritualBanked = useGameStore((s) => s.ritualBanked)
  const completedActs = useGameStore((s) => s.completedActs)
  const session = useGameStore((s) => s.session)

  // Roll over to a new day on mount; push updated totals if logged in
  useEffect(() => {
    checkNewDay()
    if (session) pushStats(session)
  }, [])

  // Push XP to leaderboard after each act so rankings stay current
  useEffect(() => {
    if (completedActs.length > 0 && session) pushStats(session)
  }, [completedActs])

  // Push stats whenever the full ritual is banked (streak/daysPlayed update)
  useEffect(() => {
    if (ritualBanked && session) pushStats(session)
  }, [ritualBanked])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/act/1" element={<ActOne />} />
        <Route path="/act/2" element={<ActTwo />} />
        <Route path="/act/3" element={<ActThree />} />
        <Route path="/act/4" element={<ActFour />} />
        <Route path="/results" element={<Results />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}
