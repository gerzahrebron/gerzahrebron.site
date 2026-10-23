const tabs = [...document.querySelectorAll('[role="tab"]')];
function activate(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  document.querySelector('.demo-feedback').textContent = '';
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById(tab.getAttribute('aria-controls')).animate(
      [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: 250, easing: 'ease-out' }
    );
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (next) { event.preventDefault(); activate(next); next.focus(); }
  });
});

// Motion enhances the page; all content remains visible without JavaScript.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations = new Set();
function playMotion(element, frames, options) {
  if (!element || motionPreference.matches || !element.animate) return;
  const animation = element.animate(frames, options);
  motionAnimations.add(animation);
  animation.finished.then(() => motionAnimations.delete(animation), () => motionAnimations.delete(animation));
}
const entrance = [
  ['.intro', 0], ['h1', 100], ['.hero-description', 260],
  ['.hero-bottom .button', 370], ['.hero-note', 450]
];
entrance.forEach(([selector, delay]) => playMotion(
  document.querySelector(selector),
  [{ opacity: 0, transform: 'translateY(18px)', filter: 'blur(5px)' },
   { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }],
  { duration: 850, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
));

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sectionObserver.unobserve(entry.target);
      // Animate a section as one composition, instead of every paragraph.
      playMotion(entry.target,
        [{ opacity: 0.25, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
        { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .applications-copy, .demo, .steps, .contact-top, .contact h2').forEach(element => sectionObserver.observe(element));
}

const phone = document.querySelector('.phone');
let tiltFrame = 0;
function resetTilt() {
  cancelAnimationFrame(tiltFrame);
  tiltFrame = 0;
  if (phone) phone.style.transform = '';
}
if (phone) {
  phone.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || motionPreference.matches) return;
    const rect = phone.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      phone.style.transform = `perspective(1000px) rotateX(${-y * 3}deg) rotateY(${x * 4}deg) rotateZ(2deg)`;
    });
  });
  phone.addEventListener('pointerleave', resetTilt);
  phone.addEventListener('pointercancel', resetTilt);
}
motionPreference.addEventListener('change', () => {
  if (!motionPreference.matches) return;
  motionAnimations.forEach(animation => animation.cancel());
  resetTilt();
});
document.querySelectorAll('.book').forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    const booked = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(booked));
    button.textContent = booked ? '✓' : '+';
    const title = button.closest('.class-card').querySelector('strong').textContent;
    document.querySelector('.demo-feedback').textContent = booked ? `${title}: пример выбора услуги. Настоящая заявка не отправлена.` : 'Демонстрационный выбор отменён.';
  });
});

// BubbleMenu-inspired staggered spring entrance for the navigation pills.
document.querySelectorAll('.bubble-header .brand, .bubble-header nav a, .bubble-header .header-contact').forEach((pill, index) => {
  playMotion(pill, [
    { opacity: 0, transform: 'translateY(-10px) scale(.8)' },
    { opacity: 1, transform: 'translateY(0) scale(1.04)', offset: .7 },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ], { duration: 550, delay: index * 85, easing: 'ease-out', fill: 'backwards' });
});

