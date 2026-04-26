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
    updated_at: new Date().toISOString(),
  })
}

export async function pullStats(session) {
  if (!session?.user) return

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) {
    // No remote record yet — push local state up
    await pushStats(session)
    return
  }

  const state = useGameStore.getState()
  const localTotal = totalXP(state)

  if (data.user_xp > localTotal) {
    // Remote is ahead (played on another device) — sync down
    useGameStore.setState({
      userXP: data.user_xp,
      xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
      streak: data.streak,
      daysPlayed: data.days_played,
      lastCompletedDate: data.last_completed_date,
    })
  } else {
    // Local is ahead or equal — push up to keep remote current
    await pushStats(session)
  }
}
