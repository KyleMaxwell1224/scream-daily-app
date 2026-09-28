// Minimal decorative sigil per rank — stroke-only, inherits color from parent.
// Not tied to specific horror motifs — reads as an occult/tarot glyph.
const SIGILS = {
  'The Babysitter': (
    <g>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  'Camp Counselor': (
    <g>
      <path d="M4 18h16" />
      <path d="M6 18l6-12 6 12" />
      <circle cx="12" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </g>
  ),
  'The Final Girl': (
    <g>
      <path d="M12 3v18" />
      <path d="M6 7l6-4 6 4" />
      <path d="M6 17l6 4 6-4" />
    </g>
  ),
  'Sole Survivor': (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </g>
  ),
  'The Occultist': (
    <g>
      <path d="M12 3l10 7-4 11h-12L2 10z" />
      <path d="M12 3l4 18M12 3l-4 18M2 10h20" />
    </g>
  ),
  'The Possessed': (
    <g>
      <path d="M12 2l4 6 6 1-4.5 4.5L19 20l-7-3.5L5 20l1.5-6.5L2 9l6-1z" />
    </g>
  ),
  'The Stalker': (
    <g>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
  'Architect of Pain': (
    <g>
      <path d="M12 3l9 16H3z" />
      <path d="M12 9v6M12 17.5v.5" />
    </g>
  ),
  'The Undying': (
    <g>
      <path d="M20 15A8 8 0 0 1 9 4a8.5 8.5 0 1 0 11 11z" />
    </g>
  ),
  'The Entity': (
    <g>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
      <path d="M8 12h8" />
    </g>
  ),
}

export default function RankSigil({ name, size = 18, strokeWidth = 1.4, style }) {
  const glyph = SIGILS[name]
  if (!glyph) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {glyph}
    </svg>
  )
}
