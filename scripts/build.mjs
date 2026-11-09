import {home,catalog,productPage} from '../src/experience/pages.mjs';
import {products} from '../src/experience/products.mjs';
import {priorityServices,priorityServicePage,priorityFor} from '../src/priority-services.mjs';
import {trackFaq} from '../src/track-page.mjs';
import {capabilities,webCapabilities} from '../src/capabilities.mjs';
import {marketingIndex,capabilityPage,websitesIndex,webServicePage,processOverview} from '../src/capability-pages.mjs';
import {readFile,writeFile,copyFile,mkdir,unlink,rm} from 'node:fs/promises';
import {config as c} from '../src/content.mjs';
import {services,projects,articles} from '../src/studio-content.mjs';
import {layout,link} from '../src/render.mjs';
import * as pages from '../src/pages.mjs';
import {validateSeo,canIndex,origin} from '../src/seo.mjs';
validateSeo();
for(const slug of ['request','catalog','proposal','approval','equipment','reorder','dealer','careers','onboarding'])await rm('dist/solutions/'+slug,{recursive:true,force:true});
const routes=[];
const add=(path,title,description,body,extra={})=>routes.push({meta:{path,title,description,...extra},body});
const crumb=(name,path)=>({name,path});
add('/','Apollo — цифровые решения, сайты и дизайн для бизнеса','Цифровые продукты для продаж, обслуживания и команды. Интерактивные прототипы, сайты и проекты Apollo.',home());
add('/solutions/','Цифровые продукты Apollo — каталог решений','Apollo Track: статусы заказов, документы и история. Посмотрите интерфейс клиента и менеджера в интерактивной технодемке.',catalog(),{type:'CollectionPage',items:products.map(p=>({name:'Apollo / '+p.brand,path:'/solutions/'+p.slug+'/'})),breadcrumbs:[crumb('Цифровые решения','/solutions/')]});
add('/marketing/','Маркетинг и дизайн — Apollo','Исследования и стратегия, брендинг, материалы для продаж, контент, реклама и SEO. Выберите задачу и узнайте состав работ и результат.',marketingIndex(),{type:'CollectionPage',items:capabilities.map(g=>({name:g.name,path:'/marketing/'+g.slug+'/'})),breadcrumbs:[crumb('Маркетинг','/marketing/')]});
for(const g of capabilities){const path='/marketing/'+g.slug+'/';add(path,g.name+' — услуги Apollo',g.intro,capabilityPage(g),{serviceName:g.name,items:g.items.map(i=>({name:i.name,path:priorityFor(g.slug,i.id)?.path||path+'#'+i.id})),breadcrumbs:[crumb('Маркетинг и дизайн','/marketing/'),crumb(g.name,path)]});}
for(const p of products){const path='/solutions/'+p.slug+'/';add(path,'Apollo Track — статусы заказов для клиентов и менеджеров','Страница статусов заказа для клиента и рабочее место менеджера. Состав пилота Apollo Track, внедрение, модель стоимости, интеграции и интерактивное демо.',productPage(p),{serviceName:'Разработка и внедрение Apollo Track',faqs:trackFaq,breadcrumbs:[crumb('Цифровые решения','/solutions/'),crumb(p.name,path)]});}
for(const p of priorityServices)add(p.path,p.title,p.description,priorityServicePage(p),{serviceName:p.name,faqs:p.faq,breadcrumbs:[crumb('Маркетинг и дизайн','/marketing/'),crumb(p.parentName,'/marketing/'+p.parent+'/'),crumb(p.shortName,p.path)]});
add('/projects/','Проекты Apollo — производство, каталоги и технический сервис','Кейсы Apollo: каталог и производственные услуги «Фундкреп», входы по маркам и моделям Nikateam. Логика решений, экраны и действующие сайты.',pages.projectIndex(),{type:'CollectionPage',items:projects.map(p=>({name:p.name,path:'/projects/'+p.slug+'/'})),breadcrumbs:[crumb('Проекты','/projects/')]});
for(const p of projects){const path='/projects/'+p.slug+'/';add(path,(p.slug==='fundkrep'?'Сайт производителя «Фундкреп» — кейс Apollo':'Сайт технического сервиса Nikateam — кейс Apollo'),p.intro,pages.projectPage(p),{caseName:p.name,image:'/'+p.asset.src,hero:p.asset,breadcrumbs:[crumb('Проекты','/projects/'),crumb(p.name,path)]});}
add('/services/','Сайты и цифровые решения для бизнеса — Apollo','Корпоративные сайты, каталоги, посадочные страницы, калькуляторы, личные кабинеты, UX/UI-дизайн, разработка и поддержка. Состав работ и результаты.',websitesIndex(),{type:'CollectionPage',items:webCapabilities.items.map(i=>({name:i.name,path:'/services/'+i.id+'/'})),breadcrumbs:[crumb('Услуги','/services/')]});
const serviceTitles={'corporate-websites':'Разработка сайтов для производственных компаний — Apollo','product-catalogs':'Разработка электронных каталогов продукции — Apollo','redesign':'Редизайн сайтов для бизнеса — Apollo','content-strategy':'Структура и содержание сайта для B2B — Apollo'};
for(const s of services){const path='/services/'+s.slug+'/';add(path,serviceTitles[s.slug]||s.name+' для бизнеса — Apollo',s.intro,pages.servicePage(s),{serviceName:s.name,breadcrumbs:[crumb('Услуги','/services/'),crumb(s.name,path)]});}
for(const i of webCapabilities.items.filter(i=>!services.some(s=>s.slug===i.id))){const path='/services/'+i.id+'/';add(path,(i.id==='maintenance'?'Поддержка и развитие сайтов для бизнеса':i.name+' — разработка')+' — Apollo',i.description,webServicePage(i),{serviceName:i.name,breadcrumbs:[crumb('Сайты для бизнеса','/services/'),crumb(i.name,path)]});}
add('/studio/','Студия Apollo — команда, руководители и подход','Роман и Михаил — партнёры и руководители Apollo. Личная ответственность, понятные роли и совместная работа над цифровыми решениями, маркетингом и дизайном.',pages.studio(),{type:'AboutPage',breadcrumbs:[crumb('Студия','/studio/')]});
add('/process/','Как работает Apollo — этапы, состав и стоимость','Работа над исследованием, брендом, материалами, сайтом или сопровождением. Согласование объёма и результатов. Отдельный ориентир стоимости разработки сайта.',processOverview(),{breadcrumbs:[crumb('Процесс и стоимость','/process/')]});
add('/insights/','Материалы о разработке и планировании сайтов — Apollo','Практические материалы Apollo: структура сайта производственной компании, подготовка содержания и факторы стоимости разработки. Основа для обсуждения проекта.',pages.insightsIndex(),{type:'CollectionPage',items:articles.map(a=>({name:a.title,path:'/insights/'+a.slug+'/'})),breadcrumbs:[crumb('Материалы','/insights/')]} );
for(const a of articles){const path='/insights/'+a.slug+'/';add(path,a.title+' — Apollo',(a.slug==='industrial-website-structure'?'Структура промышленного сайта: роли покупателей, поля карточки продукции, подтверждения возможностей и путь к расчёту. Примеры, таблицы и чек-лист.':'Шаблоны, содержание, каталог, интеграции и запуск: что влияет на бюджет разработки сайта и как сравнивать предложения студий. Практический материал Apollo.'),pages.articlePage(a),{article:a,breadcrumbs:[crumb('Материалы','/insights/'),crumb(a.title,path)]});}
add('/contacts/','Контакты Apollo — обсудить проект и заполнить бриф','Свяжитесь с Apollo в Telegram, по почте или телефону. Короткий бриф поможет подготовить описание задачи, сроков и бюджета перед разговором о проекте.',pages.contacts(),{type:'ContactPage',breadcrumbs:[crumb('Контакты','/contacts/')]});
for(const route of routes){const dir='dist'+route.meta.path;await mkdir(dir,{recursive:true});await writeFile(dir+'index.html',layout(route.meta,route.body,{cta:route.meta.path!=='/contacts/'}));}
const missing='<section class="not-found wrap"><p class="eyebrow">404 / Страница не найдена</p><h1>Здесь пока<br>нет страницы.</h1><p>Выберите цифровой продукт, услугу или проект Apollo.</p>'+link('/','На главную','button')+'</section>';
await writeFile('dist/404.html',layout({path:'/404.html',title:'Страница не найдена — Apollo',description:'Такой страницы нет. Посмотрите проекты и услуги студии Apollo или свяжитесь с нами.',noindex:true},missing,{cta:false}));
await writeFile('dist/styles.css',(await readFile('src/studio.css','utf8'))+'\n'+await readFile('src/responsive.css','utf8'));
await copyFile('src/unified.css','dist/unified.css');await copyFile('src/marketing.js','dist/marketing.js');await copyFile('src/experience/track-theme.css','dist/demos/track/apollo-theme.css');await copyFile('src/studio-app.js','dist/app.js');await copyFile('src/brief.mjs','dist/brief.js');
await writeFile('dist/site.webmanifest',JSON.stringify({name:'Apollo — digital studio',short_name:'Apollo',start_url:'/',display:'browser',theme_color:'#090c0b',background_color:'#090c0b',icons:[{src:'/assets/apollo-logo-square.png',sizes:'512x512',type:'image/png'}]}));
await writeFile('dist/robots.txt',canIndex()?'User-agent: *\nAllow: /\nSitemap: '+origin()+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');
if(canIndex())await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+origin()+r.meta.path+'</loc><lastmod>'+c.updatedAt+'</lastmod></url>').join('')+'</urlset>');
else await unlink('dist/sitemap.xml').catch(e=>{if(e.code!=='ENOENT')throw e;});
const demoPath='dist/demos/track/index.html';
const demoHtml=(await readFile(demoPath,'utf8')).replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi,'');
await writeFile(demoPath,demoHtml.replace('<head>','<head>\n  <meta name="robots" content="noindex,follow">'));
console.log('Built '+routes.length+' content pages + 404. Indexing: '+(canIndex()?'public':'private / noindex')+'.');


await copyFile('src/experience/styles.css','dist/experience.css');await copyFile('src/experience/app.js','dist/experience.js');await copyFile('src/experience/intro.js','dist/intro.js');await copyFile('src/experience/logo-renderer.js','dist/logo-renderer.js');await copyFile('src/experience/logo-bakes.js','dist/logo-bakes.js');

for(const name of ['motion.js','film-player.js','logo-film.js'])await copyFile('src/experience/'+name,'dist/'+name);
