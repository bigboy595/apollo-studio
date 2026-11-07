// Compact, keyboard-accessible workspaces with real URLs for individual services.
for(const root of document.querySelectorAll('[data-switcher]')){
 const links=[...root.querySelectorAll('[data-view]')],panels=[...root.querySelectorAll('[data-panel]')];
 if(!links.length||!panels.length)continue;
 function select(id,update=false){const panel=panels.find(p=>p.id===id);if(!panel)return;for(const p of panels){p.hidden=p!==panel;p.toggleAttribute('data-active',p===panel);}for(const a of links){const active=a.dataset.view===id;a.setAttribute('aria-selected',String(active));a.tabIndex=active?0:-1;}if(update)history.replaceState(null,'','#'+id);}
 for(const [index,a] of links.entries()){
  a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;e.preventDefault();select(a.dataset.view,true);});
  a.addEventListener('keydown',e=>{let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(index+1)%links.length;else if(['ArrowUp','ArrowLeft'].includes(e.key))next=(index+links.length-1)%links.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=links.length-1;else return;e.preventDefault();links[next].focus();select(links[next].dataset.view,true);});
 }
 const fromHash=()=>{let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}if(panels.some(p=>p.id===id))select(id);};
 select(links[0].dataset.view);fromHash();addEventListener('hashchange',fromHash);
}
