// One clock for the 3D renderer, pre-rendered reserve, glow and interface reveal.
export const DURATION=8400;
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const back=x=>{x=clamp(x);return 1+2.45*Math.pow(x-1,3)+1.45*Math.pow(x-1,2);};
export function logoState(ms){
 const bars=[580,1050,1520].map(s=>ms<s?0:Math.min(1.09,back((ms-s)/900)));
 const press=Math.exp(-Math.pow((ms-4050)/140,2)),bounce=Math.exp(-Math.pow((ms-4270)/190,2));
 return {bars,squash:[1+press*.13-bounce*.065,1-press*.19+bounce*.13],zoom:1+.11*smooth((ms-3220)/800),opacity:1-smooth((ms-5550)/650),dark:smooth((ms-4210)/1120),time:ms/1000};
}
export function sceneState(ms){return {...logoState(ms),grid:smooth((ms-5890)/900),title:smooth((ms-6690)/1100),nav:smooth((ms-7040)/1020),head:smooth((ms-6530)/1080)};}
