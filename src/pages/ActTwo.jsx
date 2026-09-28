import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import ProgressBar from '../components/ProgressBar'
import Spinner from '../components/Spinner'
import useGameStore from '../store/useGameStore'
import { getTodaysQuestions } from '../utils/questions'
import { BASE_XP, LETTERS } from '../utils/gameConfig'

const optionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const optionItem = {
  hidden:  { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function ActTwo() {
  const navigate = useNavigate()
  const {
    todayQuestions, setTodayQuestions,
    act2CurrentQuestion, act2Answers, act2Selections,
    advanceAct2Question, recordAct2Answer,
    completeAct,
  } = useGameStore()

  const questions = todayQuestions.act2
  const qIndex = act2CurrentQuestion
  const q = questions[qIndex]

  // Derive persisted state for the current question
  const persistedSelection = act2Selections[qIndex] ?? null
  const persistedRevealed = act2Answers.length > qIndex

  const [selected, setSelected] = useState(persistedSelection)
  const [revealed, setRevealed] = useState(persistedRevealed)
  const [loading, setLoading] = useState(questions.length === 0)

  // Sync selection/revealed back from persisted store when question index changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelected(act2Selections[qIndex] ?? null)
    setRevealed(act2Answers.length > qIndex)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex])

  useEffect(() => {
    if (questions.length === 0) {
      getTodaysQuestions().then(q => {
        setTodayQuestions(q)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(opt) {
    if (revealed) return
    setSelected(opt)
  }

  function handleConfirm() {
    if (!revealed) {
      const correct = selected === q.correct_answer
      recordAct2Answer(correct, selected)
      setRevealed(true)
    } else {
      setSelected(null)
      setRevealed(false)
      if (qIndex + 1 >= 5) {
        const totalXP = useGameStore.getState().act2Answers.filter(Boolean).length * BASE_XP.act2perQ
        completeAct(2, totalXP)
        navigate('/act/3')
      } else {
        advanceAct2Question()
      }
    }
  }

  const options = q?.options || []
  const containerRef = useRef(null)

  useEffect(() => {
    if (!loading) containerRef.current?.focus()
  }, [loading])

  useEffect(() => {
    function onKey(e) {
      const letterIdx = { a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()]
      if (letterIdx !== undefined && !revealed && options[letterIdx] !== undefined) {
        setSelected(options[letterIdx])
        return
      }
      if ((e.key === 'Enter' || e.key === ' ') && (selected || revealed)) {
        e.preventDefault()
        handleConfirm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, selected, options])

  if (loading || !q) {
    return (
      <div className="sd-wrap">
        <Spinner size={48} label="Preparing the inquisition" />
      </div>
    )
  }

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
      <ProgressBar currentAct={2} />
      <div ref={containerRef} tabIndex={-1} style={{ outline: 'none' }} className="sd-game-content">

        <motion.div
          className="sd-act-header"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="sd-act-badge">ACT II</span>
          <span className="sd-act-title">The Inquisition</span>
          <span className="sd-xp-pill">{BASE_XP.act2perQ * 5} xp</span>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--sd-px) 12px' }}>
          <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Question {qIndex + 1} of 5
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2, 3, 4].map(i => {
              const isDone = i < qIndex || (i === qIndex && revealed)
              const isActive = i === qIndex && !revealed
              const bg = isDone ? '#2d6640' : isActive ? 'var(--sd-red)' : 'rgba(255,255,255,0.08)'
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    boxShadow: isActive ? '0 0 8px rgba(232, 53, 80, 0.65)' : '0 0 0 rgba(0,0,0,0)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: bg }}
                />
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: '0 var(--sd-px) 14px', background: 'var(--sd-card)',
              borderRadius: 12, padding: '16px',
              border: '1px solid var(--sd-border)',
              minHeight: 90,
            }}
          >
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>
              {q.question}
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          key={qIndex}
          className="sd-options"
          variants={optionStagger}
          initial="hidden"
          animate="visible"
        >
          {options.map((opt, i) => (
            <motion.button
              key={i}
              variants={optionItem}
              whileTap={!revealed ? { scale: 0.98 } : undefined}
              className={getOptionClass(opt)}
              onClick={() => handleSelect(opt)}
            >
              <span className="sd-option-letter">{LETTERS[i]}</span>
              <span className="sd-option-text">{opt}</span>
              {revealed && opt === q.correct_answer && <span className="sd-option-icon">✓</span>}
              {revealed && opt === selected && opt !== q.correct_answer && <span className="sd-option-icon">✕</span>}
            </motion.button>
          ))}
        </motion.div>

        {revealed && (
          <div className={`sd-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? `+${BASE_XP.act2perQ} xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not quite.'}
          </div>
        )}

        <motion.div
          style={{ padding: '14px var(--sd-px) 0' }}
          className="sd-cta-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <button className="sd-cta-btn" onClick={handleConfirm} disabled={!selected && !revealed}>
            {!revealed ? 'Confirm' : isLast ? 'See Act III' : 'Next question'}
          </button>
        </motion.div>

      </div>
    </div>
  )
}
