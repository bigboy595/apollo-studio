const safe = value => String(value).replace(/[&<>"']/g, c => ({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const chip=(text, tone='')=>`<span class="lab-chip ${tone}">${safe(text)}</span>`;
const action=(label,key,value='',cls='lab-button')=>`<button type="button" class="${cls}" data-lab-command="${key}" data-value="${value}">${label}</button>`;
const nav=(items,selected,kind,label)=>`<nav class="lab-nav" aria-label="${label}">${items.map(([id,name])=>`<button type="button" data-lab-command="${kind}" data-value="${id}" aria-pressed="${selected===id}">${name}</button>`).join('')}</nav>`;
const block=(title,body)=>`<div class="lab-tile"><p>${title}</p><strong>${body}</strong></div>`;
const header=(label,h,detail,tag='')=>`<div class="lab-view-head"><div><p class="lab-kicker">${label}</p><h3 tabindex="-1" data-view-heading>${h}</h3><p>${detail}</p></div>${tag}</div>`;
const coach=(step,labels,title,body,button='')=>`<div class="lab-coach"><div><p class="lab-kicker">${step===labels.length?'Сценарий пройден':'Знакомство с продуктом'}</p><h3>${title}</h3><p>${body}</p></div>${button}<ol aria-label="Шаги сценария">${labels.map((label,i)=>`<li ${i===step?'aria-current="step"':''} class="${i<step?'is-done':''}"><span>${i<step?'✓':i+1}</span>${label}</li>`).join('')}</ol></div>`;
const shell=(brand,guide,menu,content)=>`<div class="lab-top"><strong>Apollo <span>/ ${brand}</span></strong><div>${chip('Тестовые данные')}${action('Начать заново','reset','','lab-reset')}</div></div>${guide}${menu}<div class="lab-content">${content}</div>`;

const nodes={
 rear:{label:'Задняя подвеска',x:24,y:68,text:'Лёгкий стук на неровностях. Проверить втулки стабилизатора при следующем визите.'},
 front:{label:'Передние тормоза',x:75,y:68,text:'Осмотреть колодки и диски при следующем ТО.'},
 motor:{label:'Двигатель',x:84,y:49,text:'Проверить уровень масла перед дальней поездкой.'},
 interior:{label:'Салон',x:53,y:42,text:'Проверить состояние салонного фильтра при следующем ТО.'}
};
const order=['rear','front','motor','interior'];
const visits=[
 {date:'19 ноября',service:'Плановое ТО',km:'86 420 км',items:['Заменили моторное масло','Заменили масляный фильтр','Провели осмотр ходовой части']},
 {date:'16 мая',service:'Сезонное обслуживание',km:'78 150 км',items:['Переобули автомобиль','Проверили давление в шинах','Осмотрели тормозные колодки']}
];
const car=`<svg class="lab-car" viewBox="0 0 600 208" aria-hidden="true">
 <defs><linearGradient id="garage-car-metal" x2="0%" y2="100%"><stop stop-color="#95c5b6" stop-opacity=".52"/><stop offset=".62" stop-color="#345c58" stop-opacity=".8"/><stop offset="1" stop-color="#163132"/></linearGradient></defs>
 <path class="lab-car-floor" d="M30 183h540m-480 8h420"/>
 <path class="lab-car-body" d="M36 137l10-25 46-16 67-10 53-44c23-20 129-23 173-5l75 46 65 11 29 20 10 32-10 14h-67a39 39 0 0 0-77 0H183a39 39 0 0 0-77 0H52z"/>
 <path class="lab-car-window" d="m183 86 43-35c16-12 56-15 82-14l-9 49zm130 0 10-49c23 0 46 3 64 12l58 36z"/>
 <path class="lab-car-detail" d="M54 118l39-6m-8-14 78-11h283l75 14 23 15M307 90l-13 68m-111-23h228m-96-36h25m-104 0h24m253 4 37 9M49 143h54m389 0h65"/>
 <circle class="lab-car-wheel" cx="145" cy="157" r="27"/><circle class="lab-car-wheel" cx="449" cy="157" r="27"/>
 <circle class="lab-car-detail" cx="145" cy="157" r="13"/><circle class="lab-car-detail" cx="449" cy="157" r="13"/>
 </svg>`;
const freshGarage=()=>({role:'owner',view:'car',node:'rear',visit:0,notes:[],seen:false});
function garageGuide(s){
 const labels=['Откройте режим мастера','Сохраните замечание','Проверьте в кабинете'];
 if(s.seen)return coach(3,labels,'Запись появилась у владельца','Сервис привязал рекомендацию к узлу. Владелец может открыть её после визита и вернуться к ней перед следующим ТО.');
 if(s.notes.length)return coach(2,labels,'Посмотрите запись глазами владельца','Вы сохранили замечание в карточке визита. Откройте кабинет владельца: та же запись уже на схеме.',action('Показать владельца →','garage-result','','lab-button lab-primary'));
 if(s.role==='staff')return coach(1,labels,'Добавьте замечание по узлу','Выберите точку на схеме. Можно отредактировать предложенный текст и сохранить запись ниже.');
 return coach(0,labels,'Что клиент увидит после визита в сервис?','Попробуйте сами: запишите рекомендацию мастера и проверьте, как она выглядит у владельца автомобиля.',action('Перейти к мастеру →','garage-role','staff','lab-button lab-primary'));
}
function garage(s){
 const staff=s.role==='staff';
 const role=nav([['owner','Владелец'],['staff','Мастер сервиса']],s.role,'garage-role','Роль в Garage');
 let inner;
 if(s.view==='history'){
  const visit=visits[s.visit];
  inner=header('Toyota Camry · Сервисная история','История обслуживания','Выберите визит и посмотрите, какие работы выполнил сервис.');
  inner+=`<div class="lab-split"><div class="lab-list">${visits.map((v,i)=>`<button type="button" class="lab-record" aria-pressed="${s.visit===i}" data-lab-command="garage-visit" data-value="${i}"><strong>${v.service}</strong><span>${v.date} · ${v.km}</span></button>`).join('')}</div><article class="lab-card"><p class="lab-kicker">${visit.date} · ${visit.km}</p><h4>${visit.service}</h4><ul class="lab-checklist">${visit.items.map(t=>`<li>${t}</li>`).join('')}</ul></article></div>`;
 }else if(s.view==='maintenance'){
  inner=header('Toyota Camry · План обслуживания','Следующее ТО','Владелец видит, к какому пробегу готовиться и что рекомендовал проверить мастер.');
  inner+=`<div class="lab-metrics">${block('Текущий пробег','86 420 км')}${block('Следующее ТО','96 420 км')}${block('До обслуживания','10 000 км')}</div><article class="lab-card lab-space"><h4>Что проверить</h4><ul class="lab-checklist"><li>Моторное масло и фильтр</li><li>Тормозные колодки</li>${s.notes.map(n=>`<li>${safe(nodes[n.node].label)}: ${safe(n.text)}</li>`).join('')}</ul></article>`;
 }else{
  const active=nodes[s.node],notes=s.notes.filter(n=>n.node===s.node);
  inner=header(staff?'Приёмка · Визит № 184':'Мой автомобиль · Визит № 184','Toyota Camry','86 420 км · Плановое ТО 19 ноября',chip(staff?'Карточка мастера':s.notes.length?'Есть новые рекомендации':'ТО выполнено','is-good'));
  inner+=`<div class="lab-split lab-garage-layout"><div class="lab-carbox"><p class="lab-kicker">Карта узлов</p><div class="lab-car-stage">${car}${order.map((id,i)=>`<button type="button" class="lab-pin" style="--px:${nodes[id].x}%;--py:${nodes[id].y}%" data-lab-command="garage-node" data-value="${id}" aria-label="${nodes[id].label}" aria-pressed="${id===s.node}">${i+1}</button>`).join('')}</div><div class="lab-node-list">${order.map((id,i)=>`<button type="button" data-lab-command="garage-node" data-value="${id}" aria-pressed="${id===s.node}"><span>${i+1}</span>${nodes[id].label}${s.notes.some(n=>n.node===id)?'<b aria-label="Есть замечание">●</b>':''}</button>`).join('')}</div></div>
  <article class="lab-card lab-node-detail"><p class="lab-kicker">${staff?'Запись для клиента':'Рекомендация мастера'}</p><h4>${active.label}</h4>${notes.map(n=>`<div class="lab-note">${chip('Добавлено в этом визите','is-good')}<p>${safe(n.text)}</p></div>`).join('')}
  ${staff?`<form data-demo-form="note"><label for="garage-demo-note">Что нужно проверить?</label><textarea id="garage-demo-note" name="note" rows="3" required maxlength="180">${safe(notes.at(-1)?.text||active.text)}</textarea><button type="button" class="lab-button lab-primary" data-lab-command="garage-save">Сохранить замечание</button></form>${s.notes.length?action('Открыть запись у владельца →','garage-result','','lab-text-button lab-inline-result'):''}`:notes.length?'':s.node==='rear'?'<div class="lab-note">'+chip('Из предыдущего визита')+'<p>Осмотрели заднюю подвеску после сезонного обслуживания. Повторить проверку при плановом ТО.</p></div>':'<p>По этому узлу пока нет замечаний. Выберите другую точку или добавьте запись в режиме мастера.</p>'}
  ${!staff?'<p class="lab-node-foot">Информация после планового ТО</p>':''}</article></div>`;
 }
 const choices=staff?[['car','Карточка визита'],['history','История работ']]:[['car','Обзор автомобиля'],['history','История работ'],['maintenance','Следующее ТО']];
 return shell('Garage',garageGuide(s),role+nav(choices,s.view,'garage-view','Разделы Garage'),inner);
}

const columns=[['todo','К выполнению'],['doing','В работе'],['done','Готово']];
const cards=[
 {id:'calc',title:'Подготовить расчёт партии',who:'Анна · Сметчик',due:'До 27 ноября',detail:'Посчитать изготовление 120 комплектов по спецификации и передать расчёт руководителю.'},
 {id:'tech',title:'Проверить допуски чертежа',who:'Олег · Инженер',due:'До 26 ноября',detail:'Сверить допуски из чертежа с требованиями проекта и отметить расхождения.'},
 {id:'brief',title:'Собрать требования клиента',who:'Ирина · Менеджер',due:'25 ноября',detail:'Согласованы объём партии и исходная спецификация.'}
];
const docs=[
 {id:'estimate',title:'Расчёт опытной партии',kind:'КОММЕРЧЕСКИЙ РАСЧЁТ',meta:'Анна · Версия 1',rows:[['Изделие','Комплект крепежа по спецификации'],['Объём','120 комплектов'],['Состав работ','Материал, изготовление, контроль качества']]},
 {id:'spec',title:'Спецификация опытной партии',kind:'ТРЕБОВАНИЯ',meta:'Ирина · Версия 2',rows:[['Объём','120 комплектов'],['Материал','Сталь по чертежу заказчика'],['Приёмка','Проверка размеров и комплектности']]},
 {id:'checklist',title:'Карта контроля качества',kind:'РАБОЧИЙ ШАБЛОН',meta:'Технический отдел',rows:[['Контроль','Проверить размеры и маркировку'],['Результат','Заполнить протокол проверки'],['Ответственный','Инженер по качеству']]}
];
const freshTask=()=>({view:'board',active:'calc',status:{calc:'todo',tech:'doing',brief:'done'},document:'estimate',review:'draft',completed:false});
const statusName=id=>columns.find(c=>c[0]===id)[1];
const reviewInfo={
 draft:['Черновик','Перед отправкой руководителю проверьте состав работ.'],
 pending:['На согласовании','Руководитель проверяет содержание перед передачей расчёта.'],
 approved:['Согласовано','Расчёт принят. Задачу на его подготовку можно закрыть.']
};
function taskGuide(s){
 const labels=['Возьмите задачу','Отправьте расчёт','Согласуйте и закройте'];
 if(s.completed)return coach(3,labels,'Проект продвинулся на один шаг','Документ согласован, задача закрыта. По доске видно, что готово, а в материалах проекта осталась актуальная версия расчёта.');
 if(s.review==='approved')return coach(2,labels,'Расчёт согласован','Вернитесь к доске и переведите задачу на подготовку расчёта в «Готово».',action('Вернуться к задаче →','task-focus','','lab-button lab-primary'));
 if(s.review==='pending')return coach(2,labels,'Примите решение по документу','Вы в роли руководителя. Откройте запрос на согласование и подтвердите расчёт.',action('К согласованию →','task-view','reviews','lab-button lab-primary'));
 if(s.status.calc!=='todo')return coach(1,labels,'В работе: расчёт опытной партии','Откройте документ из задачи, проверьте объём и состав работ, затем отправьте на согласование.',action('Открыть расчёт →','task-open','estimate','lab-button lab-primary'));
 return coach(0,labels,'От задачи до согласованного расчёта','Вы в проекте по изготовлению 120 комплектов крепежа. Возьмите задачу в работу и проведите расчёт через согласование.',action('Выбрать задачу →','task-focus','','lab-button lab-primary'));
}
function docView(doc){
 return `<p class="lab-kicker">${doc.kind} · ${doc.meta}</p><h4>${doc.title}</h4><dl class="lab-data">${doc.rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}
function task(s){
 let body;
 const menu=nav([['board','Доска задач'],['docs','Документы'],['reviews','Согласования'+(s.review==='pending'?' · 1':'')]],s.view,'task-view','Разделы Task');
 if(s.view==='board'){
  const current=cards.find(c=>c.id===s.active);
  body=header('Проекты и заказы · AP–024','Доска задач','Распределите работу по статусам. Нажмите на карточку, чтобы открыть детали.',chip('Опытная партия'));
  body+=`<div class="lab-board">${columns.map(([id,label])=>{
   const list=cards.filter(c=>s.status[c.id]===id);
   return `<div class="lab-column" data-column="${id}"><div class="lab-column-head"><strong>${label}</strong><span>${list.length}</span></div>${list.map(c=>`<button type="button" class="lab-record" aria-pressed="${c.id===s.active}" data-lab-command="task-card" data-value="${c.id}"><strong>${c.title}</strong><span>${c.who}</span></button>`).join('')||'<p class="lab-empty">Нет задач</p>'}</div>`;
  }).join('')}</div><article class="lab-card lab-active"><div><p class="lab-kicker">${current.who} · ${current.due}</p><h4>${current.title}</h4><p>${current.detail}</p>${current.id==='calc'?action('Документ: расчёт опытной партии ↗','task-open','estimate','lab-text-button'):''}</div><div class="lab-task-status"><label for="task-demo-status">Статус задачи</label><select id="task-demo-status" aria-label="Статус задачи">${columns.map(([id,label])=>`<option value="${id}"${s.status[current.id]===id?' selected':''}>${label}</option>`).join('')}</select>${current.id==='calc'&&s.status.calc==='todo'?action('Взять в работу','task-progress','','lab-button lab-primary'):current.id==='calc'&&s.review==='approved'&&s.status.calc!=='done'?action('Завершить задачу','task-finish','','lab-button lab-primary'):''}</div></article>`;
 }else if(s.view==='docs'){
  const doc=docs.find(d=>d.id===s.document);
  body=header('Проекты и заказы · AP–024','Документы проекта','Рабочие файлы и шаблоны доступны из того же проекта.');
  body+=`<div class="lab-split"><div class="lab-list">${docs.map(d=>`<button type="button" class="lab-record" aria-pressed="${s.document===d.id}" data-lab-command="task-open" data-value="${d.id}"><strong>${d.title}</strong><span>${d.meta}</span></button>`).join('')}</div><article class="lab-card">${docView(doc)}${doc.id==='estimate'?`<div class="lab-document-actions">${chip(reviewInfo[s.review][0],s.review==='approved'?'is-good':'')}${s.review==='draft'?action('Отправить на согласование','task-submit','','lab-button lab-primary'):action('К согласованию →','task-view','reviews','lab-button')}</div>`:''}</article></div>`;
 }else{
  body=header('Проекты и заказы · AP–024','Согласования','Посмотрите, что ждёт решения руководителя.');
  body+=`<article class="lab-card">${s.review==='draft'?'<h4>Пока нет запросов</h4><p>Откройте расчёт и отправьте его на согласование.</p>'+action('Открыть расчёт →','task-open','estimate'):`<div class="lab-document-actions">${chip(reviewInfo[s.review][0],s.review==='approved'?'is-good':'')}</div>${docView(docs[0])}<p>${reviewInfo[s.review][1]}</p>${s.review==='pending'?action('Согласовать расчёт','task-approve','','lab-button lab-primary'):action('К задаче →','task-focus')}</article>`}${s.review==='draft'?'</article>':''}`;
 }
 return shell('Task',taskGuide(s),menu,body);
}

const newState=kind=>kind==='garage'?freshGarage():freshTask();
const view=(kind,state)=>kind==='garage'?garage(state):task(state);
export function workspaceDemo(kind){
 return `<div class="lab-shell lab-${kind}" data-workspace-demo="${kind}"><div class="lab-live sr-only" role="status" aria-live="polite"></div><div data-demo-screen>${view(kind,newState(kind))}</div><noscript><p>Включите JavaScript, чтобы попробовать действия в демо.</p></noscript></div>`;
}

function mount(root) {
 const kind=root.dataset.workspaceDemo;
 let state=newState(kind);
 const screen=root.querySelector('[data-demo-screen]'),live=root.querySelector('.lab-live');
 function update(message='',focusSelector='',reveal=false){
  screen.innerHTML=view(kind,state);
  if(message)live.textContent=message;
  if(focusSelector){
   const next=screen.querySelector(focusSelector);
   next?.focus({preventScroll:true});
   if(reveal)next?.scrollIntoView({block:'nearest',behavior:'instant'});
  }
 }
 function shift(key,value,focus,reveal=false) {
  let note='',target=focus;
  const s=state;
  if(key==='reset'){state=newState(kind);note='Демо возвращено к начальному состоянию';target='[data-lab-command="reset"]';}
  else if(kind==='garage'){
   if(key==='garage-role'){
    s.role=value;s.view='car';
    if(value==='owner'&&s.notes.length){
     s.node=s.notes.at(-1).node;s.seen=true;
    }
    target=reveal?'[data-view-heading]':`.lab-nav [data-lab-command="garage-role"][data-value="${value}"]`;
   }
   if(key==='garage-view')s.view=value;
   if(key==='garage-visit')s.visit=Number(value);
   if(key==='garage-node'){s.node=value;note='Выбран узел: '+nodes[value].label;}
   if(key==='garage-result'){s.role='owner';s.view='car';s.node=s.notes.at(-1).node;s.seen=true;target='[data-view-heading]';reveal=true;note='В кабинете владельца показана сохранённая запись';}
  }else{
   if(key==='task-view')s.view=value;
   if(key==='task-card')s.active=value;
   if(key==='task-focus'){s.view='board';s.active='calc';target='[data-lab-command="task-card"][data-value="calc"]';}
   if(key==='task-open'){s.view='docs';s.document=value;target=`[data-lab-command="task-open"][data-value="${value}"]`;}
   if(key==='task-progress'||key==='task-status'||key==='task-finish'){
    if(key==='task-progress')s.status.calc='doing';else if(key==='task-finish')s.status.calc='done';else s.status[s.active]=value;
    s.completed=s.review==='approved'&&s.status.calc==='done';
    target='#task-demo-status';note='Статус задачи: '+statusName(s.status[s.active]);
   }
   if(key==='task-submit'){s.review='pending';s.view='reviews';target='[data-view-heading]';reveal=true;note='Расчёт отправлен на согласование';}
   if(key==='task-approve'){s.review='approved';s.completed=s.status.calc==='done';target='[data-view-heading]';note='Расчёт согласован';}
  }
  update(note,target,reveal);
 }
 root.addEventListener('click',e=>{
  const target=e.target.closest('button[data-lab-command]');
  if(!target||!root.contains(target))return;
  const {labCommand:key,value}=target.dataset;
  if(key==='garage-save'){saveNote(target.closest('form'));return;}
  const selector=`button[data-lab-command="${key}"][data-value="${value}"]`;
  shift(key,value,selector,Boolean(target.closest('.lab-coach')));
 });
 root.addEventListener('change',e=>{
  if(e.target.id==='task-demo-status')shift('task-status',e.target.value,'#task-demo-status');
 });
 function saveNote(form){
  const input=form.elements.namedItem('note'),text=input.value.trim();
  if(!text){input.setCustomValidity('Введите замечание');input.reportValidity();return;}
  state.notes=state.notes.filter(note=>note.node!==state.node);
  state.notes.push({node:state.node,text:text.slice(0,180)});state.seen=false;
  update('Замечание сохранено и доступно в кабинете владельца','.lab-inline-result',true);
 }
 root.addEventListener('submit',e=>{
  if(e.target.dataset.demoForm!=='note')return;
  e.preventDefault();saveNote(e.target);
 });
 root.addEventListener('input',e=>{
  if(e.target.id==='garage-demo-note')e.target.setCustomValidity('');
 });
}
if(typeof document!=='undefined')document.querySelectorAll('[data-workspace-demo]').forEach(mount);
