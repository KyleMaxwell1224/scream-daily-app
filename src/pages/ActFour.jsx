import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
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

  const gradeColor = result
    ? result.grade === 'exact' ? '#2d6640'
    : result.grade === 'close' ? '#ba7517'
    : result.grade === 'partial' ? '#c0152a'
    : '#5a1212'
    : null

  const gradeLabel = result
    ? result.grade === 'exact' ? 'Perfect.'
    : result.grade === 'close' ? 'Close.'
    : result.grade === 'partial' ? 'Partial.'
    : 'Wrong.'
    : null

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={4} />
      <div className="sd-game-content">

      <div className="sd-act-header">
        <span className="sd-act-badge">ACT IV</span>
        <span className="sd-act-title">Final reckoning</span>
        <span className="sd-xp-pill">0–100 xp</span>
      </div>

      {/* Warning banner */}
      <div style={{
        margin: '4px var(--sd-px) 14px',
        background: 'rgba(192, 21, 42, 0.1)',
        border: '1px solid rgba(192, 21, 42, 0.25)',
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)', lineHeight: 1.5 }}>
          No multiple choice. Type your answer exactly. Partial credit is awarded — the closer you are, the more XP you earn.
        </span>
      </div>

      {/* Question card with pulsing border */}
      <div style={{
        margin: '0 var(--sd-px) 14px',
        background: 'var(--sd-card)',
        borderRadius: 12,
        padding: '16px',
        animation: result ? 'none' : 'pulse-border 3s ease-in-out infinite',
        border: '1px solid var(--sd-border)',
      }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-red)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          The brutal question
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>
          {q.question}
        </div>
      </div>

      {/* XP scale */}
      <div style={{ display: 'flex', gap: 8, padding: '0 var(--sd-px) 14px' }}>
        {[
          { label: 'Exact', val: '100', bg: 'rgba(45,102,64,0.18)', border: 'rgba(45,102,64,0.3)', color: '#7cc48a' },
          { label: 'Close', val: '60',  bg: 'rgba(186,117,23,0.18)', border: 'rgba(186,117,23,0.3)', color: '#d4a04a' },
          { label: 'Partial', val: '20', bg: 'rgba(192,21,42,0.1)', border: 'rgba(192,21,42,0.2)', color: 'var(--sd-cream-dim)' },
        ].map(({ label, val, bg, border, color }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '8px',
            background: bg, border: `1px solid ${border}`, borderRadius: 8,
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 16, color }}>{val}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 8, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', padding: '0 var(--sd-px) 10px' }}>
        Type your answer below — spelling counts
      </div>

      <input
        className="sd-input"
        value={answer}
        onChange={e => !result && setAnswer(e.target.value)}
        placeholder="Type your answer..."
        disabled={!!result}
        style={{ opacity: result ? 0.6 : 1 }}
      />

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textAlign: 'center', padding: '8px var(--sd-px)' }}>
        One attempt only. No going back.
      </div>

      {/* Result card */}
      {result && (
        <div style={{
          margin: '4px var(--sd-px) 14px',
          background: result.grade === 'wrong' ? 'rgba(90,18,18,0.2)' : result.grade === 'exact' ? 'rgba(45,102,64,0.2)' : 'rgba(186,117,23,0.15)',
          border: `1px solid ${gradeColor}44`,
          borderRadius: 12, padding: '16px',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: gradeColor, marginBottom: 4 }}>{gradeLabel}</div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 28, color: gradeColor }}>+{result.xp} xp</div>
          {q.explanation && (
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)', marginTop: 8, lineHeight: 1.5 }}>
              {q.explanation}
            </div>
          )}
          {result.grade !== 'exact' && (
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 6 }}>
              Correct answer: {q.correct_answer}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '4px var(--sd-px) 0' }}>
        <button
          className="sd-cta-btn"
          onClick={result ? () => navigate('/results') : handleSubmit}
          disabled={!answer.trim() && !result}
        >
          {result ? 'See results' : 'Seal your fate'}
        </button>
      </div>

      {!result && (
        <button className="sd-skip-link" onClick={() => { completeAct(4, 0); navigate('/results') }}>
          Skip — 0 xp
        </button>
      )}

      </div>
      <BottomNav activePage="ritual" />
    </div>
  )
}
