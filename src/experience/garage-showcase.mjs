import {arrow,breadcrumbs,esc,faqBlock,link} from '../render.mjs';

const folder='/assets/garage/';
const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const scenes=[
 {id:'map',label:'Карта узлов',brief:'Нажмите на узел, чтобы найти запись мастера.',image:'screen-map.webp',alt:'Карта Toyota Camry с точками узлов и списком систем автомобиля.',w:1140,h:444,headline:'Замечание видно на машине.',text:'Отметка ведёт к детали и объяснению мастера: что проверить и с какой стороны.'},
 {id:'history',label:'История и ТО',brief:'Откройте выполненные работы и срок следующего ТО.',image:'screen-history.webp',alt:'История выполненных работ с датами визита и карточкой следующего ТО.',w:1140,h:444,headline:'Всё, что было. И что дальше.',text:'У работ есть дата и пробег. Ближайшее ТО видно по дате и оставшимся километрам.'},
 {id:'staff',label:'Работа мастера',brief:'Посмотрите, как рекомендация попадает в кабинет.',image:'screen-staff.webp',alt:'Карточка автомобиля в Garage с новой сохранённой рекомендацией.',w:1140,h:444,headline:'Одна запись для обеих сторон.',text:'Мастер выбирает узел, деталь и сторону. Владелец получает эту же запись в кабинете.'}
];
const parts=[
 {id:'rear',label:'Подвеска',head:'Втулки стабилизатора',tag:'Рекомендация',text:'Задняя ось, справа. Проверить втулки при следующем визите.',x:22.5,y:66},
 {id:'engine',label:'Двигатель',head:'Масло и фильтр',tag:'Выполнено',text:'Замена масла и фильтра сохранена в истории с датой и пробегом.',x:84,y:45},
 {id:'front',label:'Тормоза',head:'Передние тормоза',tag:'Осмотр',text:'Колодки и диски передней оси осмотрены при последнем ТО.',x:77,y:68}
];
const films={
 main:{id:'owner',title:'Apollo Garage. У машины есть память.',label:'Смотреть фильм',duration:'0:22'},
 service:{id:'service',title:'Как замечание доходит до владельца',label:'Смотреть сцену',duration:'0:12'}
};
const asset=name=>folder+name;
const videoSrc=f=>asset('garage-'+f.id+'-film.mp4');
const poster=f=>asset('garage-'+f.id+'-film-poster.webp');
function playLink(f,variant=''){
 return `<a class="gs-watch ${variant}" href="${videoSrc(f)}" data-gs-film="${f.id}"><span class="gs-watch-icon">${play}</span><span>${f.label}</span><small>${f.duration}</small></a>`;
}
function player(f){
 return `<section class="gs-player-section">
 <div class="gs-player-chrome"><p class="gs-kicker">APOLLO GARAGE</p><p>${f.title}</p><button type="button" aria-label="Закрыть фильм" data-gs-close>×</button></div>
 <video id="gs-${f.id}-video" aria-label="${esc(f.title)}" width="1152" height="648" poster="${poster(f)}" controls playsinline preload="none">
  <source src="${videoSrc(f)}" type="video/mp4"><p><a href="${videoSrc(f)}">Открыть видео</a>.</p>
 </video></section>`;
}
function features(){
 return `<section class="gs-feature gs-shell" id="demo" aria-labelledby="gs-feature-title" data-gs-tabs>
  <div class="gs-feature-head"><p class="gs-kicker">ПРОДУКТ КРУПНЫМ ПЛАНОМ</p><h2 id="gs-feature-title">Ближе к каждой детали.</h2><p>Посмотрите три экрана Garage.</p></div>
  <div class="gs-tabs" role="tablist" aria-label="Возможности Garage">${scenes.map((s,i)=>`<button type="button" role="tab" id="gs-tab-${s.id}" aria-controls="gs-panel-${s.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${s.label}</button>`).join('')}</div>
  ${scenes.map((s,i)=>`<div class="gs-panel" role="tabpanel" id="gs-panel-${s.id}" aria-labelledby="gs-tab-${s.id}" tabindex="0"${i?' hidden':''}>
   <figure><div class="gs-window"><div class="gs-window-bar"><span></span><b>Apollo / Garage</b><small>ДЕМО</small></div><img src="${asset(s.image)}" width="${s.w}" height="${s.h}" alt="${s.alt}" loading="lazy"></div><figcaption><strong>${s.headline}</strong> ${s.text}</figcaption></figure>
  </div>`).join('')}
 </section>`;
}
function map(){
 return `<section class="gs-map-section" id="garage-map" aria-labelledby="gs-map-title">
  <div class="gs-shell gs-map-inner" data-gs-explorer>
   <div class="gs-map-head"><p class="gs-kicker">ПОПРОБУЙТЕ КАРТУ</p><h2 id="gs-map-title">Где именно?</h2><p>Выберите точку на автомобиле.</p></div>
   <div class="gs-map-visual"><div class="gs-map-car"><img src="${asset('sedan.webp')}" width="1200" height="393" alt="Toyota Camry, вид сбоку" loading="lazy">${parts.map((n,i)=>`<button type="button" class="gs-pin" style="--gs-x:${n.x}%;--gs-y:${n.y}%" data-gs-node="${n.id}" data-gs-group="pin" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}" aria-label="${n.label}"><span>+</span></button>`).join('')}</div></div>
   <div class="gs-map-info">
    <div aria-live="polite">${parts.map((n,i)=>`<div id="gs-detail-${n.id}" data-gs-detail="${n.id}"${i?' hidden':''}><p class="gs-detail-tag">${n.tag}</p><h3>${n.head}</h3><p>${n.text}</p></div>`).join('')}</div>
    <div class="gs-map-list" role="group" aria-label="Узлы автомобиля">${parts.map((n,i)=>`<button type="button" data-gs-node="${n.id}" data-gs-group="list" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}">${n.label}</button>`).join('')}</div>
   </div>
  </div>
 </section>`;
}
export function garageShowcase(product){
 const brief='/contacts/?product='+encodeURIComponent(product.name)+'#brief';
 return `<div class="gs-page">
 <section class="gs-opening" aria-labelledby="gs-heading">
  <div class="gs-opening-inner gs-shell">
   ${breadcrumbs('Apollo Garage',[['/solutions/','Цифровые решения']])}
   <div class="gs-hero-copy">
    <p class="gs-brandline"><img src="/assets/apollo-symbol.svg" width="22" height="22" alt=""> Apollo Garage</p>
    <h1 id="gs-heading">У машины<br>есть память.</h1>
    <p class="gs-hero-sub">Что сделали. Что заметил мастер. Когда пора на ТО.</p>
    ${playLink(films.main,'gs-watch-main')}
   </div>
  </div>
  <div class="gs-packshot" aria-hidden="true"><img src="${asset('garage-reveal.webp')}" width="1600" height="669" alt="" fetchpriority="high"></div>
  <div class="gs-opening-index gs-shell"><span>КАБИНЕТ АВТОВЛАДЕЛЬЦА</span><span>РАБОЧЕЕ МЕСТО АВТОСЕРВИСА</span></div>
 </section>
 ${features()}
 <section class="gs-story" id="garage-service" aria-labelledby="gs-story-title"><div class="gs-shell gs-story-inner">
  <div class="gs-story-copy"><p class="gs-kicker">ПОСЛЕ ВИЗИТА</p><h2 id="gs-story-title">Из рук мастера.<br>В руки владельца.</h2><p>Мастер завершает осмотр и оставляет замечание. Клиент видит, к какой детали оно относится, даже спустя недели после визита.</p>${playLink(films.service)}</div>
  <a class="gs-story-media" href="${videoSrc(films.service)}" data-gs-film="service" aria-label="Смотреть, как замечание доходит до владельца"><img src="${poster(films.service)}" width="1152" height="648" loading="lazy" alt=""><span>${play}</span></a>
 </div></section>
 ${map()}
 <section class="gs-contact gs-shell" id="faq">
  <div class="gs-contact-copy"><p class="gs-kicker">APOLLO GARAGE ДЛЯ АВТОСЕРВИСА</p><h2>Начните с одного визита.</h2><p>Выберем тип обслуживания. Согласуем, что заполняет мастер и что получает владелец после выдачи автомобиля.</p><div class="gs-contact-actions">${link(brief,'Обсудить Garage','button')}${link('/solutions/','Другие продукты Apollo')}</div></div>
  ${faqBlock(product.faq)}
  <p class="gs-disclosure">В фильмах показан интерфейс Garage на тестовых данных.</p>
 </section>
 <dialog class="gs-cinema" aria-label="Фильм Apollo Garage">${player(films.main)}${player(films.service)}</dialog>
 <script type="module" src="/garage-showcase.js?v=3"></script></div>`;
}
