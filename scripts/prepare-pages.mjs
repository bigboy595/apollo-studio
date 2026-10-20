import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {config} from '../src/content.mjs';

const deployment=new URL(process.env.PAGES_SITE_URL||'');
assert.equal(deployment.protocol,'https:','GitHub Pages requires an HTTPS site URL');
assert(!deployment.search&&!deployment.hash,'The deployment URL cannot contain a query or fragment');
const base=deployment.href.replace(/\/$/,'');
const prefix=deployment.pathname.replace(/\/$/,'');
const root=resolve(process.env.PAGES_OUTPUT_DIR||'dist');
if(config.publicDomain&&config.indexable)assert.equal(base,config.publicDomain.replace(/\/$/,''),'Pages must use the confirmed public SEO domain');
const local=value=>value.startsWith('/')&&!value.startsWith('//')?prefix+value:value;
async function files(dir){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name);
  out.push(...entry.isDirectory()?await files(path):[path]);
 }
 return out;
}
const all=await files(root);
for(const path of all){
 if(path.endsWith('.html')){
  let html=await readFile(path,'utf8');
  html=html.replace(/(\b(?:href|src|poster|action)=["'])(\/(?!\/)[^"']*)(["'])/g,(_,a,value,b)=>a+local(value)+b);
  html=html.replace(/(\b(?:srcset|imagesrcset)=["'])([^"']+)(["'])/g,(_,a,value,b)=>a+value.split(',').map(item=>{
   const parts=item.trim().split(/\s+/);parts[0]=local(parts[0]);return parts.join(' ');
  }).join(', ')+b);
  if(!config.publicDomain)html=html.replaceAll(config.previewOrigin.replace(/\/$/,''),base);
  await writeFile(path,html);
 }else if(path.endsWith('.css')){
  const css=await readFile(path,'utf8');
  await writeFile(path,css.replace(/url\((["']?)(\/(?!\/)[^"')]+)\1\)/g,(_,quote,value)=>'url('+quote+local(value)+quote+')'));
 }
}
const manifestPath=resolve(root,'site.webmanifest');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
manifest.start_url=local('/');
manifest.scope=local('/');
for(const icon of manifest.icons||[])icon.src=local(icon.src);
await writeFile(manifestPath,JSON.stringify(manifest));
await writeFile(resolve(root,'.nojekyll'),'');

let checked=0;
async function checkReference(value,from){
 if(!value||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value))return;
 const pathname=decodeURIComponent(value.split(/[?#]/)[0]);
 if(!pathname)return;
 let target;
 if(pathname.startsWith('/')){
  assert(!prefix||pathname.startsWith(prefix+'/')||pathname===prefix,'Link escapes the Pages project path: '+value);
  const relative=prefix?pathname.slice(prefix.length):pathname;
  target=resolve(root,'.'+(relative||'/'));
 }else target=resolve(dirname(from),pathname);
 assert(target===root||target.startsWith(root+sep),'Link escapes the output directory: '+value);
 let item=await stat(target);
 if(item.isDirectory()){target=resolve(target,'index.html');item=await stat(target);}
 assert(item.isFile()&&item.size>0,'Missing or empty published resource: '+value);
 checked++;
}
for(const path of all){
 if(path.endsWith('.html')){
  const html=await readFile(path,'utf8');
  for(const [,value] of html.matchAll(/\b(?:href|src|poster|action)=["']([^"']+)["']/g))await checkReference(value,path);
  for(const [,value] of html.matchAll(/\b(?:srcset|imagesrcset)=["']([^"']+)["']/g))for(const item of value.split(','))await checkReference(item.trim().split(/\s+/)[0],path);
  for(const [,json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))JSON.parse(json);
  if(!config.publicDomain)assert(!html.includes(config.previewOrigin),'Preview metadata remains in a published page');
 }else if(path.endsWith('.css')){
  for(const [,value] of (await readFile(path,'utf8')).matchAll(/url\(["']?([^"')]+)["']?\)/g))await checkReference(value,path);
 }
}
for(const icon of manifest.icons||[])await checkReference(icon.src,manifestPath);
console.log('Prepared '+base+'; verified '+checked+' local page and resource references.');
