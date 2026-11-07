// Local WebGL studio: bevelled extruded Apollo silhouettes and analytic softbox lighting.
// No external textures, models, libraries or telemetry.
const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`
precision highp float;
uniform vec2 resolution;
uniform vec3 bars;
uniform vec2 squash;
uniform float zoom,opacity,dark,time;
const float PI=3.14159265;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float trapezoid(vec2 p,float bottom,float top,float height){
 vec2 k1=vec2(top,height),k2=vec2(top-bottom,2.*height);p.x=abs(p.x);
 vec2 ca=vec2(max(0.,p.x-((p.y<0.)?bottom:top)),abs(p.y)-height);
 vec2 cb=p-k1+k2*clamp(dot(k1-p,k2)/dot(k2,k2),0.,1.);
 float signum=(cb.x<0.&&ca.y<0.)?-1.:1.;
 return signum*sqrt(min(dot(ca,ca),dot(cb,cb)));
}
float column(vec3 p,float center,float height,float bottom,float amount,float index){
 if(amount<.004)return 20.;
 float grown=height*amount;
 float age=max(0.,time-(.58+.47*index));
 float arrival=sin(age*7.5)*exp(-age*2.5)*.12;
 float dance=smoothstep(2.35,2.7,time)*(1.-smoothstep(3.5,3.95,time));
 float leap=pow(max(sin((time-2.4-index*.16)*4.4),0.),2.)*.27*dance;
 float tilt=sin(age*8.5)*exp(-age*2.3)*.16+sin(time*3.8-index*.7)*.055*dance;
 p.x-=center+sin(time*3.+index)*.045*dance;
 p.y-=-1.30+grown*.5+arrival+leap;
 p.xy=rot(tilt)*p.xy;
 p.xz=rot(-.26*exp(-age*1.5)+sin(time*2.-index)*.035*dance)*p.xz;
 float d=trapezoid(p.xy,bottom-.035,.235-.035,grown*.5-.035);
 vec2 q=vec2(d,abs(p.z)-.185);
 return min(max(q.x,q.y),0.)+length(max(q,0.))-.045;
}
float scene(vec3 p){
 p/=vec3(zoom*squash.x,zoom*squash.y,zoom);
 float a=column(p,-.88,1.83,.410,bars.x,0.);
 float b=column(p,0.,2.22,.410,bars.y,1.);
 float c=column(p,.91,2.61,.490,bars.z,2.);
 return min(a,min(b,c))*min(squash.x,squash.y)*zoom;
}
vec3 normalAt(vec3 p){
 vec2 e=vec2(.0015,-.0015);
 return normalize(e.xyy*scene(p+e.xyy)+e.yyx*scene(p+e.yyx)+e.yxy*scene(p+e.yxy)+e.xxx*scene(p+e.xxx));
}
float ambientOcclusion(vec3 p,vec3 n){
 float value=0.,weight=1.;
 for(int i=1;i<=4;i++){float h=.045*float(i);value+=(h-scene(p+n*h))*weight;weight*=.58;}
 return clamp(1.-value*2.8,.45,1.);
}
float shadow(vec3 ro,vec3 rd){
 float result=1.,t=.025;
 for(int i=0;i<15;i++){float d=scene(ro+rd*t);result=min(result,9.*d/t);t+=clamp(d,.025,.25);if(d<.001||t>3.)break;}
 return clamp(result,.22,1.);
}
vec3 environment(vec3 r){
 float sweep=-.72+1.4*(.5+.5*sin(time*1.7-1.));
 r.xz=rot(.09*sin(time*1.4))*r.xz;
 // Large rectangular studio sources reflected in the polished material.
 float key=exp(-pow((r.x+.48)/.40,4.)-pow((r.y-.56)/.65,4.));
 float strip=exp(-pow((r.x-.72)/.13,2.)-pow((r.y-.08)/.75,4.));
 float ceiling=pow(max(r.y,0.),5.);
 vec3 base=mix(vec3(.10,.13,.15),vec3(.40,.49,.46),smoothstep(-.5,.8,r.y));
 float traveling=exp(-pow((r.x-sweep)/.15,2.)-pow((r.y-.16)/.9,4.));
 float cyan=exp(-pow((r.x+.6-.12*sin(time*2.))/ .21,2.)-pow((r.y+.1)/.85,4.));
 return base+vec3(2.9,3.1,2.8)*key+vec3(.3,2.,2.8)*strip+vec3(.6)*ceiling+vec3(2.2,2.8,1.8)*traveling+vec3(.06,.75,1.5)*cyan;
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec2 boxHit(vec3 ro,vec3 rd){
 vec3 a=(-vec3(2.15,2.08,.95)-ro)/rd,b=(vec3(2.15,2.08,.95)-ro)/rd;
 vec3 lo=min(a,b),hi=max(a,b);return vec2(max(max(lo.x,lo.y),lo.z),min(min(hi.x,hi.y),hi.z));
}
void main(){
 vec2 uv=(2.*gl_FragCoord.xy-resolution)/resolution.y;
 vec3 ro=vec3(0.,.07,7.2),rd=normalize(vec3(uv,-4.1));
 float orbit=smoothstep(.4,3.6,time);
 float yaw=mix(-.64,-.12,orbit)+.045*sin(time*1.6),pitch=.035+.055*sin(time*.7);
 ro.xz=rot(yaw)*ro.xz;rd.xz=rot(yaw)*rd.xz;
 ro.yz=rot(pitch)*ro.yz;rd.yz=rot(pitch)*rd.yz;
 vec2 hit=boxHit(ro,rd);if(hit.y<max(hit.x,0.)){gl_FragColor=vec4(0.);return;}
 float t=max(hit.x,0.),d=1.;
 for(int i=0;i<64;i++){d=scene(ro+rd*t);if(d<.0012||t>hit.y)break;t+=d*.87;}
 if(d>.004||t>hit.y){gl_FragColor=vec4(0.);return;}
 vec3 p=ro+rd*t,n=normalAt(p),v=-rd;
 float ao=ambientOcclusion(p,n);
 vec3 key=normalize(vec3(-3.3+2.*sin(time*1.4),4.8,5.2)),fill=normalize(vec3(4.,1.8+sin(time),3.)),rim=normalize(vec3(1.5,3.,-4.));
 float shade=shadow(p+n*.008,key);
 float ndl=max(dot(n,key),0.);
 vec3 hue=mix(vec3(.008,.40,.53),vec3(.38,.68,.035),smoothstep(-1.2,1.25,p.x));
 hue=mix(hue,vec3(.4,.9,.65),.035);
 float wrap=clamp((dot(n,key)+.35)/1.35,0.,1.);
 vec3 diffuse=hue*(.19+wrap*.71*shade+max(dot(n,fill),0.)*.21)*ao;
 vec3 refl=reflect(rd,n);vec3 env=environment(refl);
 float fresnel=.12+.82*pow(1.-max(dot(n,v),0.),4.);
 vec3 halfDirection=normalize(key+v);
 float spec=pow(max(dot(n,halfDirection),0.),82.);
 vec3 color=diffuse+env*(.18+fresnel*.62)+vec3(1.2)*spec*shade;
 color+=vec3(.22,.42,.43)*pow(max(dot(n,rim),0.),3.)*(.10+.45*dark);
 float stripe=exp(-pow((p.y-p.x*.32-(mod(time*1.7,5.)-2.5))/.15,2.));
 color+=vec3(.7,1.,.83)*stripe*.36;
 color+=hue*pow(1.-max(dot(n,v),0.),3.)*(.3+1.7*dark);
 color*=mix(1.05,.48,dark);
 color=pow(aces(color*1.05),vec3(1./2.2));
 float edge=1.-smoothstep(.0015,.004,d);
 gl_FragColor=vec4(color,opacity*edge);
}`;
export function createLogoRenderer(canvas){
 let gl;
 try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{return null;}
 if(!gl)return null;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn('Apollo studio shader:',gl.getShaderInfoLog(s));gl.deleteShader(s);return null;}return s;}
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
 if(!vs||!fs)return null;
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn('Apollo studio program:',gl.getProgramInfoLog(program));return null;}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const uniforms=Object.fromEntries(['resolution','bars','squash','zoom','opacity','dark','time'].map(n=>[n,gl.getUniformLocation(program,n)]));
 let lost=false,cleared=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
 return {
  get ready(){return !lost;},
  resize(){const ratio=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);gl.viewport(0,0,canvas.width,canvas.height);cleared=false;},
  render({bars,squash,zoom,opacity,dark,time}){if(lost)return;if(opacity<=.001){if(!cleared){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);cleared=true;}return;}cleared=false;gl.useProgram(program);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform3f(uniforms.bars,...bars);gl.uniform2f(uniforms.squash,...squash);gl.uniform1f(uniforms.zoom,zoom);gl.uniform1f(uniforms.opacity,opacity);gl.uniform1f(uniforms.dark,dark);gl.uniform1f(uniforms.time,time);gl.drawArrays(gl.TRIANGLES,0,6);}
 };
}
