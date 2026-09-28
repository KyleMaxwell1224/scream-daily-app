import { useEffect, useRef, useState } from 'react'

// Animates a numeric value from prev → new whenever it changes.
// On first mount, ticks 0 → value with a snappier duration.
// Uses requestAnimationFrame + easeOutCubic.
export default function CountUp({
  value,
  duration = 900,
  format = (n) => n.toLocaleString(),
  className,
  style,
}) {
  const [displayed, setDisplayed] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = displayed
    startRef.current = null

    function tick(ts) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased)
      setDisplayed(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <span className={className} style={style}>{format(displayed)}</span>
}
