const dialog = document.querySelector('#image-dialog');
const viewer = document.querySelector('#dialog-image');
const caption = document.querySelector('#image-caption');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionControl = document.querySelector('.motion-control');
let userReduced = false;
let previewAnimation;
let lastPreviewButton;
const reduced = () => motionPreference.matches || userReduced;
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', async () => {
    lastPreviewButton = button;
    previewAnimation?.cancel();
    const origin = (button.classList.contains('portrait-photo') ? button : button.querySelector('img')).getBoundingClientRect();
    viewer.src = button.dataset.image;
    viewer.alt = button.dataset.caption;
    caption.textContent = button.dataset.caption;
    if (!dialog.open) dialog.showModal();
    try { await viewer.decode(); } catch { /* Keep the browser image state. */ }
    if (!dialog.open || lastPreviewButton !== button || reduced() || !viewer.animate) return;
    const target = viewer.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - target.left - target.width / 2;
    const dy = origin.top + origin.height / 2 - target.top - target.height / 2;
    const scale = Math.min(origin.width / Math.max(target.width, 1), origin.height / Math.max(target.height, 1));
    previewAnimation = viewer.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: .5 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1 }
    ], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
});
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  previewAnimation?.cancel();
  lastPreviewButton?.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
// The project index tracks reading progress as evidence settles into view.
const rail = document.querySelector('.project-rail');
const chapters = [...document.querySelectorAll('#work > .project')];
const railLinks = [...rail.querySelectorAll('a')];
const evidence = [...document.querySelectorAll('.main-evidence, .phone-evidence, .margin-note')];

let framePending = false;
const clamp = value => Math.min(1, Math.max(0, value));
function renderScroll() {
  framePending = false;
  const offset = rail.getBoundingClientRect().bottom;
  let active = null;
  chapters.forEach((chapter, index) => {
    const box = chapter.getBoundingClientRect();
    const progress = clamp((offset - box.top) / Math.max(box.height, 1));
    railLinks[index].style.setProperty('--read-progress', progress);
    if (box.top <= offset + 80 && box.bottom > offset) active = chapter.id;
  });
  railLinks.forEach(link => {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (reduced()) {
    evidence.forEach(el => el.style.removeProperty('--evidence-angle'));
    return;
  }
  const height = window.innerHeight;
  evidence.forEach(el => {
    const box = el.getBoundingClientRect();
    if (box.bottom < 0 || box.top > height) return;
    const focus = clamp((height - box.top) / (height * .6));
    const angle = el.classList.contains('phone-evidence') ? 4 : -4;
    el.style.setProperty('--evidence-angle', (angle * (1 - focus)).toFixed(2) + 'deg');
  });
}
function scheduleScroll() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(renderScroll);
}
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll);
window.addEventListener('load', scheduleScroll);
document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => {
    scheduleScroll();
    if (!details.open || reduced()) return;
    details.querySelector('.detail-body')?.animate?.([
      { opacity: .45, transform: 'translateY(-5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 220, easing: 'ease-out' });
  });
});
function updateMotion() {
  const isReduced = reduced();
  document.documentElement.classList.toggle('motion-reduced', isReduced);
  motionControl.setAttribute('aria-pressed', String(isReduced));
  motionControl.disabled = motionPreference.matches;
  motionControl.title = motionPreference.matches ? 'Reduced motion is enabled in your device settings' : 'Control motion on this page';
  motionControl.textContent = isReduced ? 'Motion reduced' : 'Reduce motion';
  if (isReduced) previewAnimation?.cancel();
  scheduleScroll();
}
motionControl.addEventListener('click', () => { userReduced = !userReduced; updateMotion(); });
motionPreference.addEventListener('change', updateMotion);
updateMotion();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.site-header nav a').forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-10% 0px -65% 0px' });
  document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
}
