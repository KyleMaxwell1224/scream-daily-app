import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import RankSigil from './RankSigil'

// Deterministic particle positions so the layout doesn't reshuffle on re-render
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
  y: (Math.cos(i * 78.233) * 43758.5453) % 1,
  size: 2 + ((i * 7) % 4),
  delay: (i * 0.13) % 2,
  duration: 3.6 + ((i * 0.29) % 2.4),
}))

export default function RankUpTakeover({ rank, prevRank, onDismiss }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault(); onDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <AnimatePresence>
      <motion.div
        key="takeover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: `radial-gradient(ellipse at center, ${rank.color}33 0%, rgba(10, 4, 4, 0.94) 60%, rgba(0,0,0,0.98) 100%)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
          cursor: 'pointer',
        }}
      >
        {/* Rising particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {PARTICLES.map(p => (
            <motion.span
              key={p.id}
              initial={{ y: '110vh', opacity: 0 }}
              animate={{ y: '-10vh', opacity: [0, 0.7, 0.7, 0] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.1, 0.9, 1],
              }}
              style={{
                position: 'absolute',
                left: `${p.x * 100}%`,
                width: p.size, height: p.size,
                borderRadius: '50%',
                background: rank.color,
                boxShadow: `0 0 8px ${rank.color}, 0 0 20px ${rank.color}88`,
                filter: 'blur(0.4px)',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
          onClick={e => e.stopPropagation()}
          style={{
            textAlign: 'center',
            position: 'relative', zIndex: 1,
            maxWidth: 420,
            cursor: 'default',
          }}
        >
          {/* "RANK UP" label */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontFamily: "'Special Elite', serif",
              fontSize: 12,
              color: rank.color,
              textTransform: 'uppercase',
              marginBottom: 24,
              paddingLeft: '0.42em',
              textShadow: `0 0 12px ${rank.color}`,
            }}
          >
            Rank Ascended
          </motion.div>

          {/* Sigil in a giant ring */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.15 }}
            style={{
              width: 120, height: 120, borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: rank.color,
              background: `radial-gradient(circle at 30% 30%, ${rank.color}30 0%, rgba(0,0,0,0.4) 90%)`,
              border: `2px solid ${rank.color}`,
              boxShadow: `0 0 0 8px ${rank.color}18, 0 0 40px ${rank.color}66, 0 0 80px ${rank.color}44, inset 0 2px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <RankSigil name={rank.name} size={60} strokeWidth={1.6} />
          </motion.div>

          {/* Previous → New */}
          {prevRank && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              style={{
                fontFamily: "'Special Elite', serif",
                fontSize: 11,
                color: 'var(--sd-muted)',
                marginBottom: 8,
                letterSpacing: '0.1em',
              }}
            >
              <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{prevRank.name}</span>
              <span style={{ margin: '0 10px', color: rank.color }}>→</span>
            </motion.div>
          )}

          {/* Rank name */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.55 }}
            style={{
              fontFamily: "'Creepster', cursive",
              fontSize: 52,
              color: rank.color,
              lineHeight: 1,
              letterSpacing: '1.5px',
              marginBottom: 16,
              textShadow: `0 0 24px ${rank.color}88, 0 0 60px ${rank.color}44, 2px 2px 0 rgba(0,0,0,0.7)`,
            }}
          >
            {rank.name}
          </motion.div>

          {/* Flavor */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            style={{
              fontFamily: "'Special Elite', serif",
              fontSize: 13,
              color: 'var(--sd-cream-dim)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              maxWidth: 320,
              margin: '0 auto 32px',
            }}
          >
            {rank.flavor}
          </motion.div>

          {/* Dismiss */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.05 }}
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: `1px solid ${rank.color}`,
              borderRadius: 10,
              padding: '11px 32px',
              cursor: 'pointer',
              fontFamily: "'Special Elite', serif",
              fontSize: 11,
              color: rank.color,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${rank.color}18` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Ascend
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.25 }}
            style={{
              fontFamily: "'Special Elite', serif",
              fontSize: 9,
              color: 'var(--sd-muted)',
              letterSpacing: '0.14em',
              marginTop: 14,
              opacity: 0.7,
            }}
          >
            Click anywhere · Enter · Esc
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
