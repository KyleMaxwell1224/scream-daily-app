import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ActOne from './pages/ActOne'
import ActTwo from './pages/ActTwo'
import ActThree from './pages/ActThree'
import ActFour from './pages/ActFour'
import Results from './pages/Results'
import Profile from './pages/Profile'

export default function App() {
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
      </Routes>
    </BrowserRouter>
  )
}
