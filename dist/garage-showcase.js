const page=document.querySelector('.gm-page');
if(page){
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const network=navigator.connection;
 const motion=page.querySelector('[data-gs-motion]');
 const videos=[...page.querySelectorAll('[data-gs-loop]')];
 const visible=new Set();
 let choice=null;
 const allowed=()=>choice??!(media.matches||network?.saveData);

 function sync(){
  const enabled=allowed();
  motion.textContent=enabled?'Остановить анимацию':'Включить анимацию';
  for(const video of videos){
   const active=enabled&&visible.has(video)&&!document.hidden;
   video.dataset.enabled=String(enabled);
   video.autoplay=active;
   if(active){
    if(!video.hasAttribute('src'))video.src=video.dataset.src;
    if(video.paused)video.play().catch(()=>{});
   }else if(!video.paused)video.pause();
  }
 }
 motion.hidden=false;
 motion.addEventListener('click',()=>{choice=!allowed();sync();});
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting,intersectionRatio} of entries){
   if(isIntersecting&&intersectionRatio>=.18)visible.add(target);
   else visible.delete(target);
  }
  sync();
 },{threshold:.18}):null;
 for(const video of videos){
  video.muted=true;
  video.addEventListener('playing',()=>video.dataset.started='true');
  video.addEventListener('error',()=>delete video.dataset.started);
  if(observer)observer.observe(video);
  else visible.add(video);
 }
 media.addEventListener('change',()=>{choice=null;sync();});
 network?.addEventListener?.('change',sync);
 document.addEventListener('visibilitychange',sync);
 sync();

 const explorer=page.querySelector('[data-gs-explorer]');
 const buttons=[...explorer.querySelectorAll('[data-gs-node]')];
 const details=[...explorer.querySelectorAll('[data-gs-detail]')];
 for(const button of buttons)button.addEventListener('click',()=>{
  const id=button.dataset.gsNode;
  for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.gsNode===id));
  for(const detail of details)detail.hidden=detail.dataset.gsDetail!==id;
 });
}
