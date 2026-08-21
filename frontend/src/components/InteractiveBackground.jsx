import React, { useEffect, useRef } from 'react'

export default function InteractiveBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX
      mouseRef.current.targetY = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Particle palette: subtle vibrant specks
    const colors = [
      'rgba(255, 107, 74, 0.45)',  // Coral
      'rgba(139, 92, 246, 0.45)',  // Violet
      'rgba(59, 130, 246, 0.45)',   // Blue
      'rgba(6, 182, 212, 0.40)',   // Cyan
      'rgba(236, 72, 153, 0.40)',  // Pink
      'rgba(16, 17, 20, 0.20)'     // Charcoal
    ]

    const particleCount = window.innerWidth < 768 ? 40 : 110
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        depth: Math.random() * 0.6 + 0.4,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.015
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Drift motion
        p.x += p.vx
        p.y += p.vy
        p.angle += p.angularSpeed

        // Wrap edges smoothly
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10

        // Subtle mouse repulsion/shift
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        let offsetX = 0
        let offsetY = 0

        if (dist < 220) {
          const force = (1 - dist / 220) * 18 * p.depth
          offsetX = -(dx / dist) * force
          offsetY = -(dy / dist) * force
        }

        ctx.save()
        ctx.translate(p.x + offsetX, p.y + offsetY)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="ambient-glow-coral top-[-10%] right-[-5%]" />
      <div className="ambient-glow-violet top-[20%] left-[-10%]" />
      <div className="ambient-glow-blue bottom-[-10%] right-[10%]" />

      {/* Subtle Noise / Grid Pattern */}
      <div className="absolute inset-0 bg-noise opacity-40" />

      {/* Dynamic Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
