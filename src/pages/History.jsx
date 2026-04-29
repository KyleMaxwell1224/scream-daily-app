import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'

const PAGE_SIZE = 10

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  if (dateStr === yesterdayStr) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function History() {
  const navigate = useNavigate()
  const { session, completedActs, xpEarned, ritualBanked, completedBackfills } = useGameStore()

  const [log, setLog] = useState([])
  const [avail, setAvail] = useState([])
  const [cursor, setCursor] = useState(null)   // oldest date loaded so far
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const todayDone = ritualBanked
  const todayXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)

  // Fetch PAGE_SIZE distinct past dates older than `before`
  const fetchPage = useCallback(async (before) => {
    // Fetch enough rows to get PAGE_SIZE distinct dates.
    // 500 rows / ~10 questions per day ≈ 50 days — plenty of headroom.
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
    async function init() {
      const { page, hasMore: more } = await fetchPage(today)
      setAvail(page)
      setCursor(page.at(-1) ?? today)
      setHasMore(more)

      if (session?.user && page.length) {
        const { data: logRows } = await supabase
          .from('ritual_log')
          .select('date, xp_earned, is_backfill')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false })
        setLog(logRows || [])
      }

      setLoading(false)
    }
    init()
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

  return (
    <div className="sd-wrap">
      <Header activePage="ritual" />

      <div style={{ padding: '20px var(--sd-px) 8px' }}>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', letterSpacing: 1 }}>
          Past Rituals
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>
          {session ? 'Your history of horror.' : 'Sign in to track your history.'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px var(--sd-px) 20px' }}>

        {/* Today row */}
        <div style={{
          background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 17, color: 'var(--sd-cream)' }}>
              Today
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-cream-dim)', marginTop: 5 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          {todayDone ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: '#7cc48a' }}>
                {todayXP} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>xp</span>
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: '#2d6640' }}>complete</div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--sd-red)', border: 'none', borderRadius: 8,
                padding: '7px 16px', cursor: 'pointer',
                fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)',
              }}
            >
              {completedActs.length > 0 ? 'Resume' : 'Play'}
            </button>
          )}
        </div>

        {/* Past days */}
        {loading ? (
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textAlign: 'center', padding: '24px 0' }}>
            Loading…
          </div>
        ) : avail.length === 0 ? (
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', textAlign: 'center', padding: '24px 0' }}>
            No past rituals available yet.
          </div>
        ) : avail.map(dateStr => {
          const entry = logByDate[dateStr] ?? (completedBackfills[dateStr] != null ? { xp_earned: completedBackfills[dateStr], is_backfill: true } : null)
          const done = !!entry

          return (
            <div
              key={dateStr}
              onClick={() => !done && navigate(`/past/${dateStr}`)}
              style={{
                background: done
                  ? 'linear-gradient(135deg, rgba(45,102,64,0.12) 0%, rgba(30,18,18,0.92) 100%)'
                  : 'linear-gradient(135deg, rgba(192,21,42,0.1) 0%, rgba(30,18,18,0.92) 100%)',
                border: `1px solid ${done ? 'rgba(45,102,64,0.32)' : 'rgba(192,21,42,0.35)'}`,
                borderLeft: `4px solid ${done ? '#2d6640' : 'var(--sd-red)'}`,
                borderRadius: 12, padding: '14px 16px 14px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: done ? 'default' : 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Creepster', cursive", fontSize: 17, color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)' }}>
                  {formatDate(dateStr)}
                </div>
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-cream-dim)', marginTop: 5 }}>
                  {done ? 'Past ritual · 50% XP' : 'Available to play'}
                </div>
              </div>

              {done ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: '#7cc48a' }}>
                    {entry.xp_earned} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)' }}>xp</span>
                  </div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: '#2d6640' }}>complete</div>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/past/${dateStr}`) }}
                  style={{
                    background: 'var(--sd-red)', border: 'none',
                    borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)',
                    flexShrink: 0,
                  }}
                >
                  Play
                </button>
              )}
            </div>
          )
        })}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              width: '100%', background: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '13px', cursor: loadingMore ? 'default' : 'pointer',
              fontFamily: "'Special Elite', serif", fontSize: 12,
              color: loadingMore ? 'var(--sd-muted)' : 'var(--sd-cream-dim)',
            }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}

      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
