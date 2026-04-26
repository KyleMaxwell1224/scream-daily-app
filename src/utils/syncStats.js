import { supabase } from '../supabaseClient'
import useGameStore from '../store/useGameStore'

function totalXP(state) {
  return state.userXP + Object.values(state.xpEarned).reduce((s, v) => s + v, 0)
}

export async function pushStats(session) {
  if (!session?.user) return
  const state = useGameStore.getState()

  await supabase.from('user_stats').upsert({
    user_id: session.user.id,
    user_xp: totalXP(state),
    streak: state.streak,
    days_played: state.daysPlayed,
    last_completed_date: state.lastCompletedDate || null,
    username: state.username || null,
    favorite_slasher: state.favoriteSlasher || null,
    total_correct: state.totalCorrect,
    total_answered: state.totalAnswered,
    updated_at: new Date().toISOString(),
  })
}

export async function logRitual(session, date, xp, isBackfill = false) {
  if (!session?.user) return
  await supabase.from('ritual_log').upsert({
    user_id: session.user.id,
    date,
    xp_earned: xp,
    is_backfill: isBackfill,
  }, { onConflict: 'user_id,date' })
}

export async function pullStats(session) {
  if (!session?.user) return

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) {
    await pushStats(session)
    return
  }

  // Always sync profile fields down if they exist remotely
  const profileUpdate = {}
  if (data.username) profileUpdate.username = data.username
  if (data.favorite_slasher) profileUpdate.favoriteSlasher = data.favorite_slasher
  if (Object.keys(profileUpdate).length) useGameStore.setState(profileUpdate)

  const state = useGameStore.getState()
  const localTotal = totalXP(state)

  if (data.user_xp > localTotal) {
    useGameStore.setState({
      userXP: data.user_xp,
      xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
      streak: data.streak,
      daysPlayed: data.days_played,
      lastCompletedDate: data.last_completed_date,
      totalCorrect: data.total_correct ?? 0,
      totalAnswered: data.total_answered ?? 0,
    })
  } else {
    await pushStats(session)
  }
}
