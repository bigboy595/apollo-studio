import {readFile,writeFile,copyFile,mkdir,unlink} from 'node:fs/promises';
import {config as c} from '../src/content.mjs';
import {services,projects,articles} from '../src/studio-content.mjs';
import {layout,home,link} from '../src/render.mjs';
import * as pages from '../src/pages.mjs';
import {validateSeo,canIndex,origin} from '../src/seo.mjs';
validateSeo();
const routes=[];
const add=(path,title,description,body,extra={})=>routes.push({meta:{path,title,description,...extra},body});
const crumb=(name,path)=>({name,path});
add('/','Apollo — сайты для промышленного и технического бизнеса','Студия Apollo: корпоративные сайты, каталоги продукции, редизайн и содержание. Реальные проекты «Фундкреп» и Nikateam. Команда, подход и стоимость.',home());
add('/projects/','Проекты Apollo — производство, каталоги и технический сервис','Реальные проекты Apollo: сайт производителя «Фундкреп» и технического сервиса Nikateam. Задачи, структура, актуальные интерфейсы и ссылки на работающие сайты.',pages.projectIndex(),{type:'CollectionPage',breadcrumbs:[crumb('Проекты','/projects/')]});
for(const p of projects){const path='/projects/'+p.slug+'/';add(path,(p.slug==='fundkrep'?'Сайт производителя «Фундкреп» — кейс Apollo':'Сайт технического сервиса Nikateam — кейс Apollo'),p.intro,pages.projectPage(p),{caseName:p.name,image:'/'+p.asset.src,hero:p.asset,breadcrumbs:[crumb('Проекты','/projects/'),crumb(p.name,path)]});}
add('/services/','Услуги Apollo — сайты, каталоги, редизайн и содержание','Создаём сайты для промышленного и технического бизнеса. Четыре направления: корпоративные сайты, каталоги продукции, редизайн, структура и содержание.',pages.servicesIndex(),{type:'CollectionPage',breadcrumbs:[crumb('Услуги','/services/')]});
for(const s of services){const path='/services/'+s.slug+'/';add(path,s.name+' для бизнеса — Apollo',s.intro,pages.servicePage(s),{serviceName:s.name,breadcrumbs:[crumb('Услуги','/services/'),crumb(s.name,path)]});}
add('/studio/','Студия Apollo — команда, руководители и подход','Роман и Михаил — партнёры и руководители Apollo. Личная ответственность, понятные роли и совместная работа над сайтами для промышленного и технического бизнеса.',pages.studio(),{type:'AboutPage',breadcrumbs:[crumb('Студия','/studio/')]});
add('/process/','Процесс и стоимость разработки сайта — Apollo','Этапы проекта Apollo: исследование, структура, дизайн, разработка и передача. Базовый ориентир — от 120 000 ₽, 4–6 недель. Состав и границы работ.',pages.processPage(),{breadcrumbs:[crumb('Процесс и стоимость','/process/')]});
add('/insights/','Материалы о разработке и планировании сайтов — Apollo','Практические материалы Apollo: структура сайта производственной компании, подготовка содержания и факторы стоимости разработки. Основа для обсуждения проекта.',pages.insightsIndex(),{type:'CollectionPage',breadcrumbs:[crumb('Материалы','/insights/')]});
for(const a of articles){const path='/insights/'+a.slug+'/';add(path,a.title+' — Apollo',(a.slug==='industrial-website-structure'?'Какие разделы нужны производственной компании: продукция, услуги, возможности предприятия, документы и путь к запросу расчёта. Практический материал Apollo.':'Шаблоны, содержание, каталог, интеграции и запуск: что влияет на бюджет разработки сайта и как сравнивать предложения студий. Практический материал Apollo.'),pages.articlePage(a),{article:a,breadcrumbs:[crumb('Материалы','/insights/'),crumb(a.title,path)]});}
add('/contacts/','Контакты Apollo — обсудить сайт и заполнить бриф','Свяжитесь с Apollo в Telegram, по почте или телефону. Короткий бриф поможет подготовить описание задачи, сроков и бюджета перед разговором о сайте.',pages.contacts(),{type:'ContactPage',breadcrumbs:[crumb('Контакты','/contacts/')]});
for(const route of routes){const dir='dist'+route.meta.path;await mkdir(dir,{recursive:true});await writeFile(dir+'index.html',layout(route.meta,route.body,{cta:route.meta.path!=='/contacts/'}));}
const missing='<section class="not-found wrap"><p class="eyebrow">404 / Страница не найдена</p><h1>Здесь пока<br>нет страницы.</h1><p>Проекты, услуги и команда Apollo — на главной.</p>'+link('/','На главную','button')+'</section>';
await writeFile('dist/404.html',layout({path:'/404.html',title:'Страница не найдена — Apollo',description:'Такой страницы нет. Посмотрите проекты и услуги студии Apollo или свяжитесь с нами.',noindex:true},missing,{cta:false}));
await writeFile('dist/styles.css',(await readFile('src/studio.css','utf8'))+'\n'+await readFile('src/responsive.css','utf8'));
await copyFile('src/studio-app.js','dist/app.js');await copyFile('src/brief.mjs','dist/brief.js');
await writeFile('dist/site.webmanifest',JSON.stringify({name:'Apollo — digital studio',short_name:'Apollo',start_url:'/',display:'browser',theme_color:'#090c0b',background_color:'#090c0b',icons:[{src:'/assets/apollo-logo-square.png',sizes:'512x512',type:'image/png'}]}));
await writeFile('dist/robots.txt',canIndex()?'User-agent: *\nAllow: /\nSitemap: '+origin()+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');
if(canIndex())await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+origin()+r.meta.path+'</loc><lastmod>'+c.updatedAt+'</lastmod></url>').join('')+'</urlset>');
else await unlink('dist/sitemap.xml').catch(e=>{if(e.code!=='ENOENT')throw e;});
console.log('Built '+routes.length+' content pages + 404. Indexing: '+(canIndex()?'public':'private / noindex')+'.');

