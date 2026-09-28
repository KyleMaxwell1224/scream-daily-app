// Ambient background — drifting fog + rising embers.
// Fixed, non-interactive, sits behind all app content but above the base bg.
// Deterministic particle positions so nothing reshuffles between renders.

const EMBERS = Array.from({ length: 30 }, (_, i) => {
  // pseudo-random but stable
  const r1 = (Math.sin(i * 12.9898) * 43758.5453) % 1
  const r2 = (Math.cos(i * 78.233)  * 43758.5453) % 1
  const r3 = (Math.sin(i * 39.346)  * 43758.5453) % 1
  const r4 = (Math.cos(i * 55.121)  * 43758.5453) % 1
  return {
    id: i,
    x:        Math.abs(r1) * 100,             // 0-100 vw
    size:     1.5 + Math.abs(r2) * 3,         // 1.5–4.5 px
    delay:    Math.abs(r3) * 14,              // 0–14 s
    duration: 12 + Math.abs(r1) * 12,         // 12–24 s
    // Lateral drift ±40-90px so no ember rises straight up
    drift:    (r2 > 0 ? 1 : -1) * (40 + Math.abs(r3) * 50),
    // Mid-flight wobble opposite the main drift so paths curve, not just tilt
    wobble:   (r2 > 0 ? -1 : 1) * (12 + Math.abs(r4) * 18),
  }
})

export default function AmbientLayer() {
  return (
    <>
      {/* Fog — three counter-drifting radial layers */}
      <div className="sd-fog sd-fog-1" aria-hidden="true" />
      <div className="sd-fog sd-fog-2" aria-hidden="true" />
      <div className="sd-fog sd-fog-3" aria-hidden="true" />

      {/* Embers — sparse warm particles rising */}
      <div className="sd-embers" aria-hidden="true">
        {EMBERS.map(e => (
          <span
            key={e.id}
            className="sd-ember"
            style={{
              left: `${e.x}vw`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              '--drift': `${e.drift}px`,
              '--wobble': `${e.wobble}px`,
            }}
          />
        ))}
      </div>
    </>
  )
}
