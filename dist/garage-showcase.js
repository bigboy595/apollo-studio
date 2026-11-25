const clips=document.querySelector('.gs-cinema');
if(clips?.showModal){
 const videos=[...clips.querySelectorAll('video')];
 const panels=[...clips.querySelectorAll('.gs-player-section')];
 let trigger;
 for(const link of document.querySelectorAll('[data-gs-film]')){
  link.addEventListener('click',event=>{
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const selected=clips.querySelector('#gs-'+link.dataset.gsFilm+'-video');
   if(!selected)return;
   event.preventDefault();
   trigger=link;
   for(const panel of panels)panel.hidden=!panel.contains(selected);
   for(const player of videos)if(player!==selected)player.pause();
   clips.showModal();
   selected.currentTime=0;
   selected.play().catch(()=>{});
  });
 }
 clips.addEventListener('click',event=>{
  if(event.target===clips||event.target.closest('[data-gs-close]'))clips.close();
 });
 clips.addEventListener('close',()=>{
  for(const video of videos)video.pause();
  trigger?.focus({preventScroll:true});
 });
}
const controls=document.querySelector('[data-gs-tabs]');
if(controls){
 const tabs=[...controls.querySelectorAll('[role="tab"]')];
 const select=active=>{
  for(const button of tabs){
   const open=button===active;
   button.setAttribute('aria-selected',String(open));
   button.tabIndex=open?0:-1;
   document.getElementById(button.getAttribute('aria-controls')).hidden=!open;
  }
 };
 for(const [i,tab] of tabs.entries()){
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',event=>{
   const target={
    ArrowRight:tabs[(i+1)%tabs.length],
    ArrowLeft:tabs[(i-1+tabs.length)%tabs.length],
    Home:tabs[0], End:tabs.at(-1)
   }[event.key];
   if(!target)return;
   event.preventDefault();
   select(target);
   target.focus({preventScroll:true});
  });
 }
}
const explorer=document.querySelector('[data-gs-explorer]');
if(explorer){
 const buttons=[...explorer.querySelectorAll('[data-gs-node]')];
 const details=[...explorer.querySelectorAll('[data-gs-detail]')];
 const select=id=>{
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.gsNode===id));
  for(const detail of details)detail.hidden=detail.dataset.gsDetail!==id;
 };
 for(const button of buttons)button.addEventListener('click',()=>select(button.dataset.gsNode));
}
