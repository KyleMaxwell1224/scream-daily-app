import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { gradeAnswer } from '../utils/questions'
import { logRitual, pushStats } from '../utils/syncStats'

function getSaved(date) {
  return useGameStore.getState().pastRitualProgress[date] ?? null
}

const MULT = 0.5
const XP = {
  act1: Math.floor(25 * MULT),   // 12
  act2perQ: Math.floor(10 * MULT), // 5
  act3: Math.floor(35 * MULT),   // 17
  act4: Math.floor(100 * MULT),  // 50
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
  const { session, bankBackfillXP, savePastRitualProgress, clearPastRitualProgress } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState(null)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [doneXP, setDoneXP] = useState(0)

  // Restore in-progress state from localStorage-backed store on first render
  const _saved = getSaved(date)

  // Step: 'act1' | 'act2' | 'act3' | 'act4' | 'done'
  const [step, setStep] = useState(_saved?.step ?? 'act1')

  // Act 1
  const [act1Answer, setAct1Answer] = useState(_saved?.act1Answer ?? '')
  const [act1Result, setAct1Result] = useState(_saved?.act1Result ?? null)

  // Act 2
  const [act2Idx, setAct2Idx] = useState(_saved?.act2Idx ?? 0)
  const [act2Selected, setAct2Selected] = useState(null)
  const [act2Revealed, setAct2Revealed] = useState(false)
  const [act2CorrectCount, setAct2CorrectCount] = useState(_saved?.act2CorrectCount ?? 0)
  // Act 3
  const [act3Selected, setAct3Selected] = useState(null)
  const [act3Revealed, setAct3Revealed] = useState(false)

  // Act 4
  const [act4Answer, setAct4Answer] = useState('')
  const [act4Result, setAct4Result] = useState(_saved?.act4Result ?? null)

  // Accumulated XP per act — state so values are safe to read during render
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

  // Persist in-progress state so a refresh doesn't let acts be replayed
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
    clearPastRitualProgress(date)
    await logRitual(session, date, total, true)
    if (session) await pushStats(session)
  }, [xpByAct, bankBackfillXP, clearPastRitualProgress, session, date])

  // ── Act 1 handlers ────────────────────────────────────────────────

  function handleAct1Submit() {
    if (!questions?.act1 || act1Result) return
    const grade = gradeAnswer(act1Answer, questions.act1.correct_answer, questions.act1.accepted_variants || [])
    const xp = grade.grade === 'wrong' ? 0 : XP.act1
    const result = { correct: grade.grade !== 'wrong', xp }
    setXpByAct(prev => ({ ...prev, act1: xp }))
    setAct1Result(result)
  }

  // ── Act 2 handlers ────────────────────────────────────────────────

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
        const xp = finalCount * XP.act2perQ
        setXpByAct(prev => ({ ...prev, act2: xp }))
        setStep('act3')
      } else {
        setAct2Idx(i => i + 1)
        setAct2Selected(null)
        setAct2Revealed(false)
      }
    }
  }

  // ── Act 3 handlers ────────────────────────────────────────────────

  function handleAct3Confirm() {
    if (!act3Revealed) {
      const xp = act3Selected === questions.act3?.correct_answer ? XP.act3 : 0
      setXpByAct(prev => ({ ...prev, act3: xp }))
      setAct3Revealed(true)
    } else {
      setStep('act4')
    }
  }

  // ── Act 4 handlers ────────────────────────────────────────────────

  async function handleAct4Submit() {
    if (!questions?.act4 || act4Result) return
    const grade = gradeAnswer(act4Answer, questions.act4.correct_answer, questions.act4.accepted_variants || [])
    const xp = grade.grade === 'wrong' ? 0 : XP.act4
    const result = { correct: grade.grade !== 'wrong', grade: grade.grade, xp }
    setAct4Result(result)
  }

  async function handleAct4Continue() {
    await finishRitual(act4Result?.xp ?? 0)
    setStep('done')
  }

  // ── Loading / error / already done ───────────────────────────────

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

  if (!questions || (!questions.act1 && !questions.act2?.length)) {
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

  if (alreadyDone) {
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ padding: '40px var(--sd-px)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            {formatDate(date)}
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', marginBottom: 16 }}>
            Already completed.
          </div>
          <div style={{
            background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
            borderRadius: 14, padding: '24px', marginBottom: 24,
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
      { label: 'Act I — Scene of the Crime',   xp: xpByAct.act1, max: XP.act1 },
      { label: 'Act II — The Inquisition',      xp: xpByAct.act2, max: XP.act2perQ * 5 },
      { label: 'Act III — Speak of the Devil',  xp: xpByAct.act3, max: XP.act3 },
      { label: 'Act IV — Final Reckoning',      xp: act4XP,       max: XP.act4 },
    ]
    return (
      <div className="sd-wrap">
        <Header activePage="ritual" />
        <div style={{ padding: '32px var(--sd-px) 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            {formatDate(date)} · Backfill
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 32, color: 'var(--sd-cream)' }}>
            Ritual complete.
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>
            50% XP for past rituals.
          </div>
        </div>

        <div style={{ margin: '0 var(--sd-px) 20px', background: 'var(--sd-card)', border: '1px solid var(--sd-border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 64, color: 'var(--sd-red)', lineHeight: 1 }}>{total}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>experience points</div>
        </div>

        <div style={{ paddingBottom: 16 }}>
          <div className="sd-section-label">Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 var(--sd-px)' }}>
            {ACTS_META.map(({ label, xp, max }) => (
              <div key={label} style={{
                background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>{label}</span>
                <span style={{ fontFamily: "'Creepster', cursive", fontSize: 16, color: xp === 0 ? 'var(--sd-muted)' : xp >= max ? '#7cc48a' : '#d4a04a' }}>
                  {xp} / {max} xp
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 var(--sd-px) 20px' }}>
          <button onClick={() => navigate('/history')} style={backBtnStyle}>← Back to history</button>
        </div>
        <BottomNav activePage="ritual" />
      </div>
    )
  }

  // ── Shared wrapper ────────────────────────────────────────────────

  const stepNum = { act1: 1, act2: 2, act3: 3, act4: 4 }[step]

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />
      <ProgressBar currentAct={stepNum} />

      {/* Backfill banner */}
      <div style={{
        margin: '10px var(--sd-px) 0',
        background: 'rgba(192,21,42,0.07)', border: '0.5px solid var(--sd-border)',
        borderRadius: 8, padding: '6px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>
          {formatDate(date)} · 50% XP
        </span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-red)' }}>
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
          <Act4View
            q={questions.act4}
            answer={act4Answer}
            setAnswer={setAct4Answer}
            result={act4Result}
            onSubmit={handleAct4Submit}
            onContinue={handleAct4Continue}
            maxXP={XP.act4}
          />
        )}
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Act1View({ q, answer, setAnswer, result, onSubmit, onContinue, maxXP }) {
  return (
    <>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT I</span>
        <span className="sd-act-title">Scene of the Crime</span>
        <span className="sd-xp-pill">{maxXP} xp</span>
      </div>
      <div style={{ padding: '0 var(--sd-px) 14px' }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--sd-border)', background: '#120808' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {q.image_url
              ? <img src={q.image_url} alt="horror still" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#120808' }} />
            }
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', padding: '0 var(--sd-px) 12px' }}>
        What horror film is this scene from?
      </div>
      <input className="sd-input" value={answer} onChange={e => !result && setAnswer(e.target.value)} placeholder="Type your answer…" disabled={!!result} style={{ opacity: result ? 0.6 : 1 }} />
      {result && (
        <div style={{ margin: '10px var(--sd-px) 4px', background: result.correct ? 'rgba(45,102,64,0.2)' : 'rgba(90,18,18,0.2)', border: `1px solid ${result.correct ? 'rgba(45,102,64,0.4)' : 'rgba(192,21,42,0.3)'}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 20, color: result.correct ? '#7cc48a' : '#e24b4a', marginBottom: 2 }}>{result.correct ? 'Correct.' : 'Wrong.'}</div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: result.correct ? '#7cc48a' : '#e24b4a' }}>+{result.xp} xp</div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', marginTop: 10, paddingTop: 8 }}>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)' }}>{q.correct_answer}</div>
            {q.decade && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 2 }}>{q.decade}</div>}
            {q.authored_by && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>Dir. {q.authored_by}</div>}
          </div>
        </div>
      )}
      <div style={{ padding: '10px 0 6px' }}>
        <button className="sd-cta-btn" onClick={result ? onContinue : onSubmit} disabled={!result && !answer.trim()}>
          {result ? 'Continue' : 'Lock it in'}
        </button>
      </div>
    </>
  )
}

function Act2View({ q, qIndex, selected, setSelected, revealed, onConfirm, isLast, xpPerQ }) {
  const isCorrect = revealed && selected === q.correct_answer
  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }
  return (
    <>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT II</span>
        <span className="sd-act-title">The Inquisition</span>
        <span className="sd-xp-pill">{xpPerQ} xp</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--sd-px) 12px' }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>Question {qIndex + 1} of 5</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < qIndex ? '#2d6640' : i === qIndex ? 'var(--sd-red)' : 'rgba(255,255,255,0.08)' }} />)}
        </div>
      </div>
      <div style={{ margin: '0 var(--sd-px) 14px', background: 'var(--sd-card)', borderRadius: 12, padding: '16px', border: '1px solid var(--sd-border)', minHeight: 90 }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>{q.question}</div>
      </div>
      <div className="sd-options">
        {(q.options || []).map((opt, i) => (
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
    </>
  )
}

function Act3View({ q, selected, setSelected, revealed, onConfirm, maxXP }) {
  const isCorrect = revealed && selected === q.correct_answer
  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }
  return (
    <>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT III</span>
        <span className="sd-act-title">Speak of the Devil</span>
        <span className="sd-xp-pill">{maxXP} xp</span>
      </div>
      <div style={{ margin: '0 var(--sd-px) 14px', background: 'var(--sd-card)', borderRadius: 12, padding: '20px', border: '1px solid var(--sd-border)' }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Identify the film</div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 15, color: 'var(--sd-cream)', lineHeight: 1.7, fontStyle: 'italic' }}>"{q.question}"</div>
      </div>
      <div className="sd-options">
        {(q.options || []).map((opt, i) => (
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
          {isCorrect ? `+${maxXP} xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not quite.'}
        </div>
      )}
      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <button className="sd-cta-btn" onClick={onConfirm} disabled={!selected && !revealed}>
          {!revealed ? 'Confirm' : 'Continue to Act IV'}
        </button>
      </div>
    </>
  )
}

function Act4View({ q, answer, setAnswer, result, onSubmit, onContinue, maxXP }) {
  const gradeColor = { exact: '#7cc48a', close: '#d4a04a', partial: '#d4a04a', wrong: '#e24b4a' }
  return (
    <>
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT IV</span>
        <span className="sd-act-title">Final Reckoning</span>
        <span className="sd-xp-pill">{maxXP} xp</span>
      </div>
      <div style={{ margin: '0 var(--sd-px) 14px', background: 'var(--sd-card)', borderRadius: 12, padding: '16px', border: '1px solid var(--sd-border)' }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>{q.question}</div>
      </div>
      <input className="sd-input" value={answer} onChange={e => !result && setAnswer(e.target.value)} placeholder="Your answer…" disabled={!!result} style={{ opacity: result ? 0.6 : 1 }} />
      {result && (
        <div style={{ margin: '10px var(--sd-px) 4px', background: result.correct ? 'rgba(45,102,64,0.15)' : 'rgba(90,18,18,0.15)', border: `1px solid ${result.correct ? 'rgba(45,102,64,0.35)' : 'rgba(192,21,42,0.3)'}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 16, color: gradeColor[result.grade] || '#e24b4a', textTransform: 'capitalize', marginBottom: 2 }}>{result.grade}</div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: gradeColor[result.grade] || '#e24b4a' }}>+{result.xp} xp</div>
          {!result.correct && <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 6 }}>Answer: {q.correct_answer}</div>}
        </div>
      )}
      <div style={{ padding: '10px 0 6px' }}>
        <button className="sd-cta-btn" onClick={result ? onContinue : onSubmit} disabled={!result && !answer.trim()}>
          {result ? 'Finish ritual' : 'Submit'}
        </button>
      </div>
    </>
  )
}

const backBtnStyle = {
  background: 'none', border: '1px solid var(--sd-border)', borderRadius: 10,
  padding: '11px 24px', cursor: 'pointer',
  fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
}
