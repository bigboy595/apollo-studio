const page = document.documentElement;
const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;
let position;
let litPanel;

function paint() {
  frame = 0;
  const {clientX, clientY, target} = position;
  const x = clientX / innerWidth;
  const y = clientY / innerHeight;
  page.style.setProperty('--pointer-x', `${(100 * x).toFixed(1)}%`);
  page.style.setProperty('--pointer-y', `${(100 * y).toFixed(1)}%`);
  page.style.setProperty('--pointer-turn', `${(110 * (x - .5) + 36 * (y - .5)).toFixed(1)}deg`);

  const panel = target.closest('[data-gradient-focus]');
  if (panel) {
    litPanel = panel;
    const box = panel.getBoundingClientRect();
    panel.style.setProperty('--footer-light-x', `${(100 * (clientX - box.left) / box.width).toFixed(1)}%`);
    panel.style.setProperty('--footer-light-y', `${(100 * (clientY - box.top) / box.height).toFixed(1)}%`);
  }
}

addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !mouse.matches || reducedMotion.matches) return;
  position = event;
  if (!frame) frame = requestAnimationFrame(paint);
}, {passive: true});

function resetLight() {
  if (mouse.matches && !reducedMotion.matches) return;
  cancelAnimationFrame(frame);
  frame = 0;
  for (const property of ['--pointer-x', '--pointer-y', '--pointer-turn']) page.style.removeProperty(property);
  litPanel?.style.removeProperty('--footer-light-x');
  litPanel?.style.removeProperty('--footer-light-y');
}
mouse.addEventListener('change', resetLight);
reducedMotion.addEventListener('change', resetLight);
