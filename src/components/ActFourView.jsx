import { useEffect, useRef } from 'react'
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
      <div className="sd-act-header">
        <span className="sd-act-badge">ACT IV</span>
        <span className="sd-act-title">Final reckoning</span>
        <span className="sd-xp-pill">0–{xpScale.exact} xp</span>
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

      {/* Question card */}
      <div style={{
        margin: '0 var(--sd-px) 14px',
        background: 'var(--sd-card)',
        borderRadius: 12, padding: '16px',
        animation: result ? 'none' : 'pulse-border 3s ease-in-out infinite',
        border: '1px solid var(--sd-border)',
      }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          The brutal question
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 14, color: 'var(--sd-cream)', lineHeight: 1.6 }}>
          {q.question}
        </div>
      </div>

      {/* XP scale */}
      <div style={{ display: 'flex', gap: 8, padding: '0 var(--sd-px) 14px' }}>
        {[
          { label: 'Exact',   val: xpScale.exact,   bg: 'rgba(45,102,64,0.18)',  border: 'rgba(45,102,64,0.3)',  color: '#7cc48a' },
          { label: 'Close',   val: xpScale.close,   bg: 'rgba(186,117,23,0.18)', border: 'rgba(186,117,23,0.3)', color: '#d4a04a' },
          { label: 'Partial', val: xpScale.partial, bg: 'rgba(192,21,42,0.1)',   border: 'rgba(192,21,42,0.2)',  color: 'var(--sd-cream-dim)' },
        ].map(({ label, val, bg, border, color }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '8px',
            background: bg, border: `1px solid ${border}`, borderRadius: 8,
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 16, color }}>{val}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', padding: '0 var(--sd-px) 10px' }}>
        Type your answer below — spelling counts
      </div>

      <input
        ref={inputRef}
        className="sd-input"
        value={answer}
        onChange={e => !result && setAnswer(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !result && answer.trim()) onSubmit() }}
        placeholder="Type your answer..."
        disabled={!!result}
        autoFocus={!result}
        style={{ opacity: result ? 0.6 : 1 }}
      />

      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textAlign: 'center', padding: '8px var(--sd-px)' }}>
        One attempt only. No going back.
      </div>

      {/* Result card */}
      {result && (
        <div style={{
          margin: '4px var(--sd-px) 14px',
          background: result.grade === 'wrong'
            ? 'rgba(90,18,18,0.2)'
            : result.grade === 'exact'
            ? 'rgba(45,102,64,0.2)'
            : 'rgba(186,117,23,0.15)',
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
          onClick={result ? onContinue : onSubmit}
          disabled={!answer.trim() && !result}
        >
          {result ? continueBtnLabel : 'Seal your fate'}
        </button>
      </div>

      {!result && onSkip && (
        <button className="sd-skip-link" onClick={onSkip}>
          Skip — 0 xp
        </button>
      )}
    </>
  )
}
