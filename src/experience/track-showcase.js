const page=document.querySelector('.tk-page');
if(page){
 const demo=page.querySelector('[data-track-demo]');
 const pick=name=>demo.querySelector('[data-track-'+name+']');
 const roleButtons=[...demo.querySelectorAll('[data-track-role]')];
 const timeline=[...demo.querySelectorAll('[data-track-step]')];
 const dialog=pick('dialog');
 const action=pick('action');
 const reset=pick('reset');
 const labels=['Чертёж принят','На согласовании','В производстве','Готов к отгрузке'];
 const versions=['На проверке','Версия 03','Согласован','Согласован'];
 const views={
  client:[
   ['Чертёж у инженера.','Проверяем размеры и материал партии. Когда чертёж будет готов, появится шаг согласования.','Инженер готовит чертёж для согласования.','Перейти к менеджеру','manager'],
   ['Проверьте чертёж.','Менеджер прислал версию 03. Откройте чертёж и подтвердите его, чтобы запустить партию.','Ваше согласование.','Открыть и согласовать','document'],
   ['Партия в работе.','Чертёж согласован. Производство началось по утверждённой версии.','Менеджер обновит статус после контроля качества.','Перейти к менеджеру','manager'],
   ['Можно согласовать выдачу.','Партия прошла контроль качества и готова к получению. Чертёж по-прежнему доступен в заказе.','Договориться об отгрузке с менеджером.','Начать заново','reset']
  ],
  manager:[
   ['Чертёж готов к отправке.','Инженер проверил размеры и материал. Передайте версию 03 заказчику на согласование.','Отправить клиенту проверенный чертёж.','Отправить на согласование','send'],
   ['Ждём ответа клиента.','Версия 03 доступна клиенту. Пока заказ ждёт согласования, в производство его не передаём.','Клиент проверяет чертёж.','Посмотреть как клиент','client'],
   ['Проверка партии завершена.','Представим, что после согласования партию изготовили и проверили. Опубликуйте новый статус.','Отметить готовность к отгрузке.','Отметить готовность','ready'],
   ['Готовность опубликована.','Клиент видит новый статус и может согласовать получение заказа.','Договориться с клиентом об отгрузке.','Посмотреть как клиент','client']
  ]
 };
 let role='client', stage=0, opener=null, task='';
 function render(){
  const [heading,copy,next,cta,id]=views[role][stage];
  task=id;
  demo.dataset.stage=String(stage);
  demo.dataset.role=role;
  for(const b of roleButtons)b.setAttribute('aria-pressed',String(b.dataset.trackRole===role));
  for(const [i,step] of timeline.entries()){
   step.dataset.done=String(i<stage);
   if(i===stage)step.setAttribute('aria-current','step');
   else step.removeAttribute('aria-current');
  }
  pick('status').textContent=labels[stage];
  pick('heading').textContent=heading;
  pick('copy').textContent=copy;
  pick('next').textContent=next;
  pick('version').textContent=versions[stage];
  action.textContent=cta;
  reset.hidden=stage===0||id==='reset';
  reset.tabIndex=reset.hidden?-1:0;
 }
 function openDrawing(trigger){
  if(typeof dialog.showModal!=='function')return false;
  opener=trigger;
  const canApprove=role==='client'&&stage===1;
  pick('approve').hidden=!canApprove;
  pick('drawing-note').textContent=canApprove?'Демонстрационный чертёж. Согласование переведёт тестовый заказ в производство.':'Демонстрационный чертёж. Реальные документы и данные сюда не загружаются.';
  dialog.showModal();
  return true;
 }
 for(const b of roleButtons)b.addEventListener('click',()=>{role=b.dataset.trackRole;render();});
 action.addEventListener('click',()=>{
  if(task==='document'){
   if(!openDrawing(action))location.href=pick('document').href;
   return;
  }
  if(task==='send')stage=1;
  if(task==='ready')stage=3;
  if(task==='client'||task==='manager')role=task;
  if(task==='reset'){stage=0;role='client';}
  render();
 });
 reset.addEventListener('click',()=>{stage=0;role='client';render();action.focus({preventScroll:true});});
 pick('document').addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(openDrawing(event.currentTarget))event.preventDefault();
 });
 pick('approve').addEventListener('click',()=>{
  if(role!=='client'||stage!==1)return;
  stage=2;
  render();
  dialog.close();
 });
 pick('close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{opener?.focus({preventScroll:true});opener=null;});
 render();

 const deep=page.querySelector('[data-track-deep]');
 const frame=deep.querySelector('iframe');
 const loadExtended=()=>{if(deep.open&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;};
 deep.addEventListener('toggle',loadExtended);
 loadExtended();

 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const network=navigator.connection;
 const motion=page.querySelector('[data-track-motion]');
 const reels=[...page.querySelectorAll('[data-track-reel]')];
 const inView=new Set();
 let preference=null;
 const allowed=()=>preference??!(reduced.matches||network?.saveData);
 function sync(){
  const animate=allowed();
  motion.textContent=animate?'Остановить анимацию':'Включить анимацию';
  page.dataset.trackMotion=String(animate);
  for(const reel of reels){
   const play=animate&&inView.has(reel)&&!document.hidden;
   reel.autoplay=play;
   if(play){
    if(!reel.hasAttribute('src'))reel.src=reel.dataset.src;
    if(reel.paused)reel.play().catch(()=>{});
   }else if(!reel.paused)reel.pause();
  }
 }
 const observe='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting,intersectionRatio} of entries){
   if(isIntersecting&&intersectionRatio>=.18)inView.add(target);
   else inView.delete(target);
  }
  sync();
 },{threshold:.18}):null;
 for(const reel of reels){
  reel.muted=true;
  reel.addEventListener('playing',()=>reel.dataset.started='true');
  reel.addEventListener('error',()=>delete reel.dataset.started);
  if(observe)observe.observe(reel);
  else inView.add(reel);
 }
 motion.hidden=false;
 motion.addEventListener('click',()=>{preference=!allowed();sync();});
 reduced.addEventListener('change',()=>{preference=null;sync();});
 network?.addEventListener?.('change',sync);
 document.addEventListener('visibilitychange',sync);
 sync();
}
