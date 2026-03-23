/**
 * Animated cartoon motorcycle background for the main menu.
 * Draws a stylized motorcycle silhouette with spinning wheels on a canvas.
 */
export function initMenuBackground() {
  const canvas = document.getElementById('menu-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, time = 0;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Road stripes
  const stripes = [];
  for (let i = 0; i < 12; i++) {
    stripes.push({ x: Math.random() * 2 - 0.5, speed: 0.5 + Math.random() * 1.5 });
  }

  function drawWheel(cx, cy, r, angle) {
    // Tire
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = r * 0.25;
    ctx.stroke();

    // Rim
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spokes
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = angle + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
      ctx.stroke();
    }
  }

  function drawBike(bx, by, scale, wheelAngle) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(scale, scale);

    const wr = 28; // wheel radius

    // Rear wheel
    drawWheel(-50, 30, wr, wheelAngle);
    // Front wheel
    drawWheel(55, 30, wr, wheelAngle);

    // Chain line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-50, 30);
    ctx.lineTo(-15, 0);
    ctx.stroke();

    // Frame
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#0088ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-50, 30);  // rear axle
    ctx.lineTo(-20, -10); // seat post
    ctx.lineTo(15, -15);  // top tube
    ctx.lineTo(55, 30);   // front axle
    ctx.stroke();

    // Down tube
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(-10, 20);
    ctx.lineTo(20, 20);
    ctx.lineTo(15, -15);
    ctx.stroke();

    // Engine block
    ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-10, 20);
    ctx.lineTo(18, 20);
    ctx.lineTo(12, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0077cc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handlebar
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, -15);
    ctx.lineTo(20, -30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, -32);
    ctx.lineTo(25, -28);
    ctx.stroke();

    // Seat
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(-22, -14, 18, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Headlight glow
    ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.shadowColor = '#ffff88';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(22, -28, 4, 0, Math.PI * 2);
    ctx.fill();

    // Exhaust pipe
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(-45, 25);
    ctx.lineTo(-55, 22);
    ctx.stroke();

    // Tail light
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-55, 22, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Floating particles (speed lines & sparks)
  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      len: 10 + Math.random() * 30,
      speed: 1 + Math.random() * 3,
      alpha: 0.1 + Math.random() * 0.3
    });
  }

  function draw() {
    time += 0.016;
    ctx.clearRect(0, 0, w, h);

    // Dark gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000510');
    grad.addColorStop(0.5, '#001030');
    grad.addColorStop(1, '#000008');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Road perspective at bottom
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Road stripes (moving)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    for (const s of stripes) {
      s.x -= s.speed * 0.003;
      if (s.x < -0.1) s.x = 1.1;
      const sx = s.x * w;
      const sy = h * 0.88;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 40, sy);
      ctx.stroke();
    }

    // Speed lines (particles)
    for (const p of particles) {
      p.x -= p.speed * 0.003;
      if (p.x < -0.05) { p.x = 1.05; p.y = Math.random(); }
      ctx.strokeStyle = `rgba(0, 170, 255, ${p.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x * w, p.y * h);
      ctx.lineTo(p.x * w + p.len, p.y * h);
      ctx.stroke();
    }

      // Draw the motorcycle - positioned in road area (below buttons)
      const bikeScale = Math.min(w / 400, h / 300) * 1.5;
      const bikeX = w * 0.5;
      const bikeY = h * 0.5;
    const wheelAngle = time * 8; // spinning

    // Subtle bounce
    const bounce = Math.sin(time * 3) * 2;

    drawBike(bikeX, bikeY + bounce, bikeScale, wheelAngle);

    // Exhaust puffs from bike
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) {
      const age = (time * 2 + i * 0.5) % 2;
      const ex = bikeX - 55 * bikeScale - age * 30 * bikeScale;
      const ey = bikeY + 22 * bikeScale + bounce + Math.sin(age * 5) * 3;
      const er = (4 + age * 8) * bikeScale;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 100, 100, ${0.3 - age * 0.15})`;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    animId = requestAnimationFrame(draw);
  }

  let animId = requestAnimationFrame(draw);

  // Return cleanup function
  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}
