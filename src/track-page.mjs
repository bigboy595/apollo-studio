import {breadcrumbs,link,faqBlock} from './render.mjs';
export const trackFaq=[
 ['Apollo Track — это готовая CRM?','Это решение под согласованный процесс заказа: клиентский интерфейс, статусы, документы и рабочее место ответственного. Оно может дополнять CRM или учётную систему. Состав рабочей версии определяем до разработки; опубликованное окно — интерактивный прототип.'],
 ['Можно начать без интеграции с 1С или CRM?','Да. В пилоте сотрудник может обновлять заказ вручную. Сначала согласуем статусы, документы, роли и правила обновления. Необходимость автоматического обмена оцениваем после проверки этого процесса.'],
 ['Какие интеграции можно добавить?','Рассматриваем передачу заказов и статусов из учётной системы, ссылки на документы и уведомления. Возможность и стоимость зависят от версии системы, API, доступов и качества данных. Готовое подключение к любой системе не обещается.'],
 ['Как ограничивается доступ к заказам?','В рабочей версии заранее определяем способ входа, разделение ролей, хранение файлов и срок доступа. Требование приёмки — клиент не получает чужие заказы, а сотрудник меняет только разрешённые данные. Публичное демо использует тестовые данные и не является защищённым рабочим кабинетом.'],
 ['Из чего складывается стоимость?','Разово оцениваются проектирование, интерфейсы, логика, доступ и запуск. Интеграции и перенос данных считаются по отдельному составу. Хостинг, сторонние сервисы и согласованная поддержка могут быть регулярными расходами. Сумму и срок фиксируем после разбора процесса.'],
 ['Что сохраняется в технодемо?','Короткий пример сбрасывается при обновлении страницы. Расширенное демо хранит тестовый заказ в вашем браузере. Оба сценария работают на тестовых данных, без реальных уведомлений и подключения к учётной системе.']
];

const art='/assets/track/';
const brief='/contacts/?product='+encodeURIComponent('Страница заказа')+'#brief';
const phases=['Чертёж принят','На согласовании','В производстве','Готов к отгрузке'];
const marks={
 file:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
 client:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 1 1 14 0v2"/>',
 manager:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 6V4h6v2M4 12h16m-10 0v2h4v-2"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 book:'<path d="M4 6h16v14H4zM8 3v6m8-6v6M8 13h8m-8 3h5"/>',
 cycle:'<path d="M20 7a8 8 0 1 0 .4 9M20 3v5h-5"/>',
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${marks[name]}</svg>`;

function statusRail(){
 return `<ol class="tk-steps" aria-label="Этапы заказа">${phases.map((phase,i)=>`<li data-track-step="${i}"${i===0?' aria-current="step"':''}><span class="tk-step-dot"></span><span>${phase}</span></li>`).join('')}</ol>`;
}
function demo(){
 return `<section class="tk-demo" id="demo" aria-labelledby="tk-demo-heading">
  <div class="tk-wrap">
   <div class="tk-intro"><div><p class="tk-kicker">ИНТЕРАКТИВНЫЙ ПРИМЕР</p><h2 id="tk-demo-heading">Один заказ.<br>Два взгляда.</h2></div><p>Передайте чертёж на согласование как менеджер. Затем откройте его от лица клиента и посмотрите, как изменится заказ.</p></div>
   <div class="tk-console" data-track-demo>
    <header class="tk-console-head"><div><span class="tk-console-label">APOLLO / TRACK</span><p>Заказ № 2481</p></div><div class="tk-role" role="group" aria-label="Роль в примере">
     <button type="button" data-track-role="client" aria-pressed="true">${icon('client')} Клиент</button><button type="button" data-track-role="manager" aria-pressed="false">${icon('manager')} Менеджер</button>
    </div></header>
    ${statusRail()}
    <div class="tk-desk">
     <div class="tk-role-copy" aria-live="polite"><p class="tk-status" data-track-status>Чертёж принят</p><h3 data-track-heading>Чертёж у инженера.</h3><p data-track-copy>Проверяем размеры и материал партии. Когда чертёж будет готов, появится шаг согласования.</p></div>
     <div class="tk-order">
      <a class="tk-file" href="${art}order-2481.svg" data-track-document>${icon('file')}<span><b>Чертёж детали</b><small>Эскиз · демонстрационный заказ</small></span><span class="tk-file-ver" data-track-version>На проверке</span></a>
      <dl><div><dt>Деталь</dt><dd>Фундаментный болт</dd></div><div><dt>Размер</dt><dd>М24 × 800 мм</dd></div><div><dt>Партия</dt><dd>120 шт.</dd></div><div><dt>Материал</dt><dd>Сталь 09Г2С</dd></div></dl>
     </div>
    </div>
    <div class="tk-console-bottom"><div><span>Следующий шаг</span><p data-track-next>Инженер готовит чертёж для согласования.</p></div><div class="tk-console-actions"><button class="tk-btn tk-btn-solid" type="button" data-track-action>Перейти к менеджеру</button><button class="tk-reset" type="button" data-track-reset hidden>${icon('cycle')} Начать заново</button></div></div>
    <dialog class="tk-drawing" aria-labelledby="tk-drawing-title" data-track-dialog>
     <div><h3 id="tk-drawing-title">Чертёж заказа № 2481</h3><button type="button" data-track-close aria-label="Закрыть чертёж">×</button></div>
     <img src="${art}order-2481.svg" width="1000" height="660" loading="lazy" alt="Иллюстративный чертёж фундаментного болта М24 × 800, заказ № 2481.">
     <div><p data-track-drawing-note></p><button class="tk-btn tk-btn-solid" type="button" data-track-approve hidden>Согласовать чертёж</button></div>
    </dialog>
    <noscript><p class="tk-noscript">Для переключения ролей включите JavaScript.</p></noscript>
   </div>
   <p class="tk-demo-note">Тестовые данные. Действия в примере не отправляют файлы и уведомления.</p>
   <details class="tk-deep" data-track-deep><summary><span>Расширенное технодемо</span><small>Документы, комментарии и история заказа</small></summary>
     <iframe data-src="/demos/track/" title="Расширенное демо Apollo Track — заказ клиента и менеджера" loading="lazy"></iframe>
     <noscript><p><a href="/demos/track/">Открыть технодемо</a></p></noscript>
   </details>
  </div>
 </section>`;
}
function handoff(){
 return `<section class="tk-handoff" aria-labelledby="tk-handoff-heading">
  <div class="tk-wrap tk-handoff-grid">
   <div><p class="tk-kicker">ОДНО ОБНОВЛЕНИЕ</p><h2 id="tk-handoff-heading">Менеджер меняет этап.<br>Клиент видит результат.</h2><p>Для клиента важен смысл статуса: что изменилось, нужно ли согласование и чего ждать дальше. У менеджера остаётся история обновлений и документы заказа.</p></div>
   <figure class="tk-relay" aria-label="Пример передачи статуса от менеджера к клиенту"><div class="tk-relay-card"><span>${icon('manager')} Менеджер</span><b>Изготовление</b><small>Этап сохранён</small></div><div class="tk-relay-line" aria-hidden="true"><i></i></div><div class="tk-relay-card tk-relay-client"><span>${icon('client')} Клиент</span><b>Заказ в производстве</b><small>Далее — контроль качества</small></div></figure>
  </div>
 </section>`;
}
function pilot(){
 return `<section class="tk-pilot tk-wrap" id="pilot" aria-labelledby="tk-pilot-heading">
  <div class="tk-intro"><div><p class="tk-kicker">ВНЕДРЕНИЕ</p><h2 id="tk-pilot-heading">Один процесс<br>для первого запуска.</h2></div><p>Начинаем с типового заказа. Согласуем этапы, кто их обновляет и в какой момент от клиента нужно действие. На пилоте проверяем, понятнее ли стал ход заказа.</p></div>
  <div class="tk-pilot-grid">
   <article><span>${icon('book')}</span><h3>Состав пилота</h3><p>Карточка клиента, рабочее место менеджера, статусы, файлы и история обновлений. Заранее согласуем правила доступа и проверим сценарий на телефоне.</p></article>
   <article><span>${icon('cycle')}</span><h3>Интеграции</h3><p>На старте заказ можно обновлять вручную. Подключение 1С, CRM и уведомлений оцениваем отдельно после проверки источника данных и требований.</p></article>
   <article><span>${icon('file')}</span><h3>Модель стоимости</h3><p>Разработка и запуск пилота — разово. Интеграции и перенос данных оцениваем отдельно, хостинг и поддержку согласуем до запуска.</p></article>
  </div>
 </section>`;
}
export function trackPage(){
 return `<div class="tk-page">
  <section class="tk-hero" aria-labelledby="tk-title">
   <div class="tk-wrap">${breadcrumbs('Apollo Track',[['/solutions/','Цифровые решения']])}
    <div class="tk-hero-grid">
     <div class="tk-hero-copy"><p class="tk-brand"><img src="/assets/apollo-symbol.svg" width="24" height="24" alt=""> Apollo Track</p><h1 id="tk-title">Статус заказа.<br><span>В одном окне.</span></h1><p>От чертежа до отгрузки. Клиент знает, на каком этапе заказ и что будет дальше. Менеджер обновляет всё в одной карточке.</p>
      <div class="tk-hero-actions"><a class="tk-btn tk-btn-primary" href="#demo">Попробовать на заказе</a><a class="tk-btn tk-btn-quiet" href="#pilot">Что входит в пилот</a></div>
     </div>
     <figure class="tk-stage">
      <div class="tk-stage-media"><img src="${art}track-bolt-poster.webp" width="960" height="640" fetchpriority="high" alt="Стальной фундаментный болт с гайками и шайбами — деталь демонстрационного заказа."><video data-track-reel data-src="${art}track-bolt-loop.mp4" autoplay muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" width="960" height="640"></video></div>
      <figcaption class="tk-stage-meta"><span>ДЕТАЛЬ 01 / ТЕСТОВЫЙ ЗАКАЗ № 2481</span><b>М24 × 800 мм</b></figcaption>
      <div class="tk-stage-status" aria-hidden="true"><span>ЗАКАЗ № 2481</span><strong>Чертёж согласован</strong><div><i></i><i></i><i></i><i></i></div></div>
     </figure>
    </div>
    <div class="tk-hero-foot"><span>Кабинет клиента · Рабочее место менеджера</span><button type="button" data-track-motion hidden>Остановить анимацию</button></div>
   </div>
  </section>
  ${demo()}
  ${handoff()}
  ${pilot()}
  <section class="tk-contact tk-wrap" id="faq" aria-labelledby="tk-contact-heading">
   <div><p class="tk-kicker">APOLLO TRACK ДЛЯ БИЗНЕСА</p><h2 id="tk-contact-heading">Покажите, как у вас идёт заказ.</h2><p>Возьмём один типовой пример и решим, какие этапы и документы стоит показать клиенту.</p><div class="tk-contact-actions">${link(brief,'Обсудить пилот Track','button')}${link('/solutions/','Все продукты Apollo')}</div></div>
   <div>${faqBlock(trackFaq)}</div>
  </section>
  <script type="module" src="/track-showcase.js?v=1"></script>
 </div>`;
}
