// Standalone adaptation of the supplied React Bits SlingButton interaction.
(() => {
  const root = document.getElementById('back-top');
  const pad = root.querySelector('button');
  const move = root.querySelector('.sling-button__move');
  const band = root.querySelector('.sling-button__band');
  const hot = root.querySelector('.sling-button__band--hot');
  const tension = root.querySelector('.sling-button__tension');
  const arc = root.querySelector('.sling-button__arc');
  const icon = root.querySelector('.sling-button__icon');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  let x = 0, y = 0, grip = null, frame = 0, skipUntil = 0;
  function paint() {
    move.style.transform = `translate(${x}px,${y}px)`;
    const dist = Math.hypot(x, y);
    const power = clamp(dist / 48, 0, 1);
    let path = '';
    if (dist > .5) {
      const a = Math.atan2(y, x), b = Math.acos(clamp((35 - 26.5) / dist, -1, 1));
      path = [a + b, a - b].map(t => {
        const cx = Math.cos(t), cy = Math.sin(t);
        return `M${35 * cx},${35 * cy}L${x + 26.5 * cx},${y + 26.5 * cy}`;
      }).join('');
    }
    band.setAttribute('d', path); hot.setAttribute('d', path);
    tension.style.opacity = String(clamp(dist / 6, 0, 1));
    hot.style.opacity = String(power);
    arc.style.opacity = String(power);
    arc.setAttribute('stroke-dasharray', `${power} ${1 - power}`);
    arc.setAttribute('stroke-dashoffset', String(power / 2));
    arc.setAttribute('transform', `rotate(${Math.atan2(-y, -x) * 180 / Math.PI})`);
    if (grip && dist > 3 && !reduced.matches) icon.style.transform = `rotate(${(Math.atan2(-y, -x) * 180 / Math.PI + 90) * clamp(dist / 12, 0, 1)}deg)`;
  }
  function spring(launch) {
    cancelAnimationFrame(frame);
    if (reduced.matches) { x = y = 0; paint(); return; }
    const dist = Math.hypot(x, y) || 1;
    let vx = launch ? -x / dist * 1600 : 0, vy = launch ? -y / dist * 1600 : 0;
    let previous = performance.now(), elapsed = 0;
    function tick(now) {
      const dt = Math.min((now - previous) / 1000, .025); previous = now; elapsed += dt;
      vx += (-400 * x - 28 * vx) * dt;
      vy += (-400 * y - 28 * vy) * dt;
      x += vx * dt; y += vy * dt; paint();
      if (elapsed < 1.2 && Math.hypot(x, y, vx, vy) > .2) frame = requestAnimationFrame(tick);
      else { x = y = 0; paint(); frame = 0; }
    }
    frame = requestAnimationFrame(tick);
  }
  function burst() {
    if (reduced.matches) return;
    root.querySelectorAll('.sling-button__dot').forEach((dot, i) => {
      const angle = -Math.PI / 2 + (Math.random() - .5) * .9;
      const reach = i === 0 ? 155 : 65 + Math.random() * 90;
      const scale = .3 + Math.random() * .7;
      dot.animate([
        { opacity: 0, transform: `translate(0,-30px) scale(${scale})` },
        { opacity: 1, offset: .12 },
        { opacity: 0, transform: `translate(${Math.cos(angle) * reach}px,${Math.sin(angle) * reach}px) scale(.15)` }
      ], { duration: 400 + Math.random() * 180, easing: 'cubic-bezier(.23,1,.32,1)' });
    });
  }
  function goTop() {
    burst();
    const heading = document.querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  function show() {
    root.hidden = window.scrollY < 350 && !grip && document.activeElement !== pad;
  }
  pad.addEventListener('pointerdown', event => {
    if (event.button !== 0 || grip) return;
    cancelAnimationFrame(frame);
    x = y = 0;
    grip = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    pad.setPointerCapture(event.pointerId);
    pad.setAttribute('data-held', '');
  });
  pad.addEventListener('pointermove', event => {
    if (!grip || event.pointerId !== grip.id) return;
    const dx = event.clientX - grip.x, dy = event.clientY - grip.y;
    if (Math.hypot(dx, dy) > 6) grip.moved = true;
    const rx = dx * .2, raw = Math.hypot(rx, dy);
    const d = 160 * raw / (160 + raw);
    x = raw ? d * rx / raw : 0; y = raw ? d * dy / raw : 0;
    root.toggleAttribute('data-armed', d >= 48);
    pad.toggleAttribute('data-armed', d >= 48);
    paint();
  });
  function release(event, cancelled = false) {
    if (!grip || event.pointerId !== grip.id) return;
    const moved = grip.moved, launch = moved && Math.hypot(x, y) >= 48 && !cancelled;
    const id = grip.id; grip = null;
    if (pad.hasPointerCapture(id)) pad.releasePointerCapture(id);
    pad.removeAttribute('data-held'); pad.removeAttribute('data-armed'); root.removeAttribute('data-armed');
    icon.style.transform = '';
    if (moved || cancelled) skipUntil = performance.now() + 500;
    spring(launch);
    if (launch) goTop();
    show();
  }
  pad.addEventListener('pointerup', event => release(event));
  pad.addEventListener('pointercancel', event => release(event, true));
  pad.addEventListener('lostpointercapture', event => release(event, true));
  pad.addEventListener('keydown', event => {
    if (event.key === 'Escape' && grip) release({ pointerId: grip.id }, true);
  });
  pad.addEventListener('click', event => {
    if (event.detail > 0 && performance.now() < skipUntil) return;
    goTop();
  });
  pad.addEventListener('blur', show);
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    cancelAnimationFrame(frame); x = y = 0; paint();
    root.querySelectorAll('.sling-button__dot').forEach(dot => dot.getAnimations().forEach(a => a.cancel()));
  });
  window.addEventListener('scroll', show, { passive: true });
  show();
})();

