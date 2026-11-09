import {logoBakes} from './logo-bakes.js';
import {DURATION,clamp,smooth,sceneState} from './motion.js';
const home=document.querySelector('#apollo-home');
if(home){
 const canvas=home.querySelector('#aurora'),ctx=canvas.getContext('2d'),mark=home.querySelector('#apollo-mark');
 let renderer=null,film=null,stagePromise=null,pillars=[],hasPlayed=false;
 const replay=home.querySelector('#intro-control'),motion=home.querySelector('#motion-control'),content=home.querySelector('.console-content'),header=home.querySelector('.console-header');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),menu=document.querySelector('#nav-dialog');
 home.dataset.renderer='idle';
 async function prepareStage(){
  stagePromise??=Promise.all([import('./logo-renderer.js'),import('./film-player.js')]).then(([gl,player])=>{renderer=gl.createLogoRenderer(mark);film=player.createFilmPlayer();pillars=logoBakes.map(meta=>{const image=new Image();image.src=meta.src;return {...meta,image};});renderer?.resize();home.dataset.renderer=renderer?'webgl':'cinematic-sequence';});
  await stagePromise;
 }
 const layer=document.createElement('canvas'),lctx=layer.getContext('2d');layer.width=layer.height=512;
 const air=document.createElement('canvas'),actx=air.getContext('2d');
 const bloom=document.createElement('canvas'),bctx=bloom.getContext('2d');bloom.width=bloom.height=112;
 let bootCancelled=false,ready=false,startGeneration=0;
 let w=0,h=0,frame=0,previous=0,lastDraw=0,time=0,introTime=DURATION,inIntro=false,paused=false,menuWasPaused=false;
 function resize(){w=home.clientWidth;h=home.clientHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx?.setTransform(d,0,0,d,0,0);air.width=Math.ceil(w/3);air.height=Math.ceil(h/3);actx.setTransform(1/3,0,0,1/3,0,0);renderer?.resize();draw();}
 function finish(){bootCancelled=true;startGeneration++;inIntro=false;introTime=DURATION;home.classList.remove('is-intro','is-light');home.classList.add('intro-complete');document.documentElement.classList.remove('intro-pending');content.inert=false;content.removeAttribute('aria-hidden');header.inert=false;replay.innerHTML=hasPlayed?'Повторить интро <span aria-hidden="true">↻</span>':'Смотреть интро <span aria-hidden="true">↗</span>';replay.setAttribute('aria-label',hasPlayed?'Посмотреть вступление ещё раз':'Посмотреть 3D-вступление');draw();film?.release();}
 async function start(){
  if(reduced.matches)return;hasPlayed=true;const generation=++startGeneration;
  introTime=0;inIntro=true;ready=false;home.classList.add('is-intro','is-light');home.classList.remove('intro-complete');document.documentElement.classList.remove('intro-pending');content.inert=true;content.setAttribute('aria-hidden','true');header.inert=true;
  replay.innerHTML='Пропустить интро <span aria-hidden="true">↗</span>';replay.setAttribute('aria-label','Пропустить вступление');setPaused(false);draw();
  try{await prepareStage();}catch{finish();return;}
  if(generation!==startGeneration)return;
  if(!renderer)await Promise.race([film.prepare(),new Promise(resolve=>setTimeout(resolve,2000))]);
  if(generation!==startGeneration)return;ready=true;previous=performance.now();
 }
 function setPaused(value){paused=value;motion.innerHTML=value?'<span aria-hidden="true">▷</span>':'<span aria-hidden="true">Ⅱ</span>';motion.setAttribute('aria-pressed',String(value));motion.setAttribute('aria-label',value?'Продолжить анимацию':'Приостановить анимацию');if(value){cancelAnimationFrame(frame);frame=0;}else schedule();}
 function schedule(){if(!frame&&!paused&&!document.hidden&&!reduced.matches){previous=performance.now();frame=requestAnimationFrame(tick);}}
 function tick(now){frame=0;const elapsed=Math.max(0,now-previous);previous=now;time+=elapsed/1000;if(inIntro&&ready){introTime+=elapsed;if(introTime>=DURATION)finish();}if(now-lastDraw>=16){draw();lastDraw=now;}if(!paused&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 function mesh(t,alpha){
  if(alpha<=.001)return;ctx.save();ctx.globalAlpha=alpha;
  const p=(u,v)=>[w*(.5+u*(.4+v*.35)),h*(.73+v*.5)+Math.sin(u*2.6+v*2.2+t*.10)*h*.06-Math.cos(u*1.8)*h*.04];
  const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#a9d589');g.addColorStop(.5,'#6ab9a7');g.addColorStop(1,'#4783bc');ctx.strokeStyle=g;ctx.lineWidth=.65;
  for(let row=0;row<30;row++){ctx.beginPath();for(let i=0;i<=60;i++){const [x,y]=p(-1.6+i/60*3.2,row/30);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  for(let col=0;col<44;col++){ctx.beginPath();for(let i=0;i<=30;i++){const [x,y]=p(-1.6+col/44*3.2,i/30);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();
 }
 function glow(x,y,rx,ry,color,alpha,target=ctx){
  const ctx=target;
  if(alpha<.001)return;ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.24,`rgba(${color},${alpha*.65})`);g.addColorStop(.62,`rgba(${color},${alpha*.15})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 function atmosphere(ms,s,size){
  const ctx=actx,paint=(...args)=>glow(...args,actx);
  ctx.clearRect(0,0,w,h);const t=ms/1000,show=smooth((ms-390)/440)*(1-smooth((ms-5580)/1180));if(show<.001)return;
  const cx=w*.5,cy=h*.475,ink=s.dark,colors=['33,213,215','106,242,167','172,239,62'];
  // Three independent pools of volumetric colour follow the arrivals and spring motion.
  for(let i=0;i<3;i++){
   const onset=smooth((ms-(420+i*470))/720),breath=.82+.18*Math.sin(t*2.2-i*.9),x=cx+(i-1)*size*.22+Math.sin(t*.8+i)*size*.04,y=cy-size*(.03+.13*Math.sin(t*.9-i*.65));
   paint(x,y,size*(.39+.045*Math.sin(t*1.6+i)),size*(.63+.08*Math.cos(t+i)),colors[i],show*onset*(.24+ink*.48)*breath);
   paint(x,cy+size*.30,size*.33,size*.075,colors[i],show*onset*(.09+ink*.22));
  }
  // Large drifting blue fill, lime rim and travelling softboxes. No hard-edged blobs.
  paint(cx-size*.43+Math.sin(t*.7)*size*.12,cy-size*.17,size*.8,size*.8,'50,143,255',show*(.07+ink*.23));
  paint(cx+size*.38,cy-size*.24,size*.57,size*.82,'176,247,88',show*(.06+ink*.13));
  if(ink>.03){
   ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=show*ink*.35;ctx.lineCap='round';
   for(let j=0;j<3;j++){const drift=Math.sin(t*.7+j*.45)*size*.12;const g=ctx.createLinearGradient(cx-size,cy,cx+size,cy);g.addColorStop(0,'#48b9ff00');g.addColorStop(.25,'#48cbdc99');g.addColorStop(.55,'#b3f69cbb');g.addColorStop(1,'#c9ff7300');ctx.strokeStyle=g;ctx.lineWidth=size*(.014+j*.006);ctx.filter=`blur(${3+j*2}px)`;ctx.beginPath();ctx.moveTo(cx-size*.87,cy+size*.40+drift);ctx.bezierCurveTo(cx-size*.45,cy-size*.49-drift,cx+size*.31,cy-size*.44+drift,cx+size*.9,cy+size*.23);ctx.stroke();}
   ctx.restore();
  }
  const destination=canvas.getContext('2d');destination.drawImage(air,0,0,w,h);
 }
 function drawMark(ms,s,size){
  if(s.opacity<.001){renderer?.render(s);return;}
  lctx.clearRect(0,0,512,512);
  if(renderer?.ready){renderer.render({...s,opacity:1});lctx.drawImage(mark,0,0,512,512);mark.style.opacity='0';}
  else if(!film?.draw(lctx,ms,0,0,512,512)){
   for(let i=2;i>=0;i--){const p=pillars[i];if(!p.image.complete||!p.image.naturalWidth)continue;const gh=p.height*512*s.bars[i];lctx.drawImage(p.image,p.x*512,(p.y+p.height)*512-gh,p.width*512,gh);}
  }
  const x=(w-size)/2,y=h*.475-size/2;
  // A low-resolution bloom buffer makes edge light continuous without a full-screen blur.
  bctx.clearRect(0,0,112,112);bctx.filter='blur(4px)';bctx.drawImage(layer,0,0,112,112);bctx.filter='none';
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=s.opacity*(.12+.42*s.dark);ctx.drawImage(bloom,x-size*.07,y-size*.07,size*1.14,size*1.14);ctx.restore();
  ctx.save();ctx.globalAlpha=s.opacity;ctx.drawImage(layer,x,y,size,size);ctx.restore();
 }
 function impulse(ms,size,s){
  const flare=Math.exp(-Math.pow((ms-4320)/260,2))*s.opacity;
  if(flare>.002){ctx.save();ctx.globalCompositeOperation='screen';glow(w*.5,h*.475+size*.27,size*1.15,size*.013,'98,229,233',flare*.38);glow(w*.5,h*.475+size*.27,size*.34,size*.032,'221,255,212',flare*.36);ctx.restore();}
  const p=clamp((ms-4170)/1450);if(p<=0||p>=1)return;
  ctx.save();ctx.translate(w*.5,h*.475);ctx.scale(1,.46);ctx.rotate(-.09);ctx.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){const spread=clamp(p-i*.065),r=size*(.12+spread*1.7);ctx.globalAlpha=Math.pow(1-spread,2)*.34*s.opacity;ctx.strokeStyle=i===1?'#9cf3d2':'#89d7ff';ctx.lineWidth=1.7+i*.4;ctx.shadowColor='#79e7e2';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(0,0,r,r,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
 }
 function draw(){
  if(!ctx||!w||!h)return;
  const ms=inIntro?introTime:DURATION,s=sceneState(ms),size=mark.getBoundingClientRect().width;
  if(inIntro){header.inert=s.head<.98;content.inert=s.nav<.98;if(s.nav>=.98)content.removeAttribute('aria-hidden');}
  home.classList.toggle('is-light',s.dark<.75);home.style.setProperty('--light',String(1-s.dark));home.style.setProperty('--content-reveal',String(s.title));home.style.setProperty('--nav-reveal',String(s.nav));home.style.setProperty('--header-reveal',String(s.head));home.style.setProperty('--grid-reveal',String(s.grid));
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#f5f6f2';ctx.fillRect(0,0,w,h);
  // The compression triggers an expanding ink front, with a wide, soft optical edge.
  if(s.dark>0){const far=Math.hypot(w*.5,h*.525)+130,radius=(1-Math.pow(1-s.dark,2))*far,edge=Math.max(32,Math.min(w,h)*.075);const disk=ctx.createRadialGradient(w*.5,h*.475,Math.max(0,radius-edge),w*.5,h*.475,radius+edge);disk.addColorStop(0,'#060a0c');disk.addColorStop(.55,'#060a0cfb');disk.addColorStop(.88,'#112521c0');disk.addColorStop(1,'#11252100');ctx.fillStyle=disk;ctx.fillRect(0,0,w,h);if(s.dark>=1){ctx.fillStyle='#060a0c';ctx.fillRect(0,0,w,h);}}
  atmosphere(ms,s,size);
  if(ms<6200){glow(w*.5,h*.475+size*.435,size*.40,size*.037,'20,45,38',(1-s.dark)*Math.max(...s.bars)*.10*s.opacity);drawMark(ms,s,size);impulse(ms,size,s);}else renderer?.render(s);
  if(s.grid>0){glow(w*.73,h*.8,w*.7,h*.7,'30,92,133',.10*s.grid);mesh(reduced.matches?0:time,.12*s.grid);}
 }
 replay.addEventListener('click',()=>inIntro?finish():start());motion.addEventListener('click',()=>setPaused(!paused));
 home.addEventListener('keydown',e=>{if(e.key==='Escape'&&inIntro)finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
 if(menu)new MutationObserver(()=>{if(menu.open){menuWasPaused=paused;setPaused(true);}else if(!menuWasPaused)setPaused(false);}).observe(menu,{attributes:true,attributeFilter:['open']});
 reduced.addEventListener('change',()=>{if(reduced.matches){finish();setPaused(true);}else setPaused(false);replay.hidden=reduced.matches;motion.hidden=reduced.matches;});
 addEventListener('resize',resize);resize();
 finish();
 if(ctx&&!reduced.matches){replay.hidden=false;motion.hidden=false;schedule();}
}
