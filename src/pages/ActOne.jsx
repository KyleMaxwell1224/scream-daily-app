import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import Act1GameView from '../components/Act1GameView'
import useGameStore from '../store/useGameStore'
import { getDayNumber, gradeAnswer } from '../utils/questions'
import { BASE_XP, ACT1_CLUES } from '../utils/gameConfig'

export default function ActOne() {
  const navigate = useNavigate()
  const { completeAct, todayQuestions, actResults, setActResult } = useGameStore()
  const q = todayQuestions.act1
  const dayNum = getDayNumber()
  const saved = actResults.act1

  const [answer, setAnswer] = useState(saved?.answer ?? '')
  const [result, setResult] = useState(saved ? { correct: saved.correct, xp: saved.xp } : null)
  const [usedClues, setUsedClues] = useState({})
  const [revealedClues, setRevealedClues] = useState({})

  const penaltyTotal = ACT1_CLUES.filter(c => usedClues[c.key]).reduce((s, c) => s + c.penalty, 0)
  const maxXP = Math.max(0, BASE_XP.act1 - penaltyTotal)

  function revealClue(key) {
    if (usedClues[key] || result) return
    setUsedClues(prev => ({ ...prev, [key]: true }))
    if (q) {
      const val = key === 'year' ? q.decade : key === 'director' ? (q.authored_by || '—') : q.subgenre
      setRevealedClues(prev => ({ ...prev, [key]: val || '—' }))
    }
  }

  function handleSubmit() {
    if (!q || result) return
    const grade = gradeAnswer(answer, q.correct_answer, q.accepted_variants || [])
    const xp = grade.grade === 'wrong' ? 0 : maxXP
    const r = { correct: grade.grade !== 'wrong', xp }
    setResult(r)
    setActResult(1, { answer, correct: r.correct, xp: r.xp })
    completeAct(1, xp)
  }

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={1} />
      <div className="sd-game-content">
        <Act1GameView
          q={q}
          answer={answer}
          setAnswer={setAnswer}
          result={result}
          maxXP={maxXP}
          onSubmit={handleSubmit}
          onContinue={() => navigate('/act/2')}
          clues={ACT1_CLUES}
          usedClues={usedClues}
          revealedClues={revealedClues}
          onRevealClue={revealClue}
          dayNum={dayNum}
          onSkip={() => { completeAct(1, 0); navigate('/act/2') }}
        />
      </div>
      <BottomNav activePage="ritual" />
    </div>
  )
}
