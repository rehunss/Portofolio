// One original illustration moves gently; brand marks are never clipped.
(() => {
  const art = document.querySelector('.sky-art');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const brands = [...document.querySelectorAll('.brand-art')];
  const played = new WeakSet(), waiting = new WeakSet();
  const inView = new Set(), animations = new Map();
  let raf = 0, pointerX = 0, pointerY = 0;
  let currentX = 0, currentY = 0, currentScroll = 0;
  const muted = () => media.matches || document.documentElement.classList.contains('motion-reduced');
  const progress = () => Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
  function draw() {
    raf = 0;
    if (document.hidden || muted() || !art) return;
    const target = progress();
    currentScroll += (target - currentScroll) * .12;
    currentX += (pointerX - currentX) * .1;
    currentY += (pointerY - currentY) * .1;
    art.style.transform = `translate3d(${currentX * 6}px,${currentScroll * -24 + currentY * 4}px,0) scale(${1 + currentScroll * .006})`;
    if (Math.abs(target-currentScroll) > .0002 || Math.abs(pointerX-currentX) > .002 || Math.abs(pointerY-currentY) > .002) raf = requestAnimationFrame(draw);
  }
  function schedule() {
    if (!raf && !document.hidden && !muted()) raf = requestAnimationFrame(draw);
  }
  function reveal(brand) {
    if (played.has(brand) || muted() || document.hidden || !brand.animate || !inView.has(brand)) return;
    const image = brand.querySelector('img');
    if (image && !image.complete) {
      if (!waiting.has(image)) {
        waiting.add(image);
        image.addEventListener('load', () => {waiting.delete(image);reveal(brand);}, {once:true});
      }
      return;
    }
    if (image && image.naturalWidth === 0) return;
    played.add(brand);
    const animation = brand.animate([
      {transform:'translateY(5px) scale(.985)',opacity:.7},
      {transform:'translateY(0) scale(1)',opacity:1}
    ], {duration:460,easing:'cubic-bezier(.22,1,.36,1)'});
    animations.set(brand, animation);
    animation.finished.then(() => {if(animations.get(brand)===animation)animations.delete(brand);}).catch(()=>{});
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){inView.add(entry.target);reveal(entry.target);}
      else{inView.delete(entry.target);animations.get(entry.target)?.cancel();animations.delete(entry.target);}
    }),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    brands.forEach(brand=>observer.observe(brand));
  }
  function stopAnimations() {
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    animations.forEach(animation=>animation.cancel());animations.clear();
  }
  function syncMotion() {
    stopAnimations();
    if(muted())art?.style.removeProperty('transform');
    else{currentScroll=progress();schedule();inView.forEach(reveal);}
  }
  new MutationObserver(syncMotion).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  media.addEventListener('change',syncMotion);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule);
  document.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',schedule));
  if(finePointer.matches){
    window.addEventListener('pointermove',event=>{pointerX=(event.clientX/innerWidth-.5)*2;pointerY=(event.clientY/innerHeight-.5)*2;schedule();},{passive:true});
    document.addEventListener('pointerleave',()=>{pointerX=pointerY=0;schedule();});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimations();else{schedule();inView.forEach(reveal);}});
  currentScroll=progress();schedule();
})();
