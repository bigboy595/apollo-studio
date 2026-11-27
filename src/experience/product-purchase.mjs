import {esc} from '../render.mjs';

const options={
 track:{
  name:'Apollo Track',
  design:'Оформим кабинет клиента в вашем фирменном стиле: логотип, цвета, типографика и названия разделов.',
  functions:'Настроим этапы заказа, роли, карточки документов и правила согласования. При необходимости оценим интеграцию с CRM или 1С.',
  input:'Покажите, как сейчас проходит один типовой заказ: от приёма чертежа до отгрузки.'
 },
 garage:{
  name:'Apollo Garage',
  design:'Оформим кабинет владельца и рабочее место мастера в стиле вашего автосервиса.',
  functions:'Настроим карточку визита, категории работ, схему узлов, рекомендации к следующему ТО и доступы сотрудников.',
  input:'Покажите, какие данные и рекомендации вы выдаёте клиенту после обслуживания.'
 },
 task:{
  name:'Apollo Task',
  design:'Оформим рабочее пространство в стиле вашей компании и адаптируем шаблоны документов, включая коммерческие предложения.',
  functions:'Настроим роли, поля и статусы задач, структуру проектов и маршруты согласования документов.',
  input:'Покажите, как ваша команда ведёт один проект или согласовывает один документ.'
 }
};

export function productPurchase(slug,brief){
 const {name,design,functions,input}=options[slug];
 return `<section class="ap-buy ap-buy-${slug}" id="purchase" aria-labelledby="purchase-title">
  <div class="ap-buy-wrap">
   <div class="ap-buy-intro"><p class="ap-buy-label">ПОКУПКА И КАСТОМИЗАЦИЯ</p>
    <h2 id="purchase-title">Купить ${esc(name)}<br><span>под вашу компанию.</span></h2>
    <p>Вы можете купить продукт и адаптировать его под свой бизнес: от фирменного дизайна до функций и рабочих процессов.</p>
   </div>
   <div class="ap-buy-details">
    <article><p class="ap-buy-label">ИНТЕРФЕЙС</p><h3>Ваш фирменный стиль</h3><p>${esc(design)}</p></article>
    <article><p class="ap-buy-label">ФУНКЦИОНАЛ</p><h3>Ваш порядок работы</h3><p>${esc(functions)}</p></article>
    <article class="ap-buy-price"><p class="ap-buy-label">СТОИМОСТЬ</p><h3>Цена после консультации</h3><p>${esc(input)} После разговора подготовим оценку по согласованному объёму работ.</p><a href="${esc(brief)}" class="ap-buy-link">Узнать стоимость</a></article>
   </div>
  </div>
 </section>`;
}
