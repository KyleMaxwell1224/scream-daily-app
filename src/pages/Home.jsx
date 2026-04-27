import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { getTodaysQuestions, getDayNumber } from '../utils/questions'
import { getRankForXP, getNextRank } from '../utils/ranks'

const ACTS = [
  { num: 1, numeral: 'I',   badge: 'ACT I',   name: 'Scene of the Crime', desc: 'Identify the film from a horror still.', xp: 25  },
  { num: 2, numeral: 'II',  badge: 'ACT II',  name: 'The Inquisition',    desc: '5 multiple choice trivia questions.',   xp: 50  },
  { num: 3, numeral: 'III', badge: 'ACT III', name: 'Speak of the Devil', desc: 'Name the film from a famous quote.',    xp: 35  },
  { num: 4, numeral: 'IV',  badge: 'ACT IV',  name: 'Final Reckoning',    desc: 'Open answer — no multiple choice.',     xp: 100 },
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
      width: 24, height: 24, borderRadius: '50%',
      background: '#1a3d22', border: '1.5px solid #2d6640', flexShrink: 0,
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#3d8f55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ProfilePanel({ username, rank, displayXP, nextRank, xpBarFill, streak, daysPlayed, weekDays, today, weekCompletions = new Set() }) {
  const displayName = username || 'Survivor'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${rank.color}30`,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.02) 0%, rgba(192,21,42,0.04) 100%)',
      overflow: 'hidden',
    }}>
      {/* Identity */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 13,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(192,21,42,0.1)',
          border: `1.5px solid ${rank.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Creepster', cursive", fontSize: 19, color: rank.color }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Creepster', cursive", fontSize: 20, color: 'var(--sd-cream)',
            lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 13, color: rank.color, marginTop: 3 }}>
            {rank.name}
          </div>
        </div>
      </div>

      {/* XP + progress */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', fontStyle: 'italic', flex: 1, marginRight: 10, lineHeight: 1.4 }}>
            {rank.flavor}
          </span>
          <span style={{ fontFamily: "'Teko', sans-serif", fontSize: 20, color: 'var(--sd-cream)', lineHeight: 1, flexShrink: 0 }}>
            {displayXP}<span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginLeft: 3 }}>xp</span>
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: `${xpBarFill}%`, height: '100%', background: rank.color, borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>
          {nextRank ? `${nextRank.minXP - displayXP} XP to ${nextRank.name}` : 'Max rank achieved'}
        </div>
      </div>

      {/* Stats inline */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      }}>
        {[{ label: 'Day streak', value: streak }, { label: 'Days played', value: daysPlayed }].map(({ label, value }, i) => (
          <div key={label} style={{
            padding: '14px 20px', textAlign: 'center',
            borderRight: i === 0 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
          }}>
            <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 34, color: 'var(--sd-cream)', lineHeight: 1 }}>{value}</div>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4,
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Week calendar */}
      <div style={{ padding: '14px 20px 18px' }}>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
        }}>
          This week
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {weekDays.map((d, i) => {
            const dateKey = d.toISOString().slice(0, 10)
            const isToday = d.toDateString() === today.toDateString()
            const isPast = d < today && !isToday
            const isFuture = d > today && !isToday
            const done = weekCompletions.has(dateKey)
            const dotColor = done ? '#3d8f55' : isToday ? rank.color : isPast ? 'rgba(255,255,255,0.1)' : 'transparent'
            const borderColor = done
              ? 'rgba(45,102,64,0.5)'
              : isToday
              ? rank.color
              : isPast
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(255,255,255,0.04)'
            const bg = done
              ? 'rgba(45,102,64,0.12)'
              : isToday
              ? `${rank.color}18`
              : 'transparent'
            const labelColor = done
              ? '#3d8f55'
              : isToday
              ? rank.color
              : isFuture
              ? 'var(--sd-muted)'
              : 'var(--sd-cream-dim)'
            return (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '8px 2px 7px', borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: bg,
              }}>
                <div style={{
                  fontFamily: "'Special Elite', serif", fontSize: 11,
                  textTransform: 'uppercase', color: labelColor,
                }}>
                  {DAY_LABELS[i]}
                </div>
                <div style={{
                  width: 4, height: 4, borderRadius: '50%', margin: '5px auto 0',
                  background: dotColor,
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.25)' }} />
      <span style={{
        fontFamily: "'Creepster', cursive", fontSize: 13, color: 'rgba(192,21,42,0.8)',
        textTransform: 'uppercase', letterSpacing: '0.18em', whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.25)' }} />
    </div>
  )
}

function ActList({ completedActs, navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ACTS.map(({ num, numeral, name, desc, xp }) => {
        const done = completedActs.includes(num)
        return (
          <div
            key={num}
            onClick={() => !done && navigate(`/act/${num}`)}
            className="sd-act-row"
            style={{
              borderRadius: 12,
              border: `1px solid ${done ? 'rgba(45,102,64,0.35)' : 'rgba(192,21,42,0.38)'}`,
              borderLeft: `4px solid ${done ? '#2d6640' : 'var(--sd-red)'}`,
              background: done
                ? 'linear-gradient(135deg, rgba(45,102,64,0.14) 0%, rgba(24,15,15,0.9) 100%)'
                : 'linear-gradient(135deg, rgba(192,21,42,0.13) 0%, rgba(24,15,15,0.9) 100%)',
              boxShadow: done
                ? '0 4px 20px rgba(0,0,0,0.55)'
                : '0 4px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(192,21,42,0.08)',
              padding: '16px 16px 16px 14px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: done ? 'default' : 'pointer',
              opacity: done ? 0.6 : 1,
            }}
          >
            {/* Roman numeral badge */}
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: done ? 'rgba(45,102,64,0.25)' : 'rgba(192,21,42,0.2)',
              border: `1.5px solid ${done ? 'rgba(45,102,64,0.5)' : 'rgba(192,21,42,0.55)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: done ? 'none' : '0 0 10px rgba(192,21,42,0.12)',
            }}>
              <div style={{
                fontFamily: "'Creepster', cursive",
                fontSize: numeral.length > 2 ? 15 : 20,
                color: done ? '#5db87a' : '#e83550',
                lineHeight: 1,
              }}>{numeral}</div>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 10,
                color: done ? 'rgba(93,184,122,0.7)' : 'rgba(232,53,80,0.7)',
                letterSpacing: '0.06em', marginTop: 2,
              }}>ACT</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 22, color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)', lineHeight: 1.1 }}>{name}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: done ? 'var(--sd-muted)' : '#9a8a8a', marginTop: 2 }}>{desc}</div>
            </div>

            {done ? <CheckIcon /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: "'Creepster', cursive", fontSize: 17, color: '#e83550', lineHeight: 1 }}>+{xp}</span>
                <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>xp</span>
                <span style={{ color: 'rgba(232,53,80,0.7)', fontSize: 20, lineHeight: 1 }}>›</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatPastDate(dateStr) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Home() {
  const navigate = useNavigate()
  const {
    completedActs, xpEarned, setTodayQuestions,
    userXP, streak, daysPlayed, session, completedBackfills, username, ritualBanked,
  } = useGameStore()

  const [pastAvail, setPastAvail] = useState([])
  const [pastLog, setPastLog] = useState({})
  const [weekCompletions, setWeekCompletions] = useState(new Set())

  const totalXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + totalXP
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)
  const dayNum = getDayNumber()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const nextAct = [1, 2, 3, 4].find(n => !completedActs.includes(n)) || null

  useEffect(() => {
    getTodaysQuestions().then(setTodayQuestions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function loadPast() {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const cutoffStr = cutoff.toISOString().slice(0, 10)

      const { data: qRows } = await supabase
        .from('questions')
        .select('used_on')
        .gte('used_on', cutoffStr)
        .lt('used_on', todayStr)
        .not('used_on', 'is', null)

      const dates = [...new Set((qRows || []).map(r => r.used_on))]
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 3)
      setPastAvail(dates)

      if (session?.user && dates.length) {
        const { data: logRows } = await supabase
          .from('ritual_log')
          .select('date, xp_earned')
          .eq('user_id', session.user.id)
          .in('date', dates)
        const byDate = Object.fromEntries((logRows || []).map(r => [r.date, r]))
        setPastLog(byDate)
      }
    }
    loadPast()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  useEffect(() => {
    async function loadWeek() {
      const days = getWeekDays()
      const dateStrs = days.map(d => d.toISOString().slice(0, 10))
      const completed = new Set()

      // Today: check local state first
      if (ritualBanked) completed.add(todayStr)

      // Local backfills
      for (const d of dateStrs) {
        if (completedBackfills[d] != null) completed.add(d)
      }

      // Supabase ritual_log for the rest
      if (session?.user) {
        const weekStart = dateStrs[0]
        const { data } = await supabase
          .from('ritual_log')
          .select('date')
          .eq('user_id', session.user.id)
          .gte('date', weekStart)
          .lte('date', todayStr)
        for (const row of data || []) completed.add(row.date)
      }

      setWeekCompletions(completed)
    }
    loadWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, ritualBanked])

  const xpBarFill = nextRank
    ? ((displayXP - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100
    : 100

  const weekDays = getWeekDays()

  return (
    <div className="sd-wrap" style={{
      background: 'radial-gradient(ellipse 100% 340px at 50% 0px, rgba(192,21,42,0.22) 0%, transparent 100%), var(--sd-black)',
    }}>
      <Header activePage="ritual" />

      {/* Date bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '13px var(--sd-px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        background: 'rgba(192,21,42,0.04)',
      }}>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-cream-dim)', letterSpacing: '0.03em' }}>
          {dateStr}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(192,21,42,0.55)', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: 'var(--sd-red)', letterSpacing: 1 }}>
          Day #{dayNum}
        </span>
      </div>

      <div className="sd-home-content">

        {/* Left: act list + CTA */}
        <div className="sd-home-left">
          <div className="sd-mobile-only" style={{ paddingTop: 'var(--sd-px)' }}>
            <ProfilePanel
              username={username}
              rank={rank}
              displayXP={displayXP}
              nextRank={nextRank}
              xpBarFill={xpBarFill}
              streak={streak}
              daysPlayed={daysPlayed}
              weekDays={weekDays}
              today={today}
              weekCompletions={weekCompletions}
            />
          </div>

          <div style={{ paddingTop: 22, paddingBottom: 10 }}>
            <SectionLabel>Today's ritual</SectionLabel>
            <ActList completedActs={completedActs} navigate={navigate} />
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

          {pastAvail.length > 0 && (
            <div style={{ paddingBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
                <span style={{
                  fontFamily: "'Creepster', cursive", fontSize: 13, color: 'var(--sd-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.18em', whiteSpace: 'nowrap',
                }}>Past Rituals</span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
                <span
                  onClick={() => navigate('/history')}
                  style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-red)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  See all →
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pastAvail.map(dateStr => {
                  const entry = pastLog[dateStr] ?? (completedBackfills[dateStr] != null ? { xp_earned: completedBackfills[dateStr] } : null)
                  const done = !!entry
                  return (
                    <div
                      key={dateStr}
                      onClick={() => !done && navigate(`/past/${dateStr}`)}
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${done ? 'rgba(45,102,64,0.32)' : 'rgba(192,21,42,0.35)'}`,
                        borderLeft: `4px solid ${done ? '#2d6640' : 'var(--sd-red)'}`,
                        background: done
                          ? 'linear-gradient(135deg, rgba(45,102,64,0.12) 0%, rgba(24,15,15,0.9) 100%)'
                          : 'linear-gradient(135deg, rgba(192,21,42,0.11) 0%, rgba(24,15,15,0.9) 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        padding: '13px 16px 13px 14px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        cursor: done ? 'default' : 'pointer',
                        opacity: done ? 0.6 : 1,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 20, color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)', lineHeight: 1.1 }}>
                          {formatPastDate(dateStr)}
                        </div>
                        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 3 }}>
                          {done ? 'Backfill · 50% xp' : 'Available to play'}
                        </div>
                      </div>
                      {done ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontFamily: "'Special Elite', serif", fontSize: 10, color: '#7cc48a',
                            border: '0.5px solid rgba(45,102,64,0.4)', borderRadius: 20, padding: '3px 10px',
                          }}>
                            +{entry.xp_earned} xp
                          </span>
                          <CheckIcon />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                            border: '0.5px solid rgba(192,21,42,0.25)', borderRadius: 20,
                            padding: '3px 10px', background: 'rgba(192,21,42,0.05)',
                          }}>
                            +50% xp
                          </span>
                          <span style={{ color: 'var(--sd-muted)', fontSize: 16 }}>›</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right sidebar — desktop only */}
        <div className="sd-home-right sd-desktop-only" style={{ paddingTop: 22 }}>
          <ProfilePanel
            username={username}
            rank={rank}
            displayXP={displayXP}
            nextRank={nextRank}
            xpBarFill={xpBarFill}
            streak={streak}
            daysPlayed={daysPlayed}
            weekDays={weekDays}
            today={today}
            weekCompletions={weekCompletions}
          />
        </div>

      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
