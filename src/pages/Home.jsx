import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { getTodaysQuestions, getDayNumber } from '../utils/questions'
import { getRankForXP, getNextRank } from '../utils/ranks'

const ACTS = [
  { num: 1, badge: 'ACT I',   name: 'Scene of the Crime', desc: 'Identify the film from a horror still.', xp: 25  },
  { num: 2, badge: 'ACT II',  name: 'The Inquisition',    desc: '5 multiple choice trivia questions.',   xp: 50  },
  { num: 3, badge: 'ACT III', name: 'Speak of the Devil', desc: 'Name the film from a famous quote.',    xp: 35  },
  { num: 4, badge: 'ACT IV',  name: 'Final Reckoning',    desc: 'Open answer — no multiple choice.',     xp: 100 },
]

function getWeekDays() {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CheckIcon() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%',
      background: '#1a3d22', border: '1px solid #2d6640',
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#2d6640" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { completedActs, xpEarned, setTodayQuestions, userXP, streak, daysPlayed } = useGameStore()

  const totalXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + totalXP
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)
  const dayNum = getDayNumber()

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const nextAct = [1, 2, 3, 4].find(n => !completedActs.includes(n)) || null

  useEffect(() => {
    getTodaysQuestions().then(setTodayQuestions)
  }, [])

  const xpBarFill = nextRank
    ? ((displayXP - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100
    : 100

  const weekDays = getWeekDays()

  return (
    <div className="sd-wrap">
      <Logo />

      {/* Date bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '9px var(--sd-px)',
        borderTop: '0.5px solid var(--sd-border)',
        borderBottom: '0.5px solid var(--sd-border)',
      }}>
        <span style={{ color: 'var(--sd-red)', fontSize: 10 }}>▼</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)' }}>
          {dateStr} · Day #{dayNum}
        </span>
        <span style={{ color: 'var(--sd-red)', fontSize: 10 }}>▼</span>
      </div>

      {/* Rank card */}
      <div style={{ padding: '14px var(--sd-px) 0' }}>
        <div style={{
          background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
          borderRadius: 14, padding: '14px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: 'var(--sd-red-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20 }}>💀</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: rank.color, letterSpacing: 1 }}>
              {rank.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{
                flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{ width: `${xpBarFill}%`, height: '100%', background: 'var(--sd-red)', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 3 }}>
              {displayXP} XP
              {nextRank ? ` · ${nextRank.minXP - displayXP} to ${nextRank.name}` : ' · Max rank'}
            </div>
          </div>
        </div>
      </div>

      {/* Today's ritual */}
      <div style={{ padding: '18px 0 8px' }}>
        <div className="sd-section-label">Today's ritual</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 var(--sd-px)' }}>
          {ACTS.map(({ num, badge, name, desc, xp }) => {
            const done = completedActs.includes(num)
            return (
              <div
                key={num}
                onClick={() => !done && navigate(`/act/${num}`)}
                style={{
                  background: 'var(--sd-card)', borderRadius: 12,
                  border: '1px solid var(--sd-border)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: done ? 'default' : 'pointer',
                  opacity: done ? 0.7 : 1,
                }}
              >
                <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: 'var(--sd-red)', letterSpacing: 0.5 }}>{badge}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 17, color: 'var(--sd-cream)', fontWeight: 500 }}>{name}</div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 1 }}>{desc}</div>
                </div>
                {done ? (
                  <CheckIcon />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontFamily: "'Special Elite', serif", fontSize: 10,
                      color: 'var(--sd-cream-dim)', border: '0.5px solid var(--sd-border)',
                      borderRadius: 20, padding: '2px 7px',
                    }}>+{xp} xp</span>
                    <span style={{ color: 'var(--sd-muted)', fontSize: 14 }}>›</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '14px 0' }}>
        <button
          className="sd-cta-btn"
          onClick={() => nextAct && navigate(`/act/${nextAct}`)}
          disabled={!nextAct}
        >
          {completedActs.length === 0 ? 'Begin the ritual' : nextAct ? 'Continue the ritual' : 'Ritual complete'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, padding: '4px var(--sd-px) 18px' }}>
        {[
          { label: 'Day streak', value: streak },
          { label: 'Days played', value: daysPlayed },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, background: 'var(--sd-card)', borderRadius: 12,
            border: '1px solid var(--sd-border)', padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 32, color: 'var(--sd-red)' }}>{value}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* This week */}
      <div style={{ paddingBottom: 18 }}>
        <div className="sd-section-label">This week</div>
        <div style={{ display: 'flex', gap: 6, padding: '0 var(--sd-px)' }}>
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString()
            const isPast = d < today && !isToday
            return (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 8,
                border: isToday
                  ? '1px solid var(--sd-red)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: isPast ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}>
                <div style={{
                  fontFamily: "'Special Elite', serif", fontSize: 8,
                  color: isToday ? 'var(--sd-red)' : 'var(--sd-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{DAY_LABELS[i]}</div>
                {isToday && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sd-red)', margin: '4px auto 0' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
