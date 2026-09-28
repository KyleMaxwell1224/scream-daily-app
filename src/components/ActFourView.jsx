import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { ACT4_XP_SCALE } from '../utils/gameConfig'

const GRADE_COLOR = {
  exact:   '#2d6640',
  close:   '#ba7517',
  partial: '#c0152a',
  wrong:   '#5a1212',
}
const GRADE_LABEL = {
  exact: 'Perfect.',
  close: 'Close.',
  partial: 'Partial.',
  wrong: 'Wrong.',
}

export default function ActFourView({
  q,
  answer,
  setAnswer,
  result,
  onSubmit,
  onContinue,
  onSkip,
  continueBtnLabel = 'See results',
  xpScale = ACT4_XP_SCALE,
}) {
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

  const gradeColor = result ? GRADE_COLOR[result.grade] ?? '#5a1212' : null
  const gradeLabel = result ? GRADE_LABEL[result.grade] ?? 'Wrong.' : null

  return (
    <>
      <motion.div
        className="sd-act-header"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <span className="sd-act-badge">ACT IV</span>
        <span className="sd-act-title">Final reckoning</span>
        <span className="sd-xp-pill">0–{xpScale.exact} xp</span>
      </motion.div>

      {/* Warning banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        style={{
          margin: '4px var(--sd-px) 14px',
          background: 'rgba(192, 21, 42, 0.1)',
          border: '1px solid rgba(192, 21, 42, 0.3)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, color: 'var(--sd-red-bright)' }}>⚠</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10.5, color: 'var(--sd-cream-dim)', lineHeight: 1.5 }}>
          No multiple choice. Type your answer exactly. Partial credit is awarded — the closer you are, the more XP you earn.
        </span>
      </motion.div>

      {/* Question card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          margin: '0 var(--sd-px) 14px',
          background: 'var(--sd-card)',
          borderRadius: 12, padding: '18px',
          animation: result ? 'none' : 'pulse-border 3s ease-in-out infinite',
          border: '1px solid var(--sd-border)',
          boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red-bright)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
          The brutal question
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14.5, color: 'var(--sd-cream)', lineHeight: 1.65 }}>
          {q.question}
        </div>
      </motion.div>

      {/* XP scale */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.28 } } }}
        style={{ display: 'flex', gap: 8, padding: '0 var(--sd-px) 14px' }}
      >
        {[
          { label: 'Exact',   val: xpScale.exact,   bg: 'rgba(45,102,64,0.18)',  border: 'rgba(45,102,64,0.35)',  color: '#7cc48a' },
          { label: 'Close',   val: xpScale.close,   bg: 'rgba(186,117,23,0.18)', border: 'rgba(186,117,23,0.35)', color: '#d4a04a' },
          { label: 'Partial', val: xpScale.partial, bg: 'rgba(192,21,42,0.1)',   border: 'rgba(192,21,42,0.25)',  color: 'var(--sd-cream-dim)' },
        ].map(({ label, val, bg, border, color }) => (
          <motion.div
            key={label}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
            style={{
              flex: 1, textAlign: 'center', padding: '10px 8px',
              background: bg, border: `1px solid ${border}`, borderRadius: 8,
            }}
          >
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color }}>{val}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', padding: '0 var(--sd-px) 10px', textAlign: 'center', letterSpacing: '0.08em' }}
      >
        Type your answer below — spelling counts
      </motion.div>

      <motion.input
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: result ? 0.6 : 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        ref={inputRef}
        className="sd-input"
        value={answer}
        onChange={e => !result && setAnswer(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !result && answer.trim()) onSubmit() }}
        placeholder="Type your answer..."
        disabled={!!result}
        autoFocus={!result}
      />

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textAlign: 'center', padding: '8px var(--sd-px)', letterSpacing: '0.06em' }}>
        One attempt only. No going back.
      </div>

      {/* Result card */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          style={{
            margin: '4px var(--sd-px) 14px',
            background: result.grade === 'wrong'
              ? 'linear-gradient(135deg, rgba(90,18,18,0.28) 0%, var(--sd-card) 100%)'
              : result.grade === 'exact'
              ? 'linear-gradient(135deg, rgba(45,102,64,0.24) 0%, var(--sd-card) 100%)'
              : 'linear-gradient(135deg, rgba(186,117,23,0.18) 0%, var(--sd-card) 100%)',
            border: `1px solid ${gradeColor}66`,
            borderRadius: 12, padding: '18px',
            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 30px ${gradeColor}22`,
          }}
        >
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: gradeColor, marginBottom: 4, letterSpacing: '0.5px' }}>{gradeLabel}</div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 32, color: gradeColor, letterSpacing: '0.5px' }}>+{result.xp} xp</div>
          {q.explanation && (
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)', marginTop: 10, lineHeight: 1.55 }}>
              {q.explanation}
            </div>
          )}
          {result.grade !== 'exact' && (
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10.5, color: 'var(--sd-muted)', marginTop: 8 }}>
              Correct answer: <span style={{ color: 'var(--sd-cream)' }}>{q.correct_answer}</span>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        className="sd-cta-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35 }}
        style={{ padding: '4px var(--sd-px) 0' }}
      >
        <button
          className="sd-cta-btn"
          onClick={result ? onContinue : onSubmit}
          disabled={!answer.trim() && !result}
          style={{ margin: 0, width: '100%' }}
        >
          {result ? continueBtnLabel : 'Seal your fate'}
        </button>
      </motion.div>

      {!result && onSkip && (
        <button className="sd-skip-link" onClick={onSkip}>
          Skip — 0 xp
        </button>
      )}
    </>
  )
}
