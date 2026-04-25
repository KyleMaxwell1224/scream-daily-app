import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
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
      background: '#1a3d22', border: '1px solid #2d6640', flexShrink: 0,
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

  const RankCard = () => (
    <div style={{
      background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
      borderRadius: 14, padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'var(--sd-red-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💀</div>
        <div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: rank.color, letterSpacing: 1 }}>{rank.name}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 1 }}>
            {displayXP} XP{nextRank ? ` · ${nextRank.minXP - displayXP} to ${nextRank.name}` : ' · Max rank'}
          </div>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${xpBarFill}%`, height: '100%', background: 'var(--sd-red)', borderRadius: 2 }} />
      </div>
    </div>
  )

  const StatsRow = () => (
    <div style={{ display: 'flex', gap: 10 }}>
      {[{ label: 'Day streak', value: streak }, { label: 'Days played', value: daysPlayed }].map(({ label, value }) => (
        <div key={label} style={{
          flex: 1, background: 'var(--sd-card)', borderRadius: 12,
          border: '1px solid var(--sd-border)', padding: '14px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 32, color: 'var(--sd-red)' }}>{value}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
        </div>
      ))}
    </div>
  )

  const CalendarStrip = () => (
    <div>
      <div className="sd-section-label" style={{ padding: 0, marginBottom: 8 }}>This week</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          const isPast = d < today && !isToday
          return (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8,
              border: isToday ? '1px solid var(--sd-red)' : '1px solid rgba(255,255,255,0.06)',
              background: isPast ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 8,
                color: isToday ? 'var(--sd-red)' : 'var(--sd-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{DAY_LABELS[i]}</div>
              {isToday && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sd-red)', margin: '4px auto 0' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )

  const ActList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ACTS.map(({ num, badge, name, desc, xp }) => {
        const done = completedActs.includes(num)
        return (
          <div
            key={num}
            onClick={() => !done && navigate(`/act/${num}`)}
            style={{
              background: 'var(--sd-card)', borderRadius: 12,
              border: '1px solid var(--sd-border)', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: done ? 'default' : 'pointer', opacity: done ? 0.7 : 1,
            }}
          >
            <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 11, color: 'var(--sd-red)', letterSpacing: 0.5 }}>{badge}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: 'var(--sd-cream)', fontWeight: 500 }}>{name}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 1 }}>{desc}</div>
            </div>
            {done ? <CheckIcon /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                  border: '0.5px solid var(--sd-border)', borderRadius: 20, padding: '2px 7px',
                }}>+{xp} xp</span>
                <span style={{ color: 'var(--sd-muted)', fontSize: 14 }}>›</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />

      {/* Date bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '9px var(--sd-px)',
        borderBottom: '0.5px solid var(--sd-border)',
      }}>
        <span style={{ color: 'var(--sd-red)', fontSize: 10 }}>▼</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)' }}>
          {dateStr} · Day #{dayNum}
        </span>
        <span style={{ color: 'var(--sd-red)', fontSize: 10 }}>▼</span>
      </div>

      {/* Two-column grid on desktop, single column on mobile */}
      <div className="sd-home-content">

        {/* Left: act list + CTA */}
        <div className="sd-home-left">
          {/* Mobile-only: rank card above acts */}
          <div className="sd-mobile-only" style={{ paddingTop: 'var(--sd-px)' }}>
            <RankCard />
          </div>

          <div style={{ paddingTop: 18, paddingBottom: 8 }}>
            <div className="sd-section-label" style={{ padding: 0, marginBottom: 10 }}>Today's ritual</div>
            <ActList />
          </div>

          <div style={{ paddingBottom: 18 }}>
            <button
              className="sd-cta-btn"
              onClick={() => nextAct && navigate(`/act/${nextAct}`)}
              disabled={!nextAct}
            >
              {completedActs.length === 0 ? 'Begin the ritual' : nextAct ? 'Continue the ritual' : 'Ritual complete'}
            </button>
          </div>

          {/* Mobile-only: stats + calendar below CTA */}
          <div className="sd-mobile-only" style={{ paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <StatsRow />
            <CalendarStrip />
          </div>
        </div>

        {/* Right: rank + stats + calendar (desktop only) */}
        <div className="sd-home-right sd-desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 18 }}>
          <RankCard />
          <StatsRow />
          <CalendarStrip />
        </div>

      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
