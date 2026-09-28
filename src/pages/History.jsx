import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import Spinner from '../components/Spinner'

const PAGE_SIZE = 10

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  if (dateStr === yesterdayStr) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    day:   d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

const rowStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}
const rowItem = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
}

export default function History() {
  const navigate = useNavigate()
  const { session, completedActs, xpEarned, ritualBanked, completedBackfills } = useGameStore()

  const [log, setLog] = useState([])
  const [avail, setAvail] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const todayDone = ritualBanked
  const todayXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const fetchPage = useCallback(async (before) => {
    const { data: qRows } = await supabase
      .from('questions')
      .select('used_on')
      .lt('used_on', before)
      .not('used_on', 'is', null)
      .order('used_on', { ascending: false })
      .limit(500)

    const distinct = [...new Set((qRows || []).map(r => r.used_on))].sort((a, b) => b.localeCompare(a))
    const page = distinct.slice(0, PAGE_SIZE)
    return { page, hasMore: distinct.length > PAGE_SIZE }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { page, hasMore: more } = await fetchPage(today)
      if (!alive) return
      setAvail(page)
      setCursor(page.at(-1) ?? today)
      setHasMore(more)

      if (session?.user && page.length) {
        const { data: logRows } = await supabase
          .from('ritual_log')
          .select('date, xp_earned, is_backfill')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false })
        if (!alive) return
        setLog(logRows || [])
      }

      setLoading(false)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  async function loadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    const { page, hasMore: more } = await fetchPage(cursor)
    setAvail(prev => [...prev, ...page])
    setCursor(page.at(-1) ?? cursor)
    setHasMore(more)
    setLoadingMore(false)
  }

  const logByDate = Object.fromEntries(log.map(r => [r.date, r]))
  const doneCount = avail.filter(d => logByDate[d] || completedBackfills[d] != null).length + (todayDone ? 1 : 0)

  // Last 7 days (yesterday going back), regardless of DB availability
  const weekBackDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (i + 1))
    return d.toISOString().slice(0, 10)
  })
  const availSet = new Set(avail)

  return (
    <div className="sd-wrap">

      {/* ── Hero ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: '26px var(--sd-px) 18px',
          background: 'radial-gradient(ellipse 90% 220px at 50% -20px, rgba(192,21,42,0.2) 0%, transparent 70%)',
          borderBottom: '0.5px solid var(--sd-border)',
        }}
      >
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-red-bright)',
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          The Archive
        </div>
        <div style={{
          fontFamily: "'Creepster', cursive", fontSize: 34, color: 'var(--sd-cream)',
          letterSpacing: '1px', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>
          Past Rituals
        </div>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)',
          marginTop: 8, letterSpacing: '0.04em', lineHeight: 1.4,
        }}>
          {session
            ? doneCount > 0
              ? <>You've completed <span style={{ color: '#7cc48a' }}>{doneCount}</span> {doneCount === 1 ? 'ritual' : 'rituals'} — earn 50% XP on old ones.</>
              : 'Every night behind you is another chance to catch up.'
            : 'Sign in to track your history.'}
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '18px var(--sd-px) 24px' }}>

        {/* Today row — visually distinct */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          style={{
            borderRadius: 14,
            border: todayDone ? '1px solid rgba(93, 184, 122, 0.45)' : '1px solid rgba(192, 21, 42, 0.55)',
            borderLeft: `4px solid ${todayDone ? '#5db87a' : 'var(--sd-red-bright)'}`,
            background: todayDone
              ? 'linear-gradient(135deg, rgba(45,102,64,0.16) 0%, var(--sd-card) 80%)'
              : 'linear-gradient(135deg, rgba(192,21,42,0.18) 0%, var(--sd-card) 80%)',
            padding: '14px 16px 14px 14px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: todayDone
              ? '0 6px 22px rgba(0,0,0,0.5), 0 0 26px rgba(93,184,122,0.16)'
              : '0 6px 22px rgba(0,0,0,0.5), 0 0 26px rgba(232,53,80,0.2)',
          }}
        >
          <DateBadge dateStr={today} isToday accent={todayDone ? '#5db87a' : 'var(--sd-red-bright)'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Creepster', cursive", fontSize: 22, color: 'var(--sd-cream)',
              lineHeight: 1, letterSpacing: '0.5px',
            }}>
              Tonight
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)', marginTop: 5 }}>
              {todayDate}
            </div>
          </div>
          {todayDone ? (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 22, color: '#7cc48a', lineHeight: 1 }}>
                {todayXP} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>xp</span>
              </div>
              <div style={{
                fontFamily: "'Special Elite', serif", fontSize: 10, color: '#7cc48a',
                letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4,
              }}>complete</div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--sd-red)', border: 'none', borderRadius: 8,
                padding: '9px 18px', cursor: 'pointer',
                fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                boxShadow: '0 2px 10px rgba(192,21,42,0.35)',
                flexShrink: 0,
              }}
            >
              {completedActs.length > 0 ? 'Resume' : 'Play'}
            </button>
          )}
        </motion.div>

        {/* Past 7 days calendar strip */}
        {!loading && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 4px 8px',
            }}>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.3)' }} />
              <span style={{
                fontFamily: "'Special Elite', serif", fontSize: 9.5, color: 'var(--sd-muted)',
                letterSpacing: '0.24em', textTransform: 'uppercase',
              }}>
                Past Week
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.3)' }} />
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 5,
              }}
            >
              {[...weekBackDates].reverse().map(dateStr => {
                const isAvail = availSet.has(dateStr)
                const entry = logByDate[dateStr] ?? (completedBackfills[dateStr] != null ? { xp_earned: completedBackfills[dateStr] } : null)
                const done = !!entry
                const d = new Date(dateStr + 'T12:00:00')
                const dayLetter = ['S','M','T','W','T','F','S'][d.getDay()]
                const dayNum = d.getDate()

                return (
                  <motion.button
                    key={dateStr}
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    whileTap={isAvail && !done ? { scale: 0.94 } : undefined}
                    onClick={() => isAvail && !done && navigate(`/past/${dateStr}`)}
                    disabled={!isAvail}
                    aria-label={`${dateStr} — ${done ? 'complete' : isAvail ? 'available' : 'no ritual'}`}
                    style={{
                      cursor: isAvail && !done ? 'pointer' : 'default',
                      padding: '10px 4px 9px',
                      borderRadius: 10,
                      border: done
                        ? '1px solid rgba(93, 184, 122, 0.5)'
                        : isAvail
                        ? '1px solid rgba(192, 21, 42, 0.5)'
                        : '1px dashed rgba(255, 255, 255, 0.08)',
                      background: done
                        ? 'linear-gradient(160deg, rgba(45, 102, 64, 0.16) 0%, var(--sd-card) 80%)'
                        : isAvail
                        ? 'linear-gradient(160deg, rgba(192, 21, 42, 0.14) 0%, var(--sd-card) 80%)'
                        : 'transparent',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 2,
                      transition: 'transform 0.12s, border-color 0.15s, box-shadow 0.15s',
                      boxShadow: done
                        ? '0 2px 8px rgba(0,0,0,0.3), 0 0 12px rgba(93,184,122,0.15)'
                        : isAvail
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : 'none',
                      opacity: isAvail ? 1 : 0.4,
                      minHeight: 58,
                      color: done ? '#7cc48a' : isAvail ? 'var(--sd-cream)' : 'var(--sd-muted)',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Special Elite', serif", fontSize: 9, letterSpacing: '0.08em',
                      textTransform: 'uppercase', opacity: 0.75,
                    }}>{dayLetter}</span>
                    <span style={{
                      fontFamily: "'Teko', sans-serif", fontSize: 20, lineHeight: 0.9,
                      fontWeight: 500,
                    }}>{dayNum}</span>
                    {done ? (
                      <span style={{ fontSize: 8, marginTop: 1, color: '#7cc48a' }}>✓</span>
                    ) : isAvail ? (
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--sd-red-bright)', marginTop: 2,
                        boxShadow: '0 0 6px rgba(232,53,80,0.6)',
                      }} />
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--sd-muted)', marginTop: 1, opacity: 0.5 }}>—</span>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)',
              letterSpacing: '0.05em', textAlign: 'center', padding: '8px 0 2px',
              opacity: 0.85,
            }}>
              {(() => {
                const availInWeek = weekBackDates.filter(d => availSet.has(d)).length
                if (availInWeek === 0) return 'No rituals from this week yet — check older days below.'
                if (availInWeek === 7) return 'Full week available. Tap any day to play.'
                return `${availInWeek} of 7 days available — dashed cells have no ritual data.`
              })()}
            </div>
          </>
        )}

        {/* Divider between today and past */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 4px 4px',
        }}>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.3)' }} />
          <span style={{
            fontFamily: "'Special Elite', serif", fontSize: 9.5, color: 'var(--sd-muted)',
            letterSpacing: '0.24em', textTransform: 'uppercase',
          }}>
            All Available
          </span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.3)' }} />
        </div>

        {loading ? (
          <Spinner size={40} label="Digging up bones" />
        ) : avail.length === 0 ? (
          <div style={{
            fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)',
            textAlign: 'center', padding: '32px 20px', fontStyle: 'italic',
            border: '0.5px dashed rgba(255,255,255,0.1)', borderRadius: 10,
          }}>
            No past rituals yet. Check back after the first night rolls over.
          </div>
        ) : (
          <motion.div
            variants={rowStagger}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {avail.map(dateStr => {
              const entry = logByDate[dateStr] ?? (completedBackfills[dateStr] != null ? { xp_earned: completedBackfills[dateStr], is_backfill: true } : null)
              const done = !!entry

              return (
                <motion.div
                  key={dateStr}
                  variants={rowItem}
                  onClick={() => !done && navigate(`/past/${dateStr}`)}
                  whileHover={!done ? { y: -1 } : undefined}
                  whileTap={!done ? { scale: 0.99 } : undefined}
                  style={{
                    background: done
                      ? 'linear-gradient(135deg, rgba(45,102,64,0.1) 0%, var(--sd-card) 70%)'
                      : 'linear-gradient(135deg, rgba(192,21,42,0.08) 0%, var(--sd-card) 70%)',
                    border: `1px solid ${done ? 'rgba(45,102,64,0.35)' : 'rgba(192,21,42,0.3)'}`,
                    borderLeft: `4px solid ${done ? '#3d8f55' : 'var(--sd-red)'}`,
                    borderRadius: 12, padding: '12px 16px 12px 12px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: done ? 'default' : 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    opacity: done ? 0.78 : 1,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <DateBadge dateStr={dateStr} accent={done ? '#5db87a' : 'var(--sd-red-bright)'} muted={done} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Creepster', cursive", fontSize: 19,
                      color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)',
                      lineHeight: 1, letterSpacing: '0.5px',
                    }}>
                      {formatDate(dateStr)}
                    </div>
                    <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 5, letterSpacing: '0.04em' }}>
                      {done ? 'Ritual complete · 50% XP' : 'Available to play'}
                    </div>
                  </div>

                  {done ? (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 20, color: '#7cc48a', lineHeight: 1 }}>
                        {entry.xp_earned} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>xp</span>
                      </div>
                      <div style={{
                        fontFamily: "'Special Elite', serif", fontSize: 10, color: '#7cc48a',
                        opacity: 0.85, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4,
                      }}>complete</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                        border: '0.5px solid rgba(192,21,42,0.35)', borderRadius: 20,
                        padding: '3px 10px', background: 'rgba(192,21,42,0.08)',
                        letterSpacing: '0.06em',
                      }}>
                        +50% xp
                      </span>
                      <span style={{ color: 'var(--sd-red-bright)', fontSize: 18, lineHeight: 1 }}>›</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              width: '100%',
              background: loadingMore ? 'var(--sd-card)' : 'rgba(192, 21, 42, 0.06)',
              border: '1px dashed rgba(192, 21, 42, 0.35)', borderRadius: 12,
              padding: '13px', cursor: loadingMore ? 'default' : 'pointer',
              fontFamily: "'Special Elite', serif", fontSize: 11,
              color: loadingMore ? 'var(--sd-muted)' : 'var(--sd-red-bright)',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              transition: 'background 0.15s, border-color 0.15s',
              marginTop: 6,
            }}
            onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.background = 'rgba(192, 21, 42, 0.12)'; e.currentTarget.style.borderColor = 'rgba(192, 21, 42, 0.5)' } }}
            onMouseLeave={e => { if (!loadingMore) { e.currentTarget.style.background = 'rgba(192, 21, 42, 0.06)'; e.currentTarget.style.borderColor = 'rgba(192, 21, 42, 0.35)' } }}
          >
            {loadingMore ? 'Digging deeper…' : 'Load older rituals'}
          </button>
        )}

      </div>

    </div>
  )
}

function DateBadge({ dateStr, isToday = false, accent = 'var(--sd-red-bright)', muted = false }) {
  const { day, month } = formatShortDate(dateStr)
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `${accent}12`,
      border: `1px solid ${accent}55`,
      boxShadow: isToday ? `0 0 14px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      opacity: muted ? 0.9 : 1,
    }}>
      <div style={{
        fontFamily: "'Teko', sans-serif", fontSize: 20, lineHeight: 0.9,
        color: accent, fontWeight: 500,
      }}>{day}</div>
      <div style={{
        fontFamily: "'Special Elite', serif", fontSize: 8, letterSpacing: '0.1em',
        color: accent, opacity: 0.75, marginTop: 2,
      }}>{month}</div>
    </div>
  )
}
