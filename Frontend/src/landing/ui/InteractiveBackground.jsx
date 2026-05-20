import React, { useEffect, useRef } from 'react';

export default function InteractiveBackground({ children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let points = [];
    
    const SPACING = 40;
    const RADIUS = 1.5;
    const HOVER_RADIUS = 120;
    const FORCE = 0.2;
    
    class Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = 0;
        this.vy = 0;
        this.size = RADIUS;
        this.targetSize = RADIUS;
        this.color = 'rgba(255, 255, 255, 0.08)';
      }

      update() {
        const dx = mouse.current.x - this.x;
        const dy = mouse.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < HOVER_RADIUS) {
          const angle = Math.atan2(dy, dx);
          const force = (HOVER_RADIUS - distance) / HOVER_RADIUS;
          const pushX = Math.cos(angle) * force * FORCE * 40;
          const pushY = Math.sin(angle) * force * FORCE * 40;
          this.vx -= pushX;
          this.vy -= pushY;
          this.targetSize = RADIUS * 2.5;
          this.color = `rgba(99, 102, 241, ${0.25 + force * 0.45})`;
        } else {
          this.targetSize = RADIUS;
          this.color = 'rgba(255, 255, 255, 0.08)';
        }

        const springK = 0.05;
        const damping = 0.9;
        const ax = (this.originX - this.x) * springK;
        const ay = (this.originY - this.y) * springK;
        this.vx += ax;
        this.vy += ay;
        this.vx *= damping;
        this.vy *= damping;
        this.x += this.vx;
        this.y += this.vy;
        this.size += (this.targetSize - this.size) * 0.1;
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      
      points = [];
      const cols = Math.ceil(rect.width / SPACING);
      const rows = Math.ceil(rect.height / SPACING);
      const offsetX = (rect.width - (cols - 1) * SPACING) / 2;
      const offsetY = (rect.height - (rows - 1) * SPACING) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          points.push(new Point(offsetX + i * SPACING, offsetY + j * SPACING));
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.forEach(point => { point.update(); point.draw(ctx); });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    init();
    animate();

    window.addEventListener('resize', init);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', () => { mouse.current = { x: -1000, y: -1000 }; });

    return () => {
      window.removeEventListener('resize', init);
      if (container) container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#1b1d25] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="relative z-10 h-full pointer-events-none">
        <div className="pointer-events-auto h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
