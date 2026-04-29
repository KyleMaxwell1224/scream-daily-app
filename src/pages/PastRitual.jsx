import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import ActFourView from '../components/ActFourView'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { gradeAnswer } from '../utils/questions'
import { logRitual, pushStats } from '../utils/syncStats'

function getSaved(date) {
  return useGameStore.getState().pastRitualProgress[date] ?? null
}

const MULT = 0.5
const XP = {
  act1:    Math.floor(25  * MULT), // 12
  act2perQ: Math.floor(10 * MULT), // 5
  act3:    Math.floor(35  * MULT), // 17
  act4:    Math.floor(100 * MULT), // 50
}
const LETTERS = ['A', 'B', 'C', 'D']

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function PastRitual() {
  const { date } = useParams()
  const navigate = useNavigate()
  const {
    session, bankBackfillXP, savePastRitualProgress,
    clearPastRitualProgress, completedBackfills, recordCompletedBackfill,
  } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState(null)
  const [alreadyDone, setAlreadyDone] = useState(completedBackfills[date] != null)
  const [doneXP, setDoneXP] = useState(completedBackfills[date] ?? 0)

  const _saved = getSaved(date)

  const [step, setStep] = useState(_saved?.step ?? 'act1')
  const [act1Answer, setAct1Answer] = useState(_saved?.act1Answer ?? '')
  const [act1Result, setAct1Result] = useState(_saved?.act1Result ?? null)
  const [act2Idx, setAct2Idx] = useState(_saved?.act2Idx ?? 0)
  const [act2Selected, setAct2Selected] = useState(null)
  const [act2Revealed, setAct2Revealed] = useState(false)
  const [act2CorrectCount, setAct2CorrectCount] = useState(_saved?.act2CorrectCount ?? 0)
  const [act3Selected, setAct3Selected] = useState(null)
  const [act3Revealed, setAct3Revealed] = useState(false)
  const [act4Answer, setAct4Answer] = useState('')
  const [act4Result, setAct4Result] = useState(_saved?.act4Result ?? null)
  const [xpByAct, setXpByAct] = useState(_saved?.xpByAct ?? { act1: 0, act2: 0, act3: 0 })
  const bankedRef = useRef(false)

  useEffect(() => {
    async function load() {
      const [{ data: qs }, logResult] = await Promise.all([
        supabase.rpc('get_questions_for_date', { target_date: date }),
        session?.user
          ? supabase.from('ritual_log').select('xp_earned').eq('user_id', session.user.id).eq('date', date).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      if (logResult.data) {
        setAlreadyDone(true)
        setDoneXP(logResult.data.xp_earned)
      }
      setQuestions(qs || null)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, session?.user?.id])

  useEffect(() => {
    if (loading || alreadyDone || step === 'done') return
    savePastRitualProgress(date, {
      step, act1Answer, act1Result, act2Idx, act2CorrectCount, xpByAct, act4Result,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, act1Answer, act1Result, act2Idx, act2CorrectCount, xpByAct, act4Result])

  const finishRitual = useCallback(async (act4XP) => {
    if (bankedRef.current) return
    bankedRef.current = true
    const total = xpByAct.act1 + xpByAct.act2 + xpByAct.act3 + act4XP
    bankBackfillXP(total)
    recordCompletedBackfill(date, total)
    clearPastRitualProgress(date)
    await logRitual(session, date, total, true)
    if (session) await pushStats(session)
  }, [xpByAct, bankBackfillXP, recordCompletedBackfill, clearPastRitualProgress, session, date])

  function handleAct1Submit() {
    if (!questions?.act1 || act1Result) return
    const grade = gradeAnswer(act1Answer, questions.act1.correct_answer, questions.act1.accepted_variants || [])
    const xp = grade.grade === 'wrong' ? 0 : XP.act1
    setXpByAct(prev => ({ ...prev, act1: xp }))
    setAct1Result({ correct: grade.grade !== 'wrong', xp })
  }

  function handleAct2Confirm() {
    const q = questions.act2[act2Idx]
    if (!act2Revealed) {
      const correct = act2Selected === q.correct_answer
      if (correct) setAct2CorrectCount(c => c + 1)
      setAct2Revealed(true)
    } else {
      const isLast = act2Idx + 1 >= 5
      if (isLast) {
        const correct = act2Selected === q.correct_answer
        const finalCount = act2CorrectCount + (correct ? 1 : 0)
        setXpByAct(prev => ({ ...prev, act2: finalCount * XP.act2perQ }))
        setStep('act3')
      } else {
        setAct2Idx(i => i + 1)
        setAct2Selected(null)
        setAct2Revealed(false)
      }
    }
  }

  function handleAct3Confirm() {
    if (!act3Revealed) {
      const xp = act3Selected === questions.act3?.correct_answer ? XP.act3 : 0
      setXpByAct(prev => ({ ...prev, act3: xp }))
      setAct3Revealed(true)
    } else if (questions.act4) {
      setStep('act4')
    } else {
      // No act4 data for this date — finish after act3
      finishRitual(0).then(() => setStep('done'))
    }
  }

  async function handleAct4Submit() {
    if (!questions?.act4 || act4Result) return
    const grade = gradeAnswer(act4Answer, questions.act4.correct_answer, questions.act4.accepted_variants || [])
    const xp = Math.round(grade.xp * MULT)
    setAct4Result({ grade: grade.grade, xp })
  }

  async function handleAct4Continue() {
    await finishRitual(act4Result?.xp ?? 0)
    setStep('done')
  }

  // ── Loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', marginTop: 80 }}>
          Unearthing the past…
        </div>
      </div>
    )
  }

  if (!questions || !questions.act1 || !questions.act2?.length) {
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ padding: '40px var(--sd-px)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: 'var(--sd-cream)', marginBottom: 10 }}>No ritual found.</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginBottom: 24 }}>No questions exist for {date}.</div>
          <button onClick={() => navigate('/history')} style={backBtnStyle}>← Back to history</button>
        </div>
        <BottomNav activePage="ritual" />
      </div>
    )
  }

  // ── Already done ──────────────────────────────────────────────────

  if (alreadyDone) {
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ padding: '40px var(--sd-px)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            {formatDate(date)}
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', marginBottom: 20 }}>
            Already completed.
          </div>
          <div style={{
            borderRadius: 14, border: '1px solid rgba(192,21,42,0.3)',
            background: 'rgba(192,21,42,0.07)', padding: '24px', marginBottom: 24,
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 56, color: 'var(--sd-red)', lineHeight: 1 }}>{doneXP}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>xp earned</div>
          </div>
          <button onClick={() => navigate('/history')} style={backBtnStyle}>← Back to history</button>
        </div>
        <BottomNav activePage="ritual" />
      </div>
    )
  }

  const act4XP = act4Result?.xp ?? 0
  const totalSoFar = xpByAct.act1 + xpByAct.act2 + xpByAct.act3 + act4XP

  // ── Done screen ───────────────────────────────────────────────────

  if (step === 'done') {
    const total = xpByAct.act1 + xpByAct.act2 + xpByAct.act3 + act4XP
    const ACTS_META = [
      { label: 'Scene of the Crime',  badge: 'ACT I',   xp: xpByAct.act1,  max: XP.act1 },
      { label: 'The Inquisition',     badge: 'ACT II',  xp: xpByAct.act2,  max: XP.act2perQ * 5 },
      { label: 'Speak of the Devil',  badge: 'ACT III', xp: xpByAct.act3,  max: XP.act3 },
      ...(questions.act4 ? [{ label: 'Final Reckoning', badge: 'ACT IV', xp: act4XP, max: XP.act4 }] : []),
    ]
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />

        <div style={{
          textAlign: 'center',
          padding: '32px var(--sd-px) 24px',
          background: 'linear-gradient(180deg, rgba(192,21,42,0.1) 0%, transparent 100%)',
          borderBottom: '0.5px solid var(--sd-border)',
        }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
            {formatDate(date)} · Past Ritual
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 36, color: 'var(--sd-cream)', lineHeight: 1.05 }}>
            Ritual complete.
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 6, fontStyle: 'italic' }}>
            50% XP for past rituals.
          </div>
        </div>

        <div style={{ padding: '20px var(--sd-px) 0' }}>
          <div style={{
            borderRadius: 16, padding: '22px 20px 18px',
            border: '1px solid rgba(192,21,42,0.35)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(192,21,42,0.05) 100%)',
          }}>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              XP earned
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 72, color: 'var(--sd-red)', lineHeight: 1 }}>{total}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)' }}>xp</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px var(--sd-px) 0' }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Act breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ACTS_META.map(({ label, badge, xp, max }) => {
              const full = xp >= max
              const partial = xp > 0 && !full
              const accentColor = full ? '#2d6640' : partial ? '#7a5a1a' : 'rgba(255,255,255,0.1)'
              const borderColor = full ? 'rgba(45,102,64,0.25)' : partial ? 'rgba(180,120,20,0.25)' : 'rgba(255,255,255,0.06)'
              const xpColor = full ? '#7cc48a' : partial ? '#d4a04a' : 'var(--sd-muted)'
              return (
                <div key={label} style={{
                  borderRadius: 11,
                  borderTop: `1px solid ${borderColor}`,
                  borderRight: `1px solid ${borderColor}`,
                  borderBottom: `1px solid ${borderColor}`,
                  borderLeft: `3px solid ${accentColor}`,
                  background: full ? 'rgba(45,102,64,0.04)' : partial ? 'rgba(180,120,20,0.04)' : 'rgba(255,255,255,0.015)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 42, flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: xpColor, letterSpacing: 1 }}>{badge}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 17, color: 'var(--sd-cream)', lineHeight: 1.1 }}>{label}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: xpColor }}>{xp}</span>
                    <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}> / {max} xp</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '20px var(--sd-px) 28px' }}>
          <button onClick={() => navigate('/history')} style={backBtnStyle}>← Back to history</button>
        </div>
        <BottomNav activePage="ritual" />
      </div>
    )
  }

  // ── Active ritual wrapper ─────────────────────────────────────────

  const stepNum = { act1: 1, act2: 2, act3: 3, act4: 4 }[step]

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={stepNum} />

      <div style={{
        margin: '10px var(--sd-px) 0',
        background: 'rgba(192,21,42,0.07)', border: '0.5px solid var(--sd-border)',
        borderRadius: 8, padding: '6px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)' }}>
          {formatDate(date)} · 50% XP
        </span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red)' }}>
          {totalSoFar} xp
        </span>
      </div>

      <div className="sd-game-content">
        {step === 'act1' && questions.act1 && (
          <Act1View
            q={questions.act1}
            answer={act1Answer}
            setAnswer={setAct1Answer}
            result={act1Result}
            onSubmit={handleAct1Submit}
            onContinue={() => setStep('act2')}
            maxXP={XP.act1}
          />
        )}
        {step === 'act2' && questions.act2?.length > 0 && (
          <Act2View
            q={questions.act2[act2Idx]}
            qIndex={act2Idx}
            selected={act2Selected}
            setSelected={setAct2Selected}
            revealed={act2Revealed}
            onConfirm={handleAct2Confirm}
            isLast={act2Idx === 4}
            xpPerQ={XP.act2perQ}
          />
        )}
        {step === 'act3' && questions.act3 && (
          <Act3View
            q={questions.act3}
            selected={act3Selected}
            setSelected={setAct3Selected}
            revealed={act3Revealed}
            onConfirm={handleAct3Confirm}
            maxXP={XP.act3}
          />
        )}
        {step === 'act4' && questions.act4 && (
          <ActFourView
            q={questions.act4}
            answer={act4Answer}
            setAnswer={setAct4Answer}
            result={act4Result}
            onSubmit={handleAct4Submit}
            onContinue={handleAct4Continue}
            continueBtnLabel="Finish ritual"
            xpScale={{ exact: XP.act4, close: Math.round(XP.act4 * 0.6), partial: Math.round(XP.act4 * 0.2) }}
          />
        )}
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

const PAGE_BG = '#1e1111'

function Act1View({ q, answer, setAnswer, result, onSubmit, onContinue, maxXP }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!result) inputRef.current?.focus()
  }, [result])

  useEffect(() => {
    if (!result) return
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onContinue() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  return (
    <>
      {/* ── Cinematic image block ── */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '52%', overflow: 'hidden', background: '#1a0e0e' }}>

        <div style={{ position: 'absolute', inset: 0 }}>
          {q.image_url
            ? <img src={q.image_url} alt="horror still" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: '#1a0e0e' }} />
          }
        </div>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
        {/* Top scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,8,8,0.82) 0%, transparent 38%)', pointerEvents: 'none' }} />
        {/* Bottom bleed */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${PAGE_BG} 0%, transparent 42%)`, pointerEvents: 'none' }} />

        {/* ACT I — top-left */}
        <div style={{ position: 'absolute', top: 14, left: 16 }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: 'var(--sd-red)', letterSpacing: '0.18em', lineHeight: 1, textShadow: '0 0 12px rgba(192,21,42,0.7)' }}>
            ACT I
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 15, color: 'var(--sd-cream)', letterSpacing: '0.03em', lineHeight: 1.15, marginTop: 3, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
            Scene of the Crime
          </div>
        </div>

        {/* XP pill — top-right */}
        {!result && (
          <div style={{
            position: 'absolute', top: 14, right: 16,
            fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
            border: '0.5px solid rgba(192,21,42,0.55)', borderRadius: 20,
            padding: '3px 9px', background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
          }}>
            {maxXP} xp
          </div>
        )}

        {/* ── Result overlay — frosted, image bleeds through ── */}
        {result && (
          <div className="sd-result-reveal" style={{
            position: 'absolute', inset: 0,
            background: result.correct ? 'rgba(4,18,10,0.72)' : 'rgba(20,4,4,0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '16px 24px', textAlign: 'center',
          }}>
            <div className="sd-stamp-in" style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: result.correct ? '#7cc48a' : '#e24b4a', letterSpacing: '0.12em', lineHeight: 1, marginBottom: 4 }}>
              {result.correct ? 'Correct.' : 'Wrong.'}
            </div>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 64, color: result.correct ? '#7cc48a' : '#e24b4a', lineHeight: 0.9, marginBottom: 14 }}>
              +{result.xp} xp
            </div>
            <div style={{ borderTop: `0.5px solid ${result.correct ? 'rgba(74,171,106,0.3)' : 'rgba(192,21,42,0.3)'}`, paddingTop: 12, width: '100%' }}>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: 'var(--sd-cream)', lineHeight: 1.15 }}>
                {q.correct_answer}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 5, justifyContent: 'center' }}>
                {q.decade && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>{q.decade}</div>}
                {q.authored_by && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>Dir. {q.authored_by}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsing container — animates away after answer ── */}
      <div style={{ maxHeight: result ? 0 : '400px', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>

        {/* Question prompt */}
        <div style={{ padding: '12px var(--sd-px) 10px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'linear-gradient(to right, transparent, rgba(192,21,42,0.3))' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(192,21,42,0.6)', boxShadow: '0 0 6px rgba(192,21,42,0.5)' }} />
            <div style={{ flex: 1, height: '0.5px', background: 'linear-gradient(to left, transparent, rgba(192,21,42,0.3))' }} />
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-muted)', letterSpacing: '0.05em', lineHeight: 1.7 }}>
            What horror film is this scene from?
          </div>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          className="sd-input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && answer.trim()) onSubmit() }}
          placeholder="Name the film…"
          style={{ fontSize: 20, textAlign: 'center', letterSpacing: '0.03em', background: 'rgba(46,26,26,0.7)' }}
        />

      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '12px 0 6px' }}>
        <button className="sd-cta-btn" onClick={result ? onContinue : onSubmit} disabled={!result && !answer.trim()}>
          {result ? 'Continue' : 'Lock it in'}
        </button>
      </div>
    </>
  )
}

function Act2View({ q, qIndex, selected, setSelected, revealed, onConfirm, isLast, xpPerQ }) {
  const containerRef = useRef(null)
  const options = q.options || []
  const isCorrect = revealed && selected === q.correct_answer

  useEffect(() => {
    containerRef.current?.focus()
  }, [qIndex])

  useEffect(() => {
    function onKey(e) {
      const letterIdx = { a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()]
      if (letterIdx !== undefined && !revealed && options[letterIdx] !== undefined) {
        setSelected(options[letterIdx])
        return
      }
      if ((e.key === 'Enter' || e.key === ' ') && (selected || revealed)) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, selected, options])

  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }

  return (
    <div ref={containerRef} tabIndex={-1} style={{ outline: 'none' }}>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT II</span>
        <span className="sd-act-title">The Inquisition</span>
        <span className="sd-xp-pill">{xpPerQ} xp</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--sd-px) 12px' }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>Question {qIndex + 1} of 5</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < qIndex ? '#2d6640' : i === qIndex ? 'var(--sd-red)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>
      <div style={{ margin: '0 var(--sd-px) 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', minHeight: 90 }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>{q.question}</div>
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
          {isCorrect ? `+${xpPerQ} xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not quite.'}
        </div>
      )}
      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <button className="sd-cta-btn" onClick={onConfirm} disabled={!selected && !revealed}>
          {!revealed ? 'Confirm' : isLast ? 'Continue to Act III' : 'Next question'}
        </button>
      </div>
    </div>
  )
}

function Act3View({ q, selected, setSelected, revealed, onConfirm, maxXP }) {
  const containerRef = useRef(null)
  const options = q.options || []
  const isCorrect = revealed && selected === q.correct_answer

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e) {
      const letterIdx = { a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()]
      if (letterIdx !== undefined && !revealed && options[letterIdx] !== undefined) {
        setSelected(options[letterIdx])
        return
      }
      if ((e.key === 'Enter' || e.key === ' ') && (selected || revealed)) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, selected, options])

  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }

  return (
    <div ref={containerRef} tabIndex={-1} style={{ outline: 'none' }}>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT III</span>
        <span className="sd-act-title">Speak of the Devil</span>
        <span className="sd-xp-pill">{maxXP} xp</span>
      </div>

      {/* Quote card — matches ActThree.jsx styling */}
      <div style={{
        margin: '4px var(--sd-px) 14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: '3px solid var(--sd-red)',
        padding: '20px 18px 16px',
        position: 'relative', overflow: 'hidden',
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
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 12 }}>
            — {q.attribution}
          </div>
        )}
      </div>

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 var(--sd-px) 14px' }}>
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
          {isCorrect ? `+${maxXP} xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not this time.'}
        </div>
      )}
      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <button className="sd-cta-btn" onClick={onConfirm} disabled={!selected && !revealed}>
          {!revealed ? 'Confirm' : 'Continue to Act IV'}
        </button>
      </div>
    </div>
  )
}


const backBtnStyle = {
  width: '100%', background: 'none',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '13px', cursor: 'pointer',
  fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
}
