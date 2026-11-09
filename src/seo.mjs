import {config as c} from './content.mjs';
const e=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const origin=()=>String(c.publicDomain||c.previewOrigin).replace(/\/$/,'');
export const canIndex=()=>Boolean(c.publicDomain&&c.indexable);
export function validateSeo(){
 if(c.indexable&&!c.publicDomain)throw new Error('Indexing requires a confirmed public domain.');
 for(const url of [c.publicDomain,c.previewOrigin].filter(Boolean)){const u=new URL(url);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash)throw new Error('SEO origin must be an HTTPS origin without path, query or fragment.');}
}
export function graph({path='/',title=c.title,description=c.description,caseName=null,image='/assets/og-cover.png',type='WebPage',breadcrumbs=[],serviceName=null,article=null,items=[],faqs=[]}={}){
 const base=origin(),org=base+'/#organization',url=base+path,site=base+'/#website',page=url+'#webpage';
 const organization={'@type':'Organization','@id':org,name:'Apollo',url:base+'/',description:'Студия цифровых решений, маркетинга и дизайна для бизнеса',logo:{'@type':'ImageObject','@id':base+'/#logo',url:base+'/assets/apollo-logo-square.png',width:512,height:512},email:c.contacts.email,telephone:c.contacts.phone,sameAs:[c.contacts.telegram],contactPoint:[{'@type':'ContactPoint',contactType:'Обсуждение проектов',email:c.contacts.email,telephone:c.contacts.phone,availableLanguage:'ru'}]};
 const webpage={'@type':type,'@id':page,url,name:title,description,inLanguage:'ru-RU',isPartOf:{'@id':site},about:{'@id':org},publisher:{'@id':org},primaryImageOfPage:{'@type':'ImageObject',url:base+image},dateModified:c.updatedAt};
 if(type==='ContactPage'||type==='AboutPage')webpage.mainEntity={'@id':org};
 const nodes=[organization,{'@type':'WebSite','@id':site,url:base+'/',name:'Apollo',inLanguage:'ru-RU',publisher:{'@id':org}},webpage];
 if(breadcrumbs.length){nodes.push({'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:[{name:'Apollo',path:'/'},...breadcrumbs].map((b,i)=>({'@type':'ListItem',position:i+1,name:b.name,item:base+b.path}))});webpage.breadcrumb={'@id':url+'#breadcrumbs'};}
 if(caseName){const id=url+'#project';nodes.push({'@type':'CreativeWork','@id':id,name:caseName,description,creator:{'@id':org},image:base+image,url});webpage.mainEntity={'@id':id};}
 if(serviceName){const id=url+'#service';nodes.push({'@type':'Service','@id':id,name:serviceName,serviceType:serviceName,description,provider:{'@id':org},url,mainEntityOfPage:{'@id':page}});webpage.mainEntity={'@id':id};}
 if(article){const id=url+'#article';nodes.push({'@type':'Article','@id':id,headline:article.title,description,mainEntityOfPage:{'@id':page},author:{'@id':org},publisher:{'@id':org},datePublished:c.publishedAt||c.updatedAt,dateModified:c.updatedAt,inLanguage:'ru-RU',image:base+image,url});webpage.mainEntity={'@id':id};}
 if(items.length){const id=url+'#list';nodes.push({'@type':'ItemList','@id':id,name:title,numberOfItems:items.length,itemListElement:items.map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,url:base+item.path}))});webpage.mainEntity=webpage.mainEntity?[webpage.mainEntity,{'@id':id}]:{'@id':id};}
 if(faqs.length){const id=url+'#faq';nodes.push({'@type':'FAQPage','@id':id,url:id,inLanguage:'ru-RU',isPartOf:{'@id':page},mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});webpage.hasPart={'@id':id};}
 return {'@context':'https://schema.org','@graph':nodes};
}
export function head(meta={}){
 const {path='/',title=c.title,description=c.description,caseName=null,image='/assets/og-cover.png',hero=null,heroSizes='90vw',noindex=false,article=null}=meta;
 const url=origin()+path,index=canIndex()&&!noindex;
 return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#090c0b">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="${index?'index,follow,max-image-preview:large':'noindex,nofollow'}">
${c.publicDomain?`<link rel="canonical" href="${e(url)}">`:''}
<meta property="og:type" content="${article?'article':'website'}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="Apollo"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(origin()+image)}"><meta property="og:image:alt" content="${e(caseName||'Apollo — цифровые решения, маркетинг и дизайн')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(origin()+image)}">
${c.verification.google?`<meta name="google-site-verification" content="${e(c.verification.google)}">`:''}${c.verification.yandex?`<meta name="yandex-verification" content="${e(c.verification.yandex)}">`:''}
<link rel="icon" href="/assets/apollo-symbol.svg" type="image/svg+xml"><link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="preload" href="/assets/manrope-600.woff" as="font" type="font/woff" crossorigin>
${hero?`<link rel="preload" as="image" href="/${hero.src}" imagesrcset="${hero.srcset.split(', ').map(v=>'/'+v).join(', ')}" imagesizes="${heroSizes}" fetchpriority="high">`:''}
${path==='/'?`<script>try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&performance.getEntriesByType('navigation')[0]?.type!=='back_forward'){document.documentElement.classList.add('intro-pending');setTimeout(()=>document.documentElement.classList.remove('intro-pending'),11000)}}catch{}</script>`:''}<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/experience.css"><link rel="stylesheet" href="/unified.css"><script type="module" src="/experience.js?v=20261109-autoplay"></script><script type="application/ld+json">${JSON.stringify(graph(meta)).replaceAll('<','\\u003c')}</script><script type="module" src="/app.js"></script>`;
}
