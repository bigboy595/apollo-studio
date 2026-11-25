const page=document.querySelector('.gm-page');
if(page){
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const network=navigator.connection;
 const motion=page.querySelector('[data-gs-motion]');
 const animations=[...page.querySelectorAll('[data-gs-loop]')];
 const visible=new Set();
 const cinema=page.querySelector('.gs-cinema');
 const films=[...cinema.querySelectorAll('video')];
 const panels=[...cinema.querySelectorAll('.gs-player-section')];
 let choice=null;
 let trigger=null;
 const allowed=()=>choice??!(media.matches||network?.saveData);
 function sync(){
  const enabled=allowed();
  motion.textContent=enabled?'Пауза анимации':'Включить анимацию';
  for(const video of animations){
   video.dataset.enabled=String(enabled);
   if(enabled&&visible.has(video)&&!document.hidden&&!cinema.open){
    video.play().catch(()=>{});
   }else video.pause();
  }
 }
 motion.hidden=false;
 motion.addEventListener('click',()=>{choice=!allowed();sync();});
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const video=entry.target;
   if(entry.isIntersecting&&entry.intersectionRatio>=.26)visible.add(video);
   else visible.delete(video);
  }
  sync();
 },{threshold:.26});
 for(const video of animations){
  video.muted=true;
  video.addEventListener('playing',()=>video.dataset.started='true');
  observer.observe(video);
 }
 media.addEventListener('change',()=>{choice=null;sync();});
 network?.addEventListener?.('change',()=>sync());
 document.addEventListener('visibilitychange',()=>sync());
 sync();

 if(cinema.showModal){
  for(const link of page.querySelectorAll('[data-gs-film]')){
   link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const selected=cinema.querySelector('#gs-'+link.dataset.gsFilm+'-video');
    if(!selected)return;
    event.preventDefault();
    trigger=link;
    for(const panel of panels)panel.hidden=!panel.contains(selected);
    cinema.showModal();
    sync();
    selected.currentTime=0;
    selected.play().catch(()=>{});
   });
  }
  cinema.addEventListener('click',event=>{
   if(event.target===cinema||event.target.closest('[data-gs-close]'))cinema.close();
  });
  cinema.addEventListener('close',()=>{
   for(const video of films)video.pause();
   sync();
   trigger?.focus({preventScroll:true});
  });
 }
 const explorer=page.querySelector('[data-gs-explorer]');
 const buttons=[...explorer.querySelectorAll('[data-gs-node]')];
 const details=[...explorer.querySelectorAll('[data-gs-detail]')];
 for(const button of buttons)button.addEventListener('click',()=>{
  const id=button.dataset.gsNode;
  for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.gsNode===id));
  for(const detail of details)detail.hidden=detail.dataset.gsDetail!==id;
 });
}
