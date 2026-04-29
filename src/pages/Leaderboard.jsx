import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { getRankForXP } from '../utils/ranks'

const PODIUM = [
  { label: '1st', color: '#c9a84c', border: 'rgba(201,168,76,0.45)', bg: 'rgba(201,168,76,0.1)' },
  { label: '2nd', color: '#a8a8b8', border: 'rgba(168,168,184,0.4)', bg: 'rgba(168,168,184,0.08)' },
  { label: '3rd', color: '#b07040', border: 'rgba(176,112,64,0.4)',  bg: 'rgba(176,112,64,0.08)' },
]

export default function Leaderboard() {
  const { session, userXP, xpEarned } = useGameStore()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const displayXP = userXP + Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const myId = session?.user?.id

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

  const top3 = rows.slice(0, 3)
  const rest  = rows.slice(3)

  return (
    <div className="sd-wrap" style={{
      background: 'radial-gradient(ellipse 100% 340px at 50% 0px, rgba(192,21,42,0.22) 0%, transparent 100%), var(--sd-black)',
    }}>
      <Header activePage="leaderboard" />

      <div style={{ padding: '20px var(--sd-px) 16px' }}>
        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', letterSpacing: 1 }}>
          Hall of Terror
        </div>
        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', marginTop: 4 }}>
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
        <div style={{ padding: '0 var(--sd-px) 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Top 3 podium */}
          {top3.map((row, i) => {
            const isMe = row.user_id === myId
            const rank = getRankForXP(row.user_xp)
            const displayName = row.username || 'Unknown Cultist'
            const p = PODIUM[i]

            return (
              <div key={row.user_id} style={{
                borderRadius: 14,
                border: `1px solid ${isMe ? 'rgba(192,21,42,0.55)' : p.border}`,
                borderLeft: `4px solid ${isMe ? 'var(--sd-red)' : p.color}`,
                background: isMe
                  ? 'linear-gradient(135deg, rgba(192,21,42,0.18) 0%, rgba(30,18,18,0.95) 100%)'
                  : `linear-gradient(135deg, ${p.bg} 0%, rgba(30,18,18,0.95) 100%)`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                padding: '16px 16px 16px 14px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Position badge */}
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: `${p.bg}`,
                  border: `1.5px solid ${p.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 14px ${p.color}28`,
                }}>
                  <div style={{ fontFamily: "'Creepster', cursive", fontSize: 20, color: p.color, lineHeight: 1 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 8, color: p.color, opacity: 0.7, letterSpacing: '0.05em', marginTop: 1 }}>
                    {p.label}
                  </div>
                </div>

                {/* Name + subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Creepster', cursive", fontSize: 20,
                    color: isMe ? 'var(--sd-cream)' : p.color,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}>
                    {displayName}
                    {isMe && <span style={{
                      fontFamily: "'Special Elite', serif", fontSize: 11,
                      color: 'var(--sd-red)', border: '0.5px solid rgba(192,21,42,0.5)',
                      borderRadius: 20, padding: '1px 7px', marginLeft: 8,
                      textTransform: 'uppercase', verticalAlign: 'middle',
                    }}>you</span>}
                  </div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', marginTop: 4 }}>
                    {row.favorite_slasher || rank.name}
                  </div>
                </div>

                {/* XP + streak */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 22, color: p.color, lineHeight: 1 }}>
                    {row.user_xp.toLocaleString()}
                    <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginLeft: 3 }}>xp</span>
                  </div>
                  {row.streak > 1 && (
                    <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', marginTop: 4 }}>
                      {row.streak} day streak
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Positions 4+ */}
          {rest.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 2px' }}>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.2)' }} />
                <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  rankings
                </span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(192,21,42,0.2)' }} />
              </div>

              {rest.map((row, i) => {
                const isMe = row.user_id === myId
                const rank = getRankForXP(row.user_xp)
                const displayName = row.username || 'Unknown Cultist'
                const pos = i + 4

                return (
                  <div key={row.user_id} style={{
                    borderRadius: 12,
                    border: `1px solid ${isMe ? 'rgba(192,21,42,0.45)' : 'rgba(192,21,42,0.2)'}`,
                    borderLeft: `4px solid ${isMe ? 'var(--sd-red)' : 'rgba(192,21,42,0.35)'}`,
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(192,21,42,0.12) 0%, rgba(30,18,18,0.92) 100%)'
                      : 'linear-gradient(135deg, rgba(192,21,42,0.05) 0%, rgba(30,18,18,0.92) 100%)',
                    boxShadow: '0 3px 16px rgba(0,0,0,0.5)',
                    padding: '13px 16px 13px 14px',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    {/* Position number */}
                    <div style={{
                      width: 32, flexShrink: 0, textAlign: 'center',
                      fontFamily: "'Teko', sans-serif", fontSize: 20,
                      color: isMe ? 'var(--sd-red)' : 'var(--sd-muted)', lineHeight: 1,
                    }}>
                      {pos}
                    </div>

                    {/* Name + subtitle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Creepster', cursive", fontSize: 18,
                        color: isMe ? 'var(--sd-cream)' : rank.color,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}>
                        {displayName}
                        {isMe && <span style={{
                          fontFamily: "'Special Elite', serif", fontSize: 11,
                          color: 'var(--sd-red)', border: '0.5px solid rgba(192,21,42,0.5)',
                          borderRadius: 20, padding: '1px 7px', marginLeft: 8,
                          textTransform: 'uppercase', verticalAlign: 'middle',
                        }}>you</span>}
                      </div>
                      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', marginTop: 4 }}>
                        {row.favorite_slasher || rank.name}
                      </div>
                    </div>

                    {/* XP + streak */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 19, color: isMe ? 'var(--sd-cream)' : 'var(--sd-cream-dim)', lineHeight: 1 }}>
                        {row.user_xp.toLocaleString()}
                        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginLeft: 3 }}>xp</span>
                      </div>
                      {row.streak > 1 && (
                        <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4 }}>
                          {row.streak} day streak
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

        </div>
      )}

      {/* Logged-out nudge */}
      {!session && (
        <div style={{
          margin: '0 var(--sd-px) 16px',
          border: '1px solid rgba(192,21,42,0.3)',
          background: 'rgba(192,21,42,0.07)',
          borderRadius: 12, padding: '16px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 18, color: 'var(--sd-cream)', marginBottom: 6 }}>
            Join the ranks
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)', lineHeight: 1.6 }}>
            Sign in to appear on the leaderboard and track your rank across devices.
          </div>
        </div>
      )}

      {/* Signed in but not on the board yet */}
      {session && rows.length > 0 && !rows.find(r => r.user_id === myId) && displayXP > 0 && (
        <div style={{
          margin: '0 var(--sd-px) 16px',
          background: 'rgba(192,21,42,0.07)', border: '1px solid rgba(192,21,42,0.3)',
          borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          fontFamily: "'Special Elite', serif", fontSize: 12, color: 'var(--sd-muted)',
        }}>
          You have {displayXP} XP locally — complete today's ritual to appear on the board.
        </div>
      )}

      <BottomNav activePage="leaderboard" />
    </div>
  )
}
