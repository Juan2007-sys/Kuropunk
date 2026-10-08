import React, { useEffect, useRef } from 'react';

export const ConcreteShaderCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Detect mobile / touch devices to bypass heavy 60fps canvas loop entirely
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return;

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

    // Mouse coordinates
    let mouse = { x: width * 0.7, y: height * 0.3, targetX: width * 0.7, targetY: height * 0.3 };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Particles array (optimized count for desktop)
    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25 - 0.1,
      opacity: Math.random() * 0.3 + 0.05,
      color: Math.random() > 0.6 ? '#e0141f' : '#c9c9c4'
    }));

    let time = 0;

    const render = () => {
      if (!isVisible) return;
      time += 0.012;

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Radial Ambient Glow (Reactive Red Spray)
      const grad1 = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.45
      );
      grad1.addColorStop(0, 'rgba(224, 20, 31, 0.08)');
      grad1.addColorStop(0.5, 'rgba(224, 20, 31, 0.02)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient secondary fixed drift
      const sprayX = width * 0.2 + Math.sin(time * 0.5) * 60;
      const sprayY = height * 0.4 + Math.cos(time * 0.3) * 40;
      const grad2 = ctx.createRadialGradient(sprayX, sprayY, 5, sprayX, sprayY, 350);
      grad2.addColorStop(0, 'rgba(224, 20, 31, 0.06)');
      grad2.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 3. Floating grime / ash embers
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* 1. Desktop Interactive Hardware Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80 hidden md:block"
      />
      {/* 2. Zero-cost GPU CSS radial atmosphere on Mobile Phones */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-35 md:hidden bg-[radial-gradient(circle_at_75%_25%,rgba(224,20,31,0.14),transparent_65%)]"
      />
    </>
  );
};
