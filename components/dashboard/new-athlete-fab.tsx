'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'

export function NewAthleteFab() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
      className="fixed right-4 z-30 lg:hidden"
      // Le widget de feedback est fixed right-4 bottom-[5.5rem] et monté après
      // dans app/(app)/layout.tsx : à 5rem ce FAB se faisait recouvrir par sa
      // bulle (même correctif que athletes-grid.tsx) — on passe au-dessus.
      style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/athletes/new"
        aria-label="Nouvel athlète"
        className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-xl shadow-primary/35"
      >
        <UserPlus className="size-6" />
      </Link>
    </motion.div>
  )
}
