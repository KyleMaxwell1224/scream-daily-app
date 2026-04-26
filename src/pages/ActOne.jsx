import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { getDayNumber, gradeAnswer } from '../utils/questions'

const CLUES = [
  { key: 'year',     label: 'Year',     penalty: 5  },
  { key: 'director', label: 'Director', penalty: 8  },
  { key: 'subgenre', label: 'Sub-genre', penalty: 5 },
]

function HouseSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 340 191" preserveAspectRatio="xMidYMid slice">
      <rect width="340" height="191" fill="#120808"/>
      <rect x="0" y="100" width="340" height="91" fill="#0d0505"/>
      <rect x="60" y="60" width="220" height="140" rx="2" fill="#1a0c0c"/>
      <rect x="80" y="75" width="80" height="110" fill="#0f0707"/>
      <rect x="180" y="75" width="80" height="110" fill="#0f0707"/>
      <rect x="85" y="80" width="70" height="50" rx="1" fill="#1e1010"/>
      <rect x="185" y="80" width="70" height="50" rx="1" fill="#1e1010"/>
      <rect x="85" y="138" width="30" height="47" fill="#120909"/>
      <rect x="123" y="150" width="20" height="35" fill="#120909"/>
      <rect x="185" y="138" width="30" height="47" fill="#120909"/>
      <rect x="223" y="150" width="20" height="35" fill="#120909"/>
      <rect x="152" y="110" width="36" height="80" fill="#0e0606"/>
      <ellipse cx="170" cy="108" rx="8" ry="14" fill="#1f0d0d"/>
      <defs>
        <linearGradient id="topfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0606" stopOpacity="1"/>
          <stop offset="100%" stopColor="#0e0606" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="botfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0404" stopOpacity="0"/>
          <stop offset="100%" stopColor="#0a0404" stopOpacity="1"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="340" height="60" fill="url(#topfade)"/>
      <rect x="0" y="150" width="340" height="41" fill="url(#botfade)"/>
    </svg>
  )
}

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

  const penaltyTotal = CLUES.filter(c => usedClues[c.key]).reduce((s, c) => s + c.penalty, 0)
  const maxXP = Math.max(0, 25 - penaltyTotal)

  useEffect(() => {
    if (!result) return
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate('/act/2')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, navigate])

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

      <div className="sd-act-header">
        <span className="sd-act-badge">ACT I</span>
        <span className="sd-act-title">Scene of the crime</span>
        <span className="sd-xp-pill">25 xp</span>
      </div>

      {/* Image area */}
      <div style={{ padding: '0 var(--sd-px)' }}>
        <div style={{
          position: 'relative', width: '100%', paddingTop: '56.25%',
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--sd-border)',
          background: '#120808',
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {q?.image_url ? (
              <img
                src={q.image_url}
                alt="Identify this horror film"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <HouseSVG />
            )}
          </div>
        </div>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 9,
          color: 'var(--sd-muted)', textAlign: 'center', marginTop: 6,
        }}>
          Day #{dayNum} · Identify this film
        </div>
      </div>

      {/* Clue buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '14px var(--sd-px)' }}>
        {CLUES.map(({ key, label, penalty }) => (
          <button
            key={key}
            onClick={() => revealClue(key)}
            style={{
              flex: 1, background: usedClues[key] ? 'var(--sd-card2)' : 'var(--sd-card)',
              border: '1px solid var(--sd-border)', borderRadius: 8,
              padding: '8px 4px', cursor: usedClues[key] ? 'default' : 'pointer',
              opacity: usedClues[key] ? 0.5 : 1,
            }}
          >
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-cream-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            {usedClues[key] ? (
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 13, color: 'var(--sd-cream)', marginTop: 2 }}>
                {revealedClues[key]}
              </div>
            ) : (
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-red)', marginTop: 2 }}>
                −{penalty} xp
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{
        fontFamily: "'Special Elite', serif", fontSize: 12,
        color: 'var(--sd-muted)', textAlign: 'center', padding: '0 var(--sd-px) 12px',
      }}>
        What horror film is this scene from?
      </div>

      <input
        className="sd-input"
        value={answer}
        onChange={e => !result && setAnswer(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !result && answer.trim()) handleSubmit() }}
        placeholder="Type your answer..."
        disabled={!!result}
        autoFocus={!result}
        style={{ opacity: result ? 0.6 : 1 }}
      />


      {/* Result */}
      {result && (
        <div style={{
          margin: '10px var(--sd-px) 4px',
          background: result.correct ? 'rgba(45,102,64,0.2)' : 'rgba(90,18,18,0.2)',
          border: `1px solid ${result.correct ? 'rgba(45,102,64,0.4)' : 'rgba(192,21,42,0.3)'}`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 20, color: result.correct ? '#7cc48a' : '#e24b4a', marginBottom: 2 }}>
            {result.correct ? 'Correct.' : 'Wrong.'}
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: result.correct ? '#7cc48a' : '#e24b4a' }}>
            +{result.xp} xp
          </div>
          {q && (
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', marginTop: 10, paddingTop: 8 }}>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)' }}>{q.correct_answer}</div>
              {q.decade && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 2 }}>{q.decade}</div>}
              {q.authored_by && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>Dir. {q.authored_by}</div>}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '10px 0 6px' }}>
        <button
          className="sd-cta-btn"
          onClick={result ? () => navigate('/act/2') : handleSubmit}
          disabled={!result && !answer.trim()}
        >
          {result ? 'Continue' : 'Lock it in'}
        </button>
      </div>

      {!result && (
        <button className="sd-skip-link" onClick={() => { completeAct(1, 0); navigate('/act/2') }}>
          Skip — 0 xp
        </button>
      )}

      </div>
      <BottomNav activePage="ritual" />
    </div>
  )
}
