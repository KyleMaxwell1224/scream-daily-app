import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { getRankForXP, getNextRank } from '../utils/ranks'
import { getDayNumber } from '../utils/questions'

const ACTS_META = [
  { num: 1, badge: 'ACT I',   name: 'Scene of the Crime', key: 'act1', max: 25  },
  { num: 2, badge: 'ACT II',  name: 'The Inquisition',    key: 'act2', max: 50  },
  { num: 3, badge: 'ACT III', name: 'Speak of the Devil', key: 'act3', max: 35  },
  { num: 4, badge: 'ACT IV',  name: 'Final Reckoning',    key: 'act4', max: 100 },
]

export default function Results() {
  const navigate = useNavigate()
  const { xpEarned, completedActs, userXP, streak } = useGameStore()
  const dayNum = getDayNumber()

  const todayTotal = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + todayTotal
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)

  const [counted, setCounted] = useState(0)

  useEffect(() => {
    if (todayTotal === 0) { setCounted(0); return }
    let start = 0
    const step = Math.ceil(todayTotal / 60)
    const id = setInterval(() => {
      start = Math.min(start + step, todayTotal)
      setCounted(start)
      if (start >= todayTotal) clearInterval(id)
    }, 20)
    return () => clearInterval(id)
  }, [todayTotal])

  const rankBase = userXP
  const rankTotal = displayXP
  const barMax = nextRank ? nextRank.minXP : rankTotal
  const barMin = rank.minXP
  const barRange = barMax - barMin
  const baseWidth = barRange > 0 ? ((rankBase - barMin) / barRange) * 100 : 0
  const gainWidth = barRange > 0 ? (todayTotal / barRange) * 100 : 0

  return (
    <div className="sd-wrap">
      <Logo />

      {/* All segments green */}
      <div className="sd-progress">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="sd-progress-seg completed" />
        ))}
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '28px var(--sd-px) 20px' }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Day #{dayNum} complete
        </div>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 38, lineHeight: 1.1 }}>
          The ritual is{' '}
          <span style={{ color: 'var(--sd-red)' }}>complete.</span>
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 8 }}>
          You survived another night.
        </div>
      </div>

      {/* XP hero card */}
      <div style={{
        margin: '0 var(--sd-px) 20px',
        background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
        borderRadius: 16, padding: '20px',
      }}>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          XP earned today
        </div>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 64, color: 'var(--sd-red)', lineHeight: 1 }}>
          {counted}
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-muted)', marginBottom: 16 }}>
          experience points
        </div>

        <div style={{ height: 1, background: 'var(--sd-border)', margin: '0 0 14px' }} />

        {/* Rank progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 14, color: rank.color }}>{rank.name}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>{rankBase} XP</div>
          </div>
          {nextRank && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 14, color: 'var(--sd-muted)' }}>{nextRank.name}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>{nextRank.minXP} XP</div>
            </div>
          )}
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${Math.min(baseWidth, 100)}%`, height: '100%', background: rank.color, borderRadius: '3px 0 0 3px', flexShrink: 0 }} />
          <div style={{
            width: `${Math.min(gainWidth, 100 - baseWidth)}%`, height: '100%',
            background: '#ba7517',
            animation: 'xp-bar-pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
        </div>
      </div>

      {/* Act breakdown */}
      <div style={{ paddingBottom: 18 }}>
        <div className="sd-section-label">Act breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 var(--sd-px)' }}>
          {ACTS_META.map(({ num, badge, name, key, max }) => {
            const earned = xpEarned[key] || 0
            const done = completedActs.includes(num)
            const color = earned === 0 ? 'var(--sd-muted)' : earned >= max ? '#7cc48a' : '#d4a04a'
            return (
              <div key={num} style={{
                background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: 'var(--sd-red)', width: 36, flexShrink: 0 }}>{badge}</span>
                <span style={{ fontFamily: "'Teko', sans-serif", fontSize: 16, color: 'var(--sd-cream)', flex: 1 }}>{name}</span>
                <span style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color }}>{earned} xp</span>
                <span style={{ fontSize: 14 }}>{done ? (earned > 0 ? '✓' : '○') : '—'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak banner */}
      <div style={{ padding: '0 var(--sd-px) 20px' }}>
        <div style={{
          background: 'rgba(192,21,42,0.1)', border: '1px solid rgba(192,21,42,0.25)',
          borderRadius: 12, padding: '16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 36, color: 'var(--sd-red)', flexShrink: 0 }}>
            {streak}
          </div>
          <div>
            <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 16, color: 'var(--sd-cream)' }}>Day streak</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>
              Keep coming back. Don't break the chain.
            </div>
          </div>
        </div>
      </div>

      {/* Secondary buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 var(--sd-px) 14px' }}>
        {[
          { label: 'Past rituals', onClick: () => {} },
          { label: 'My profile',   onClick: () => navigate('/profile') },
        ].map(({ label, onClick }) => (
          <button key={label} onClick={onClick} style={{
            background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
            borderRadius: 12, padding: '14px',
            fontFamily: "'Special Elite', serif", fontSize: 11,
            color: 'var(--sd-cream-dim)', cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
