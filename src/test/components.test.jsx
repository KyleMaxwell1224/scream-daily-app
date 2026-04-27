import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Mocks (hoisted before imports) ─────────────────────────────────────────

// Chainable Supabase query mock — every method returns `this`; the object is
// thenable so `await supabase.from('x').select('y').eq('z', v)` resolves to
// { data: [], error: null } without needing to know the exact chain.
vi.mock('../supabaseClient', () => {
  function makeChain() {
    const q = {
      then: (resolve, reject) =>
        Promise.resolve({ data: [], error: null }).then(resolve, reject),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    ;['select', 'eq', 'gte', 'lte', 'lt', 'not', 'in', 'order'].forEach(
      m => { q[m] = vi.fn(() => q) }
    )
    return q
  }
  return {
    supabase: {
      from: vi.fn(() => makeChain()),
      rpc:  vi.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    },
  }
})

// Prevent real Supabase RPC call for question loading
vi.mock('../utils/questions', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getTodaysQuestions: vi.fn().mockResolvedValue({
      act1: null, act2: [], act3: null, act4: null,
    }),
  }
})

// ── Imports (after vi.mock so mocks are in place) ──────────────────────────

import useGameStore from '../store/useGameStore'
import Home from '../pages/Home'
import Results from '../pages/Results'

// ── Shared helpers ─────────────────────────────────────────────────────────

const BASE_STATE = {
  todayQuestions:     { act1: null, act2: [], act3: null, act4: null },
  completedActs:      [],
  xpEarned:          { act1: 0, act2: 0, act3: 0, act4: 0 },
  act2CurrentQuestion: 0,
  act2Answers:        [],
  act2Selections:     [],
  actResults:        { act1: null, act3: null, act4: null },
  ritualBanked:      false,
  userXP:            0,
  streak:            0,
  daysPlayed:        0,
  lastPlayedDate:    null,
  lastCompletedDate: null,
  username:          'TestUser',
  favoriteSlasher:   'Ghostface',
  totalCorrect:      0,
  totalAnswered:     0,
  session:           null,
  completedBackfills: {},
  pastRitualProgress: {},
  lastUserId:        null,
}

function renderWithRouter(Component) {
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  )
}

// ── Home ───────────────────────────────────────────────────────────────────

describe('Home', () => {
  beforeEach(() => {
    useGameStore.setState(BASE_STATE)
  })

  it('renders without crashing', () => {
    expect(() => renderWithRouter(Home)).not.toThrow()
  })

  it('shows all four act names', () => {
    renderWithRouter(Home)
    expect(screen.getByText('Scene of the Crime')).toBeInTheDocument()
    expect(screen.getByText('The Inquisition')).toBeInTheDocument()
    expect(screen.getByText('Speak of the Devil')).toBeInTheDocument()
    expect(screen.getByText('Final Reckoning')).toBeInTheDocument()
  })

  it('shows "Begin the ritual" when no acts are complete', () => {
    renderWithRouter(Home)
    expect(screen.getByText('Begin the ritual')).toBeInTheDocument()
  })

  it('shows "Continue the ritual" when some acts are done', () => {
    useGameStore.setState({ ...BASE_STATE, completedActs: [1, 2] })
    renderWithRouter(Home)
    expect(screen.getByText('Continue the ritual')).toBeInTheDocument()
  })

  it('shows "Ritual complete" button when all acts are done', () => {
    useGameStore.setState({ ...BASE_STATE, completedActs: [1, 2, 3, 4] })
    renderWithRouter(Home)
    expect(screen.getByText('Ritual complete')).toBeInTheDocument()
  })

  // Regression: ProfilePanel crashed when weekCompletions prop was undefined.
  // The component now defaults to `new Set()` but this test ensures the full
  // render path (including the mobile ProfilePanel) never throws.
  it('ProfilePanel renders without crash when weekCompletions is not yet loaded', () => {
    // weekCompletions state starts as new Set() from useState — this test
    // verifies the initial render (before the async loadWeek effect fires)
    // does not throw.
    expect(() => renderWithRouter(Home)).not.toThrow()
  })

  it('shows the username in the profile panel', () => {
    useGameStore.setState({ ...BASE_STATE, username: 'HorrorFan' })
    renderWithRouter(Home)
    // Username appears in the ProfilePanel (first two chars as initials + full name)
    expect(screen.getAllByText('HorrorFan').length).toBeGreaterThan(0)
  })

  it('shows the current rank name', () => {
    // userXP=0 → rank is "The Babysitter"
    renderWithRouter(Home)
    expect(screen.getAllByText('The Babysitter').length).toBeGreaterThan(0)
  })

  it('shows a different rank at higher XP', () => {
    useGameStore.setState({ ...BASE_STATE, userXP: 300 })
    renderWithRouter(Home)
    // 300 XP → "The Final Girl"
    expect(screen.getAllByText('The Final Girl').length).toBeGreaterThan(0)
  })
})

// ── Results ────────────────────────────────────────────────────────────────

describe('Results', () => {
  beforeEach(() => {
    useGameStore.setState({
      ...BASE_STATE,
      completedActs: [1, 2, 3, 4],
      xpEarned: { act1: 25, act2: 30, act3: 35, act4: 60 },
      userXP: 150,
      streak: 5,
      username: 'TestUser',
    })
  })

  it('renders without crashing', () => {
    expect(() => renderWithRouter(Results)).not.toThrow()
  })

  it('shows the survival completion message', () => {
    renderWithRouter(Results)
    expect(screen.getByText(/survived/i)).toBeInTheDocument()
  })

  it('shows all four act names in the breakdown', () => {
    renderWithRouter(Results)
    expect(screen.getByText('Scene of the Crime')).toBeInTheDocument()
    expect(screen.getByText('The Inquisition')).toBeInTheDocument()
    expect(screen.getByText('Speak of the Devil')).toBeInTheDocument()
    expect(screen.getByText('Final Reckoning')).toBeInTheDocument()
  })

  it('shows the streak count', () => {
    renderWithRouter(Results)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders with zero XP earned (skipped all acts)', () => {
    useGameStore.setState({
      ...BASE_STATE,
      completedActs: [1, 2, 3, 4],
      xpEarned: { act1: 0, act2: 0, act3: 0, act4: 0 },
      userXP: 0,
      streak: 1,
      username: 'TestUser',
    })
    expect(() => renderWithRouter(Results)).not.toThrow()
  })

  it('does not crash when user ranks up', () => {
    // userXP=50, today earns 100 → crosses the Camp Counselor threshold (100 XP)
    useGameStore.setState({
      ...BASE_STATE,
      completedActs: [1, 2, 3, 4],
      xpEarned: { act1: 25, act2: 50, act3: 35, act4: 0 },
      userXP: 50,
      streak: 1,
      username: 'TestUser',
    })
    expect(() => renderWithRouter(Results)).not.toThrow()
    renderWithRouter(Results)
    expect(screen.getAllByText(/xp earned today/i).length).toBeGreaterThan(0)
  })

  it('shows personalised username in the hero', () => {
    useGameStore.setState({
      ...BASE_STATE,
      completedActs: [1, 2, 3, 4],
      xpEarned: { act1: 25, act2: 30, act3: 35, act4: 60 },
      userXP: 150,
      streak: 3,
      username: 'DragonSlayer',
    })
    renderWithRouter(Results)
    expect(screen.getByText(/DragonSlayer/)).toBeInTheDocument()
  })

  it('shows escalated streak message at 7+ days', () => {
    useGameStore.setState({
      ...BASE_STATE,
      completedActs: [1, 2, 3, 4],
      xpEarned: { act1: 25, act2: 30, act3: 35, act4: 60 },
      userXP: 150,
      streak: 7,
      username: 'TestUser',
    })
    renderWithRouter(Results)
    expect(screen.getByText(/A week without breaking/i)).toBeInTheDocument()
  })
})
