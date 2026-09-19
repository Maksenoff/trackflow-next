'use client'

import { motion } from 'framer-motion'

/** Entrée fade + slide-up légère, en cascade via `index` — reproduit l'effet
 *  `.enter` (opacity 0 → 1, translateY 16px → 0, delay = index * 90ms) du
 *  mockup d'origine (trackflow-dashboard-final.html). */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.2, 0.9, 0.25, 1], delay: index * 0.09 }}
    >
      {children}
    </motion.div>
  )
}
