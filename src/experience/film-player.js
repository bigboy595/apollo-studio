import {logoFilm as film} from './logo-film.js';
// Only the current sheet and its neighbours are decoded (under 64 MB).
export function createFilmPlayer(){
 const loaded=new Map(),pending=new Map(),failed=new Set();let disposed=false;
 function load(index){
  if(index<0||index>=film.sheets.length||failed.has(index))return Promise.resolve();
  if(loaded.has(index))return Promise.resolve(loaded.get(index));
  if(pending.has(index))return pending.get(index);
  const image=new Image();image.src=film.sheets[index];
  const task=image.decode().then(()=>{if(!disposed)loaded.set(index,image);return image;}).catch(()=>{failed.add(index);return null;}).finally(()=>pending.delete(index));
  pending.set(index,task);return task;
 }
 return {
  async prepare(ms=0){disposed=false;const index=Math.floor(ms/1000*film.fps/film.perSheet);await Promise.all([load(index),load(index+1)]);},
  draw(ctx,ms,x,y,width,height){
   const frame=Math.min(film.count-1,Math.max(0,Math.floor(ms/1000*film.fps))),index=Math.floor(frame/film.perSheet);
   load(index);load(index+1);load(index+2);
   for(const [key,img] of loaded)if(key<index-1||key>index+2){loaded.delete(key);img.src='';}
   const image=loaded.get(index);if(!image)return false;
   const local=frame%film.perSheet;ctx.drawImage(image,(local%film.columns)*film.size,Math.floor(local/film.columns)*film.size,film.size,film.size,x,y,width,height);return true;
  },
  release(){disposed=true;for(const img of loaded.values())img.src='';loaded.clear();}
 };
}
