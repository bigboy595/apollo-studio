import {arrow,breadcrumbs,esc,faqBlock,link} from '../render.mjs';

const folder='/assets/garage/';
const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l12-7z" fill="currentColor"/></svg>';
const films=[
 {
  id:'owner', index:'01', label:'ВЛАДЕЛЕЦ', title:'Ваш автомобиль. В деталях.', time:'0:19',
  intro:'Отметка на карте ведёт к конкретной детали. Рядом — комментарий мастера, история работ и срок следующего ТО.',
  transcript:'На главном экране владелец видит автомобиль, пробег и ближайшее ТО. Нажатие на замечание открывает нужную деталь и комментарий. В истории можно посмотреть выполненные работы по визитам.'
 },
 {
  id:'service', index:'02', label:'АВТОСЕРВИС', title:'От осмотра до записи.', time:'0:13',
  intro:'Мастер выбирает ось, деталь и сторону. После сохранения клиент видит ту же рекомендацию у себя в кабинете.',
  transcript:'Мастер открывает карточку Toyota Camry и добавляет запись. В форме выбраны задняя ось, втулки стабилизатора и правая сторона. После сохранения запись появляется в кабинете владельца возле схемы детали.'
 }
];
const nodes=[
 {id:'rear',number:'01',label:'Подвеска',heading:'Задняя подвеска',tag:'Рекомендация',body:'Мастер отметил втулки стабилизатора справа. Владелец видит, какую деталь проверить при следующем визите.',x:23,y:69},
 {id:'engine',number:'02',label:'Двигатель',heading:'Масло и фильтр',tag:'Выполнено',body:'Замена масла и масляного фильтра есть в истории. К записи привязаны дата визита и пробег автомобиля.',x:82,y:42},
 {id:'front',number:'03',label:'Тормоза',heading:'Передние тормоза',tag:'Осмотр',body:'В записи передней оси видно, что мастер осмотрел колодки и диски. На карте легко вернуться к этому узлу.',x:75,y:69}
];

function film(f,primary=false){
 return `<article class="gs-film${primary?' gs-film-main':''}">
  <div class="gs-film-copy"><p class="gs-label">${f.index} / ${f.label} <span>${f.time}</span></p><h2 id="gs-${f.id}-heading">${f.title}</h2><p id="gs-${f.id}-description">${f.intro}</p></div>
  <div class="gs-film-media">
   <video id="gs-${f.id}-video" aria-labelledby="gs-${f.id}-heading" aria-describedby="gs-${f.id}-description" width="1152" height="648" controls playsinline preload="none" poster="${folder}garage-${f.id}-poster.webp">
    <source src="${folder}garage-${f.id}.mp4" type="video/mp4">
    <p>Браузер не воспроизводит ролик. <a href="${folder}garage-${f.id}.mp4">Открыть видеофайл</a>.</p>
   </video>
  </div>
  <details class="gs-film-transcript"><summary>Что показано в ролике</summary><p>${f.transcript}</p></details>
 </article>`;
}

function map(){
 const set=(group,pin)=>nodes.map((n,i)=>`<button type="button" data-gs-node="${n.id}" data-gs-group="${group}" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}"${pin?` class="gs-pin" style="--gs-x:${n.x}%;--gs-y:${n.y}%" aria-label="${n.label}"`:' class="gs-node"'}><span>${n.number}</span>${pin?'':esc(n.label)}</button>`).join('');
 return `<section class="gs-section wrap" id="garage-map">
  <div class="gs-section-head"><div><p class="gs-label">03 / КАРТА УЗЛОВ</p><h2>Отметки прямо<br>на автомобиле.</h2></div><p>Нажмите на одну из трёх точек и посмотрите, что клиент узнаёт об этом узле.</p></div>
  <div class="gs-explorer" data-gs-explorer>
   <div class="gs-map">
    <div class="gs-map-top"><span>GARAGE / 01</span><span>TOYOTA CAMRY XV70</span></div>
    <div class="gs-map-car"><img src="${folder}sedan.webp" width="1200" height="393" alt="Toyota Camry, вид сбоку" loading="lazy">${set('pin',true)}</div>
    <div class="gs-map-switches" role="group" aria-label="Узлы автомобиля">${set('switch',false)}</div>
   </div>
   <div class="gs-map-info" aria-live="polite">${nodes.map((n,i)=>`<div class="gs-map-detail" id="gs-detail-${n.id}" data-gs-detail="${n.id}"${i?' hidden':''}><p class="gs-label">УЗЕЛ / ${n.number}</p><h3>${n.heading}</h3><span class="gs-tag">${n.tag}</span><p>${n.body}</p></div>`).join('')}</div>
  </div>
 </section>`;
}

export function garageShowcase(product){
 const brief='/contacts/?product='+encodeURIComponent(product.name)+'#brief';
 return `<div class="gs-page">
 <section class="gs-hero">
  <img class="gs-hero-image" src="${folder}studio.webp" width="1440" height="960" alt="" fetchpriority="high">
  <div class="gs-hero-wash" aria-hidden="true"></div><div class="gs-hero-grid" aria-hidden="true"></div>
  <div class="wrap gs-hero-inner">
   ${breadcrumbs('Apollo Garage',[['/solutions/','Цифровые решения']])}
   <div class="gs-hero-copy">
    <p class="gs-label"><span class="gs-signal"></span> APOLLO / GARAGE</p>
    <h1>Вся история<br>автомобиля.<br><span>В одном кабинете.</span></h1>
    <p>Что сделали в сервисе, где мастер оставил замечание и когда пора на следующее ТО.</p>
    <div class="gs-actions"><a class="gs-play" href="#demo" data-gs-play>${play}<span>Смотреть ролик</span><small>0:19</small></a><a class="gs-anchor" href="#garage-map">Проверить карту ${arrow}</a></div>
   </div>
   <div class="gs-hero-foot"><span>01 / КАБИНЕТ ВЛАДЕЛЬЦА</span><span>02 / РАБОЧЕЕ МЕСТО МАСТЕРА</span></div>
  </div>
 </section>
 <section class="gs-section gs-films wrap" id="demo" aria-label="Ролики о Garage">
  ${film(films[0],true)}
  ${film(films[1])}
  <p class="gs-footnote">Ролики сняты в интерфейсе Garage на тестовом автомобиле.</p>
 </section>
 ${map()}
 <section class="gs-section wrap" id="faq">
  <div class="gs-section-head"><div><p class="gs-label">04 / ПЕРВЫЙ ЗАПУСК</p><h2>Garage для<br>вашего сервиса.</h2></div><p>Можно начать с одного типа визита: согласовать, что заполняет мастер и что получает владелец после обслуживания.</p></div>
  ${faqBlock(product.faq)}
  <div class="gs-actions gs-end">${link(brief,'Обсудить Garage','button')}${link('/solutions/','Все продукты Apollo')}</div>
 </section>
 <script type="module" src="/garage-showcase.js"></script></div>`;
}
