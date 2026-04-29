import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { getDayNumber, gradeAnswer } from '../utils/questions'

const CLUES = [
  { key: 'year',     label: 'Year',      penalty: 5  },
  { key: 'director', label: 'Director',  penalty: 8  },
  { key: 'subgenre', label: 'Sub-genre', penalty: 5  },
]

// Page bg — must match .sd-wrap background for the gradient bleed
const PAGE_BG = '#1e1111'

function HouseSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 340 191" preserveAspectRatio="xMidYMid slice">
      <rect width="340" height="191" fill="#1a0e0e"/>
      <rect x="0" y="100" width="340" height="91" fill="#150b0b"/>
      <rect x="60" y="60" width="220" height="140" rx="2" fill="#221414"/>
      <rect x="80" y="75" width="80" height="110" fill="#160e0e"/>
      <rect x="180" y="75" width="80" height="110" fill="#160e0e"/>
      <rect x="85" y="80" width="70" height="50" rx="1" fill="#261616"/>
      <rect x="185" y="80" width="70" height="50" rx="1" fill="#261616"/>
      <rect x="85" y="138" width="30" height="47" fill="#180f0f"/>
      <rect x="123" y="150" width="20" height="35" fill="#180f0f"/>
      <rect x="185" y="138" width="30" height="47" fill="#180f0f"/>
      <rect x="223" y="150" width="20" height="35" fill="#180f0f"/>
      <rect x="152" y="110" width="36" height="80" fill="#130c0c"/>
      <ellipse cx="170" cy="108" rx="8" ry="14" fill="#2a1616"/>
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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/act/2') }
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

        {/* ── Cinematic image block ── */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '52%', overflow: 'hidden', background: '#1a0e0e' }}>

          {/* The film still */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {q?.image_url
              ? <img src={q.image_url} alt="Identify this horror film" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <HouseSVG />
            }
          </div>

          {/* Vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />

          {/* Top scrim — badge reads over image */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,8,8,0.82) 0%, transparent 38%)', pointerEvents: 'none' }} />

          {/* Bottom bleed into page */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${PAGE_BG} 0%, transparent 42%)`, pointerEvents: 'none' }} />

          {/* ACT I — overlaid top-left */}
          <div style={{ position: 'absolute', top: 14, left: 16 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: 'var(--sd-red)', letterSpacing: '0.18em', lineHeight: 1, textShadow: '0 0 12px rgba(192,21,42,0.7)' }}>
              ACT I
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 15, color: 'var(--sd-cream)', letterSpacing: '0.03em', lineHeight: 1.15, marginTop: 3, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
              Scene of the Crime
            </div>
          </div>

          {/* XP pill — overlaid top-right */}
          <div style={{
            position: 'absolute', top: 14, right: 16,
            fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
            border: '0.5px solid rgba(192,21,42,0.55)', borderRadius: 20,
            padding: '3px 9px', background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
          }}>
            {maxXP} xp
          </div>

          {/* Day label — bottom left */}
          {!result && (
            <div style={{
              position: 'absolute', bottom: 14, left: 16,
              fontFamily: "'Special Elite', serif", fontSize: 10,
              color: 'rgba(242,230,212,0.45)', letterSpacing: '0.06em',
            }}>
              Day #{dayNum}
            </div>
          )}

          {/* ── Result overlay — stamped over the image ── */}
          {result && (
            <div className="sd-result-reveal" style={{
              position: 'absolute', inset: 0,
              background: result.correct ? 'rgba(8,28,16,0.92)' : 'rgba(28,6,6,0.92)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '16px 20px', textAlign: 'center',
            }}>
              <div className="sd-stamp-in" style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: result.correct ? '#7cc48a' : '#e24b4a', lineHeight: 1, marginBottom: 2 }}>
                {result.correct ? 'Correct.' : 'Wrong.'}
              </div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 56, color: result.correct ? '#7cc48a' : '#e24b4a', lineHeight: 1, marginBottom: 10 }}>
                +{result.xp} xp
              </div>
              {q && (
                <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.12)', paddingTop: 10, width: '100%' }}>
                  <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: 'var(--sd-cream)', lineHeight: 1.2 }}>
                    {q.correct_answer}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 4, justifyContent: 'center' }}>
                    {q.decade && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>{q.decade}</div>}
                    {q.authored_by && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>Dir. {q.authored_by}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Clue row — invisible after answer (keeps height) ── */}
        <div style={{ display: 'flex', gap: 6, padding: '8px var(--sd-px) 0', visibility: result ? 'hidden' : 'visible' }}>
          {CLUES.map(({ key, label, penalty }) => {
            const used = usedClues[key]
            return (
              <button
                key={key}
                onClick={() => revealClue(key)}
                style={{
                  flex: 1, textAlign: 'center',
                  background: used ? 'rgba(255,255,255,0.02)' : 'rgba(192,21,42,0.06)',
                  border: used ? '1px solid rgba(255,255,255,0.07)' : '1px dashed rgba(192,21,42,0.35)',
                  borderRadius: 8, padding: '8px 4px',
                  cursor: used ? 'default' : 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: used ? 'var(--sd-muted)' : 'rgba(192,230,212,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {label}
                </div>
                {used ? (
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 14, color: 'var(--sd-cream)', marginTop: 2, lineHeight: 1.1 }}>
                    {revealedClues[key]}
                  </div>
                ) : (
                  <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: 'var(--sd-red)', marginTop: 2 }}>
                    −{penalty} xp
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Question prompt — invisible after answer (keeps height) ── */}
        <div style={{ padding: '12px var(--sd-px) 10px', textAlign: 'center', visibility: result ? 'hidden' : 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'linear-gradient(to right, transparent, rgba(192,21,42,0.3))' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(192,21,42,0.6)', boxShadow: '0 0 6px rgba(192,21,42,0.5)' }} />
            <div style={{ flex: 1, height: '0.5px', background: 'linear-gradient(to left, transparent, rgba(192,21,42,0.3))' }} />
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-muted)', letterSpacing: '0.05em', lineHeight: 1.7 }}>
            What horror film is this scene from?
          </div>
        </div>

        {/* ── Input — invisible after answer (keeps height) ── */}
        <input
          className="sd-input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && answer.trim()) handleSubmit() }}
          placeholder="Name the film…"
          autoFocus={!result}
          style={{ fontSize: 20, textAlign: 'center', letterSpacing: '0.03em', background: 'rgba(46,26,26,0.7)', visibility: result ? 'hidden' : 'visible' }}
        />

        {/* ── CTA ── */}
        <div style={{ padding: '12px 0 6px' }}>
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
