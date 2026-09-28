import { useState } from 'react'
import { motion } from 'motion/react'
import useGameStore from '../store/useGameStore'
import { supabase } from '../supabaseClient'
import { RANKS, getRankForXP, getNextRank } from '../utils/ranks'
import { pushStats } from '../utils/syncStats'
import RankSigil from '../components/RankSigil'
import CountUp from '../components/CountUp'
import { checkProfanity } from 'glin-profanity';

const cardEnter = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}
const gridStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
}
const cellItem = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ padding: '44px var(--sd-px)' }}
          >
            <div style={{
              background: 'linear-gradient(160deg, rgba(192,21,42,0.1) 0%, var(--sd-card) 60%)',
              border: '1px solid rgba(192, 21, 42, 0.4)',
              borderRadius: 16, padding: '36px var(--sd-px)', textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 40px rgba(192,21,42,0.14)',
            }}>
              {/* Envelope-shaped SVG */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
                style={{
                  width: 76, height: 76, margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(192,21,42,0.25) 0%, rgba(0,0,0,0.4) 90%)',
                  border: '1.5px solid rgba(232, 53, 80, 0.6)',
                  boxShadow: '0 0 0 6px rgba(192,21,42,0.08), 0 0 32px rgba(232,53,80,0.35)',
                  color: 'var(--sd-red-bright)',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="13" rx="1.5" />
                  <path d="M3 8l9 6 9-6" />
                  <path d="M3 8v0M21 8v0" />
                </svg>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                style={{ fontFamily: "'Creepster', cursive", fontSize: 28, color: 'var(--sd-cream)', marginBottom: 10, letterSpacing: '0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                Check your email.
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)', lineHeight: 1.7, marginBottom: 26 }}
              >
                We sent a confirmation link to <span style={{ color: 'var(--sd-cream)', borderBottom: '1px dashed rgba(192,21,42,0.4)', paddingBottom: 1 }}>{email}</span>.
                Click it to activate your account, then come back to sign in.
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.35 }}
                onClick={() => { setMode('login'); setAuthError('') }}
                style={{
                  background: 'rgba(192, 21, 42, 0.08)', border: '1px solid rgba(192, 21, 42, 0.4)',
                  borderRadius: 10, padding: '11px 26px', cursor: 'pointer',
                  fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192, 21, 42, 0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192, 21, 42, 0.08)' }}
              >
                ← Back to sign in
              </motion.button>
            </div>
          </motion.div>
        </div>
      )
    }

    const isSignup = mode === 'signup'

    return (
      <div className="sd-wrap">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: '28px var(--sd-px) 0' }}
        >
          <div style={{
            background: 'linear-gradient(160deg, rgba(192,21,42,0.08) 0%, var(--sd-card) 60%)',
            border: '1px solid rgba(192, 21, 42, 0.35)',
            borderRadius: 16, padding: '26px var(--sd-px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.55), 0 0 40px rgba(192, 21, 42, 0.12)',
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
                className="sd-cta-btn"
                style={{ margin: 0, width: '100%' }}
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
              <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10.5, color: 'var(--sd-muted)', letterSpacing: '0.05em' }}>
                {isSignup ? 'Already have an account? ' : 'New here? '}
                <span
                  onClick={() => { setMode(isSignup ? 'login' : 'signup'); setAuthError('') }}
                  style={{ color: 'var(--sd-red-bright)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(232,53,80,0.4)' }}
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </span>
              </span>
            </div>
          </div>
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: '44px var(--sd-px) 0' }}
        >
          <div style={{
            background: 'linear-gradient(160deg, rgba(192,21,42,0.1) 0%, var(--sd-card) 60%)',
            border: '1px solid rgba(192, 21, 42, 0.4)',
            borderRadius: 16, padding: '32px var(--sd-px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 40px rgba(192,21,42,0.14)',
          }}>
            {/* Blank scroll / tag icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
              style={{
                width: 60, height: 60, margin: '0 auto 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(192,21,42,0.22) 0%, rgba(0,0,0,0.35) 90%)',
                border: '1.5px solid rgba(232, 53, 80, 0.6)',
                boxShadow: '0 0 24px rgba(232, 53, 80, 0.28)',
                color: 'var(--sd-red-bright)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.5 11.5L12 20l-8-8V4h8z" />
                <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </motion.div>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-red-bright)',
              letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10,
            }}>
              One more thing
            </div>
            <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: 'var(--sd-cream)', marginBottom: 8, letterSpacing: '0.5px', textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Choose your name.
            </div>
            <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11.5, color: 'var(--sd-cream-dim)', lineHeight: 1.6, marginBottom: 22, textAlign: 'center' }}>
              You need a name to appear on the leaderboard.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Username (letters, numbers, _)"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                maxLength={20}
                autoFocus
                style={{ ...inputStyle, textAlign: 'center', fontSize: 18, letterSpacing: '0.5px' }}
              />
              {saveError && (
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10.5, color: '#e83550', textAlign: 'center' }}>
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="sd-cta-btn"
                style={{ margin: 0, width: '100%' }}
              >
                {saving ? 'Saving…' : 'Claim your name'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="sd-wrap">

      {/* ── Hero ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `radial-gradient(ellipse 80% 280px at 50% -10px, ${rank.color}25 0%, transparent 70%), linear-gradient(180deg, rgba(192,21,42,0.08) 0%, transparent 100%)`,
          padding: '32px var(--sd-px) 24px',
          textAlign: 'center',
          borderBottom: '0.5px solid var(--sd-border)',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 22 }}
          style={{
            position: 'relative', display: 'inline-block', marginBottom: 16,
          }}
        >
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${rank.color}22 0%, rgba(0,0,0,0.4) 90%)`,
            border: `2px solid ${rank.color}88`,
            boxShadow: `0 0 0 6px ${rank.color}12, 0 0 40px ${rank.color}33, 0 8px 32px rgba(0,0,0,0.55)`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Creepster', cursive", fontSize: 38, color: rank.color, letterSpacing: 1 }}>{initials}</span>
          </div>
          {/* Sigil badge on avatar corner */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 32, height: 32, borderRadius: '50%',
            background: '#1a0e0e',
            border: `1.5px solid ${rank.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: rank.color,
            boxShadow: `0 0 12px ${rank.color}55`,
          }}>
            <RankSigil name={rank.name} size={18} strokeWidth={1.4} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ fontFamily: "'Creepster', cursive", fontSize: 34, color: 'var(--sd-cream)', letterSpacing: '1px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}
        >
          {displayName}
        </motion.div>

        {favoriteSlasher && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.35 }}
            style={{
              display: 'inline-flex', alignItems: 'center', marginTop: 10, gap: 6,
              fontFamily: "'Special Elite', serif", fontSize: 10.5,
              color: 'var(--sd-red-bright)', border: '0.5px solid rgba(192,21,42,0.5)',
              borderRadius: 20, padding: '4px 14px', background: 'rgba(192,21,42,0.1)',
              letterSpacing: '0.08em',
            }}
          >
            <span style={{ opacity: 0.7 }}>♦</span>
            {favoriteSlasher}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42, duration: 0.35 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}
        >
          {memberSince && (
            <span style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', letterSpacing: '0.06em' }}>
              Since {memberSince}
            </span>
          )}
          <button
            onClick={openEdit}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.16)',
              borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
              fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-cream-dim)',
              letterSpacing: '0.06em',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(192,21,42,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
          >
            Edit profile
          </button>
        </motion.div>
      </motion.div>

      {/* ── Inline edit form ──────────────────────────────── */}
      {editing && (
        <div style={{ padding: '14px var(--sd-px) 0' }}>
          <div style={{
            background: 'var(--sd-card)', border: '1px solid rgba(255,255,255,0.12)',
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
      <motion.div
        variants={cardEnter}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        style={{ padding: '18px var(--sd-px) 0' }}
      >
        <div style={{
          borderRadius: 16, padding: '20px 20px 18px',
          background: `linear-gradient(135deg, ${rank.color}12 0%, var(--sd-card) 90%)`,
          border: `1px solid ${rank.color}66`,
          boxShadow: `0 8px 30px rgba(0,0,0,0.45), 0 0 40px ${rank.color}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rank.color, marginBottom: 4 }}>
                <RankSigil name={rank.name} size={16} strokeWidth={1.3} />
                <span style={{ fontFamily: "'Special Elite', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Current rank</span>
              </div>
              <div style={{ fontFamily: "'Creepster', cursive", fontSize: 30, color: rank.color, lineHeight: 1, letterSpacing: '0.5px', textShadow: `0 0 18px ${rank.color}33` }}>
                {rank.name}
              </div>
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10.5, color: 'var(--sd-cream-dim)', fontStyle: 'italic', marginTop: 5, lineHeight: 1.4 }}>
                {rank.flavor}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, borderLeft: '0.5px dashed rgba(192,21,42,0.3)', paddingLeft: 12 }}>
              <CountUp
                value={displayXP}
                duration={1200}
                style={{ fontFamily: "'Teko', sans-serif", fontSize: 34, color: 'var(--sd-cream)', lineHeight: 0.9, fontWeight: 500, display: 'block' }}
              />
              <div style={{ fontFamily: "'Special Elite', serif", fontSize: 10, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>total xp</div>
            </div>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, xpBarFill)}%` }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              style={{
                height: '100%', background: rank.color, borderRadius: 3,
                boxShadow: `0 0 10px ${rank.color}`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 8, letterSpacing: '0.04em' }}>
            <span>{rank.minXP.toLocaleString()} XP</span>
            <span>{nextRank ? `${(nextRank.minXP - displayXP).toLocaleString()} until ${nextRank.name}` : 'Max rank achieved'}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats grid ────────────────────────────────────── */}
      <motion.div
        variants={gridStagger}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px var(--sd-px) 0' }}
      >
        {[
          { label: 'Day streak',   numeric: streak,     accent: 'var(--sd-red-bright)', prefix: streak > 0 ? '⚑' : null },
          { label: 'Days played',  numeric: daysPlayed, accent: 'var(--sd-cream)' },
          { label: 'Total XP',     numeric: displayXP,  accent: rank.color },
          { label: 'Accuracy',     value: totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—', accent: 'var(--sd-cream)' },
        ].map(({ label, value, numeric, accent, prefix }) => (
          <motion.div
            key={label}
            variants={cellItem}
            style={{
              background: 'var(--sd-card)',
              border: '1px solid rgba(192, 21, 42, 0.22)',
              borderRadius: 12, padding: '16px 14px', textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
              {prefix && <span style={{ fontSize: 14, color: accent, opacity: 0.7 }}>{prefix}</span>}
              {numeric !== undefined ? (
                <CountUp
                  value={numeric}
                  duration={1100}
                  style={{ fontFamily: "'Teko', sans-serif", fontSize: 34, color: accent, lineHeight: 0.9, fontWeight: 500, letterSpacing: '0.5px' }}
                />
              ) : (
                <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 34, color: accent, lineHeight: 0.9, fontWeight: 500, letterSpacing: '0.5px' }}>{value}</div>
              )}
            </div>
            <div style={{
              fontFamily: "'Special Elite', serif", fontSize: 10.5, color: 'var(--sd-muted)',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6,
            }}>{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Settings ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        style={{ padding: '22px var(--sd-px) 0' }}
      >
        <div style={{
          fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)',
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        }}>
          Settings
        </div>
        <div style={{
          background: 'var(--sd-card)', border: '1px solid rgba(192, 21, 42, 0.22)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {[
            { label: 'Daily reminder', hint: 'Soon' },
            { label: 'Streak freeze', hint: 'Soon' },
            { label: 'Horror sub-genres', hint: 'Soon' },
            { label: 'About', hint: null },
          ].map(({ label, hint }, i, arr) => (
            <div
              key={label}
              className="sd-settings-row"
              style={{
                padding: '15px 18px',
                borderBottom: i < arr.length - 1 ? '0.5px dashed rgba(192, 21, 42, 0.18)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontFamily: "'Special Elite', serif", fontSize: 13, color: 'var(--sd-cream)', letterSpacing: '0.03em' }}>{label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {hint && <span style={{ fontFamily: "'Special Elite', serif", fontSize: 9, color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>{hint}</span>}
                <span style={{ color: 'var(--sd-red-bright)', fontSize: 16, lineHeight: 1, opacity: 0.6 }}>›</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Rank ladder ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ padding: '22px var(--sd-px) 0' }}
      >
        <div className="sd-divider" style={{ margin: '0 0 14px' }}>
          <div className="sd-divider-line" />
          <div className="sd-divider-label" style={{ fontSize: 13 }}>The Ladder</div>
          <div className="sd-divider-line right" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.4 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 7 }}
        >
          {RANKS.map((r) => {
            const isCurrent = rank.name === r.name
            const isUnlocked = displayXP >= r.minXP
            const isNext = nextRank?.name === r.name
            return (
              <motion.div
                key={r.name}
                variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                style={{
                  borderRadius: 12,
                  background: isCurrent
                    ? `linear-gradient(135deg, ${r.color}22 0%, var(--sd-card) 80%)`
                    : 'var(--sd-card)',
                  border: isCurrent
                    ? `1px solid ${r.color}88`
                    : isNext
                    ? `1px dashed ${r.color}55`
                    : '1px solid rgba(255,255,255,0.08)',
                  borderLeft: isCurrent ? `4px solid ${r.color}` : isNext ? `4px solid ${r.color}66` : `4px solid ${r.color}22`,
                  padding: '11px 14px 11px 12px',
                  opacity: isUnlocked ? 1 : 0.55,
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: isCurrent ? `0 4px 18px rgba(0,0,0,0.4), 0 0 22px ${r.color}22` : 'none',
                  filter: isUnlocked ? 'none' : 'grayscale(0.4)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: r.color,
                  background: `${r.color}12`,
                  border: `1px solid ${r.color}44`,
                }}>
                  <RankSigil name={r.name} size={16} strokeWidth={1.3} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Creepster', cursive", fontSize: 19, color: r.color,
                    lineHeight: 1, letterSpacing: '0.5px',
                    textShadow: `0 1px 6px rgba(0,0,0,0.7), 0 0 20px ${r.color}22`,
                  }}>{r.name}</div>
                  <div style={{ fontFamily: "'Special Elite', serif", fontSize: 11, color: 'var(--sd-muted)', marginTop: 4, letterSpacing: '0.05em' }}>
                    {r.minXP.toLocaleString()} XP
                    {isUnlocked && !isCurrent && <span style={{ color: '#7cc48a', marginLeft: 6 }}>· unlocked</span>}
                  </div>
                </div>
                {isCurrent && (
                  <span style={{
                    fontFamily: "'Special Elite', serif", fontSize: 10,
                    color: r.color, border: `0.5px solid ${r.color}`,
                    borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase',
                    letterSpacing: '0.14em', background: `${r.color}18`,
                  }}>you</span>
                )}
                {isNext && !isCurrent && (
                  <span style={{
                    fontFamily: "'Special Elite', serif", fontSize: 10,
                    color: 'var(--sd-muted)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>next →</span>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

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

    </div>
  )
}
