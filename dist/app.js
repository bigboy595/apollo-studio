import {composeBrief,mailHref} from './brief.js';
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
document.documentElement.classList.add('js-enabled');
const dataNode=$('#site-data'),data=dataNode?JSON.parse(dataNode.textContent):{};
const menu=$('#nav-dialog'),trigger=$('.menu-trigger');
let menuOpener;
const syncScroll=()=>document.body.classList.toggle('modal-open',$$('dialog').some(d=>d.open));
if(menu&&trigger&&typeof menu.showModal==='function'){
 trigger.setAttribute('aria-expanded','false');
 trigger.addEventListener('click',()=>{menuOpener=trigger;menu.showModal();trigger.setAttribute('aria-expanded','true');syncScroll();$('.menu-close').focus();});
 $('.menu-close').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');syncScroll();menuOpener?.focus();});
 menu.addEventListener('click',e=>{if(e.target.closest('a'))menu.close();});
}
const lightbox=$('.lightbox'),body=$('.lightbox-body'),zoom=$('#zoom-toggle');
let imageOpener;
const resetZoom=()=>{if(!body||!zoom)return;body.classList.remove('is-zoomed');zoom.setAttribute('aria-pressed','false');zoom.textContent='Крупнее';body.scrollTop=0;body.scrollLeft=0;};
if(lightbox&&typeof lightbox.showModal==='function'){
 $$('.zoom-link').forEach(a=>a.addEventListener('click',e=>{
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();imageOpener=a;const image=$('#lightbox-image');
  image.src=a.href;image.alt=a.dataset.caption||'Снимок сайта';$('#lightbox-title').textContent=a.dataset.caption||'Просмотр проекта';
  resetZoom();lightbox.showModal();syncScroll();$('.lightbox-close').focus();
 }));
 $('.lightbox-close').addEventListener('click',()=>lightbox.close());
 lightbox.addEventListener('click',e=>{if(e.target!==lightbox)return;const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();});
 lightbox.addEventListener('close',()=>{resetZoom();syncScroll();imageOpener?.focus();});
 zoom.addEventListener('click',()=>{const active=body.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(active));zoom.textContent=active?'По ширине':'Крупнее';});
}
const filters=$$('[data-filter]'),cards=$$('[data-category]');
filters.forEach(button=>button.addEventListener('click',()=>{
 const chosen=button.dataset.filter;let visible=0;
 filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 cards.forEach(card=>{card.hidden=chosen!=='all'&&card.dataset.category!==chosen;if(!card.hidden){visible++;card.classList.add('is-visible');}});
 if($('#filter-result'))$('#filter-result').textContent='Показано проектов: '+visible;
}));
$$('.faq-list details').forEach(d=>{const s=d.querySelector('summary');s.setAttribute('aria-expanded',String(d.open));d.addEventListener('toggle',()=>s.setAttribute('aria-expanded',String(d.open)));});
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window&&!reduced.matches){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);}}),{threshold:0,rootMargin:'0px 0px -20px 0px'});
 $$('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight+30){el.classList.add('js-reveal');io.observe(el);}});
 reduced.addEventListener('change',e=>{if(e.matches){$$('.js-reveal').forEach(el=>el.classList.add('is-visible'));io.disconnect();}});
}
const progress=$('.reading-progress');let tick=false;
const updateProgress=()=>{const length=document.documentElement.scrollHeight-innerHeight;progress?.style.setProperty('transform','scaleX('+(length>0?Math.min(1,Math.max(0,scrollY/length)):0)+')');tick=false;};
addEventListener('scroll',()=>{if(!tick){requestAnimationFrame(updateProgress);tick=true;}},{passive:true});
addEventListener('resize',updateProgress);updateProgress();
if('IntersectionObserver' in window){
 const asideLinks=$$('.process-aside nav a,.article-toc nav a');
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){asideLinks.forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}),{rootMargin:'-15% 0px -65% 0px'});
 $$('article.stage,.article-body section').forEach(el=>observer.observe(el));
}
const form=$('#brief-form');
if(form){
 $('#brief-fields').disabled=false;
 const service=$('#brief-service'),allowed=Object.fromEntries([...service.options].filter(o=>o.value).map(o=>[o.value,o.textContent]));
 const selected=new URLSearchParams(location.search).get('service');if(selected in allowed)service.value=selected;
 const result=$('.brief-result'),output=$('#brief-output'),mail=$('#brief-mail'),status=$('#brief-status');let subject='Проект для Apollo';
 const refreshMail=()=>{const href=mailHref('manager@apollo.su',subject,output.value);mail.href=href;status.textContent=href.length>1900?'Текст готов. Для длинного сообщения удобнее скопировать его и вставить в почту или Telegram.':'Сообщение ещё не отправлено.';};
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form).entries());const message=composeBrief(values,allowed);subject=message.subject;output.value=message.body;result.hidden=false;refreshMail();output.focus();result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});});
 output.addEventListener('input',refreshMail);
 $('#brief-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Текст скопирован. Вставьте его в почту или Telegram и отправьте, когда будете готовы.';}catch{output.focus();output.select();status.textContent='Выделили текст. Нажмите Ctrl+C или скопируйте его через меню устройства.';}});
}
if(data.metrikaId&&/^\d+$/.test(String(data.metrikaId))){
 window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=Date.now();
 const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js';document.head.appendChild(script);
 window.ym(data.metrikaId,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});
 $$('a[href^="https://t.me/"],a[href^="mailto:"],a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>window.ym(data.metrikaId,'reachGoal',a.href.startsWith('mailto:')?'email_click':a.href.startsWith('tel:')?'phone_click':'telegram_click')));
}

