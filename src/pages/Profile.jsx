import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { RANKS, getRankForXP, getNextRank } from '../utils/ranks'
import { pullStats } from '../utils/syncStats'

const inputStyle = {
  background: 'var(--sd-card2)', border: '1px solid var(--sd-border)',
  borderRadius: 10, padding: '12px 14px',
  fontFamily: "'Teko', sans-serif", fontSize: 16,
  color: 'var(--sd-cream)', outline: 'none', width: '100%',
}

export default function Profile() {
  const { session, setSession, userXP, xpEarned, streak, daysPlayed } = useGameStore()

  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'check-email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) pullStats(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setAuthError(error.message)
      } else {
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

  // displayXP includes today's unbanked earnings
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
                    background: 'var(--sd-card2)', border: '1px solid var(--sd-border)',
                    borderRadius: 10, padding: '10px', cursor: 'pointer',
                    fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-cream-dim)',
                  }}>
                    Google
                  </button>
                  <button disabled style={{
                    background: 'var(--sd-card2)', border: '1px solid var(--sd-border)',
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
  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="sd-wrap">
      <Header activePage="profile" />

      {/* Avatar + info */}
      <div style={{ textAlign: 'center', padding: '24px var(--sd-px) 16px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--sd-card2)', border: '2px solid var(--sd-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Creepster', cursive", fontSize: 26, color: 'var(--sd-red)' }}>{initials}</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 20, color: 'var(--sd-cream)', marginTop: 10 }}>
          {user?.email}
        </div>
        {memberSince && (
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', marginTop: 2 }}>
            Member since {memberSince}
          </div>
        )}
      </div>

      {/* Rank card */}
      <div style={{ padding: '0 var(--sd-px) 16px' }}>
        <div style={{
          background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ fontFamily: "'Creepster', cursive", fontSize: 22, color: rank.color, marginBottom: 2 }}>{rank.name}</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', fontStyle: 'italic', marginBottom: 10 }}>
            {rank.flavor}
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${xpBarFill}%`, height: '100%', background: rank.color, borderRadius: 3 }} />
          </div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)' }}>
            {displayXP} XP{nextRank ? ` · ${nextRank.minXP - displayXP} to ${nextRank.name}` : ' · Max rank'}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 var(--sd-px) 16px' }}>
        {[
          { label: 'Day streak',  value: streak },
          { label: 'Days played', value: daysPlayed },
          { label: 'Total XP',    value: displayXP },
          { label: 'Correct rate', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--sd-card)', border: '1px solid var(--sd-border)',
            borderRadius: 12, padding: '14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 28, color: 'var(--sd-red)' }}>{value}</div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Rank ladder */}
      <div style={{ paddingBottom: 16 }}>
        <div className="sd-section-label">Rank ladder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 var(--sd-px)' }}>
          {RANKS.map((r) => {
            const isCurrent = getRankForXP(displayXP).name === r.name
            const isUnlocked = displayXP >= r.minXP
            return (
              <div key={r.name} style={{
                background: 'var(--sd-card)', borderRadius: 10,
                border: isCurrent ? `1px solid ${r.color}66` : '1px solid var(--sd-border)',
                padding: '10px 14px', opacity: isUnlocked ? 1 : 0.35,
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
                    color: r.color, border: `0.5px solid ${r.color}66`,
                    borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase',
                  }}>you</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Settings */}
      <div style={{ paddingBottom: 16 }}>
        <div className="sd-section-label">Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 var(--sd-px)', gap: 1 }}>
          {['Daily reminder', 'Streak freeze', 'Horror sub-genres', 'About'].map(item => (
            <div key={item} style={{
              padding: '14px 0', borderBottom: '0.5px solid var(--sd-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: "'Teko', sans-serif", fontSize: 16, color: 'var(--sd-cream)',
              cursor: 'pointer',
            }}>
              {item}
              <span style={{ color: 'var(--sd-muted)', fontSize: 14 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 var(--sd-px) 20px' }}>
        <button onClick={handleSignOut} style={{
          width: '100%', background: 'none',
          border: '1px solid var(--sd-red)', borderRadius: 12,
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
