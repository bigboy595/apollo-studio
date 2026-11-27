import {breadcrumbs,esc,faqBlock,link} from '../render.mjs';

const asset='/assets/task/';
const chapters=[
 {id:'task-project',nav:'Проекты и задачи',tag:'ПРОЕКТЫ И ЗАКАЗЫ',title:'У заказа есть план.',copy:'В карточке видны этап, срок и ответственный. Материалы, задачи и согласования собраны здесь же. Команда открывает заказ и понимает, что уже сделано и кто берётся за следующий шаг.',caption:'Карточка заказа и список задач',alt:'Проект «Опытная партия крепежа» в Apollo Task: этапы работы, задачи и материалы.'},
 {id:'task-proposal',nav:'Коммерческие предложения',tag:'КОММЕРЧЕСКИЕ ПРЕДЛОЖЕНИЯ',title:'Из расчёта — в предложение.',copy:'Укажите клиента, состав поставки и условия. Конструктор рассчитает итог по позициям и покажет, каких данных не хватает. После проверки КП можно выгрузить в Word или сохранить в PDF.',caption:'Конструктор коммерческого предложения',alt:'Конструктор КП в Apollo Task: изменение количества, пересчёт суммы и предпросмотр.'},
 {id:'task-review',nav:'Согласования',tag:'ВНУТРЕННЕЕ СОГЛАСОВАНИЕ',title:'У версии есть решение.',copy:'Отправьте конкретную версию на проверку. Назначенный сотрудник согласует её или вернёт с правками. Решение и комментарий останутся в истории.',caption:'Запрос, решение и история',alt:'Запрос на согласование коммерческого предложения, форма решения и результат в истории Apollo Task.'}
];
const demoSteps=['Взять задачу','Передать КП','Согласовать','Завершить'];
function reel(stem,alt,hero=false){
 return `<div class="at-reel">
  <img src="${asset+stem}-glide.webp" width="1280" height="720" ${hero?'fetchpriority="high"':'loading="lazy"'} alt="${esc(alt)}">
  <video data-task-reel data-src="${asset+stem}-glide.mp4" autoplay muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" width="1280" height="720"></video>
 </div>`;
}
function chapter(scene){
 return `<article class="at-chapter" id="${scene.id}"><div class="at-wrap at-chapter-grid">
  <div class="at-chapter-copy"><p class="at-kicker">${scene.tag}</p><h3>${scene.title}</h3><p>${scene.copy}</p></div>
  <figure><figcaption><strong>Apollo / Task</strong><span>${scene.caption}</span></figcaption>${reel(scene.id,scene.alt)}</figure>
 </div></article>`;
}
function demo(){
 return `<section class="at-demo" id="demo" aria-labelledby="at-demo-title">
  <div class="at-wrap">
   <div class="at-demo-intro"><div><p class="at-kicker">ИНТЕРАКТИВНЫЙ ПРИМЕР</p><h2 id="at-demo-title">Одно КП.<br>От задачи до решения.</h2></div><p>Тестовый заказ на 120 комплектов крепежа. Попробуйте передать предложение на проверку и закрыть задачу после согласования.</p></div>
   <div class="at-demo-box" data-task-showcase-demo>
    <div class="at-demo-head"><span>Apollo / Task</span><strong>Опытная партия крепежа</strong><span>Заказ AP–024</span></div>
    <ol class="at-steps" aria-label="Шаги примера">${demoSteps.map((s,i)=>`<li data-task-step="${i}"${i===0?' aria-current="step"':''}><span>${i+1}</span>${s}</li>`).join('')}</ol>
    <div class="at-demo-main">
     <div class="at-demo-copy" aria-live="polite"><p class="at-demo-role" data-task-demo-role>Сотрудник</p><h3 data-task-demo-title>Задача на КП</h3><p data-task-demo-copy>Заказчик прислал требования. Возьмите задачу, чтобы подготовить предложение для опытной партии.</p></div>
     <div class="at-records" aria-label="Состояние материалов" role="group">
      <div><span>Задача</span><strong>Подготовить КП</strong><span class="at-badge" data-task-demo-task>К выполнению</span></div>
      <div><span>Документ</span><strong>КП · Опытная партия</strong><span class="at-badge" data-task-demo-doc>Черновик</span></div>
     </div>
    </div>
    <div class="at-demo-actions"><button type="button" class="at-start" data-task-demo-action>Взять в работу</button><button type="button" class="at-reset" data-task-demo-reset hidden>Начать заново</button></div>
    <noscript><p class="at-demo-note">Включите JavaScript, чтобы пройти пример.</p></noscript>
   </div>
   <p class="at-demo-note">Вымышленный заказ. Действия в примере не меняют данные в рабочем приложении.</p>
  </div>
 </section>`;
}
export function taskShowcase(p){
 const brief='/contacts/?product='+encodeURIComponent(p.name)+'#brief';
 return `<div class="at-page">
  <section class="at-hero" aria-labelledby="at-title"><div class="at-wrap">
   ${breadcrumbs(p.name,[['/solutions/','Цифровые решения']])}
   <div class="at-hero-copy">
    <p class="at-mark"><img src="/assets/apollo-symbol.svg" width="24" height="24" alt=""> Apollo Task</p>
    <h1 id="at-title">Проекты. Задачи.<br><span>Документы.</span></h1>
    <p>Рабочее пространство для команды: ведите заказы, собирайте коммерческие предложения и согласовывайте документы.</p>
    <a class="at-start" href="#demo">Попробовать на заказе</a>
   </div>
   <figure class="at-hero-art">
    ${reel('task-hero','Рабочий интерфейс Apollo Task: обзор компании, список заказов и карточка проекта.',true)}
    <figcaption><span>Запись интерфейса Apollo Task · тестовый заказ</span><button type="button" data-task-motion hidden>Остановить анимацию</button></figcaption>
   </figure>
  </div></section>
  ${demo()}
  <section class="at-stories" aria-labelledby="at-stories-title">
   <div class="at-wrap at-section-head"><p class="at-kicker">В РАБОЧЕМ ИНТЕРФЕЙСЕ</p><h2 id="at-stories-title">Один заказ. Три сцены.</h2><p>Записали реальные действия в приложении на тестовом заказе.</p>
    <nav class="at-scene-links" aria-label="Сцены Apollo Task">${chapters.map(s=>`<a href="#${s.id}">${s.nav}</a>`).join('')}</nav>
   </div>
   ${chapters.map(chapter).join('')}
  </section>
  <section class="at-contact at-wrap" id="faq" aria-labelledby="at-contact-title">
   <div><p class="at-kicker">APOLLO TASK ДЛЯ БИЗНЕСА</p><h2 id="at-contact-title">Начните с одного процесса.</h2><p>Разберём типовой заказ: кто берёт задачи, какие документы готовит и кто принимает решение. По нему подберём настройку рабочего пространства.</p><div class="at-actions">${link(brief,'Обсудить Apollo Task','button')}${link('/solutions/','Другие продукты Apollo')}</div></div>
   <div>${faqBlock(p.faq)}</div>
  </section>
  <script type="module" src="/task-showcase.js?v=1"></script>
 </div>`;
}
