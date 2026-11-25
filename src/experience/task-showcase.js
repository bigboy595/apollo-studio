const page=document.querySelector('.at-page');
if(page){
 const motion=page.querySelector('[data-task-motion]');
 const reels=[...page.querySelectorAll('[data-task-reel]')];
 const visible=new Set();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const network=navigator.connection;
 let choice=null;
 const enabled=()=>choice??!(reduced.matches||network?.saveData);

 function sync(){
  const animate=enabled();
  motion.textContent=animate?'Остановить анимацию':'Включить анимацию';
  page.dataset.animate=String(animate);
  for(const reel of reels){
   const play=animate&&visible.has(reel)&&!document.hidden;
   reel.autoplay=play;
   if(play){
    if(!reel.hasAttribute('src'))reel.src=reel.dataset.src;
    if(reel.paused)reel.play().catch(()=>{});
   }else if(!reel.paused)reel.pause();
  }
 }
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting&&entry.intersectionRatio>=.18)visible.add(entry.target);
   else visible.delete(entry.target);
  }
  sync();
 },{threshold:.18}):null;

 for(const reel of reels){
  reel.muted=true;
  reel.addEventListener('playing',()=>reel.dataset.started='true');
  reel.addEventListener('error',()=>delete reel.dataset.started);
  if(observer)observer.observe(reel);
  else visible.add(reel);
 }
 motion.hidden=false;
 motion.addEventListener('click',()=>{choice=!enabled();sync();});
 reduced.addEventListener('change',()=>{choice=null;sync();});
 network?.addEventListener?.('change',sync);
 document.addEventListener('visibilitychange',sync);
 sync();

 const demo=page.querySelector('[data-task-showcase-demo]');
 const steps=[...demo.querySelectorAll('[data-task-step]')];
 const read=name=>demo.querySelector('[data-task-demo-'+name+']');
 const action=read('action'),reset=read('reset');
 const views=[
  ['Сотрудник','Задача на КП','Заказчик прислал требования. Возьмите задачу, чтобы подготовить предложение для опытной партии.','К выполнению','Черновик','Взять в работу'],
  ['Сотрудник','КП готово к проверке','В предложении указаны 120 комплектов, состав поставки и срок. Передайте эту версию руководителю.','В работе','Черновик','Отправить на согласование'],
  ['Руководитель','Версия ждёт решения','Проверьте эту версию: 120 комплектов, самовывоз, 10 рабочих дней после согласования. Если условия подходят, подтвердите документ.','В работе','На согласовании','Согласовать версию'],
  ['Сотрудник','Предложение согласовано','Решение осталось в истории документа. Теперь можно завершить задачу на подготовку КП.','В работе','Согласовано','Завершить задачу'],
  ['Команда','Задача закрыта','На доске видно, что работа закончена. У заказа осталась согласованная версия КП.','Готово','Согласовано','Пройти заново']
 ];
 let stage=0;
 function update(){
  const [role,title,copy,task,doc,cta]=views[stage];
  demo.dataset.phase=String(stage);
  for(const [i,node] of steps.entries()){
   node.dataset.done=String(i<stage);
   if(i===stage)node.setAttribute('aria-current','step');
   else node.removeAttribute('aria-current');
  }
  for(const [name,value] of Object.entries({role,title,copy,task,doc,action:cta}))read(name).textContent=value;
  reset.hidden=stage===0||stage===views.length-1;
 }
 action.addEventListener('click',()=>{stage=(stage+1)%views.length;update();});
 reset.addEventListener('click',()=>{stage=0;update();action.focus({preventScroll:true});});
}
