"""Bake the WebGL logo's studio lighting with Mesa EGL; no browser or network needed."""
import os,ctypes as c,re,json,subprocess,time
from pathlib import Path
from PIL import Image
os.environ.setdefault('EGL_PLATFORM','surfaceless')
ROOT=Path(__file__).resolve().parents[2]
e=c.CDLL('libEGL.so.1');g=c.CDLL('libGL.so.1')
P=c.c_void_p;I=c.c_int;U=c.c_uint;F=c.c_float

def fn(lib,name,result,args):
 f=getattr(lib,name);f.restype=result;f.argtypes=args;return f
D=fn(e,'eglGetDisplay',P,[P])(None);major=I();minor=I()
assert fn(e,'eglInitialize',U,[P,c.POINTER(I),c.POINTER(I)])(D,c.byref(major),c.byref(minor))
attrs=(I*13)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
config=P();count=I();assert fn(e,'eglChooseConfig',U,[P,c.POINTER(I),c.POINTER(P),I,c.POINTER(I)])(D,attrs,c.byref(config),1,c.byref(count)) and count.value
fn(e,'eglBindAPI',U,[U])(0x30A2)
W,H=512,512
surface=fn(e,'eglCreatePbufferSurface',P,[P,P,c.POINTER(I)])(D,config,(I*5)(0x3057,W,0x3056,H,0x3038))
context=fn(e,'eglCreateContext',P,[P,P,P,c.POINTER(I)])(D,config,None,(I*1)(0x3038))
assert context and surface and fn(e,'eglMakeCurrent',U,[P,P,P,P])(D,surface,surface,context)
create_shader=fn(g,'glCreateShader',U,[U]);shader_source=fn(g,'glShaderSource',None,[U,I,c.POINTER(c.c_char_p),c.POINTER(I)]);compile_shader=fn(g,'glCompileShader',None,[U]);shader_iv=fn(g,'glGetShaderiv',None,[U,U,c.POINTER(I)]);shader_log=fn(g,'glGetShaderInfoLog',None,[U,I,c.POINTER(I),c.c_char_p])
source=(ROOT/'src/experience/logo-renderer.js').read_text()
vs=re.search(r'const vertex=`(.*?)`;',source,re.S).group(1)
fs=re.search(r'const fragment=`(.*?)`;',source,re.S).group(1).replace('precision highp float;','')
def compile(kind,code):
 s=create_shader(kind);raw=c.c_char_p(('#version 120\n'+code).encode());shader_source(s,1,c.byref(raw),None);compile_shader(s);status=I();shader_iv(s,0x8B81,c.byref(status))
 if not status.value:
  log=c.create_string_buffer(8192);shader_log(s,len(log),None,log);raise RuntimeError(log.value.decode())
 return s
program=fn(g,'glCreateProgram',U,[])();attach=fn(g,'glAttachShader',None,[U,U]);attach(program,compile(0x8B31,vs));attach(program,compile(0x8B30,fs));fn(g,'glLinkProgram',None,[U])(program)
status=I();fn(g,'glGetProgramiv',None,[U,U,c.POINTER(I)])(program,0x8B82,c.byref(status));assert status.value,'Program link failed'
fn(g,'glUseProgram',None,[U])(program)
buffer=U();fn(g,'glGenBuffers',None,[I,c.POINTER(U)])(1,c.byref(buffer));fn(g,'glBindBuffer',None,[U,U])(0x8892,buffer)
vertices=(F*12)(-1,-1,1,-1,-1,1,-1,1,1,-1,1,1);fn(g,'glBufferData',None,[U,c.c_ssize_t,P,U])(0x8892,c.sizeof(vertices),vertices,0x88E4)
position=fn(g,'glGetAttribLocation',I,[U,c.c_char_p])(program,b'position');fn(g,'glEnableVertexAttribArray',None,[U])(position);fn(g,'glVertexAttribPointer',None,[U,I,U,U,I,P])(position,2,0x1406,0,0,None)
loc=fn(g,'glGetUniformLocation',I,[U,c.c_char_p]);u1=fn(g,'glUniform1f',None,[I,F]);u2=fn(g,'glUniform2f',None,[I,F,F]);u3=fn(g,'glUniform3f',None,[I,F,F,F])
uniforms={name:loc(program,name.encode()) for name in ['resolution','bars','squash','zoom','opacity','dark','time']}
u2(uniforms['resolution'],W,H);u2(uniforms['squash'],1,1)
for name,value in [('zoom',1),('opacity',1),('dark',0),('time',2.4)]:u1(uniforms[name],value)
fn(g,'glViewport',None,[I,I,I,I])(0,0,W,H)
clear=fn(g,'glClear',None,[U]);fn(g,'glClearColor',None,[F,F,F,F])(0,0,0,0);draw=fn(g,'glDrawArrays',None,[U,I,I]);read=fn(g,'glReadPixels',None,[I,I,I,I,U,U,P]);finish=fn(g,'glFinish',None,[])
out=ROOT/'dist/assets/intro/film';out.mkdir(parents=True,exist_ok=True)
frames=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/render/film-timeline.mjs')]))
sheets=[];sheet=None;started=time.monotonic()
for i,state in enumerate(frames):
 if i%16==0:sheet=Image.new('RGBA',(W*4,H*4))
 u3(uniforms['bars'],*state['bars']);u2(uniforms['squash'],*state['squash'])
 for key in ['zoom','dark','time']:u1(uniforms[key],state[key])
 u1(uniforms['opacity'],1)
 clear(0x4000);draw(4,0,6);finish();raw=(c.c_ubyte*(W*H*4))();read(0,0,W,H,0x1908,0x1401,raw)
 image=Image.frombytes('RGBA',(W,H),bytes(raw)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 sheet.paste(image,((i%4)*W,((i%16)//4)*H))
 if i%16==15 or i==len(frames)-1:
  name=f"scene-{i//16:02}.webp";temporary=out/(name+'.tmp');sheet.save(temporary,'WEBP',quality=88,method=6,alpha_quality=95);temporary.replace(out/name)
  sheets.append('/assets/intro/film/'+name);print(name,(out/name).stat().st_size,round(time.monotonic()-started,1),flush=True)
 if i in [42,78,113,130]:
  bg=Image.new('RGBA',(W,H),(245,246,242,255) if state['dark']<.5 else (6,10,12,255));bg.alpha_composite(image)
  bg.convert('RGB').save(ROOT/f'docs/film-render-{i}.jpg',quality=93)
(ROOT/'src/experience/logo-film.js').write_text('export const logoFilm='+json.dumps({'size':W,'fps':24,'count':len(frames),'perSheet':16,'columns':4,'sheets':sheets},separators=(',',':'))+';\n')
print('Cinematic logo sequence baked.',flush=True)
