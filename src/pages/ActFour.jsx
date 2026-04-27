import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import ActFourView from '../components/ActFourView'
import useGameStore from '../store/useGameStore'
import { gradeAnswer, getTodaysQuestions } from '../utils/questions'

export default function ActFour() {
  const navigate = useNavigate()
  const { todayQuestions, setTodayQuestions, completeAct, actResults, setActResult } = useGameStore()
  const saved = actResults.act4

  const [answer, setAnswer] = useState(saved?.answer ?? '')
  const [result, setResult] = useState(saved ? { grade: saved.grade, xp: saved.xp } : null)
  const [loading, setLoading] = useState(!todayQuestions.act4)

  const q = todayQuestions.act4

  useEffect(() => {
    if (!q) {
      getTodaysQuestions().then(qs => {
        setTodayQuestions(qs)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit() {
    if (!q || result) return
    const r = gradeAnswer(answer, q.correct_answer, q.accepted_variants || [])
    setResult(r)
    setActResult(4, { answer, grade: r.grade, xp: r.xp })
    completeAct(4, r.xp)
  }

  if (loading || !q) {
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', marginTop: 80 }}>
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={4} />
      <div className="sd-game-content">
        <ActFourView
          q={q}
          answer={answer}
          setAnswer={setAnswer}
          result={result}
          onSubmit={handleSubmit}
          onContinue={() => navigate('/results')}
          onSkip={() => { completeAct(4, 0); navigate('/results') }}
        />
      </div>
      <BottomNav activePage="ritual" />
    </div>
  )
}
