'use client'

import { useEffect, useRef } from 'react'

type Star = {
  x: number
  y: number
  radius: number
  speed: number
  drift: number
  phase: number
  opacity: number
}

export function StarsBackground({
  className = '',
  starColor = '255,255,255',
  density = 0.000055,
}: {
  className?: string
  starColor?: string
  density?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrame = 0
    let stars: Star[] = []
    let width = 0
    let height = 0
    let reducedMotion = false

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const count = Math.min(
        180,
        Math.max(45, Math.floor(width * height * density)),
      )

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.25,
        speed: Math.random() * 0.18 + 0.02,
        drift: Math.random() * 0.35 - 0.175,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.6 + 0.2,
      }))
    }

    const render = (time: number) => {
      context.clearRect(0, 0, width, height)

      for (const star of stars) {
        const pulse = reducedMotion
          ? 1
          : 0.72 + Math.sin(time * 0.0015 * star.speed * 8 + star.phase) * 0.18
        const alpha = Math.max(0.08, Math.min(0.9, star.opacity * pulse))

        if (!reducedMotion) {
          star.y += star.speed
          star.x += star.drift * 0.05
          if (star.y > height + 6) star.y = -6
          if (star.x > width + 6) star.x = -6
          if (star.x < -6) star.x = width + 6
        }

        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(${starColor}, ${alpha})`
        context.fill()
      }

      if (!reducedMotion) animationFrame = requestAnimationFrame(render)
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion = motionQuery.matches
    const handleMotion = () => {
      reducedMotion = motionQuery.matches
      if (!reducedMotion) {
        cancelAnimationFrame(animationFrame)
        animationFrame = requestAnimationFrame(render)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    motionQuery.addEventListener('change', handleMotion)

    if (reducedMotion) {
      render(0)
    } else {
      animationFrame = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      motionQuery.removeEventListener('change', handleMotion)
    }
  }, [density, starColor])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full opacity-65 ${className}`}
    />
  )
}
