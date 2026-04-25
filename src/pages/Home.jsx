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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDays() {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function CheckIcon() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: '50%',
      background: '#1a3d22', border: '1.5px solid #2d6640', flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#3d8f55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      borderRadius: 16, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: 'var(--sd-red-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>💀</div>
        <div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: rank.color, letterSpacing: 1, lineHeight: 1 }}>{rank.name}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 3 }}>
            {displayXP} XP{nextRank ? ` · ${nextRank.minXP - displayXP} to ${nextRank.name}` : ' · Max rank'}
          </div>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${xpBarFill}%`, height: '100%', background: 'var(--sd-red)', borderRadius: 3 }} />
      </div>
    </div>
  )

  const StatsRow = () => (
    <div style={{ display: 'flex', gap: 10 }}>
      {[{ label: 'Day Streak', value: streak }, { label: 'Days Played', value: daysPlayed }].map(({ label, value }) => (
        <div key={label} style={{
          flex: 1, background: 'var(--sd-card)', borderRadius: 14,
          border: '1px solid var(--sd-border)', padding: '18px 14px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 40, color: 'var(--sd-red)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  )

  const CalendarStrip = () => (
    <div>
      <div style={{
        fontFamily: "'Special Elite', serif", fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        color: 'var(--sd-cream-dim)', marginBottom: 10,
      }}>This week</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          const isPast = d < today && !isToday
          return (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              padding: '10px 4px 8px',
              borderRadius: 10,
              border: isToday
                ? '1.5px solid var(--sd-red)'
                : isPast
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(255,255,255,0.05)',
              background: isToday
                ? 'rgba(192, 21, 42, 0.08)'
                : isPast
                ? 'rgba(255,255,255,0.03)'
                : 'transparent',
            }}>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 10,
                color: isToday ? 'var(--sd-red)' : isPast ? 'var(--sd-cream-dim)' : 'var(--sd-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: isToday ? 'bold' : 'normal',
              }}>{DAY_LABELS[i]}</div>
              <div style={{
                width: 5, height: 5, borderRadius: '50%', margin: '5px auto 0',
                background: isToday ? 'var(--sd-red)' : isPast ? 'rgba(255,255,255,0.15)' : 'transparent',
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )

  const ActList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ACTS.map(({ num, badge, name, desc, xp }) => {
        const done = completedActs.includes(num)
        return (
          <div
            key={num}
            onClick={() => !done && navigate(`/act/${num}`)}
            className="sd-act-row"
            style={{
              background: 'var(--sd-card)', borderRadius: 14,
              border: done ? '1px solid rgba(45,102,64,0.3)' : '1px solid var(--sd-border)',
              padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: done ? 'default' : 'pointer',
              opacity: done ? 0.65 : 1,
            }}
          >
            <div style={{
              width: 48, flexShrink: 0, textAlign: 'center',
              borderRight: '1px solid var(--sd-border)', paddingRight: 14,
            }}>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: 'var(--sd-red)', letterSpacing: 1, lineHeight: 1.2 }}>
                {badge.split(' ')[0]}
              </div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: 'var(--sd-red)', letterSpacing: 1, lineHeight: 1.2 }}>
                {badge.split(' ')[1]}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 22, color: 'var(--sd-cream)', fontWeight: 500, lineHeight: 1.1 }}>{name}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 3 }}>{desc}</div>
            </div>
            {done ? <CheckIcon /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
                  border: '0.5px solid var(--sd-border)', borderRadius: 20, padding: '3px 10px',
                }}>+{xp} xp</span>
                <span style={{ color: 'var(--sd-cream-dim)', fontSize: 18 }}>›</span>
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '13px var(--sd-px)',
        borderBottom: '0.5px solid var(--sd-border)',
        background: 'rgba(192, 21, 42, 0.04)',
      }}>
        <span style={{ color: 'var(--sd-red)', fontSize: 12 }}>▼</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 15, color: 'var(--sd-cream)', letterSpacing: '0.04em' }}>
          {dateStr}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
        <span style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: 'var(--sd-red)', letterSpacing: 1 }}>
          Day #{dayNum}
        </span>
        <span style={{ color: 'var(--sd-red)', fontSize: 12 }}>▼</span>
      </div>

      <div className="sd-home-content">

        {/* Left: act list + CTA */}
        <div className="sd-home-left">
          <div className="sd-mobile-only" style={{ paddingTop: 'var(--sd-px)' }}>
            <RankCard />
          </div>

          <div style={{ paddingTop: 22, paddingBottom: 10 }}>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'var(--sd-cream-dim)', marginBottom: 12,
            }}>Today's ritual</div>
            <ActList />
          </div>

          <div style={{ paddingBottom: 22 }}>
            <button
              className="sd-cta-btn"
              onClick={() => nextAct && navigate(`/act/${nextAct}`)}
              disabled={!nextAct}
            >
              {completedActs.length === 0 ? 'Begin the ritual' : nextAct ? 'Continue the ritual' : 'Ritual complete'}
            </button>
          </div>

          <div className="sd-mobile-only" style={{ paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <StatsRow />
            <CalendarStrip />
          </div>
        </div>

        {/* Right sidebar — desktop only */}
        <div className="sd-home-right sd-desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 22 }}>
          <RankCard />
          <StatsRow />
          <CalendarStrip />
        </div>

      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
