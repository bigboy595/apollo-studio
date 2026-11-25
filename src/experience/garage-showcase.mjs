import {arrow,breadcrumbs,esc,faqBlock,link} from '../render.mjs';

const root='/assets/garage/';
const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const play=svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>');
const down=svg('<path d="M12 4v15m-5-5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/>');
const films=[
 {id:'owner',name:'Apollo Garage. После визита.',label:'Смотреть фильм',duration:'0:25',
  summary:'Автомобиль на карте. Отмеченная деталь. Запись мастера появляется у владельца. Выполненные работы остаются в истории, а срок ТО виден в кабинете.'},
 {id:'service',name:'От отметки мастера до записи у владельца',label:'Смотреть больше',duration:'0:11',
  summary:'В рабочем месте мастер выбирает узел, деталь и сторону. В кабинете владельца рядом со схемой детали появляется сохранённая рекомендация.'}
];
const chapters=[
 {id:'map',no:'01',tag:'КАРТА АВТОМОБИЛЯ',title:['Знать, где именно.'],description:'Замечание мастера открывается прямо на схеме. Клиент видит нужную деталь, сторону автомобиля и что предстоит проверить.',meta:'Кабинет владельца',poster:'screen-map.webp',alt:'Карта Garage: Toyota Camry и узлы автомобиля.'},
 {id:'staff',no:'02',tag:'РАБОЧЕЕ МЕСТО МАСТЕРА',title:['Запись сделана.', 'Клиент её видит.'],description:'Мастер отмечает деталь и добавляет пояснение. Та же запись появляется в кабинете владельца рядом со схемой узла.',meta:'От мастера к владельцу',poster:'screen-staff.webp',alt:'Рабочее место Garage: сохранённая рекомендация в карточке автомобиля.'},
 {id:'history',no:'03',tag:'ИСТОРИЯ И ПЛАН ТО',title:['Что было.', 'Что дальше.'],description:'Выполненные работы хранятся с датой и пробегом. До следующего ТО видно, сколько осталось километров и какая дата запланирована.',meta:'История обслуживания',poster:'screen-history.webp',alt:'История работ и оставшийся пробег до ТО в Garage.'}
];
const parts=[
 {id:'rear',label:'Подвеска',head:'Втулки стабилизатора',tag:'Рекомендация',text:'Задняя ось, справа. Проверить втулки при следующем визите.',x:22.5,y:66},
 {id:'engine',label:'Двигатель',head:'Масло и фильтр',tag:'Выполнено',text:'Замена масла и фильтра сохранена в истории с датой и пробегом.',x:84,y:43},
 {id:'front',label:'Тормоза',head:'Передние тормоза',tag:'Осмотр',text:'Колодки и диски передней оси осмотрены при последнем ТО.',x:77,y:68}
];
const src=n=>root+n;
const filmUrl=f=>src('garage-'+f.id+'-motion.mp4');
const filmPoster=f=>src('garage-'+f.id+'-motion-poster.webp');
const movieLink=(f,className='')=>`<a class="gm-watch ${className}" data-gs-film="${f.id}" href="${filmUrl(f)}"><span class="gm-play">${play}</span><span>${f.label}</span><small>${f.duration}</small></a>`;
function loop(id,poster,alt,width,height){
 return `<div class="gm-loop" data-gs-stage>
  <img src="${src(poster)}" alt="${esc(alt)}" width="${width}" height="${height}" ${id==='hero'?'fetchpriority="high"':'loading="lazy"'}>
  <video data-gs-loop muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" poster="${src(poster)}" width="720" height="406">
   <source src="${src('garage-loop-'+id+'.mp4')}" type="video/mp4">
  </video></div>`;
}
const player=f=>`<section class="gs-player-section" hidden>
 <div class="gm-player-bar"><strong>Apollo Garage</strong><p>${esc(f.name)}</p><button type="button" aria-label="Закрыть фильм" data-gs-close>×</button></div>
 <video id="gs-${f.id}-video" aria-label="${esc(f.name)}" aria-describedby="gs-${f.id}-summary" width="1152" height="648" poster="${filmPoster(f)}" controls playsinline preload="none">
  <source src="${filmUrl(f)}" type="video/mp4"><p><a href="${filmUrl(f)}">Открыть видео</a>.</p>
 </video><p class="gm-player-summary" id="gs-${f.id}-summary">${f.summary}</p>
 </section>`;
function chapter(c){
 return `<article class="gm-chapter gm-chapter-${c.id}" id="garage-${c.id}">
  <div class="gm-shell gm-chapter-grid">
   <div class="gm-chapter-copy"><p class="gm-eyebrow"><span>${c.no}</span> / ${c.tag}</p><h3>${c.title.map(esc).join('<br>')}</h3><p>${c.description}</p>${c.id==='staff'?movieLink(films[1]):''}</div>
   <figure class="gm-frame">
    <div class="gm-frame-top"><span></span><b>Apollo / Garage</b><small>${c.meta}</small></div>
    ${loop(c.id,c.poster,c.alt,1140,444)}
   </figure>
  </div>
 </article>`;
}
function map(){
 return `<section class="gm-explore" id="garage-explore" aria-labelledby="gm-explore-heading">
 <div class="gm-shell" data-gs-explorer>
  <div class="gm-explore-head"><p class="gm-eyebrow">ПОПРОБУЙТЕ КАРТУ</p><h2 id="gm-explore-heading">Найдите отметку.</h2><p>Выберите один из трёх узлов на тестовом автомобиле.</p></div>
  <div class="gm-explorer">
   <div class="gm-map-stage">
    <div class="gm-map-top"><span>АПОЛЛО / КАРТА</span><span>TOYOTA CAMRY XV70</span></div>
    <div class="gm-car"><img src="${src('sedan.webp')}" width="1200" height="393" alt="Toyota Camry, вид сбоку" loading="lazy">${parts.map((n,i)=>`<button type="button" class="gm-pin" style="--gm-x:${n.x}%;--gm-y:${n.y}%" data-gs-node="${n.id}" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}" aria-label="${n.label}">+</button>`).join('')}</div>
   </div>
   <div class="gm-detail">
    <div aria-live="polite">${parts.map((n,i)=>`<div id="gs-detail-${n.id}" data-gs-detail="${n.id}"${i?' hidden':''}><p class="gm-detail-tag">${n.tag}</p><h3>${n.head}</h3><p>${n.text}</p></div>`).join('')}</div>
    <div class="gm-detail-switches" role="group" aria-label="Узлы автомобиля">${parts.map((n,i)=>`<button type="button" data-gs-node="${n.id}" aria-controls="gs-detail-${n.id}" aria-pressed="${i===0}">${n.label}</button>`).join('')}</div>
   </div></div>
 </div></section>`;
}
export function garageShowcase(product){
 const brief='/contacts/?product='+encodeURIComponent(product.name)+'#brief';
 return `<div class="gs-page gm-page">
  <section class="gm-hero" aria-labelledby="gm-title">
   <div class="gm-shell gm-hero-inner">${breadcrumbs('Apollo Garage',[['/solutions/','Цифровые решения']])}
    <div class="gm-hero-copy"><p class="gm-brand"><img src="/assets/apollo-symbol.svg" width="24" height="24" alt=""> Apollo Garage</p>
     <h1 id="gm-title">После визита<br>всё на виду.</h1>
     <p>Сервисная история автомобиля, замечания мастера и следующее ТО в одном кабинете.</p>
     <div class="gm-hero-actions">${movieLink(films[0])}<a href="#demo" class="gm-jump">Как это работает ${down}</a></div>
    </div>
   </div>
   <div class="gm-hero-grid gm-shell">${loop('hero','garage-reveal.webp','',1600,669)}
    <div class="gm-hero-meta"><span>01 / КАБИНЕТ ВЛАДЕЛЬЦА</span><button type="button" data-gs-motion hidden>Пауза анимации</button><span>02 / РАБОЧЕЕ МЕСТО МАСТЕРА</span></div>
   </div>
  </section>
  <section id="demo" class="gm-demo" aria-labelledby="gm-demo-heading">
   <div class="gm-demo-head gm-shell"><p class="gm-eyebrow">ОДИН ВИЗИТ В СЕРВИС</p><h2 id="gm-demo-heading">Отметка. Запись. История.</h2>
    <nav class="gm-scenes" aria-label="Три сцены Garage"><a href="#garage-map">01 <span>Карта</span></a><a href="#garage-staff">02 <span>Запись</span></a><a href="#garage-history">03 <span>История</span></a></nav>
   </div>
   ${chapters.map(chapter).join('')}
  </section>
  ${map()}
  <section class="gm-contact gm-shell" id="faq" aria-labelledby="gm-contact-heading">
   <div><p class="gm-eyebrow">APOLLO GARAGE ДЛЯ АВТОСЕРВИСА</p><h2 id="gm-contact-heading">Начните с одного визита.</h2><p>Выберем тип обслуживания и согласуем, что получает владелец после выдачи автомобиля.</p>
    <div class="gm-actions">${link(brief,'Обсудить Garage','button')}${link('/solutions/','Другие продукты Apollo')}</div>
   </div>
   <div>${faqBlock(product.faq)}<p class="gm-disclosure">Ролики показывают интерфейс Garage на тестовых данных.</p></div>
  </section>
  <dialog class="gs-cinema" aria-label="Фильм Apollo Garage">${films.map(player).join('')}</dialog>
  <script type="module" src="/garage-showcase.js?v=4"></script>
 </div>`;
}
