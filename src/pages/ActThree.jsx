import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'

const LETTERS = ['A', 'B', 'C', 'D']

export default function ActThree() {
  const navigate = useNavigate()
  const { todayQuestions, setTodayQuestions, completeAct } = useGameStore()

  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)

  const q = todayQuestions.act3

  useEffect(() => {
    if (!q) {
      setLoading(true)
      supabase.from('questions').select('*').eq('act', 3).limit(1)
        .then(({ data }) => {
          const current = useGameStore.getState().todayQuestions
          setTodayQuestions({ ...current, act3: data?.[0] || null })
          setLoading(false)
        })
    }
  }, [])

  function handleConfirm() {
    if (!revealed) {
      setRevealed(true)
    } else {
      const xp = selected === q.correct_answer ? 35 : 0
      completeAct(3, xp)
      navigate('/act/4')
    }
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

  const options = q.options || []
  const isCorrect = revealed && selected === q.correct_answer

  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={3} />
      <div className="sd-game-content">

      <div className="sd-act-header">
        <span className="sd-act-badge">ACT III</span>
        <span className="sd-act-title">Speak of the devil</span>
        <span className="sd-xp-pill">35 xp</span>
      </div>

      {/* Quote card */}
      <div style={{
        margin: '4px var(--sd-px) 14px',
        background: 'var(--sd-card)',
        borderRadius: 14,
        border: '1px solid var(--sd-border)',
        borderLeft: '3px solid var(--sd-red)',
        padding: '20px 18px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -10, left: 8,
          fontFamily: "'Creepster', cursive", fontSize: 80,
          color: 'rgba(192, 21, 42, 0.15)', lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>"</div>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 15,
          color: 'var(--sd-cream)', fontStyle: 'italic', lineHeight: 1.75,
          position: 'relative', zIndex: 1,
        }}>
          {q.quote || q.question}
        </div>
        {q.attribution && (
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 10,
            color: 'var(--sd-muted)', marginTop: 12,
          }}>
            — {q.attribution}
          </div>
        )}
      </div>

      <div style={{
        fontFamily: "'Special Elite', serif", fontSize: 11,
        color: 'var(--sd-muted)', textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        padding: '0 var(--sd-px) 14px',
      }}>
        Which horror film is this quote from?
      </div>

      <div className="sd-options">
        {options.map((opt, i) => (
          <button key={i} className={getOptionClass(opt)} onClick={() => !revealed && setSelected(opt)}>
            <span className="sd-option-letter">{LETTERS[i]}</span>
            <span className="sd-option-text">{opt}</span>
            {revealed && opt === q.correct_answer && <span className="sd-option-icon">✓</span>}
            {revealed && opt === selected && opt !== q.correct_answer && <span className="sd-option-icon">✕</span>}
          </button>
        ))}
      </div>

      {revealed && (
        <div className={`sd-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? `+35 xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not this time.'}
        </div>
      )}

      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <button className="sd-cta-btn" onClick={handleConfirm} disabled={!selected && !revealed}>
          {!revealed ? 'Confirm' : 'Next: Final Reckoning'}
        </button>
      </div>

      <button className="sd-skip-link" onClick={() => { completeAct(3, 0); navigate('/act/4') }}>
        Skip — 0 xp
      </button>

      </div>
      <BottomNav activePage="ritual" />
    </div>
  )
}
