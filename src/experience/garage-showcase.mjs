import {breadcrumbs,esc,faqBlock,link} from '../render.mjs';

const root='/assets/garage/';
const chapters=[
 {id:'map',no:'01',tag:'КАБИНЕТ ВЛАДЕЛЬЦА',title:['Замечание','рядом с деталью.'],description:'После ТО владелец открывает визит и находит рекомендацию на схеме. По отметке понятно, о какой детали говорил мастер и что именно нужно проверить.',meta:'От карты до истории',video:'garage-map-interface.mp4',poster:'garage-map-interface.webp',alt:'Кабинет владельца: задняя ось Camry и рекомендация проверить втулки стабилизатора.'},
 {id:'staff',no:'02',tag:'РАБОЧЕЕ МЕСТО МАСТЕРА',title:['Мастер','оставляет запись.'],description:'Мастер выбирает узел, отмечает деталь и описывает, что проверить при следующем обслуживании. В кабинете клиента появляется та же запись.',meta:'От мастера к владельцу',video:'garage-staff-interface.mp4',poster:'garage-staff-interface.webp',alt:'Мастер в Garage указывает узел, деталь и сторону, добавляет комментарий и сохраняет запись.'},
 {id:'history',no:'03',tag:'СЕРВИСНАЯ ИСТОРИЯ',title:['Что сделали.','Что дальше.'],description:'Выполненные работы сохранены с датой и пробегом. К следующему ТО клиент может вернуться к рекомендациям прошлого визита и заранее обсудить их с сервисом.',meta:'История и следующее ТО',video:'garage-history-interface.mp4',poster:'garage-history-interface.webp',alt:'Выполненные работы и запланированное обслуживание в кабинете владельца.'}
];
const parts=[
 {id:'rear',label:'Втулки стабилизатора',location:'Задняя подвеска · справа',note:'На осмотре мастер отметил износ втулки.',next:'Проверить состояние втулок и люфт стабилизатора при следующем ТО.',x:22.5,y:67},
 {id:'front',label:'Передние колодки',location:'Тормоза · передняя ось',note:'Мастер заметил износ колодок при осмотре. В этом визите их не меняли.',next:'На следующем ТО измерить остаточную толщину колодок и решить с мастером, нужна ли замена.',x:77,y:68}
];

function loop({video,poster,alt='',width=1280,height=720},hero=false){
 return `<div class="gm-loop" data-gs-stage>
  <img src="${root+poster}" alt="${esc(alt)}" width="${width}" height="${height}" ${hero?'fetchpriority="high"':'loading="lazy"'}>
  <video data-gs-loop data-src="${root+video}" muted playsinline autoplay loop preload="none" aria-hidden="true" tabindex="-1" width="1280" height="720"></video>
 </div>`;
}

function chapter(c){
 return `<article class="gm-chapter gm-chapter-${c.id}" id="garage-${c.id}">
  <div class="gm-shell gm-chapter-grid">
   <div class="gm-chapter-copy"><p class="gm-eyebrow"><span>${c.no}</span> / ${c.tag}</p><h3>${c.title.map(esc).join('<br>')}</h3><p>${c.description}</p></div>
   <figure class="gm-frame">
    <figcaption class="gm-frame-top"><b>Apollo / Garage</b><span>${c.meta}</span></figcaption>
    ${loop(c)}
   </figure>
  </div>
 </article>`;
}

function map(){
 return `<section class="gm-explore" id="demo" aria-labelledby="gm-explore-heading">
 <div class="gm-shell" id="garage-explore" data-gs-explorer>
  <div class="gm-explore-head"><p class="gm-eyebrow">ПРИМЕР В КАБИНЕТЕ ВЛАДЕЛЬЦА</p><h2 id="gm-explore-heading">Визит завершён.<br>План остался.</h2><p>Владелец забрал машину из сервиса. В кабинете он видит, что уже сделали и что мастер просит проверить на следующем ТО.</p></div>
  <div class="gm-visit" role="group" aria-label="Что осталось после визита">
   <div class="gm-visit-done"><span class="gm-visit-icon" aria-hidden="true">✓</span><div><p>ТО завершено</p><strong>Масло и фильтр заменены</strong><span>Осмотр подвески и тормозов проведён.</span></div></div>
   <div class="gm-visit-next"><span class="gm-visit-icon" aria-hidden="true">2</span><div><p>На следующем ТО</p><strong>Две проверки по рекомендации мастера</strong><span>Нажмите на отметку, чтобы прочитать, что проверить.</span></div></div>
  </div>
  <div class="gm-explorer">
   <div class="gm-map-stage">
    <div class="gm-map-top"><span>КАРТА РЕКОМЕНДАЦИЙ</span><span>TOYOTA CAMRY XV70</span></div>
    <div class="gm-car"><img src="${root}sedan.webp" width="1200" height="393" alt="Toyota Camry, вид сбоку. На схеме две отметки мастера." loading="lazy">${parts.map((n,i)=>`<button type="button" class="gm-pin" style="--gm-x:${n.x}%;--gm-y:${n.y}%" data-gs-node="${n.id}" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}" aria-label="${n.label}">${i+1}</button>`).join('')}</div>
    <div class="gm-detail-switches" role="group" aria-label="Рекомендации на следующее ТО">${parts.map((n,i)=>`<button type="button" data-gs-node="${n.id}" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}"><span aria-hidden="true">${i+1}</span>${n.label}</button>`).join('')}</div>
   </div>
   <div class="gm-detail" aria-live="polite">${parts.map((n,i)=>`<div id="gs-detail-${n.id}" data-gs-detail="${n.id}"${i?' hidden':''}><p class="gm-detail-tag">Проверить на следующем ТО</p><h3>${n.label}</h3><p class="gm-location">${n.location}</p><p>${n.note}</p><p class="gm-next"><strong>Что проверить</strong>${n.next}</p></div>`).join('')}</div>
  </div>
  <p class="gm-demo-note">Демонстрационные данные одного визита.</p>
 </div></section>`;
}

export function garageShowcase(product){
 const brief='/contacts/?product='+encodeURIComponent(product.name)+'#brief';
 return `<div class="gs-page gm-page">
  <section class="gm-hero" aria-labelledby="gm-title">
   <div class="gm-shell gm-hero-inner">${breadcrumbs('Apollo Garage',[['/solutions/','Цифровые решения']])}
    <div class="gm-hero-copy"><p class="gm-brand"><img src="/assets/apollo-symbol.svg" width="24" height="24" alt=""> Apollo Garage</p>
     <h1 id="gm-title">После визита<br>всё на виду.</h1>
     <p>Что сделали в сервисе и что проверить при следующем ТО — в кабинете владельца автомобиля.</p>
     <div class="gm-hero-actions"><a href="#demo" class="gm-jump">Посмотреть пример визита</a></div>
    </div>
   </div>
   <div class="gm-hero-grid gm-shell">${loop({video:'garage-hero-interface.mp4',poster:'garage-hero-interface.webp',alt:'Кабинет владельца Camry после визита: пробег, следующее ТО и две рекомендации.'},true)}
    <div class="gm-hero-meta"><span>Запись интерфейса Garage · тестовый автомобиль</span><button type="button" data-gs-motion hidden>Остановить анимацию</button></div>
   </div>
  </section>
  ${map()}
  <section class="gm-demo" aria-labelledby="gm-demo-heading">
   <div class="gm-demo-head gm-shell"><p class="gm-eyebrow">КАК РАБОТАЕТ APOLLO GARAGE</p><h2 id="gm-demo-heading">От осмотра к следующему ТО.</h2>
    <nav class="gm-scenes" aria-label="Возможности Garage"><a href="#garage-map">01 <span>Карта</span></a><a href="#garage-staff">02 <span>Запись мастера</span></a><a href="#garage-history">03 <span>История</span></a></nav>
   </div>
   ${chapters.map(chapter).join('')}
  </section>
  <section class="gm-contact gm-shell" id="faq" aria-labelledby="gm-contact-heading">
   <div><p class="gm-eyebrow">APOLLO GARAGE ДЛЯ АВТОСЕРВИСА</p><h2 id="gm-contact-heading">Начните с одного визита.</h2><p>Выберем тип обслуживания и согласуем, что получает владелец после выдачи автомобиля.</p>
    <div class="gm-actions">${link(brief,'Обсудить Garage','button')}${link('/solutions/','Другие продукты Apollo')}</div>
   </div>
   <div>${faqBlock(product.faq)}<p class="gm-disclosure">Ролики показывают реальные действия в Apollo Garage. Данные автомобиля и визитов тестовые.</p></div>
  </section>
  <script type="module" src="/garage-showcase.js?v=5"></script>
 </div>`;
}
