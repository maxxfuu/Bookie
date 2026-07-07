"use client"

import { motion, useReducedMotion } from "motion/react"

/** Scroll-triggered fade-up for below-the-fold sections; ease-out, once. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.165, 0.84, 0.44, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
