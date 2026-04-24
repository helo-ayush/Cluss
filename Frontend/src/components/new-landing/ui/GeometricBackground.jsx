
import React, { useEffect, useRef } from 'react'

export default function GeometricBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const shapes: Shape[] = []
    
    // Configuration
    const SHAPE_COUNT = 60
    const CONNECTION_DISTANCE = 180
    const MOUSE_DISTANCE = 250

    class Shape {
      x: number
      y: number
      z: number // Depth (0.5 to 2.0)
      vx: number
      vy: number
      size: number
      rotation: number
      rotationSpeed: number
      sides: number // 3=triangle, 4=square, 6=hexagon
      color: string

      constructor(w: number, h: number) {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.z = Math.random() * 1.5 + 0.5 // Depth factor
        this.vx = (Math.random() - 0.5) * 0.4 * this.z
        this.vy = (Math.random() - 0.5) * 0.4 * this.z
        this.size = (Math.random() * 8 + 4) * this.z
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.02
        this.sides = [3, 4, 6][Math.floor(Math.random() * 3)]
        // Grayscale with depth-based opacity
        const lightness = Math.floor(200 - this.z * 40) // Closer = darker
        this.color = `rgba(${lightness}, ${lightness}, ${lightness}, ${0.1 * this.z})`
      }

      update(w: number, h: number, mouseX: number, mouseY: number) {
        // Parallax Mouse Influence
        // Calculate a "virtual" mouse position for this layer
        // Objects deeper (low z) move less than objects closer (high z)
        // Actually, typically parallax means background moves opposite to camera.
        // Let's just keep simple movement for now + mouse interaction.
        
        // Basic movement
        this.x += this.vx
        this.y += this.vy
        this.rotation += this.rotationSpeed

        // Screen wrapping
        if (this.x < -50) this.x = w + 50
        if (this.x > w + 50) this.x = -50
        if (this.y < -50) this.y = h + 50
        if (this.y > h + 50) this.y = -50

        // Mouse Interaction
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_DISTANCE) {
            // Gentle rotation acceleration
            this.rotation += (this.rotationSpeed > 0 ? 0.05 : -0.05) * (1 - dist / MOUSE_DISTANCE)
            
            // Subtle attraction/repulsion
            // Let's do a slight repulsion
            const angle = Math.atan2(dy, dx)
            const force = (MOUSE_DISTANCE - dist) / MOUSE_DISTANCE
            this.x -= Math.cos(angle) * force * 0.5
            this.y -= Math.sin(angle) * force * 0.5
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        
        ctx.beginPath()
        ctx.fillStyle = this.color
        // Draw polygon
        for (let i = 0; i < this.sides; i++) {
            const angle = (i * 2 * Math.PI) / this.sides
            const px = Math.cos(angle) * this.size
            const py = Math.sin(angle) * this.size
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        
        // Optional: Border for higher depth items
        if (this.z > 1.2) {
            ctx.strokeStyle = `rgba(100, 100, 100, ${0.1 * this.z})`
            ctx.lineWidth = 0.5
            ctx.stroke()
        }
        
        ctx.restore()
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      ctx.scale(dpr, dpr)
      
      shapes.length = 0
      for (let i = 0; i < SHAPE_COUNT; i++) {
        shapes.push(new Shape(rect.width, rect.height))
      }
    }

    const animate = () => {
      const rect = container.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      
      // Sort shapes by Z for correct layering (painter's algorithm)
      shapes.sort((a, b) => a.z - b.z)

      // Update and Draw
      shapes.forEach(shape => {
        shape.update(rect.width, rect.height, mouse.current.x, mouse.current.y)
        shape.draw(ctx)
      })

      // Draw Connections
      // Only connect shapes that have similar depth (z) to simulate 3D planes?
      // Or connect everything for a chaotic web?
      // Let's connect everything but fade based on average Z and distance.
      
      ctx.lineWidth = 0.5
      for (let i = 0; i < shapes.length; i++) {
        const s1 = shapes[i]
        
        // Optimization: Only check a subset or nearest neighbors
        // Brute force is fine for < 100 items
        for (let j = i + 1; j < shapes.length; j++) {
            const s2 = shapes[j]
            
            // Only connect if Z is somewhat similar to avoid messy "crossing" lines
            if (Math.abs(s1.z - s2.z) > 0.5) continue

            const dx = s1.x - s2.x
            const dy = s1.y - s2.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < CONNECTION_DISTANCE * ((s1.z + s2.z) / 2)) { // Distance scales with depth
                ctx.beginPath()
                ctx.moveTo(s1.x, s1.y)
                ctx.lineTo(s2.x, s2.y)
                
                // Opacity logic
                const opacity = (1 - dist / (CONNECTION_DISTANCE * ((s1.z + s2.z) / 2))) * 0.15 * ((s1.z + s2.z) / 2)
                ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
                ctx.stroke()
            }
        }
        
        // Connect to mouse
        const dx = mouse.current.x - s1.x
        const dy = mouse.current.y - s1.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < MOUSE_DISTANCE) {
            ctx.beginPath()
            ctx.moveTo(s1.x, s1.y)
            ctx.lineTo(mouse.current.x, mouse.current.y)
            const opacity = (1 - dist / MOUSE_DISTANCE) * 0.2 * s1.z
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
            ctx.stroke()
        }
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const handleResize = () => {
        init()
    }

    init()
    animate()

    window.addEventListener('resize', handleResize)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', () => {
      mouse.current = { x: -1000, y: -1000 }
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      if (container) {
          container.removeEventListener('mousemove', handleMouseMove)
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* Content */}
      <div className="relative z-10 h-full pointer-events-none">
        <div className="pointer-events-auto h-full">
            {children}
        </div>
      </div>
    </div>
  )
}
