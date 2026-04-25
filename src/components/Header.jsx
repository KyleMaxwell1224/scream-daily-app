import { useNavigate } from 'react-router-dom'

export default function Header({ activePage }) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'ritual',   label: 'Ritual',   path: '/',        disabled: false },
    { id: 'scenes',   label: 'Scenes',   path: null,       disabled: true  },
    { id: 'discover', label: 'Discover', path: null,       disabled: true  },
    { id: 'profile',  label: 'Profile',  path: '/profile', disabled: false },
  ]

  return (
    <header className="sd-header">
      <div className="sd-header-inner">
        <div className="sd-logo">SCREAM<span className="dot">.</span>DAILY</div>
        <nav className="sd-desktop-nav">
          {tabs.map(({ id, label, path, disabled }) => (
            <button
              key={id}
              className={`sd-desktop-tab${activePage === id ? ' active' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => !disabled && path && navigate(path)}
              disabled={disabled}
            >
              {label}
              {disabled && <span className="sd-desktop-tab-soon">soon</span>}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
