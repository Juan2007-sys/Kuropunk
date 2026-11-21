import React, { useEffect, useRef } from 'react';

export const ConcreteShaderCanvas = React.memo(({ paused = false }) => {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const controlRef = useRef({ sync: null });

  pausedRef.current = paused;

  useEffect(() => {
    controlRef.current.sync?.();
  }, [paused]);

  useEffect(() => {
    // 1. Detect mobile / touch devices to scale particle count for smooth fps
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Pre-render cursor glow once on a small offscreen canvas (avoids allocating CanvasGradient 30-60x/s)
    let glowCanvas = null;
    const glowRadius = 180;
    if (!isMobile) {
      glowCanvas = document.createElement('canvas');
      glowCanvas.width = glowRadius * 2;
      glowCanvas.height = glowRadius * 2;
      const gCtx = glowCanvas.getContext('2d');
      if (gCtx) {
        const grad = gCtx.createRadialGradient(glowRadius, glowRadius, 4, glowRadius, glowRadius, glowRadius);
        grad.addColorStop(0, 'rgba(224, 20, 31, 0.10)');
        grad.addColorStop(0.5, 'rgba(224, 20, 31, 0.03)');
        grad.addColorStop(1, 'rgba(224, 20, 31, 0)');
        gCtx.fillStyle = grad;
        gCtx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
      }
    }

    let animationFrameId = null;
    let isTabVisible = document.visibilityState === 'visible';
    let isScrolling = false;
    let scrollTimer = null;
    let resizeTimer = null;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse & touch coordinates
    let mouse = { x: width * 0.7, y: height * 0.3, targetX: width * 0.7, targetY: height * 0.3 };

    // Particles array (14 on mobile, 36 on desktop)
    const particleCount = isMobile ? 14 : 36;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      size: Math.random() * 2.4 + 1.4,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35 - 0.15,
      opacity: Math.random() * 0.45 + 0.3,
      color: Math.random() > 0.45 ? '#e0141f' : '#e6e1e1'
    }));

    let time = 0;
    let lastDraw = 0;
    const frameInterval = isMobile ? 36 : 33; // ~28-30 FPS cap saves GPU compositor budget on Retina displays

    const stopLoop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const canRun = () => isTabVisible && !isScrolling && !pausedRef.current;

    const render = (now = 0) => {
      if (!canRun()) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(render);

      if (now - lastDraw < frameInterval) return;
      lastDraw = now;
      time += 0.025;

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;

      ctx.clearRect(0, 0, width, height);

      // Blit pre-rendered radial glow around cursor (desktop only)
      if (glowCanvas) {
        ctx.drawImage(glowCanvas, mouse.x - glowRadius, mouse.y - glowRadius);
      }

      // Floating grime / ash embers driven by a 2D vector field F(x, y, t) + cursor potential gradient
      const fieldScale = 0.0035;
      const fieldStrength = 0.028;
      const influenceRadiusSq = 220 * 220;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let fx = Math.sin(p.y * fieldScale + time * 0.7) * fieldStrength;
        let fy = Math.cos(p.x * fieldScale - time * 0.5) * fieldStrength;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 1 && distSq < influenceRadiusSq) {
          const dist = Math.sqrt(distSq);
          const ux = dx / dist;
          const uy = dy / dist;
          const force = 1600 / (distSq + 600);
          fx += (ux - uy * 0.45) * force;
          fy += (uy + ux * 0.45) * force;
        }

        p.vx = p.vx * 0.94 + fx;
        p.vy = p.vy * 0.94 + fy;
        p.x += p.speedX + p.vx;
        p.y += p.speedY + p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const totalVx = p.speedX + p.vx;
        const totalVy = p.speedY + p.vy;
        ctx.beginPath();
        ctx.moveTo(p.x - totalVx * 12, p.y - totalVy * 12);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.9;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.min(0.85, p.opacity * 0.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const syncLoop = () => {
      if (canRun()) {
        if (animationFrameId === null) {
          lastDraw = 0;
          animationFrameId = requestAnimationFrame(render);
        }
      } else {
        stopLoop();
      }
    };
    controlRef.current.sync = syncLoop;

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Pausar redibujado durante el scroll vertical (tanto móvil como desktop) para priorizar el compositor
    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        stopLoop();
      }
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
        syncLoop();
      }, 140);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    } else {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
      syncLoop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    syncLoop();

    return () => {
      controlRef.current.sync = null;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (scrollTimer) clearTimeout(scrollTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      stopLoop();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
});
