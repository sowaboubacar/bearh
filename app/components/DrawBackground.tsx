"use client"

import React, { useEffect, useRef } from 'react'

export default function FloatingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const text = "Val D'Oise"
    let offset = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const animate = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.font = 'bold 200px Arial'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(Math.sin(Date.now() / 2000) * 0.05)
      ctx.fillText(text, 0, 0)
      ctx.restore()

      // Glow effect
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, 'rgba(0, 120, 125, 0)')
      gradient.addColorStop(0.45, 'rgba(0, 120, 125, 0)')
      gradient.addColorStop(0.48, 'rgba(0, 120, 125, 0.1)')
      gradient.addColorStop(0.5, 'rgba(0, 120, 125, 0.3)')
      gradient.addColorStop(0.52, 'rgba(0, 120, 125, 0.1)')
      gradient.addColorStop(0.55, 'rgba(0, 120, 125, 0)')
      gradient.addColorStop(1, 'rgba(0, 120, 125, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(offset, 0, canvas.width, canvas.height)

      offset += 5
      if (offset > canvas.width) {
        offset = -canvas.width
      }

      requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
    />
  )
}

