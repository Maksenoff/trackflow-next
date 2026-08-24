'use client'

import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

/**
 * Grille des 3 widgets du dashboard, animés en stagger (0.05s entre chacun).
 * Ordre DOM = ordre mobile (séances, compétitions, performances) ; le placement
 * desktop (2 colonnes) est fait via grid-column/row explicites plutôt qu'en
 * imbriquant les widgets dans des colonnes séparées, pour garder les 3 widgets
 * comme enfants directs du même conteneur de stagger.
 */
export function DashboardWidgets({
  sessions,
  competitions,
  performances,
}: {
  sessions: React.ReactNode
  competitions: React.ReactNode
  performances: React.ReactNode
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8"
    >
      <motion.div variants={item} className="lg:col-span-3 lg:col-start-1 lg:row-start-1">
        {sessions}
      </motion.div>
      <motion.div variants={item} className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
        {competitions}
      </motion.div>
      <motion.div
        variants={item}
        className="lg:col-span-2 lg:col-start-4 lg:row-span-2 lg:row-start-1"
      >
        {performances}
      </motion.div>
    </motion.div>
  )
}
