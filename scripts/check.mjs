import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {config,assets} from '../src/content.mjs';
import {services,articles,projects} from '../src/studio-content.mjs';
import {head,graph,validateSeo,canIndex} from '../src/seo.mjs';
import {composeBrief,mailHref} from '../src/brief.mjs';
const root=resolve('dist');
async function files(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,f.name);out.push(...f.isDirectory()?await files(p):[p]);}return out;}
const pages=(await files(root)).filter(p=>p.endsWith('.html')),titles=new Set(),descriptions=new Set();
assert.equal(pages.length,16,'15 content pages and 404');
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
  if(path!==resolve(root,'index.html')&&!path.endsWith('404.html'))assert(schema['@graph'].some(n=>n['@type']==='BreadcrumbList'),'Breadcrumb schema');
 }
 assert(!/href="#"|Lorem ipsum|Заявка отправлена|<iframe\b/.test(html),'No placeholders, false success, iframe');
 assert(!/assets\/(fundkrep-main|fundkrep-hero|nikateam-sign)\.webp/.test(html),'No old screenshots');
 assert(html.includes(canIndex()&&!path.endsWith('404.html')?'content="index,follow,max-image-preview:large"':'content="noindex,nofollow"'),'Indexing mode');
 for(const [,id] of html.matchAll(/<label[^>]* for="([^"]+)"/g))assert(ids.includes(id),'Label target');
 for(const [,id] of html.matchAll(/aria-controls="([^"]+)"/g))assert(ids.includes(id),'ARIA control target');
}
const home=await readFile('dist/index.html','utf8');
assert(home.includes(config.price)&&home.includes(config.timeline));
assert(home.includes('id="why-apollo"')&&home.includes('roman-800.webp')&&home.includes('mikhail-800.webp'));
const contact=await readFile('dist/contacts/index.html','utf8');
assert(contact.includes('<fieldset id="brief-fields" disabled>'),'No-JS brief cannot accidentally submit');
assert(contact.includes('не отправляет и не сохраняет ответы'),'Honest submission behavior');
for(const a of Object.values(assets))assert(a.capturedAt==='2026-10-20'&&a.url&&a.alt&&a.width&&a.height);
const css=await readFile('dist/styles.css','utf8');for(const [,file] of css.matchAll(/url\('([^']+)'\)/g))assert((await stat(resolve(root,'.'+file))).size>0);assert(css.includes('prefers-reduced-motion'));
const app=await readFile('dist/app.js','utf8');assert(!/fetch\(|localStorage|sessionStorage/.test(app),'No hidden brief transmission or persistence');
const serviceMap=Object.fromEntries(services.map(s=>[s.slug,s.name]));
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

