'use strict';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;
$$('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages=[
 {label:'Чертёж',title:'Чертёж получен',badge:'Заявка принята',headline:'Получили\nваш чертёж',description:'Фиксируем параметры партии и передаём чертёж инженеру.',comment:'Получили чертёж и параметры партии. Передаём заявку инженеру.',next:'Далее — проверка инженером'},
 {label:'Инженер',title:'Проверка инженером',badge:'На проверке',headline:'Проверяем\nтехнические детали',description:'Инженер проверяет размеры, материал и возможность изготовления.',comment:'Инженер проверяет чертёж, материал и размеры детали.',next:'Далее — согласование чертежа'},
 {label:'Согласование',title:'Согласование чертежа',badge:'Нужно согласование',headline:'Проверьте\nчертёж',description:'Инженер подготовил чертёж. Подтвердите его перед запуском партии.',comment:'Чертёж готов. Проверьте размеры и комплектацию перед запуском производства.',next:'После согласования — производство'},
 {label:'Производство',title:'Изготовление',badge:'В производстве',headline:'Изготавливаем\nвашу партию',description:'Нарезаем резьбу и формируем изгиб по согласованному чертежу.',comment:'Нарезаем резьбу и формируем изгиб по согласованному чертежу.',next:'Далее — контроль качества'},
 {label:'Качество',title:'Контроль качества',badge:'Проверяем качество',headline:'Проверяем\nготовую партию',description:'Контролируем размеры, резьбу и комплектацию перед упаковкой.',comment:'Изготовление завершено. Проверяем размеры и качество деталей.',next:'Далее — упаковка и подготовка к выдаче'},
 {label:'Готовность',title:'Готов к отгрузке',badge:'Заказ готов',headline:'Всё готово\nк отгрузке',description:'Партия прошла контроль качества и упакована. Можно согласовать получение.',comment:'Партия прошла контроль качества, упакована и готова к самовывозу.',next:'Осталось согласовать получение'},
 {label:'Отгрузка',title:'Отгружен',badge:'Заказ выполнен',headline:'Заказ отгружен.\nСпасибо за доверие',description:'Партия передана заказчику. Документы и история остаются здесь.',comment:'Партия передана заказчику. Заказ выполнен.',next:'Все этапы пройдены'}
];
const initialOrder={number:'2481',company:'ООО «СтройПром»',product:'Фундаментный болт',size:'М24 × 800 мм',quantity:120,material:'Сталь 09Г2С',ready:'2026-11-12'};
const initialHistory=[
 {title:'Партия в производстве',comment:stages[3].comment,date:'6 ноября',time:'10:40',author:'Александр Волков · менеджер'},
 {title:'Чертёж согласован',comment:'Заказчик подтвердил чертёж. Партия передана в работу.',date:'4 ноября',time:'11:15',author:'ООО «СтройПром» · заказчик'},
 {title:'Чертёж отправлен на согласование',comment:'Проверили размеры и материал, подготовили версию 03.',date:'3 ноября',time:'16:05',author:'Александр Волков · менеджер'},
 {title:'Инженер начал проверку',comment:'Чертёж передан на техническую проверку.',date:'3 ноября',time:'10:00',author:'Александр Волков · менеджер'},
 {title:'Заявка получена',comment:'Создан заказ на 120 фундаментных болтов.',date:'2 ноября',time:'09:30',author:'Александр Волков · менеджер'}
];
const fresh=()=>({order:{...initialOrder},stage:3,comment:stages[3].comment,drawing:null,updated:'Сегодня, 10:40',history:initialHistory.map(x=>({...x}))});
const storageKey='apollo-track-demo-v2';
const validOrder=o=>o&&['number','company','product','size','material','ready'].every(k=>typeof o[k]==='string'&&o[k].length>0&&o[k].length<=100)&&Number.isInteger(o.quantity)&&o.quantity>0&&o.quantity<=100000&&/^\d{4}-\d{2}-\d{2}$/.test(o.ready)&&Number.isFinite(Date.parse(o.ready));
let state=fresh();
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&validOrder(saved.order)&&Number.isInteger(saved.stage)&&saved.stage>=0&&saved.stage<stages.length&&typeof saved.comment==='string'&&Array.isArray(saved.history)&&saved.history.length&&saved.history.every(h=>['title','comment','date','time','author'].every(k=>typeof h[k]==='string'))){state={...fresh(),...saved};if(state.drawing&&!validDrawing(state.drawing))state.drawing=null;}}catch{}
let selectedStage=state.stage;
let draftDrawing=state.drawing;
let activeDocument='drawing';
let dirty=false;
let toastTimer;
let drawReadVersion=0;
let readingDrawing=false;
const dateLabel=value=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}).format(new Date(value+'T12:00:00Z'));
const stamp=()=>{const now=new Date();return {date:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}).format(now),time:new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'}).format(now)};};
function validDrawing(d){return d&&typeof d.name==='string'&&typeof d.data==='string'&&/^data:(image\/(svg\+xml|png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(d.data)&&d.data.length<2900000&&['image/svg+xml','image/png','image/jpeg','application/pdf'].includes(d.type);}
function toast(message){const open=$$('dialog[open]');(open.at(-1)||document.body).append($('#toast'));$('#toast-text').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3400);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));return true;}catch{toast('Заказ обновлён. Браузер не разрешил сохранить его после закрытия.');return false;}}
function addHistory(title,comment,author='Александр Волков · менеджер',kind='status'){const now=stamp();state.history.unshift({title,comment,author,kind,...now});state.updated=`Сегодня, ${now.time}`;}
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const target=$('#celebration');$('#track-window').append(target);target.innerHTML=Array.from({length:25},(_,i)=>`<i style="left:${10+Math.random()*80}%;--dx:${Math.round(Math.random()*240-120)}px;--rot:${Math.round(Math.random()*800-400)}deg;animation-delay:${i*.018}s"></i>`).join('');setTimeout(()=>target.replaceChildren(),2400);}
function render(){
 const {order,stage,history}=state;const current=stages[stage];
 $('#client-order-title').textContent=`Заказ № ${order.number}`;
 $('#client-order-company').textContent=order.company;
 $('#client-updated').textContent=state.updated;
 $('#status-badge').innerHTML=`<i></i>${current.badge}`;
 $('#client-status').replaceChildren(...current.headline.split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));
 $('#client-description').textContent=state.comment||current.description;
 $('#status-next').textContent=current.next;
 $('#stage-fraction').textContent=`${String(stage+1).padStart(2,'0')} / 07`;
 $('.status-card').classList.toggle('complete',stage>=5);
 $('#journey').innerHTML=stages.map((step,i)=>{const type=i<stage||stage===6?'done':i===stage?'current':'future';return `<li class="${type}" aria-label="${step.title}" ${i===stage?'aria-current="step"':''}><span class="journey-node">${type==='done'?icon('check'):String(i+1).padStart(2,'0')}</span><span class="journey-label">${step.label}</span></li>`;}).join('');
 $('#client-product-name').textContent=order.product;
 $('#client-quantity').textContent=`${order.quantity.toLocaleString('ru-RU')} шт.`;
 $('#client-product-meta').textContent=`${order.size} · ${order.material}`;
 $('#client-ready').textContent=dateLabel(order.ready);
 $('#history-count').textContent=String(history.length);
 $('#drawing-status').textContent=stage>=3?'Чертёж согласован':stage===2?'Ожидает согласования':'На проверке';
 const needsAction=stage===2||stage===5;
 $('#client-action').classList.toggle('requires-action',needsAction);
 $('#client-action-button').hidden=!needsAction;
 $('#action-title').textContent=stage===2?'Подтвердите чертёж':stage===5?'Согласуйте получение':stage===6?'Заказ выполнен':'От вас ничего не требуется';
 $('#action-caption').textContent=stage===2?'Перед запуском производства':stage===5?'Партия уже на складе':stage===6?'Документы доступны в этой карточке':'Следующее обновление появится здесь';
 $('#client-action-button').innerHTML=`${stage===2?'Проверить чертёж':'Связаться'}${icon(stage===2?'arrow-up-right':'message')}`;
 renderDocuments();
 $('#history-list').innerHTML=history.map(item=>`<article class="history-row"><div class="history-time">${escapeHTML(item.date)}<span>${escapeHTML(item.time)}</span></div><span class="history-symbol">${icon(item.kind==='message'?'message':'check')}</span><div class="history-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.comment)}</p><small>${escapeHTML(item.author)}</small></div></article>`).join('');
}
const documentData=()=>[
 {id:'drawing',name:state.drawing?.name||`Чертёж · ${state.order.size}`,ext:state.drawing?state.drawing.name.split('.').at(-1).toUpperCase():'SVG',meta:state.stage>=3?'Согласован':state.stage===2?'На согласовании':'На проверке'},
 {id:'specification',name:'Спецификация партии',ext:'TXT',meta:`${state.order.quantity.toLocaleString('ru-RU')} шт. · ${state.order.material}`},
 {id:'confirmation',name:`Подтверждение заказа № ${state.order.number}`,ext:'TXT',meta:`Готовность — ${dateLabel(state.order.ready)}`}
];
function renderDocuments(){$('#document-list').innerHTML=documentData().map(doc=>`<div class="document-row"><span class="file-icon">${escapeHTML(doc.ext.slice(0,4))}</span><div class="document-info"><button data-document="${doc.id}">${escapeHTML(doc.name)}</button><p>${escapeHTML(doc.meta)}</p></div><button class="icon-button" data-download="${doc.id}" aria-label="Скачать: ${escapeHTML(doc.name)}">${icon('download')}</button></div>`).join('');}
const orderRows=()=>[['Заказ',`№ ${state.order.number}`],['Заказчик',state.order.company],['Изделие',state.order.product],['Размер',state.order.size],['Материал',state.order.material],['Количество',`${state.order.quantity.toLocaleString('ru-RU')} шт.`],['Готовность',dateLabel(state.order.ready)]];
function drawingContent(){return drawingSvg.replaceAll('ЗАКАЗ № 2481','ЗАКАЗ № '+escapeHTML(state.order.number)).replaceAll('Заказ: № 2481','Заказ: № '+escapeHTML(state.order.number)).replace('120 шт.',escapeHTML(state.order.quantity+' шт.')).replace('1. Материал: сталь 09Г2С.','1. Материал: '+escapeHTML(state.order.material)+'.').replace('Фундаментный болт М24 × 800',escapeHTML((state.order.product+' '+state.order.size).slice(0,52)));}
function showDocument(id){
 if(!['drawing','specification','confirmation'].includes(id))return;
 activeDocument=id;
 const doc=documentData().find(d=>d.id===id);
 $('#document-title').textContent=id==='drawing'?'Чертёж':doc.name;
 const container=$('#document-preview');container.replaceChildren();
 if(id==='drawing'){
   if(state.drawing){if(state.drawing.type==='application/pdf'){const block=document.createElement('div');block.className='doc-sheet';const h=document.createElement('h3');h.textContent=state.drawing.name;const p=document.createElement('p');p.textContent='PDF-документ · скачайте, чтобы посмотреть чертёж';block.append(h,p);container.append(block);}else{const img=document.createElement('img');img.src=state.drawing.data;img.alt=state.drawing.name;container.append(img);}}
   else container.innerHTML=drawingContent();
 }else{container.innerHTML=`<article class="doc-sheet"><h3>${escapeHTML(doc.name)}</h3><p>Apollo / Track</p><table><tbody>${orderRows().map(([key,value])=>`<tr><th scope="row">${escapeHTML(key)}</th><td>${escapeHTML(value)}</td></tr>`).join('')}</tbody></table></article>`;}
 $('#approve-drawing').hidden=id!=='drawing'||state.stage!==2;
 $('#document-caption').textContent=id==='drawing'?(state.stage>=3?'Чертёж согласован':state.stage===2?'Ожидает вашего согласования':'Чертёж на проверке'):`Заказ № ${state.order.number}`;
 $('#document-dialog').showModal();
}
function downloadFile(name,body,type){const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function downloadDocument(id){const code=state.order.number.replace(/[^a-z0-9_-]/gi,'_')||'order';if(id==='drawing'){if(state.drawing){const a=document.createElement('a');a.href=state.drawing.data;a.download=state.drawing.name;document.body.append(a);a.click();a.remove();}else downloadFile(`order_${code}_drawing.svg`,drawingContent(),'image/svg+xml;charset=utf-8');}else downloadFile(`order_${code}_${id}.txt`,'\uFEFF'+`${id==='specification'?'Спецификация партии':'Подтверждение заказа'}\n\n${orderRows().map(row=>row.join(': ')).join('\n')}\n\nДемонстрационный документ.\n`,'text/plain;charset=utf-8');}
$('#bolt-scene').innerHTML=boltSvg;
$('#stage-choices').insertAdjacentHTML('beforeend',stages.map((step,i)=>`<label class="stage-choice"><input type="radio" name="stage" value="${i}" ${i===state.stage?'checked':''}><span><span class="choice-number">${String(i+1).padStart(2,'0')}</span>${step.title}</span></label>`).join(''));
function setDirty(value=true){dirty=value;$('#save-state').classList.toggle('dirty',dirty);$('#save-state').innerHTML=`<i></i>${dirty?'Есть изменения':'Сохранено'}`;}
function fillManager(){for(const key of Object.keys(initialOrder))$('#field-'+key).value=String(state.order[key]);selectedStage=state.stage;$(`input[name="stage"][value="${selectedStage}"]`).checked=true;$('#field-comment').value=state.comment;draftDrawing=state.drawing;$('#drawing-filename').textContent=draftDrawing?.name||'bolt_M24_800_v03.svg';$('#field-drawing').value='';$('#file-error').hidden=true;drawReadVersion++;readingDrawing=false;setDirty(false);updateNextButton();}
function updateNextButton(){const btn=$('#next-stage');btn.disabled=selectedStage===6;btn.style.opacity=selectedStage===6?'.35':'1';}
function chooseStage(value){selectedStage=value;$(`input[name="stage"][value="${value}"]`).checked=true;$('#field-comment').value=stages[value].comment;setDirty();updateNextButton();}
function switchRole(role,focus=false){$$('[data-role]').forEach(button=>{const active=button.dataset.role===role;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();});$('#client-view').hidden=role!=='client';$('#manager-view').hidden=role!=='manager';$('#window-scroll').scrollTop=0;}
function switchPanel(name,focus=false){$$('[data-panel]').forEach(button=>{const active=button.dataset.panel===name;button.setAttribute('aria-selected',String(active));button.classList.toggle('active',active);button.tabIndex=active?0:-1;if(active&&focus)button.focus();});$$('.client-panel').forEach(panel=>panel.hidden=panel.id!==`client-${name}`);$('#window-scroll').scrollTop=0;}
function tabKeyboard(elements,current,e,activate){let index=elements.indexOf(current);if(e.key==='ArrowRight')index=(index+1)%elements.length;else if(e.key==='ArrowLeft')index=(index-1+elements.length)%elements.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=elements.length-1;else return;e.preventDefault();activate(elements[index]);}
$$('[data-role]').forEach(button=>{button.addEventListener('click',()=>switchRole(button.dataset.role));button.addEventListener('keydown',e=>tabKeyboard($$('[data-role]'),button,e,next=>switchRole(next.dataset.role,true)));});
$$('[data-panel]').forEach(button=>{button.addEventListener('click',()=>switchPanel(button.dataset.panel));button.addEventListener('keydown',e=>tabKeyboard($$('[data-panel]'),button,e,next=>switchPanel(next.dataset.panel,true)));});
$('#manager-form').addEventListener('input',e=>{if(e.target.id!=='field-drawing')setDirty();});
$$('input[name="stage"]').forEach(input=>input.addEventListener('change',()=>chooseStage(Number(input.value))));
$('#next-stage').addEventListener('click',()=>{if(selectedStage<6)chooseStage(selectedStage+1);});
$('#field-drawing').addEventListener('change',async e=>{const version=++drawReadVersion;const file=e.target.files?.[0];if(!file)return;const ext=file.name.split('.').at(-1).toLowerCase();const types={svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',pdf:'application/pdf'};const error=$('#file-error');error.hidden=true;if(!types[ext]||file.size>2*1024*1024||!file.size){error.textContent='Выберите SVG, PNG, JPG или PDF до 2 МБ';error.hidden=false;e.target.value='';return;}readingDrawing=true;try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('read_failed'));reader.readAsDataURL(new Blob([file],{type:types[ext]}));});if(version!==drawReadVersion)return;draftDrawing={name:file.name,type:types[ext],data};$('#drawing-filename').textContent=file.name;setDirty();}catch{if(version===drawReadVersion){error.textContent='Не удалось прочитать файл. Выберите его ещё раз.';error.hidden=false;}}finally{if(version===drawReadVersion)readingDrawing=false;}});
$('#manager-form').addEventListener('submit',e=>{e.preventDefault();if(readingDrawing){toast('Дождитесь загрузки чертежа');return;}const form=e.currentTarget;const data=new FormData(form);const order={};for(const key of Object.keys(initialOrder))order[key]=key==='quantity'?Number(data.get(key)):String(data.get(key)||'').trim();if(!validOrder(order)){toast('Проверьте параметры заказа');return;}const comment=String(data.get('comment')||'').trim()||stages[selectedStage].description;const oldStage=state.stage;state.order=order;state.stage=selectedStage;state.comment=comment;state.drawing=draftDrawing;addHistory(oldStage!==state.stage?stages[state.stage].title:'Заказ обновлён',comment);const saved=persist();render();setDirty(false);if(e.submitter?.value==='preview'){switchPanel('order');switchRole('client',true);if(oldStage<5&&state.stage>=5)celebrate();}if(saved)toast(e.submitter?.value==='preview'?'Так заказ выглядит у клиента':'Заказ сохранён');});
$('#client-action-button').addEventListener('click',()=>state.stage===2?showDocument('drawing'):$('#message-dialog').showModal());
$('#approve-drawing').addEventListener('click',()=>{if(state.stage!==2)return;state.stage=3;state.comment='Чертёж согласован. Готовим материал и запускаем партию в производство.';addHistory('Чертёж согласован',state.comment,`${state.order.company} · заказчик`);const saved=persist();render();if(!dirty)fillManager();$('#document-dialog').close();if(saved)toast('Чертёж согласован. Партия передана в работу.');});
$('#ask-manager').addEventListener('click',()=>$('#message-dialog').showModal());
$('#message-form').addEventListener('submit',e=>{e.preventDefault();const field=$('#message-text');const message=field.value.trim();if(!message){field.setCustomValidity('Введите вопрос');field.reportValidity();return;}addHistory('Вопрос заказчика',message,`${state.order.company} · заказчик`,'message');const saved=persist();render();$('#message-dialog').close();$('#message-form').reset();if(saved)toast('Вопрос добавлен в историю демо');});
$('#message-text').addEventListener('input',e=>e.target.setCustomValidity(''));
$('#download-document').addEventListener('click',()=>downloadDocument(activeDocument));
$('#export-history').addEventListener('click',()=>downloadFile('apollo_order_history.txt','\uFEFF'+`История заказа № ${state.order.number}\n\n`+state.history.map(item=>`${item.date}, ${item.time}\n${item.title}\n${item.comment}\n${item.author}`).join('\n\n'),'text/plain;charset=utf-8'));
document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return;}const doc=e.target.closest('[data-document]');if(doc){showDocument(doc.dataset.document);return;}const download=e.target.closest('[data-download]');if(download)downloadDocument(download.dataset.download);});
$$('dialog').filter(d=>d.id!=='track-window').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}));
$('#reset-demo').addEventListener('click',()=>{state=fresh();persist();render();fillManager();switchPanel('order');switchRole('client');toast('Демо начато заново');});
function closeDemo(){$('#track-window').close();if(window.parent!==window){let origin='*';try{if(document.referrer)origin=new URL(document.referrer).origin;}catch{}window.parent.postMessage({type:'apollo-track:close'},origin);}}
$('#close-demo').addEventListener('click',closeDemo);
$('#track-window').addEventListener('cancel',e=>{e.preventDefault();closeDemo();});
$('#launch-demo').addEventListener('click',()=>$('#track-window').showModal());
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embedded');
render();fillManager();switchRole(new URLSearchParams(location.search).get('view')==='manager'?'manager':'client');$('#track-window').showModal();
