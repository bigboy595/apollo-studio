const explorer=document.querySelector('[data-gs-explorer]');
if(explorer){
 const buttons=[...explorer.querySelectorAll('[data-gs-node]')];
 const details=[...explorer.querySelectorAll('[data-gs-detail]')];
 const select=id=>{
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.gsNode===id));
  for(const detail of details)detail.hidden=detail.dataset.gsDetail!==id;
 };
 explorer.addEventListener('click',event=>{
  const point=event.target.closest('[data-gs-node]');
  if(point)select(point.dataset.gsNode);
 });
 explorer.addEventListener('keydown',event=>{
  const point=event.target.closest('[data-gs-node]');
  if(!point||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  const group=buttons.filter(button=>button.dataset.gsGroup===point.dataset.gsGroup);
  const offset=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
  const next=group[(group.indexOf(point)+offset+group.length)%group.length];
  event.preventDefault();
  next.focus();
  select(next.dataset.gsNode);
 });
}
const owner=document.querySelector('#gs-owner-video');
document.querySelector('[data-gs-play]')?.addEventListener('click',event=>{
 if(!owner||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 if(location.hash!=='#demo')history.pushState(null,'','#demo');
 owner.scrollIntoView({block:'start',behavior:'instant'});
 owner.focus({preventScroll:true});
 owner.play().catch(()=>{});
});
const videos=[...document.querySelectorAll('.gs-film video')];
for(const video of videos)video.addEventListener('play',()=>{
 for(const other of videos)if(other!==video)other.pause();
});
