import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { getRankForXP } from '../utils/ranks'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { session, userXP, xpEarned } = useGameStore()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const displayXP = userXP + Object.values(xpEarned).reduce((s, v) => s + v, 0)

  useEffect(() => {
    supabase
      .from('user_stats')
      .select('user_id, username, user_xp, streak, favorite_slasher')
      .order('user_xp', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [])

  const myId = session?.user?.id

  return (
    <div className="sd-wrap">
      <Header activePage="leaderboard" />

      <div style={{ padding: '20px var(--sd-px) 8px' }}>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', letterSpacing: 1 }}>
          Hall of Terror
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>
          Top cultists ranked by total XP
        </div>
      </div>

      {loading ? (
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', marginTop: 60 }}>
          Summoning the rankings…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', textAlign: 'center', marginTop: 60 }}>
          No cultists yet. Be the first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px var(--sd-px) 16px' }}>
          {rows.map((row, i) => {
            const isMe = row.user_id === myId
            const rank = getRankForXP(row.user_xp)
            const displayName = row.username || 'Unknown Cultist'
            const isTop3 = i < 3

            return (
              <div
                key={row.user_id}
                style={{
                  background: isMe ? 'rgba(192,21,42,0.1)' : 'var(--sd-card)',
                  border: isMe ? '1px solid rgba(192,21,42,0.4)' : '1px solid var(--sd-border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Rank number / medal */}
                <div style={{
                  width: 28, flexShrink: 0, textAlign: 'center',
                  fontFamily: isTop3 ? 'inherit' : "'Special Elite', serif",
                  fontSize: isTop3 ? 20 : 13,
                  color: isTop3 ? 'inherit' : 'var(--sd-muted)',
                }}>
                  {isTop3 ? MEDALS[i] : `${i + 1}`}
                </div>

                {/* Name + slasher */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Creepster', cursive", fontSize: 18,
                    color: isMe ? 'var(--sd-cream)' : rank.color,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {displayName}
                    {isMe && (
                      <span style={{
                        fontFamily: "'Special Elite', serif", fontSize: 11,
                        color: 'var(--sd-red)', border: '0.5px solid rgba(192,21,42,0.4)',
                        borderRadius: 20, padding: '1px 6px', marginLeft: 6,
                        textTransform: 'uppercase', verticalAlign: 'middle',
                      }}>you</span>
                    )}
                  </div>
                  {row.favorite_slasher ? (
                    <div style={{
                      fontFamily: "'Special Elite', serif", fontSize: 11,
                      color: 'var(--sd-muted)', marginTop: 1,
                    }}>
                      {row.favorite_slasher}
                    </div>
                  ) : (
                    <div style={{
                      fontFamily: "'Special Elite', serif", fontSize: 11,
                      color: rank.color, marginTop: 1, opacity: 0.7,
                    }}>
                      {rank.name}
                    </div>
                  )}
                </div>

                {/* XP + streak */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Teko', sans-serif", fontSize: 18,
                    color: isMe ? 'var(--sd-cream)' : 'var(--sd-cream-dim)',
                    lineHeight: 1,
                  }}>
                    {row.user_xp.toLocaleString()}
                    <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginLeft: 3 }}>xp</span>
                  </div>
                  {row.streak > 0 && (
                    <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 2 }}>
                      {row.streak}🔥
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Logged-out nudge */}
      {!session && (
        <div style={{
          margin: '8px var(--sd-px) 16px',
          background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
          borderRadius: 12, padding: '14px 16px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', lineHeight: 1.6 }}>
            Sign in to appear on the leaderboard and track your rank across devices.
          </div>
        </div>
      )}

      {/* Your local XP if not on board */}
      {session && rows.length > 0 && !rows.find(r => r.user_id === myId) && displayXP > 0 && (
        <div style={{
          margin: '0 var(--sd-px) 16px',
          background: 'rgba(192,21,42,0.08)', border: '1px solid rgba(192,21,42,0.3)',
          borderRadius: 12, padding: '12px 16px',
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
          textAlign: 'center',
        }}>
          You have {displayXP} XP locally — complete today's ritual to appear on the board.
        </div>
      )}

      <BottomNav activePage="leaderboard" />
    </div>
  )
}
