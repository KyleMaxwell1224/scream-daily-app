import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (dateStr === today) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function History() {
  const navigate = useNavigate()
  const { session, completedActs, xpEarned, ritualBanked, completedBackfills } = useGameStore()

  const [log, setLog] = useState([])     // { date, xp_earned, is_backfill }[]
  const [avail, setAvail] = useState([]) // date strings that have questions
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const todayDone = ritualBanked
  const todayXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)

  useEffect(() => {
    async function load() {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const cutoffStr = cutoff.toISOString().slice(0, 10)

      // Which past dates have questions
      const { data: qRows } = await supabase
        .from('questions')
        .select('used_on')
        .gte('used_on', cutoffStr)
        .lt('used_on', today)
        .not('used_on', 'is', null)

      const uniqueDates = [...new Set((qRows || []).map(r => r.used_on))].sort((a, b) => b.localeCompare(a))
      setAvail(uniqueDates)

      // User's completion log
      if (session?.user) {
        const { data: logRows } = await supabase
          .from('ritual_log')
          .select('date, xp_earned, is_backfill')
          .eq('user_id', session.user.id)
          .gte('date', cutoffStr)
          .order('date', { ascending: false })
        setLog(logRows || [])
      }

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

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
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          {todayDone ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: '#7cc48a' }}>
                {todayXP} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>xp</span>
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: '#2d6640' }}>complete</div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--sd-red)', border: 'none', borderRadius: 8,
                padding: '7px 16px', cursor: 'pointer',
                fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream)',
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
              style={{
                background: done ? 'rgba(45,102,64,0.06)' : 'var(--sd-card)',
                border: done ? '1px solid rgba(45,102,64,0.2)' : '1px solid var(--sd-border)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Creepster', cursive", fontSize: 17, color: done ? 'var(--sd-cream-dim)' : 'var(--sd-cream)' }}>
                  {formatDate(dateStr)}
                </div>
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 1 }}>
                  {entry?.is_backfill ? 'Backfill · 50% xp' : dateStr}
                </div>
              </div>

              {done ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, color: '#7cc48a' }}>
                    {entry.xp_earned} <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>xp</span>
                  </div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: '#2d6640' }}>complete</div>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/past/${dateStr}`)}
                  style={{
                    background: 'none', border: '1px solid var(--sd-border)',
                    borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                  }}
                >
                  Play
                </button>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav activePage="ritual" />
    </div>
  )
}
