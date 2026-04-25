import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'

const LETTERS = ['A', 'B', 'C', 'D']

export default function ActTwo() {
  const navigate = useNavigate()
  const {
    todayQuestions, setTodayQuestions,
    act2CurrentQuestion, act2Answers,
    advanceAct2Question, recordAct2Answer,
    completeAct, xpEarned,
  } = useGameStore()

  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)

  const questions = todayQuestions.act2
  const qIndex = act2CurrentQuestion
  const q = questions[qIndex]

  useEffect(() => {
    if (questions.length === 0) {
      setLoading(true)
      supabase.from('questions').select('*').eq('act', 2).limit(5)
        .then(({ data }) => {
          const current = useGameStore.getState().todayQuestions
      setTodayQuestions({ ...current, act2: data || [] })
          setLoading(false)
        })
    }
  }, [])

  function handleSelect(opt) {
    if (revealed) return
    setSelected(opt)
  }

  function handleConfirm() {
    if (!revealed) {
      const correct = selected === q.correct_answer
      recordAct2Answer(correct)
      setRevealed(true)
    } else {
      setSelected(null)
      setRevealed(false)
      if (qIndex + 1 >= 5) {
        const totalXP = useGameStore.getState().act2Answers.filter(Boolean).length * 10
        completeAct(2, totalXP)
        navigate('/act/3')
      } else {
        advanceAct2Question()
      }
    }
  }

  if (loading || !q) {
    return (
      <div className="sd-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Logo />
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', marginTop: 40 }}>
          Loading questions…
        </div>
      </div>
    )
  }

  const options = q.options || []
  const isCorrect = revealed && selected === q.correct_answer
  const isLast = qIndex === 4

  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }

  return (
    <div className="sd-wrap">
      <Logo />
      <ProgressBar currentAct={2} />

      <div className="sd-act-header">
        <span className="sd-act-badge">ACT II</span>
        <span className="sd-act-title">The Inquisition</span>
        <span className="sd-xp-pill">50 xp</span>
      </div>

      {/* Counter + dot tracker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--sd-px) 12px' }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>
          Question {qIndex + 1} of 5
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3, 4].map(i => {
            let bg = 'rgba(255,255,255,0.08)'
            if (i < qIndex || (i === qIndex && revealed)) bg = '#2d6640'
            else if (i === qIndex) bg = 'var(--sd-red)'
            return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: bg }} />
          })}
        </div>
      </div>

      {/* Question card */}
      <div style={{
        margin: '0 var(--sd-px) 14px', background: 'var(--sd-card)',
        borderRadius: 12, padding: '16px',
        border: '1px solid var(--sd-border)',
        minHeight: 90,
      }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>
          {q.question}
        </div>
      </div>

      {/* Options */}
      <div className="sd-options">
        {options.map((opt, i) => (
          <button key={i} className={getOptionClass(opt)} onClick={() => handleSelect(opt)}>
            <span className="sd-option-letter">{LETTERS[i]}</span>
            <span className="sd-option-text">{opt}</span>
            {revealed && opt === q.correct_answer && <span className="sd-option-icon">✓</span>}
            {revealed && opt === selected && opt !== q.correct_answer && <span className="sd-option-icon">✕</span>}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {revealed && (
        <div className={`sd-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? `+10 xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not quite.'}
        </div>
      )}

      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <button
          className="sd-cta-btn"
          onClick={handleConfirm}
          disabled={!selected && !revealed}
        >
          {!revealed ? 'Confirm' : isLast ? 'See Act III' : 'Next question'}
        </button>
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
