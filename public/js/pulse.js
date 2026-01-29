export function initPulseCanvas() {
  const canvas = document.getElementById('pulseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let buffer = [];

  let spikeTimer = 0;
  function maybeStartSpike() {
    if (spikeTimer === 0 && Math.random() < 0.02) {
      spikeTimer = 1 + Math.floor(Math.random() * 6);
    }
  }

  function step() {
    let base = H * 0.5 + (Math.sin(Date.now()/800) * H * 0.02);
    base += (Math.random() - 0.5) * 4;

    if (spikeTimer > 0) {
      const t = spikeTimer;
      if (t === 6 || t === 5) base -= H * (0.22 + Math.random()*0.05);
      else if (t === 4) base += H * 0.06;
      else if (t === 3) base -= H * (0.12 + Math.random()*0.06);
      else base -= H * (0.06 + Math.random()*0.02);
      spikeTimer++;
      if (spikeTimer > 12) spikeTimer = 0;
    } else {
      if (Math.random() < 0.015) {
        spikeTimer = 6;
      }
    }

    buffer.push(base);
    if (buffer.length > W) buffer.shift();
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(255,255,255,0.02)');
    g.addColorStop(1,'rgba(0,0,0,0.02)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    ctx.beginPath();
    ctx.moveTo(0, buffer[0]);
    for (let x = 1; x < buffer.length; x++) {
      ctx.lineTo(x, buffer[x]);
    }
    ctx.strokeStyle = 'rgba(0,200,180,0.14)';
    ctx.lineWidth = 18;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, buffer[0]);
    for (let x = 1; x < buffer.length; x++) ctx.lineTo(x, buffer[x]);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }

  function loop() {
    maybeStartSpike();
    step();
    draw();
    requestAnimationFrame(loop);
  }

  function setupCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(120, Math.round(rect.width * dpr));
    canvas.height = Math.max(120, Math.round(rect.height * dpr));
    canvas.style.width = Math.round(rect.width) + 'px';
    canvas.style.height = Math.round(rect.height) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    W = Math.round(rect.width);
    H = Math.round(rect.height);
    buffer.length = 0;
    for (let i = 0; i < W; i++) buffer.push(H/2);
  }

  window.addEventListener('resize', () => {
    setupCanvasSize();
  });

  setupCanvasSize();
  loop();
}
