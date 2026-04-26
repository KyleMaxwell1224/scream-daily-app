import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { RANKS, getRankForXP, getNextRank } from '../utils/ranks'
import { pullStats, pushStats } from '../utils/syncStats'
import { checkProfanity } from 'glin-profanity';

const SLASHERS = [
  'Michael Myers',
  'Jason Voorhees',
  'Freddy Krueger',
  'Ghostface',
  'Leatherface',
  'Pinhead',
  'Chucky',
  'Pennywise',
  'Candyman',
  'Art the Clown',
  'The Babadook',
  'Norman Bates',
]

const inputStyle = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, padding: '12px 14px',
  fontFamily: "'Teko', sans-serif", fontSize: 16,
  color: 'var(--sd-cream)', outline: 'none', width: '100%',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
}

export default function Profile() {
  const {
    session, setSession, userXP, xpEarned, streak, daysPlayed,
    username, favoriteSlasher, setUsername, setFavoriteSlasher,
    totalCorrect, totalAnswered,
  } = useGameStore()

  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'check-email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  // Profile editing
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editSlasher, setEditSlasher] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) pullStats(s)
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openEdit() {
    setEditUsername(username)
    setEditSlasher(favoriteSlasher)
    setSaveError('')
    setEditing(true)
  }

  async function handleSaveProfile() {
    const trimmed = editUsername.trim()
    if (!trimmed) { setSaveError('Username is required.'); return }
    if (trimmed.length > 20) { setSaveError('Max 20 characters.'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setSaveError('Letters, numbers, and _ only.'); return }
    const profanity_check = checkProfanity(trimmed, {
      detectLeetspeak: true,
      languages: ['english']
    })
    if (profanity_check.containsProfanity) { setSaveError('Reconsider your username.'); return }

    setSaving(true)
    setSaveError('')

    if (trimmed !== username) {
      const { data: existing } = await supabase
        .from('user_stats')
        .select('user_id')
        .eq('username', trimmed)
        .maybeSingle()
      if (existing) {
        setSaveError('That username is taken.')
        setSaving(false)
        return
      }
    }

    setUsername(trimmed)
    setFavoriteSlasher(editSlasher)
    if (session) await pushStats(session)
    setSaving(false)
    setEditing(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    } else {
      const trimmed = signupUsername.trim()
      if (!trimmed) { setAuthError('Choose a username.'); setLoading(false); return }
      if (trimmed.length > 20) { setAuthError('Username max 20 characters.'); setLoading(false); return }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setAuthError('Letters, numbers, and _ only.'); setLoading(false); return }
      const profanity_check = checkProfanity(trimmed, {
        detectLeetspeak: true,
        languages: ['english']
      })
      if (profanity_check.containsProfanity) { setAuthError('Reconsider your username.'); setLoading(false); return }
      const { data: existing } = await supabase
        .from('user_stats')
        .select('user_id')
        .eq('username', trimmed)
        .maybeSingle()
      if (existing) { setAuthError('That username is already taken.'); setLoading(false); return }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setAuthError(error.message)
      } else {
        setUsername(trimmed)
        setMode('check-email')
      }
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  const todayXP = Object.values(xpEarned).reduce((s, v) => s + v, 0)
  const displayXP = userXP + todayXP
  const rank = getRankForXP(displayXP)
  const nextRank = getNextRank(displayXP)
  const xpBarFill = nextRank
    ? ((displayXP - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100
    : 100

  // ── Logged-out views ──────────────────────────────────────────────

  if (!session) {
    if (mode === 'check-email') {
      return (
        <div className="sd-wrap">
          <Header activePage="profile" />
          <div style={{ padding: '40px var(--sd-px)' }}>
            <div style={{
              background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
              borderRadius: 14, padding: '32px var(--sd-px)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>📬</div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: 'var(--sd-cream)', marginBottom: 8 }}>
                Check your email.
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                We sent a confirmation link to <span style={{ color: 'var(--sd-cream-dim)' }}>{email}</span>.
                Click it to activate your account, then come back to sign in.
              </div>
              <button
                onClick={() => { setMode('login'); setAuthError('') }}
                style={{
                  background: 'none', border: '1px solid var(--sd-border)',
                  borderRadius: 10, padding: '10px 24px', cursor: 'pointer',
                  fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
                }}
              >
                Back to sign in
              </button>
            </div>
          </div>
          <BottomNav activePage="profile" />
        </div>
      )
    }

    const isSignup = mode === 'signup'

    return (
      <div className="sd-wrap">
        <Header activePage="profile" />

        <div style={{ padding: '24px var(--sd-px) 0' }}>
          <div style={{
            background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
            borderRadius: 14, padding: '24px var(--sd-px)',
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 28, color: 'var(--sd-cream)', marginBottom: 6 }}>
              {isSignup ? 'Join the horror.' : 'Welcome back.'}
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              {isSignup
                ? 'Create an account to track your rank, streaks, and XP across devices.'
                : 'Sign in to track your rank, streaks, and XP across devices.'}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isSignup && (
                <input
                  type="text"
                  placeholder="Username (letters, numbers, _)"
                  value={signupUsername}
                  onChange={e => setSignupUsername(e.target.value)}
                  maxLength={20}
                  required
                  style={inputStyle}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={isSignup ? 'Choose a password' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={isSignup ? 6 : undefined}
                style={inputStyle}
              />
              {authError && (
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: '#e24b4a' }}>
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--sd-red)', border: 'none', borderRadius: 10,
                  padding: '13px', cursor: 'pointer',
                  fontFamily: "'Creepster', cursive", fontSize: 20, color: 'var(--sd-cream)',
                  letterSpacing: 1,
                }}
              >
                {loading
                  ? (isSignup ? 'Creating account…' : 'Entering…')
                  : (isSignup ? 'Begin your descent' : 'Enter if you dare')}
              </button>
            </form>

            {!isSignup && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--sd-border)' }} />
                  <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--sd-border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={handleGoogleLogin} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                  }}>
                    Google
                  </button>
                  <button disabled style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, padding: '10px', cursor: 'not-allowed', opacity: 0.4,
                    fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                  }}>
                    Apple
                  </button>
                </div>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)' }}>
                {isSignup ? 'Already have an account? ' : 'New here? '}
                <span
                  onClick={() => { setMode(isSignup ? 'login' : 'signup'); setAuthError('') }}
                  style={{ color: 'var(--sd-red)', cursor: 'pointer' }}
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <BottomNav activePage="profile" />
      </div>
    )
  }

  // ── Logged-in view ────────────────────────────────────────────────

  const user = session?.user
  const displayName = username || user?.email?.split('@')[0] || '??'
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  // Google OAuth users skip signup — prompt for username if not set
  if (!username) {
    return (
      <div className="sd-wrap">
        <Header activePage="profile" />
        <div style={{ padding: '40px var(--sd-px) 0' }}>
          <div style={{
            background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
            borderRadius: 14, padding: '28px var(--sd-px)',
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: 'var(--sd-cream)', marginBottom: 6 }}>
              Choose your name.
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              You need a username to appear on the leaderboard.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Username (letters, numbers, _)"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                maxLength={20}
                style={inputStyle}
              />
              {saveError && (
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: '#e24b4a' }}>
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  background: 'var(--sd-red)', border: 'none', borderRadius: 10,
                  padding: '13px', cursor: 'pointer',
                  fontFamily: "'Creepster', cursive", fontSize: 20, color: 'var(--sd-cream)',
                  letterSpacing: 1,
                }}
              >
                {saving ? 'Saving…' : 'Claim your name'}
              </button>
            </div>
          </div>
        </div>
        <BottomNav activePage="profile" />
      </div>
    )
  }

  return (
    <div className="sd-wrap">
      <Header activePage="profile" />

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(192,21,42,0.13) 0%, transparent 100%)',
        padding: '28px var(--sd-px) 22px',
        textAlign: 'center',
        borderBottom: '0.5px solid var(--sd-border)',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(192,21,42,0.1)',
          border: '2px solid rgba(192,21,42,0.5)',
          boxShadow: '0 0 0 6px rgba(192,21,42,0.07), 0 8px 32px rgba(0,0,0,0.5)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <span style={{ fontFamily: "'Creepster', cursive", fontSize: 34, color: 'var(--sd-red)' }}>{initials}</span>
        </div>

        <div style={{ fontFamily: "'Creepster', cursive", fontSize: 32, color: 'var(--sd-cream)', letterSpacing: 0.5, lineHeight: 1.1 }}>
          {displayName}
        </div>

        {favoriteSlasher && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', marginTop: 8,
            fontFamily: "'Special Elite', serif", fontSize: 10,
            color: 'var(--sd-red)', border: '0.5px solid rgba(192,21,42,0.35)',
            borderRadius: 20, padding: '3px 14px', background: 'rgba(192,21,42,0.07)',
          }}>
            {favoriteSlasher}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
          {memberSince && (
            <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>
              Since {memberSince}
            </span>
          )}
          <button
            onClick={openEdit}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.14)',
              borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
              fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-cream-dim)',
            }}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* ── Inline edit form ──────────────────────────────── */}
      {editing && (
        <div style={{ padding: '14px var(--sd-px) 0' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '18px',
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 20, color: 'var(--sd-cream)', marginBottom: 14 }}>
              Edit profile
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Username"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                maxLength={20}
                style={inputStyle}
              />
              <div style={{ position: 'relative' }}>
                <select
                  value={editSlasher}
                  onChange={e => setEditSlasher(e.target.value)}
                  style={{ ...selectStyle, paddingRight: 36 }}
                >
                  <option value="">Favorite slasher…</option>
                  {SLASHERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--sd-muted)', pointerEvents: 'none', fontSize: 12,
                }}>▾</span>
              </div>
              {saveError && (
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: '#e24b4a' }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    background: 'var(--sd-red)', border: 'none',
                    borderRadius: 10, padding: '10px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream)',
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rank card ─────────────────────────────────────── */}
      <div style={{ padding: '18px var(--sd-px) 0' }}>
        <div style={{
          borderRadius: 14, padding: '18px',
          background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(192,21,42,0.05) 100%)`,
          border: `1px solid ${rank.color}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 28, color: rank.color, lineHeight: 1 }}>
                {rank.name}
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', fontStyle: 'italic', marginTop: 3 }}>
                {rank.flavor}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 30, color: 'var(--sd-cream)', lineHeight: 1 }}>{displayXP}</div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 8, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>total xp</div>
            </div>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${xpBarFill}%`, height: '100%',
              background: rank.color, borderRadius: 3,
            }} />
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', marginTop: 7 }}>
            {nextRank ? `${nextRank.minXP - displayXP} XP until ${nextRank.name}` : 'Max rank achieved'}
          </div>
        </div>
      </div>

      {/* ── Stats grid ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px var(--sd-px) 0' }}>
        {[
          { label: 'Day streak',   value: streak },
          { label: 'Days played',  value: daysPlayed },
          { label: 'Total XP',     value: displayXP },
          { label: 'Accuracy',     value: totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '16px 14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 36, color: 'var(--sd-cream)', lineHeight: 1 }}>{value}</div>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5,
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Settings ──────────────────────────────────────── */}
      <div style={{ padding: '20px var(--sd-px) 0' }}>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>
          Settings
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {[
            { label: 'Daily reminder' },
            { label: 'Streak freeze' },
            { label: 'Horror sub-genres' },
            { label: 'About' },
          ].map(({ label }, i, arr) => (
            <div key={label} style={{
              padding: '15px 18px',
              borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <span style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-cream)' }}>{label}</span>
              <span style={{ color: 'var(--sd-muted)', fontSize: 16, lineHeight: 1 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rank ladder ───────────────────────────────────── */}
      <div style={{ padding: '20px var(--sd-px) 0' }}>
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>
          Rank ladder
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RANKS.map((r) => {
            const isCurrent = getRankForXP(displayXP).name === r.name
            const isUnlocked = displayXP >= r.minXP
            return (
              <div key={r.name} style={{
                borderRadius: 10,
                background: isCurrent ? `rgba(${r.color === '#c0152a' ? '192,21,42' : '255,255,255'},0.04)` : 'rgba(255,255,255,0.02)',
                border: isCurrent ? `1px solid ${r.color}55` : '1px solid rgba(255,255,255,0.07)',
                padding: '10px 14px', opacity: isUnlocked ? 1 : 0.3,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Creepster', cursive", fontSize: 15, color: r.color }}>{r.name}</div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>{r.minXP} XP</div>
                </div>
                {isCurrent && (
                  <span style={{
                    fontFamily: "'Special Elite', serif", fontSize: 8,
                    color: r.color, border: `0.5px solid ${r.color}55`,
                    borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase',
                  }}>you</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Sign out ──────────────────────────────────────── */}
      <div style={{ padding: '20px var(--sd-px) 28px' }}>
        <button onClick={handleSignOut} style={{
          width: '100%', background: 'none',
          border: '1px solid rgba(192,21,42,0.3)', borderRadius: 12,
          padding: '13px', cursor: 'pointer',
          fontFamily: "'Special Elite', serif", fontSize: 12,
          color: 'var(--sd-red)', letterSpacing: '0.05em',
        }}>
          Sign out
        </button>
      </div>

      <BottomNav activePage="profile" />
    </div>
  )
}
