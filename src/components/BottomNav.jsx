import { useNavigate } from 'react-router-dom'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v11h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SkullIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a6 6 0 0 0-6 6c0 2.2 1.1 4.1 2.8 5.3V17a1 1 0 0 0 1 1h4.4a1 1 0 0 0 1-1v-1.7A6 6 0 0 0 18 10a6 6 0 0 0-6-6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17.5v1M14.5 17.5v1" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.1" />
      <circle cx="14" cy="10" r="1.1" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav({ activePage }) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'ritual',      label: 'Ritual',      Icon: HomeIcon,  path: '/',            disabled: false },
    { id: 'leaderboard', label: 'Ranks',        Icon: SkullIcon, path: '/leaderboard', disabled: false },
    { id: 'discover',    label: 'Discover',     Icon: ClockIcon, path: null,           disabled: true  },
    { id: 'profile',     label: 'Profile',      Icon: PersonIcon, path: '/profile',    disabled: false },
  ]

  return (
    <nav className="sd-bottom-nav">
      {tabs.map(({ id, label, Icon, path, disabled }) => (
        <button
          key={id}
          className={`sd-nav-tab${activePage === id ? ' active' : ''}${disabled ? ' disabled' : ''}`}
          onClick={() => !disabled && path && navigate(path)}
          disabled={disabled}
          aria-label={label}
        >
          <Icon />
          <span className="sd-nav-label">{label}</span>
          {disabled && <span className="sd-nav-soon">soon</span>}
        </button>
      ))}
    </nav>
  )
}
