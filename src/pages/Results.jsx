import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { getRankForXP, getNextRank } from '../utils/ranks'
import { getDayNumber } from '../utils/questions'
import { ACTS } from '../utils/gameConfig'

export default function Results() {
  const navigate = useNavigate()
  const { xpEarned, completedActs, userXP, streak, username } = useGameStore()
  const dayNum = getDayNumber()

  const todayTotal = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + todayTotal

  const prevRank = getRankForXP(userXP)
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)
  const rankedUp = prevRank.name !== rank.name

  const [counted, setCounted] = useState(0)
  const [showRankUp, setShowRankUp] = useState(false)

  useEffect(() => {
    if (todayTotal === 0) return
    let start = 0
    const step = Math.ceil(todayTotal / 60)
    const id = setInterval(() => {
      start = Math.min(start + step, todayTotal)
      setCounted(start)
      if (start >= todayTotal) {
        clearInterval(id)
        if (rankedUp) setTimeout(() => setShowRankUp(true), 400)
      }
    }, 20)
    return () => clearInterval(id)
  }, [todayTotal, rankedUp])

  const barMax = nextRank ? nextRank.minXP : displayXP
  const barMin = rank.minXP
  const barRange = barMax - barMin
  const baseWidth = barRange > 0 ? Math.min(((userXP - barMin) / barRange) * 100, 100) : 0
  const gainWidth = barRange > 0 ? Math.min((todayTotal / barRange) * 100, 100 - baseWidth) : 0

  const displayName = username || 'Survivor'

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />

      {/* Full green progress */}
      <div className="sd-progress">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="sd-progress-seg completed" />
        ))}
      </div>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '32px var(--sd-px) 24px',
        background: 'linear-gradient(180deg, rgba(192,21,42,0.1) 0%, transparent 100%)',
        borderBottom: '0.5px solid var(--sd-border)',
      }}>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-red)',
          textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10,
        }}>
          Day #{dayNum} complete
        </div>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 40, color: 'var(--sd-cream)', lineHeight: 1.05, marginBottom: 8 }}>
          {displayName}, you survived.
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', fontStyle: 'italic' }}>
          Another night behind you. Another waiting.
        </div>
      </div>

      {/* XP card */}
      <div style={{ padding: '20px var(--sd-px) 0' }}>
        <div style={{
          borderRadius: 16,
          border: `1px solid ${rank.color}44`,
          background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(192,21,42,0.05) 100%)`,
          padding: '22px 20px 18px',
        }}>
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6,
          }}>
            XP earned today
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 72, color: rank.color, lineHeight: 1 }}>
              {counted}
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)' }}>xp</div>
          </div>

          {/* Two-tone rank progress bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: rank.color }}>{rank.name}</div>
            {nextRank && (
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: 'var(--sd-muted)' }}>{nextRank.name}</div>
            )}
          </div>
          <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
            <div style={{
              width: `${baseWidth}%`, height: '100%',
              background: rank.color, borderRadius: '4px 0 0 4px', flexShrink: 0,
            }} />
            <div style={{
              width: `${gainWidth}%`, height: '100%',
              background: '#ba7517',
              animation: 'xp-bar-pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }} />
          </div>
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 7,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{userXP} XP before today</span>
            {nextRank && <span>{nextRank.minXP - displayXP} to {nextRank.name}</span>}
          </div>
        </div>
      </div>

      {/* Rank-up callout */}
      {showRankUp && (
        <div style={{ padding: '14px var(--sd-px) 0' }}>
          <div style={{
            borderRadius: 14,
            border: `1px solid ${rank.color}66`,
            background: `${rank.color}12`,
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 11, color: rank.color,
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4,
              }}>
                Rank up
              </div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: rank.color, lineHeight: 1 }}>
                {rank.name}
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', fontStyle: 'italic', marginTop: 3 }}>
                {rank.flavor}
              </div>
            </div>
            <div style={{
              fontFamily: "'Creepster', cursive", fontSize: 28, color: rank.color,
              opacity: 0.6, flexShrink: 0,
            }}>↑</div>
          </div>
        </div>
      )}

      {/* Act breakdown */}
      <div style={{ padding: '20px var(--sd-px) 0' }}>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>
          Act breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ACTS.map(({ num, badge, name, key, maxXP: max }) => {
            const earned = xpEarned[key] || 0
            const done = completedActs.includes(num)
            const full = earned >= max
            const partial = earned > 0 && !full
            const accentColor = !done ? 'rgba(255,255,255,0.15)' : full ? '#2d6640' : partial ? '#7a5a1a' : 'rgba(192,21,42,0.3)'
            const xpColor = !done ? 'var(--sd-muted)' : full ? '#7cc48a' : partial ? '#d4a04a' : 'var(--sd-muted)'
            const borderColor = !done ? 'rgba(255,255,255,0.1)' : full ? 'rgba(45,102,64,0.25)' : partial ? 'rgba(180,120,20,0.25)' : 'rgba(192,21,42,0.15)'

            return (
              <div key={num} style={{
                borderRadius: 11,
                borderTop: `1px solid ${borderColor}`,
                borderRight: `1px solid ${borderColor}`,
                borderBottom: `1px solid ${borderColor}`,
                borderLeft: `3px solid ${accentColor}`,
                background: full ? 'rgba(45,102,64,0.07)' : partial ? 'rgba(180,120,20,0.07)' : 'var(--sd-card)',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 42, flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Creepster', cursive", fontSize: 11,
                    color: done ? xpColor : 'var(--sd-muted)',
                    letterSpacing: 1, lineHeight: 1,
                  }}>
                    {badge}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 17, color: 'var(--sd-cream)', lineHeight: 1.1 }}>{name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: xpColor, lineHeight: 1 }}>{earned}</span>
                  <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}> / {max} xp</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak */}
      <div style={{ padding: '16px var(--sd-px) 0' }}>
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(192,21,42,0.25)',
          background: 'rgba(192,21,42,0.07)',
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 48, color: 'var(--sd-red)', lineHeight: 1, flexShrink: 0 }}>
            {streak}
          </div>
          <div>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: 'var(--sd-cream)' }}>
              {streak === 1 ? 'day streak' : 'day streak'}
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 2 }}>
              {streak >= 7 ? 'A week without breaking. Impressive.' : streak >= 3 ? "Don't break the chain." : 'Keep coming back.'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px var(--sd-px) 24px' }}>
        {[
          { label: 'Past rituals', onClick: () => navigate('/history') },
          { label: 'My profile',   onClick: () => navigate('/profile') },
        ].map(({ label, onClick }) => (
          <button key={label} onClick={onClick} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
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
