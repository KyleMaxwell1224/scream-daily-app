import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import ProgressBar from '../components/ProgressBar'
import ActFourView from '../components/ActFourView'
import Act1GameView from '../components/Act1GameView'
import RankSigil from '../components/RankSigil'
import RankUpTakeover from '../components/RankUpTakeover'
import Spinner from '../components/Spinner'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { gradeAnswer } from '../utils/questions'
import { getRankForXP, getNextRank } from '../utils/ranks'
import { logRitual, pushStats } from '../utils/syncStats'
import { PAST_RITUAL_MULT, BASE_XP, ACT1_CLUES, ACTS, ACT4_XP_SCALE, LETTERS } from '../utils/gameConfig'

function getSaved(date) {
  return useGameStore.getState().pastRitualProgress[date] ?? null
}

const XP = {
  act1:    Math.floor(BASE_XP.act1    * PAST_RITUAL_MULT),
  act2perQ: Math.floor(BASE_XP.act2perQ * PAST_RITUAL_MULT),
  act3:    Math.floor(BASE_XP.act3    * PAST_RITUAL_MULT),
  act4:    Math.floor(BASE_XP.act4    * PAST_RITUAL_MULT),
}
const CLUES = ACT1_CLUES.map(c => ({ ...c, penalty: Math.floor(c.penalty * PAST_RITUAL_MULT) }))

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function PastRitualDoneScreen({ date, xpByAct, act4XP, questions, userXP, username, onBack, backBtnStyle }) {
  const total = xpByAct.act1 + xpByAct.act2 + xpByAct.act3 + act4XP
  const displayName = username || 'Survivor'
  const displayXP = userXP + total

  const prevRank = getRankForXP(userXP)
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)
  const rankedUp = prevRank.name !== rank.name

  const [counted, setCounted] = useState(0)
  const [showRankUp, setShowRankUp] = useState(false)
  const [showTakeover, setShowTakeover] = useState(false)

  useEffect(() => {
    if (total === 0) return
    let start = 0
    const step = Math.ceil(total / 60)
    const id = setInterval(() => {
      start = Math.min(start + step, total)
      setCounted(start)
      if (start >= total) {
        clearInterval(id)
        if (rankedUp) setTimeout(() => setShowTakeover(true), 500)
      }
    }, 20)
    return () => clearInterval(id)
  }, [total, rankedUp])

  const barMax = nextRank ? nextRank.minXP : displayXP
  const barMin = rank.minXP
  const barRange = barMax - barMin
  const baseWidth = barRange > 0 ? Math.min(((userXP - barMin) / barRange) * 100, 100) : 0
  const gainWidth = barRange > 0 ? Math.min((total / barRange) * 100, 100 - baseWidth) : 0

  const earnedByKey = { act1: xpByAct.act1, act2: xpByAct.act2, act3: xpByAct.act3, act4: act4XP }
  const pastMax = { act1: XP.act1, act2: XP.act2perQ * 5, act3: XP.act3, act4: XP.act4 }
  const ACTS_META = ACTS
    .filter(a => a.key !== 'act4' || questions.act4)
    .map(a => ({ label: a.name, badge: a.badge, xp: earnedByKey[a.key], max: pastMax[a.key] }))

  return (
    <div className="sd-wrap">
      {showTakeover && (
        <RankUpTakeover
          rank={rank}
          prevRank={prevRank}
          onDismiss={() => { setShowTakeover(false); setShowRankUp(true) }}
        />
      )}

      {/* Full green progress */}
      <div className="sd-progress">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="sd-progress-seg completed" />
        ))}
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          textAlign: 'center',
          padding: '36px var(--sd-px) 28px',
          background: 'linear-gradient(180deg, rgba(192,21,42,0.16) 0%, rgba(192,21,42,0.02) 60%, transparent 100%)',
          borderBottom: '0.5px solid var(--sd-border)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0em' }}
          animate={{ opacity: 1, letterSpacing: '0.16em' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red-bright)',
            textTransform: 'uppercase', marginBottom: 14,
          }}
        >
          {formatDate(date)} · Past Ritual
        </motion.div>
        <motion.div
          className="sd-stamp-in"
          style={{
            fontFamily: "'Creepster', cursive", fontSize: 46, color: 'var(--sd-cream)',
            lineHeight: 1.05, marginBottom: 10, letterSpacing: '1px',
            textShadow: '0 0 22px rgba(192,21,42,0.35), 2px 2px 0 rgba(0,0,0,0.55)',
          }}
        >
          {displayName}, you survived.
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)',
            fontStyle: 'italic',
          }}
        >
          A grave dug up. 50% XP for old bones.
        </motion.div>
      </motion.div>

      {/* XP card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{ padding: '20px var(--sd-px) 0' }}
      >
        <div style={{
          borderRadius: 16,
          border: `1px solid ${rank.color}55`,
          background: `linear-gradient(135deg, ${rank.color}0f 0%, var(--sd-card) 100%)`,
          padding: '22px 20px 18px',
          boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 40px ${rank.color}18`,
        }}>
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6,
          }}>
            XP earned
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 72, color: rank.color, lineHeight: 1 }}>
              {counted}
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)' }}>xp</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: rank.color }}>
              <RankSigil name={rank.name} size={14} strokeWidth={1.3} />
              <span style={{ fontFamily: "'Creepster', cursive", fontSize: 14 }}>{rank.name}</span>
            </div>
            {nextRank && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sd-muted)' }}>
                <span style={{ fontFamily: "'Creepster', cursive", fontSize: 13 }}>{nextRank.name}</span>
                <RankSigil name={nextRank.name} size={13} strokeWidth={1.2} />
              </div>
            )}
          </div>
          <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${baseWidth}%`, height: '100%', background: rank.color, borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
            <div style={{ width: `${gainWidth}%`, height: '100%', background: '#ba7517', animation: 'xp-bar-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          </div>
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 7,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{userXP.toLocaleString()} XP before</span>
            {nextRank && <span>{(nextRank.minXP - displayXP).toLocaleString()} to {nextRank.name}</span>}
          </div>
        </div>
      </motion.div>

      {/* Rank-up callout */}
      {showRankUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          style={{ padding: '14px var(--sd-px) 0' }}
        >
          <div style={{
            borderRadius: 14,
            border: `1px solid ${rank.color}88`,
            background: `linear-gradient(135deg, ${rank.color}22 0%, var(--sd-card) 80%)`,
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 40px ${rank.color}38`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: rank.color,
              background: `${rank.color}18`,
              border: `1px solid ${rank.color}66`,
              boxShadow: `0 0 18px ${rank.color}22`,
            }}>
              <RankSigil name={rank.name} size={24} strokeWidth={1.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 11, color: rank.color,
                textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4,
              }}>
                Rank up
              </div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 24, color: rank.color, lineHeight: 1, letterSpacing: '0.5px' }}>
                {rank.name}
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)', fontStyle: 'italic', marginTop: 5 }}>
                {rank.flavor}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Act breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        style={{ padding: '20px var(--sd-px) 0' }}
      >
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        }}>
          Act breakdown
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 7 }}
        >
          {ACTS_META.map(({ label, badge, xp, max }) => {
            const full = xp >= max
            const partial = xp > 0 && !full
            const accentColor = full ? '#2d6640' : partial ? '#7a5a1a' : 'rgba(255,255,255,0.15)'
            const borderColor = full ? 'rgba(45,102,64,0.25)' : partial ? 'rgba(180,120,20,0.25)' : 'rgba(255,255,255,0.1)'
            const xpColor = full ? '#7cc48a' : partial ? '#d4a04a' : 'var(--sd-muted)'
            return (
              <motion.div
                key={label}
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }}
                style={{
                  borderRadius: 11,
                  borderTop: `1px solid ${borderColor}`,
                  borderRight: `1px solid ${borderColor}`,
                  borderBottom: `1px solid ${borderColor}`,
                  borderLeft: `3px solid ${accentColor}`,
                  background: full ? 'rgba(45,102,64,0.07)' : partial ? 'rgba(180,120,20,0.07)' : 'var(--sd-card)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
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
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        style={{ padding: '20px var(--sd-px) 28px' }}
      >
        <button onClick={onBack} style={backBtnStyle}>← Back to history</button>
      </motion.div>
    </div>
  )
}

export default function PastRitual() {
  const { date } = useParams()
  const navigate = useNavigate()
  const {
    session, userXP, username, bankBackfillXP, savePastRitualProgress,
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
  const [act1UsedClues, setAct1UsedClues] = useState({})
  const [act1RevealedClues, setAct1RevealedClues] = useState({})
  const bankedRef = useRef(false)

  const act1PenaltyTotal = CLUES.filter(c => act1UsedClues[c.key]).reduce((s, c) => s + c.penalty, 0)
  const act1MaxXP = Math.max(0, XP.act1 - act1PenaltyTotal)

  function revealAct1Clue(key) {
    if (act1UsedClues[key] || act1Result) return
    setAct1UsedClues(prev => ({ ...prev, [key]: true }))
    const q = questions?.act1
    if (q) {
      const val = key === 'year' ? q.decade : key === 'director' ? (q.authored_by || '—') : q.subgenre
      setAct1RevealedClues(prev => ({ ...prev, [key]: val || '—' }))
    }
  }

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
    const xp = grade.grade === 'wrong' ? 0 : act1MaxXP
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
    const xp = Math.round(grade.xp * PAST_RITUAL_MULT)
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
        <Spinner size={48} label="Unearthing the past" />
      </div>
    )
  }

  if (!questions || !questions.act1 || !questions.act2?.length) {
    return (
      <div className="sd-wrap">
        <div style={{ padding: '40px var(--sd-px)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: 'var(--sd-cream)', marginBottom: 10 }}>No ritual found.</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginBottom: 24 }}>No questions exist for {date}.</div>
          <button onClick={() => navigate('/history')} style={backBtnStyle}>← Back to history</button>
        </div>
      </div>
    )
  }

  // ── Already done ──────────────────────────────────────────────────

  if (alreadyDone) {
    return (
      <div className="sd-wrap">
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
      </div>
    )
  }

  const act4XP = act4Result?.xp ?? 0
  const totalSoFar = xpByAct.act1 + xpByAct.act2 + xpByAct.act3 + act4XP

  // ── Done screen ───────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <PastRitualDoneScreen
        date={date}
        xpByAct={xpByAct}
        act4XP={act4XP}
        questions={questions}
        userXP={userXP}
        username={username}
        onBack={() => navigate('/history')}
        backBtnStyle={backBtnStyle}
      />
    )
  }

  // ── Active ritual wrapper ─────────────────────────────────────────

  const stepNum = { act1: 1, act2: 2, act3: 3, act4: 4 }[step]

  return (
    <div className="sd-wrap">
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
          <Act1GameView
            q={questions.act1}
            answer={act1Answer}
            setAnswer={setAct1Answer}
            result={act1Result}
            onSubmit={handleAct1Submit}
            onContinue={() => setStep('act2')}
            maxXP={act1MaxXP}
            clues={CLUES}
            usedClues={act1UsedClues}
            revealedClues={act1RevealedClues}
            onRevealClue={revealAct1Clue}
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
            xpScale={Object.fromEntries(Object.entries(ACT4_XP_SCALE).map(([k, v]) => [k, Math.floor(v * PAST_RITUAL_MULT)]))}
          />
        )}
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

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
