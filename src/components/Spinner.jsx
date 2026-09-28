// Themed loader. Two SVG rings that counter-rotate + a pulsing center.
// Reads as a ritual sigil / summoning circle. All CSS, no JS runtime cost.
export default function Spinner({ size = 40, label, color = 'var(--sd-red-bright)' }) {
  return (
    <div className="sd-spinner-block">
      <div className="sd-spinner" style={{ width: size, height: size, color }}>
        <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor">
          {/* Outer ring — dashed, rotates clockwise */}
          <circle className="sd-spinner-outer" cx="20" cy="20" r="16" strokeWidth="1" strokeDasharray="4 6" opacity="0.7" />
          {/* Middle ring — solid arc, rotates counterclockwise */}
          <circle className="sd-spinner-mid"   cx="20" cy="20" r="11" strokeWidth="1.4" strokeDasharray="26 60" strokeLinecap="round" />
          {/* Inverted pentagram lines — static, faint */}
          <path className="sd-spinner-star" d="M20 8 L28 30 L10 16 L30 16 L12 30 Z" strokeWidth="0.8" opacity="0.35" strokeLinejoin="round" />
          {/* Center dot — pulses */}
          <circle className="sd-spinner-core" cx="20" cy="20" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      </div>
      {label && <div className="sd-spinner-label">{label}</div>}
    </div>
  )
}
