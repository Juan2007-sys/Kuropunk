import React, { useEffect, useRef } from 'react';

export const ConcreteShaderCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Detect mobile / touch devices to scale particle count for smooth 60fps
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let isVisible = true;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse & touch coordinates
    let mouse = { x: width * 0.7, y: height * 0.3, targetX: width * 0.7, targetY: height * 0.3 };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Particles array (18 on mobile for battery efficiency, 42 on desktop - IEEE spec)
    const particleCount = isMobile ? 18 : 42;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      size: Math.random() * 2.6 + 1.5,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35 - 0.15,
      opacity: Math.random() * 0.45 + 0.3,
      color: Math.random() > 0.45 ? '#e0141f' : '#e6e1e1'
    }));

    let time = 0;
    let lastDraw = 0;
    const frameInterval = isMobile ? 33 : 16;

    const render = (now = 0) => {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(render);

      if (now - lastDraw < frameInterval) return;
      lastDraw = now;
      time += 0.015;

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      // Halos sutiles del campo de potencial repulsivo alrededor del cursor
      const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 4, mouse.x, mouse.y, 180);
      cursorGrad.addColorStop(0, 'rgba(224, 20, 31, 0.10)');
      cursorGrad.addColorStop(0.5, 'rgba(224, 20, 31, 0.03)');
      cursorGrad.addColorStop(1, 'rgba(224, 20, 31, 0)');
      ctx.fillStyle = cursorGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
      ctx.fill();

      // Floating grime / ash embers driven by a 2D vector field F(x, y, t) + cursor potential gradient
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Campo vectorial de flujo F(x, y, t) = (sin(ay + wt), cos(ax - wt))
        const fieldScale = 0.0035;
        const fieldStrength = 0.028;
        let fx = Math.sin(p.y * fieldScale + time * 0.7) * fieldStrength;
        let fy = Math.cos(p.x * fieldScale - time * 0.5) * fieldStrength;

        // Gradiente de potencial repulsivo (-grad V) + componente rotacional (-uy, ux) alrededor del cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const influenceRadius = 220;

        if (distSq > 1 && distSq < influenceRadius * influenceRadius) {
          const dist = Math.sqrt(distSq);
          const ux = dx / dist;
          const uy = dy / dist;
          const force = 1600 / (distSq + 600);
          // Repulsión radial + remolino tangencial (-uy, ux)
          fx += (ux - uy * 0.45) * force;
          fy += (uy + ux * 0.45) * force;
        }

        // Integración con amortiguamiento viscoso
        p.vx = p.vx * 0.94 + fx;
        p.vy = p.vy * 0.94 + fy;
        p.x += p.speedX + p.vx;
        p.y += p.speedY + p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Estela direccional alineada al vector velocidad v = (speedX + vx, speedY + vy)
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

    animationFrameId = requestAnimationFrame(render);

    // Pause rendering when tab is hidden to save battery & CPU
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[30] opacity-95"
    />
  );
};
