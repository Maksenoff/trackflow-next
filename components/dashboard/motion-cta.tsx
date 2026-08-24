'use client'

import { motion } from 'framer-motion'

export function MotionCta({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className={className}>
      {children}
    </motion.div>
  )
}
