import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {config,assets} from '../src/content.mjs';
import {services,articles,projects} from '../src/studio-content.mjs';
import {head,graph,validateSeo,canIndex} from '../src/seo.mjs';
import {logoBakes} from '../src/experience/logo-bakes.js';
import {logoFilm} from '../src/experience/logo-film.js';
import {DURATION,sceneState} from '../src/experience/motion.js';
import {priorityServices} from '../src/priority-services.mjs';
import {trackFaq} from '../src/track-page.mjs';
import {composeBrief,mailHref} from '../src/brief.mjs';
import {capabilities,webCapabilities,serviceOptions,serviceValue} from '../src/capabilities.mjs';
const root=resolve('dist');
const originForCheck=()=>String(config.publicDomain||config.previewOrigin).replace(/\/$/,'');
async function files(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,f.name);out.push(...f.isDirectory()?await files(p):[p]);}return out;}
const pages=(await files(root)).filter(p=>p.endsWith('.html')&&!p.includes('/demos/')),titles=new Set(),descriptions=new Set();
assert.equal(pages.length,33,'32 content pages and 404');
let totalAnchors=0,totalImages=0,totalLinks=0;
for(const path of pages){
 const html=await readFile(path,'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'Unique IDs: '+path);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'One H1: '+path);
 assert.match(html,/<html lang="ru">/);
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1],description=html.match(/name="description" content="([^"]+)"/)?.[1];
 assert(title&&!titles.has(title),'Unique title');titles.add(title);
 assert(description&&!descriptions.has(description),'Unique description');descriptions.add(description);
 for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  totalLinks++;
  if(/^(https?:|mailto:|tel:)/.test(url))continue;
  const [location,hash]=url.split('#'),file=location.split('?')[0];
  let target=file?(file.startsWith('/')?resolve(root,'.'+file):resolve(dirname(path),file)):path;
  let metadata=await stat(target);if(metadata.isDirectory()){target=resolve(target,'index.html');metadata=await stat(target);}
  assert(metadata.size>0,'Nonempty '+url);
  if(hash){const dest=target===path?html:await readFile(target,'utf8');assert(dest.includes('id="'+hash+'"'),'Anchor '+url+' from '+path);totalAnchors++;}
 }
 for(const [,list] of html.matchAll(/srcset="([^"]+)"/g))for(const entry of list.split(',')){const file=entry.trim().split(' ')[0];assert((await stat(resolve(root,'.'+file))).size>0);}
 for(const [,attrs] of html.matchAll(/<img\b([^>]+)>/g)){if(!/\bsrc=/.test(attrs))continue;assert(/\balt=/.test(attrs)&&/\bwidth=/.test(attrs)&&/\bheight=/.test(attrs),'Image alt and dimensions');totalImages++;}
 for(const [,json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)){
  const schema=JSON.parse(json);assert.equal(schema['@context'],'https://schema.org');assert(schema['@graph'].some(n=>n['@type']==='Organization'));assert(!JSON.stringify(schema).includes('AggregateRating'));
  const ids=schema['@graph'].map(n=>n['@id']);assert.equal(new Set(ids).size,ids.length,'Distinct schema identities');
  const visible=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
  for(const n of schema['@graph']){
   if(n['@type']==='Service')assert.equal(n.provider['@id'],schema['@graph'].find(x=>x['@type']==='Organization')['@id']);
   if(n['@type']==='FAQPage'){assert(visible.includes('id="faq"'),'Visible FAQ section');for(const q of n.mainEntity){assert(visible.includes(q.name)&&visible.includes(q.acceptedAnswer.text),'FAQ markup matches visible answers');}}
   if(n['@type']==='ItemList'){assert.equal(n.numberOfItems,n.itemListElement.length);for(const [i,item] of n.itemListElement.entries()){assert.equal(item.position,i+1);const u=new URL(item.url);assert.equal(u.origin,originForCheck());const target=resolve(root,'.'+u.pathname,'index.html');assert((await stat(target)).size>0,'Listed page exists');if(u.hash)assert((await readFile(target,'utf8')).includes('id="'+u.hash.slice(1)+'"'),'Listed section exists');}}
  }
  if(path!==resolve(root,'index.html')&&!path.endsWith('404.html'))assert(schema['@graph'].some(n=>n['@type']==='BreadcrumbList'),'Breadcrumb schema');
 }
 assert(!/href="#"|Lorem ipsum|Заявка отправлена/.test(html),'No placeholders, false success, iframe');
 assert(!/assets\/(fundkrep-main|fundkrep-hero|nikateam-sign)\.webp/.test(html),'No old screenshots');
 assert(html.includes(canIndex()&&!path.endsWith('404.html')?'content="index,follow,max-image-preview:large"':'content="noindex,nofollow"'),'Indexing mode');
 for(const [,id] of html.matchAll(/<label[^>]* for="([^"]+)"/g))assert(ids.includes(id),'Label target');
 for(const [,id] of html.matchAll(/aria-controls="([^"]+)"/g))assert(ids.includes(id),'ARIA control target');
}
const home=await readFile('dist/index.html','utf8');
assert(home.includes('/solutions/')&&home.includes('id="aurora"')&&home.includes('id="apollo-mark"'));
assert.equal(logoFilm.sheets.length,Math.ceil(logoFilm.count/logoFilm.perSheet));
for(const src of logoFilm.sheets)assert((await stat(resolve(root,'.'+src))).size>0,'Cinematic 3D frame sheet');
assert(logoFilm.count/logoFilm.fps>=6.2);assert(sceneState(0).bars.every(v=>v===0));assert.equal(sceneState(DURATION).opacity,0);assert.equal(sceneState(DURATION).nav,1);
for(let ms=0;ms<=DURATION;ms+=40){const s=sceneState(ms);assert(Object.values(s).flat().every(Number.isFinite));assert(s.opacity>=0&&s.opacity<=1);}
assert.equal(logoBakes.length,3);for(const p of logoBakes){assert(p.width>0&&p.height>0);assert((await stat(resolve(root,'.'+p.src))).size>0,'Baked 3D pillar resource');}
for(const name of ['motion.js','film-player.js','logo-film.js'])assert((await stat('dist/'+name)).size>0);
assert((await stat('dist/logo-renderer.js')).size>0&&(await stat('dist/logo-bakes.js')).size>0);
assert((await stat('dist/solutions/track/index.html')).size>0);
const catalog=await readFile('dist/solutions/index.html','utf8');assert.equal((catalog.match(/data-product /g)||[]).length,1,'Only Apollo Track in catalog');
for(const slug of ['request','catalog','proposal','approval','equipment','reorder','dealer','careers','onboarding'])assert(!(await stat('dist/solutions/'+slug).catch(()=>null)),'Unpublished concept: '+slug);
const demo=await readFile('dist/demos/track/index.html','utf8');assert(demo.includes('name="robots" content="noindex,follow"'),'Standalone demo is excluded from indexing');
for(const p of priorityServices){const html=await readFile('dist'+p.path+'index.html','utf8');assert(html.includes(p.name)&&html.includes(p.modules[0][1]));const parent=await readFile('dist/marketing/'+p.parent+'/index.html','utf8');assert(parent.includes('href="'+p.path+'"'),'Leaf page is linked from its parent');}
const track=await readFile('dist/solutions/track/index.html','utf8');assert(track.includes('Модель стоимости')&&track.includes('Интеграции')&&trackFaq.every(([q,a])=>track.includes(q)&&track.includes(a)));
assert(home.includes('intro-pending'),'Automatic intro preserves the opening white screen');
assert(home.includes('class="console-page"'),'Home uses the fixed interface shell');
assert.equal((home.match(/class="console-direction"/g)||[]).length,3,'Three main navigation entries');
assert(!home.includes('class="site-footer"')&&!home.includes('class="reading-progress"'),'No long-page shell on home');
const studio=await readFile('dist/studio/index.html','utf8');assert(studio.includes('roman-800.webp')&&studio.includes('mikhail-800.webp'),'Team remains on its own page');
const experience=await readFile('dist/experience.js','utf8');const intro=await readFile('dist/intro.js','utf8');assert(!experience.includes('scrollIntoView')&&!intro.includes('scrollIntoView'),'Intro never moves the home page');
const contact=await readFile('dist/contacts/index.html','utf8');
assert(contact.includes('<fieldset id="brief-fields" disabled>'),'No-JS brief cannot accidentally submit');
assert(contact.includes('не отправляет и не сохраняет ответы'),'Honest submission behavior');
for(const a of Object.values(assets))assert(a.capturedAt==='2026-10-20'&&a.url&&a.alt&&a.width&&a.height);
const css=await readFile('dist/styles.css','utf8');for(const [,file] of css.matchAll(/url\('([^']+)'\)/g))assert((await stat(resolve(root,'.'+file))).size>0);assert(css.includes('prefers-reduced-motion'));
const app=await readFile('dist/app.js','utf8');assert(!/fetch\(|localStorage|sessionStorage/.test(app),'No hidden brief transmission or persistence');
assert.equal(serviceOptions.length,44,'Complete service offering');
assert.equal(new Set(serviceOptions.map(s=>s.value)).size,44,'Unambiguous service selections');
for(const g of capabilities){const html=await readFile('dist/marketing/'+g.slug+'/index.html','utf8');for(const i of g.items){assert(html.includes('id="'+i.id+'"')&&html.includes(i.description)&&html.includes(i.outputs[0]),'Scope and outputs: '+i.name);assert(contact.includes('value="'+serviceValue(g,i)+'"'),'Brief offers '+i.name);}}
for(const i of webCapabilities.items)assert((await stat('dist/services/'+i.id+'/index.html')).size>0,'Website service route: '+i.id);
const serviceMap=Object.fromEntries([...services.map(s=>[s.slug,s.name]),...serviceOptions.map(s=>[s.value,s.name])]);
assert(composeBrief({service:'branding-naming',task:'Название новой линейки'},serviceMap).body.includes('Задача: Нейминг'),'New marketing service survives brief composition');

const message=composeBrief({company:'Тестовая компания',website:'company.ru',service:'product-catalogs',task:'Каталог с чертежами\nи параметрами',budget:'Нужна оценка'},serviceMap);
assert(message.body.includes('Каталоги продукции')&&message.body.includes('Каталог с чертежами\nи параметрами'));
const href=mailHref('manager@apollo.su',message.subject,message.body),url=new URL(href);
assert.equal(url.searchParams.get('body'),message.body,'Cyrillic and newline mailto roundtrip');
assert.equal(url.searchParams.get('subject'),message.subject);
assert(composeBrief({service:'untrusted',company:'  Компания\r\nА  '},serviceMap).subject==='Проект для Apollo — Компания А');
assert.equal(graph({serviceName:services[0].name})['@graph'].filter(n=>n['@type']==='Service').length,1);
assert(graph({article:articles[0]})['@graph'].some(n=>n['@type']==='Article'));
const robots=await readFile('dist/robots.txt','utf8');assert(robots.includes(canIndex()?'Allow: /':'Disallow: /'));
validateSeo();const saved={domain:config.publicDomain,indexable:config.indexable};
try{config.publicDomain=null;config.indexable=true;assert.throws(validateSeo);config.publicDomain='https://apollo.example';validateSeo();assert(canIndex());assert(head().includes('rel="canonical" href="https://apollo.example/"'));config.indexable=false;assert(head().includes('noindex,nofollow'));}finally{config.publicDomain=saved.domain;config.indexable=saved.indexable;}
console.log('Passed: '+pages.length+' pages, '+totalLinks+' links, '+totalAnchors+' anchors, '+totalImages+' images; metadata, schema, source assets, brief composition, mail encoding and indexing modes.');

