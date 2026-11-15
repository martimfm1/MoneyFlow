'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function MotionReveal({
  children,
  className,
  delay = 0,
}: MotionRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 25,
        mass: 0.72,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}
