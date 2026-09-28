import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="sd-wrap">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: '80px var(--sd-px) 60px',
          textAlign: 'center',
          minHeight: '60vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          style={{
            fontFamily: "'Creepster', cursive",
            fontSize: 120,
            color: 'var(--sd-red-bright)',
            lineHeight: 0.9,
            letterSpacing: '4px',
            textShadow: '0 0 30px rgba(232, 53, 80, 0.5), 0 0 80px rgba(232, 53, 80, 0.25), 3px 3px 0 rgba(0, 0, 0, 0.7)',
            marginBottom: 8,
          }}
        >
          404
        </motion.div>

        <motion.div
          className="sd-marquee-flicker"
          initial={{ opacity: 0, letterSpacing: '0em' }}
          animate={{ opacity: 1, letterSpacing: '0.32em' }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={{
            fontFamily: "'Special Elite', serif",
            fontSize: 12,
            color: 'var(--sd-red-bright)',
            textTransform: 'uppercase',
            marginBottom: 20,
            paddingLeft: '0.32em',
          }}
        >
          Wrong Turn
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            fontFamily: "'Creepster', cursive",
            fontSize: 30,
            color: 'var(--sd-cream)',
            letterSpacing: '0.5px',
            marginBottom: 14,
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
          }}
        >
          You've wandered off the path.
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            fontFamily: "'Special Elite', serif",
            fontSize: 12,
            color: 'var(--sd-cream-dim)',
            fontStyle: 'italic',
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 34,
          }}
        >
          Whatever you were looking for isn't here.
          Something else might be. Best not to find out.
        </motion.div>

        <motion.div
          className="sd-cta-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          style={{ width: '100%', maxWidth: 320 }}
        >
          <button
            className="sd-cta-btn"
            onClick={() => navigate('/')}
            style={{ margin: 0, width: '100%' }}
          >
            Back to the ritual
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
