import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

export default function Header({ activePage }) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'ritual',      label: 'Ritual',    path: '/',            disabled: false },
    { id: 'leaderboard', label: 'Ranks',     path: '/leaderboard', disabled: false },
    { id: 'discover',    label: 'Discover',  path: null,           disabled: true  },
    { id: 'profile',     label: 'Profile',   path: '/profile',     disabled: false },
  ]

  return (
    <header className="sd-header">
      <div className="sd-header-inner">
        <div className="sd-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SCREAM<span className="dot">.</span>DAILY</div>
        <nav className="sd-desktop-nav">
          {tabs.map(({ id, label, path, disabled }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                className={`sd-desktop-tab${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && path && navigate(path)}
                disabled={disabled}
              >
                {active && (
                  <motion.span
                    layoutId="sd-desktop-nav-marker"
                    className="sd-desktop-tab-marker"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                {disabled && <span className="sd-desktop-tab-soon">soon</span>}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
