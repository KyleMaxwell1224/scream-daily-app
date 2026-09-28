import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import RankSigil from '../components/RankSigil'
import CountUp from '../components/CountUp'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { getTodaysQuestions } from '../utils/questions'
import { getRankForXP, getNextRank } from '../utils/ranks'
import { ACTS } from '../utils/gameConfig'

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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
    <span className="sd-act-check">
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#5db87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function FeatureCard({ dayNum, dateStr, username, rank, displayXP, nextRank, xpBarFill }) {
  const initials = (username || 'SD').slice(0, 2).toUpperCase()
  return (
    <motion.div
      className="sd-feature"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sd-feature-marquee sd-marquee-flicker">Tonight's Feature</div>

      <div className="sd-feature-body">
        {dayNum !== null && (
          <div className="sd-feature-day">
            DAY <span className="n">#{dayNum}</span>
          </div>
        )}
        <div className="sd-feature-date">{dateStr}</div>
      </div>

      <div className="sd-feature-hr" />

      <div className="sd-feature-identity">
        <div
          className="sd-feature-avatar"
          style={{
            border: `1.5px solid ${rank.color}80`,
            color: rank.color,
            boxShadow: `0 0 18px ${rank.color}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {initials}
        </div>
        <div className="sd-feature-who">
          <div className="sd-feature-name">{username || 'Survivor'}</div>
          <div className="sd-feature-rank" style={{ color: rank.color, display: 'flex', alignItems: 'center', gap: 7 }}>
            <RankSigil name={rank.name} size={15} strokeWidth={1.3} />
            <span>{rank.name}</span>
          </div>
        </div>
        <div className="sd-feature-xp">
          <CountUp value={displayXP} duration={1100} className="sd-feature-xp-val" />
          <div className="sd-feature-xp-lbl">xp</div>
        </div>
      </div>

      <div className="sd-feature-progress">
        <div className="sd-feature-progress-track">
          <motion.div
            className="sd-feature-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, xpBarFill)}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            style={{ background: rank.color, color: rank.color }}
          />
        </div>
        <div className="sd-feature-progress-label">
          {nextRank ? `${(nextRank.minXP - displayXP).toLocaleString()} XP to ${nextRank.name}` : 'Max rank achieved'}
        </div>
      </div>
    </motion.div>
  )
}

function ActList({ completedActs, navigate }) {
  return (
    <motion.div
      className="sd-act-list"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {ACTS.map(({ num, numeral, name, desc, maxXP: xp }) => {
        const done = completedActs.includes(num)
        return (
          <motion.div
            key={num}
            variants={fadeUp}
            whileTap={done ? undefined : { scale: 0.985 }}
            onClick={() => !done && navigate(`/act/${num}`)}
            className={`sd-act-card${done ? ' done' : ''}`}
          >
            <div className="sd-act-numeral">
              <div className="sd-act-numeral-r">{numeral}</div>
              <div className="sd-act-numeral-lbl">ACT</div>
            </div>
            <div className="sd-act-body">
              <div className="sd-act-name">{name}</div>
              <div className="sd-act-desc">{desc}</div>
            </div>
            {done ? <CheckIcon /> : (
              <div className="sd-act-xp">
                <span className="sd-act-xp-plus">+{xp}</span>
                <span className="sd-act-xp-lbl">xp</span>
              </div>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function StatsCard({ streak, daysPlayed, weekDays, today, weekCompletions, rank }) {
  return (
    <div className="sd-stats-card">
      <div className="sd-stats-row">
        <div className="sd-stats-cell">
          <div className="sd-stats-value streak">{streak}</div>
          <div className="sd-stats-label">Day streak</div>
        </div>
        <div className="sd-stats-cell">
          <div className="sd-stats-value">{daysPlayed}</div>
          <div className="sd-stats-label">Days played</div>
        </div>
      </div>
      <div className="sd-week">
        <div className="sd-week-title">This week</div>
        <div className="sd-week-row">
          {weekDays.map((d, i) => {
            const dateKey = d.toISOString().slice(0, 10)
            const isToday = d.toDateString() === today.toDateString()
            const isPast = d < today && !isToday
            const isFuture = d > today && !isToday
            const done = weekCompletions.has(dateKey)

            const style = done
              ? {
                  background: 'rgba(45, 102, 64, 0.16)',
                  border: '1px solid rgba(93, 184, 122, 0.4)',
                }
              : isToday
              ? {
                  background: `${rank.color}20`,
                  border: `1px solid ${rank.color}80`,
                  boxShadow: `0 0 10px ${rank.color}22`,
                }
              : isPast
              ? {
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }
              : {
                  background: 'transparent',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                }

            const labelColor = done
              ? '#7cc48a'
              : isToday
              ? rank.color
              : isFuture
              ? 'var(--sd-muted)'
              : 'var(--sd-cream-dim)'

            const dotColor = done
              ? '#5db87a'
              : isToday
              ? rank.color
              : 'transparent'

            return (
              <div key={i} className="sd-week-cell" style={style}>
                <div className="lbl" style={{ color: labelColor }}>{DAY_LABELS[i]}</div>
                <div className="dot" style={{ background: dotColor }} />
              </div>
            )
          })}
        </div>
      </div>
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
  const [dayNum, setDayNum] = useState(null)

  const totalXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + totalXP
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const nextAct = [1, 2, 3, 4].find(n => !completedActs.includes(n)) || null

  useEffect(() => {
    getTodaysQuestions().then(setTodayQuestions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const query = supabase
          .from('questions').select('used_on')
          .lte('used_on', todayStr).not('used_on', 'is', null)
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('past query timed out')), 10000)
        )
        const { data: allRows, error } = await Promise.race([query, timeout])

        if (!alive) return
        if (error) { console.warn('past query failed', error); return }

        const allDates = [...new Set((allRows || []).map(r => r.used_on))].sort((a, b) => b.localeCompare(a))
        const pastDates = allDates.filter(d => d < todayStr)

        setPastAvail(pastDates.slice(0, 3))
        setDayNum(allDates.length)

        if (session?.user && pastDates.length) {
          const { data: logRows } = await supabase
            .from('ritual_log')
            .select('date, xp_earned')
            .eq('user_id', session.user.id)
            .in('date', pastDates.slice(0, 3))
          if (!alive) return
          const byDate = Object.fromEntries((logRows || []).map(r => [r.date, r]))
          setPastLog(byDate)
        }
      } catch (err) {
        console.warn('loadPast error', err)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  useEffect(() => {
    async function loadWeek() {
      const days = getWeekDays()
      const dateStrs = days.map(d => d.toISOString().slice(0, 10))
      const completed = new Set()

      if (ritualBanked) completed.add(todayStr)

      for (const d of dateStrs) {
        if (completedBackfills[d] != null) completed.add(d)
      }

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

  const featureProps = { dayNum, dateStr, username, rank, displayXP, nextRank, xpBarFill }
  const statsProps = { streak, daysPlayed, weekDays, today, weekCompletions, rank }

  return (
    <div className="sd-wrap" style={{
      background: 'radial-gradient(ellipse 100% 380px at 50% -20px, rgba(192,21,42,0.24) 0%, transparent 100%), #1a0e0e',
    }}>

      <div className="sd-home-content">

        <div className="sd-home-left">
          <div className="sd-mobile-only">
            <FeatureCard {...featureProps} />
          </div>

          <motion.div
            className="sd-divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="sd-divider-line" />
            <div className="sd-divider-label">Tonight's Ritual</div>
            <div className="sd-divider-line right" />
          </motion.div>
          <ActList completedActs={completedActs} navigate={navigate} />

          <motion.div
            className="sd-cta-wrap"
            style={{ padding: '20px var(--sd-px) 4px' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              className="sd-cta-btn"
              onClick={() => nextAct && navigate(`/act/${nextAct}`)}
              disabled={!nextAct}
              style={{ margin: 0, width: '100%' }}
            >
              {completedActs.length === 0 ? 'Begin the ritual' : nextAct ? 'Continue the ritual' : 'Ritual complete'}
            </button>
          </motion.div>

          <div className="sd-mobile-only" style={{ marginTop: 22 }}>
            <StatsCard {...statsProps} />
          </div>

          {pastAvail.length > 0 && (
            <>
              <div className="sd-divider">
                <div className="sd-divider-line" />
                <div className="sd-divider-label">Previously</div>
                <div className="sd-divider-line right" />
                <div className="sd-divider-link" onClick={() => navigate('/history')}>See all →</div>
              </div>
              <div className="sd-past-list">
                {pastAvail.map(dateStr => {
                  const entry = pastLog[dateStr] ?? (completedBackfills[dateStr] != null ? { xp_earned: completedBackfills[dateStr] } : null)
                  const done = !!entry
                  return (
                    <div
                      key={dateStr}
                      onClick={() => !done && navigate(`/past/${dateStr}`)}
                      className={`sd-past-card${done ? ' done' : ''}`}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'Teko', sans-serif", fontSize: 20,
                          color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)',
                          lineHeight: 1.1, letterSpacing: '0.5px',
                        }}>
                          {formatPastDate(dateStr)}
                        </div>
                        <div style={{
                          fontFamily: "'Special Elite', serif", fontSize: 11,
                          color: 'var(--sd-cream-dim)', marginTop: 5,
                        }}>
                          {done ? 'Ritual complete · 50% XP' : 'Available to play'}
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
                            border: '0.5px solid rgba(192,21,42,0.3)', borderRadius: 20,
                            padding: '3px 10px', background: 'rgba(192,21,42,0.06)',
                          }}>
                            +50% xp
                          </span>
                          <span style={{ color: 'var(--sd-red-bright)', fontSize: 18 }}>›</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ height: 24 }} />
        </div>

        <div className="sd-home-right sd-desktop-only" style={{
          display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 4,
        }}>
          <FeatureCard {...featureProps} />
          <StatsCard {...statsProps} />
        </div>

      </div>

    </div>
  )
}
