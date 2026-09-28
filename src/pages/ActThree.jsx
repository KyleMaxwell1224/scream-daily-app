import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import ProgressBar from '../components/ProgressBar'
import Spinner from '../components/Spinner'
import useGameStore from '../store/useGameStore'
import { getTodaysQuestions } from '../utils/questions'
import { BASE_XP, LETTERS } from '../utils/gameConfig'

const optionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
}
const optionItem = {
  hidden:  { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function ActThree() {
  const navigate = useNavigate()
  const { todayQuestions, setTodayQuestions, completeAct, actResults, setActResult } = useGameStore()
  const saved = actResults.act3

  const [selected, setSelected] = useState(saved?.selected ?? null)
  const [revealed, setRevealed] = useState(saved?.revealed ?? false)
  const [loading, setLoading] = useState(!todayQuestions.act3)

  const q = todayQuestions.act3
  const options = q?.options || []
  const containerRef = useRef(null)

  useEffect(() => {
    if (!loading) containerRef.current?.focus()
  }, [loading])

  useEffect(() => {
    if (!q) {
      getTodaysQuestions().then(qs => {
        setTodayQuestions(qs)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleConfirm() {
    if (!revealed) {
      setRevealed(true)
      setActResult(3, { selected, revealed: true })
    } else {
      const xp = selected === q.correct_answer ? BASE_XP.act3 : 0
      completeAct(3, xp)
      navigate('/act/4')
    }
  }

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
        <Spinner size={48} label="Listening for a voice" />
      </div>
    )
  }

  const isCorrect = revealed && selected === q.correct_answer

  function getOptionClass(opt) {
    if (!revealed) return selected === opt ? 'sd-option selected' : 'sd-option'
    if (opt === q.correct_answer) return 'sd-option correct'
    if (opt === selected && !isCorrect) return 'sd-option wrong'
    return 'sd-option disabled'
  }

  return (
    <div className="sd-wrap">
      <ProgressBar currentAct={3} />
      <div ref={containerRef} tabIndex={-1} style={{ outline: 'none' }} className="sd-game-content">

      <motion.div
        className="sd-act-header"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="sd-act-badge">ACT III</span>
        <span className="sd-act-title">Speak of the devil</span>
        <span className="sd-xp-pill">{BASE_XP.act3} xp</span>
      </motion.div>

      {/* Quote card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        style={{
          margin: '4px var(--sd-px) 14px',
          background: 'var(--sd-card)',
          borderRadius: 14,
          border: '1px solid var(--sd-border)',
          borderLeft: '3px solid var(--sd-red)',
          padding: '20px 18px 16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          position: 'absolute', top: -14, left: 6,
          fontFamily: "'Creepster', cursive", fontSize: 90,
          color: 'rgba(192, 21, 42, 0.18)', lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>"</div>
        <div className="sd-quote-reveal" style={{
          fontFamily: "'Special Elite', serif", fontSize: 15,
          color: 'var(--sd-cream)', fontStyle: 'italic', lineHeight: 1.75,
          position: 'relative', zIndex: 1,
          animationDelay: '0.15s',
        }}>
          {q.quote || q.question}
        </div>
        {q.attribution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            style={{
              fontFamily: "'Special Elite', serif", fontSize: 10,
              color: 'var(--sd-muted)', marginTop: 12,
            }}
          >
            — {q.attribution}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        style={{
          fontFamily: "'Special Elite', serif", fontSize: 11,
          color: 'var(--sd-muted)', textAlign: 'center',
          textTransform: 'uppercase', letterSpacing: '0.14em',
          padding: '0 var(--sd-px) 14px',
        }}
      >
        Which horror film is this quote from?
      </motion.div>

      <motion.div
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
            onClick={() => !revealed && setSelected(opt)}
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
          {isCorrect ? `+${BASE_XP.act3} xp — ${q.explanation || 'Correct!'}` : q.explanation || 'Not this time.'}
        </div>
      )}

      <motion.div
        className="sd-cta-wrap"
        style={{ padding: '14px var(--sd-px) 0' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35 }}
      >
        <button className="sd-cta-btn" onClick={handleConfirm} disabled={!selected && !revealed}>
          {!revealed ? 'Confirm' : 'Next: Final Reckoning'}
        </button>
      </motion.div>

      <button className="sd-skip-link" onClick={() => { completeAct(3, 0); navigate('/act/4') }}>
        Skip — 0 xp
      </button>

      </div>
    </div>
  )
}
