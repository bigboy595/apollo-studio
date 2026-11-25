"""Build the Garage launch films, stills and original soundtrack.
Run from project root: python scripts/render/garage-films.py CAPTURES HERO_PNG
CAPTURES contains the local Garage interface shots made with a test account.
"""
from functools import lru_cache
from pathlib import Path
from tempfile import TemporaryDirectory
import math
import subprocess
import sys
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

CAP, HERO = map(Path, sys.argv[1:3])
OUT = Path('dist/assets/garage')
FONT = Path('dist/assets')
W, H, FPS = 1152, 648, 24
L = Image.Resampling.LANCZOS
B = Image.Resampling.BICUBIC
INK = (3, 6, 7)
MINT = (202, 241, 178)
BLACK = Image.new('RGB', (W, H), INK)

@lru_cache(None)
def font(size,weight=600):
    return ImageFont.truetype(str(FONT/f'manrope-{weight}.ttf'),size)

def ease(x):
    x=max(0,min(1,x))
    return x*x*(3-2*x)

def type_at(layer, xy, text, size, color=(241,248,245), anchor='lt', weight=600):
    ImageDraw.Draw(layer).text(xy,text,font=font(size,weight),fill=color,anchor=anchor)

@lru_cache(None)
def glow(rgb):
    yy,xx=np.mgrid[0:H,0:W]
    r=np.exp(-3.3*((xx/W-.56)**2/.48 + (yy/H-.56)**2/.27))
    v=np.exp(-5*((xx/W-.16)**2/.75 + (yy/H-.2)**2/.65))
    return Image.fromarray((np.array(INK)+r[:,:,None]*np.array(rgb)+v[:,:,None]*np.array((3,6,9))).astype('uint8'))

def crop(name,box):
    return Image.open(CAP/(name+'.jpg')).convert('RGB').crop(box)

hero=Image.open(HERO).convert('RGB')
hero_web=hero.copy()
hero_web.thumbnail((1600,900),L)
hero_web.save(OUT/'garage-reveal.webp',quality=89,method=6)
print('Hero:',hero_web.size,flush=True)

# Preserve the pixels of the original application. These crops put the
# related work and service interval next to each other for the catalogue still.
map_shot=crop('01-owner',(35,463,1298,925))
nodes=crop('02-part',(35,185,867,689))
history=crop('03-history',(35,354,1300,624))
soon=crop('01-owner',(400,370,899,447))
staff=crop('04-staff',(35,94,1328,653))
editor=crop('05-new',(361,66,1002,872))
saved=crop('06-saved',(347,198,1328,690))
result=crop('07-client-result',(35,185,1299,691))
notice=crop('07-client-result',(890,478,1268,633))
sedan=Image.open(OUT/'sedan.webp').convert('RGBA')

def rounded(im,rect,l,radius=13,edge=(100,136,137)):
    x,y,w,h=map(int,rect)
    if w<1 or h<1:return
    im=ImageOps.fit(im,(w,h),L)
    mask=Image.new('L',(w,h))
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=radius,fill=255)
    l.paste(im,(x,y),mask)
    ImageDraw.Draw(l).rounded_rectangle((x,y,x+w-1,y+h-1),radius=radius,outline=edge,width=1)

def screen_still(im,name):
    l=Image.new('RGB',(1140,444),(8,17,19))
    pic=ImageOps.contain(im,(1110,420),L)
    rounded(pic,((1140-pic.width)//2,(444-pic.height)//2,pic.width,pic.height),l,10)
    l.save(OUT/(name+'.webp'),quality=86,method=6)

screen_still(map_shot,'screen-map')
screen_still(saved,'screen-staff')
s=Image.new('RGB',(1140,444),(8,17,19))
rounded(history,(19,18,1102,234),s,10)
rounded(soon,(19,288,680,115),s,10)
s.save(OUT/'screen-history.webp',quality=86,method=6)

@lru_cache(None)
def surface(im_key):
    im=dict(map=map_shot,part=nodes,staff=staff,edit=editor,saved=saved,result=result)[im_key]
    im=im.resize((min(1040,im.width),round(im.height*min(1040,im.width)/im.width)),L)
    w,h=im.size
    tray=Image.new('RGBA',(w+14,h+14))
    d=ImageDraw.Draw(tray)
    d.rounded_rectangle((0,0,w+13,h+13),radius=18,fill=(11,19,23),outline=(110,145,150),width=2)
    mask=Image.new('L',(w,h))
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=12,fill=255)
    tray.paste(im,(7,7),mask)
    return tray

def plane(layer,key,center,width,yaw=0,pitch=0):
    src=surface(key)
    h=width*src.height/src.width
    f=1300
    dest=[]
    for px,py in [(-width/2,-h/2),(width/2,-h/2),(width/2,h/2),(-width/2,h/2)]:
        xr=px*math.cos(yaw)
        yr=py*math.cos(pitch)+px*math.sin(yaw)*math.sin(pitch)
        zr=px*math.sin(yaw)*math.cos(pitch)-py*math.sin(pitch)
        dest.append((center[0]+xr*f/(f+zr),center[1]+yr*f/(f+zr)))
    a=[];v=[]
    for (x,y),(u,b) in zip(dest,[(0,0),(src.width,0),(src.width,src.height),(0,src.height)]):
        a.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-b*x,-b*y]])
        v.extend([u,b])
    transform=tuple(np.linalg.solve(np.asarray(a),np.asarray(v)))
    shot=src.transform((W,H),Image.Transform.PERSPECTIVE,transform,resample=B)
    layer.paste(shot,(0,0),shot)

def window(t,zoom,center):
    iw,ih=hero.size
    f=1.0/zoom
    width=min(iw,ih*W/H)*f
    height=width*H/W
    x,y=center
    return hero.transform((W,H),Image.Transform.EXTENT,(x*iw-width/2,y*ih-height/2,x*iw+width/2,y*ih+height/2),B)

def lower_shade(l, strength=.9):
    band=Image.new('L',(1,H))
    band.putdata([int(255*strength*ease((y/H-.45)/.55)) for y in range(H)])
    l.paste(INK,(0,0,W,H),band.resize((W,H)))

def opening(t):
    e=ease(t)
    l=window(t,1.02+.20*(1-e),(.62-.10*e,.52-.01*e))
    l=Image.blend(BLACK,l,.21+.79*ease(t*2.5))
    lower_shade(l,.93)
    type_at(l,(W//2,516+int(10*(1-e))),'У машины есть память.',56,anchor='mt')
    return l

def ring(layer,x,y,t,color=MINT):
    q=1-(1-t)**2
    overlay=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(overlay)
    r=round(7+34*q)
    d.ellipse((x-r,y-r,x+r,y+r),outline=(*color,round(200*(1-t))),width=2)
    d.ellipse((x-4,y-4,x+4,y+4),fill=(*color,220))
    layer.paste(overlay,(0,0),overlay)

def map_scene(t):
    l=glow((15,36,35)).copy()
    e=ease(t)
    type_at(l,(W//2,58),'Автомобиль на карте.',49,anchor='mt')
    plane(l,'map',(W//2+46*(1-e),352+26*(1-e)),999+65*e,.29*(1-e),-.10+.10*e)
    if .42<t<.92:ring(l,235,444,(t-.42)/.50)
    return l

def part_scene(t):
    l=glow((11,32,39)).copy()
    e=ease(t)
    plane(l,'part',(388-14*e,320),660+81*e,-.15+.05*e,-.035)
    # The real record stays legible as a large pull-out, rather than a new UI mock.
    y=269+round(26*(1-e))
    rounded(notice,(684,y,422,173),l,13,(180,139,142))
    lower_shade(l,.65)
    type_at(l,(58,544),'От узла к детали.',48)
    return l

def history_scene(t):
    l=glow((18,29,31)).copy()
    e=ease(t)
    type_at(l,(W//2,65),'Что было. Что дальше.',50,anchor='mt')
    rounded(history,(round(42-22*(1-e)),163,1069,228),l,15)
    rounded(soon,(round(454+90*(1-e)),421,638,100),l,12)
    return l

def staff_intro(t):
    l=glow((23,15,20)).copy()
    e=ease(t)
    type_at(l,(W//2,62),'Начинается у мастера.',47,anchor='mt')
    plane(l,'staff',(W//2-44*(1-e),353),1000+42*e,-.20*(1-e),.07)
    if .38<t<.92:ring(l,1004,363,(t-.38)/.54,(246,198,174))
    return l

def edit_scene(t):
    l=glow((22,19,26)).copy()
    e=ease(t)
    plane(l,'edit',(843+60*(1-e),326),411+.9*t,.14*(1-e),-.055)
    type_at(l,(54,179),'Точное место.',54)
    type_at(l,(54,245),'Точная запись.',54,MINT)
    type_at(l,(57,351),'Задняя ось  /  Справа',25,(196,217,203))
    type_at(l,(57,394),'Втулки стабилизатора',25,(196,217,203))
    if .67<t<.97:ring(l,1001,558,(t-.67)/.3,(246,198,174))
    return l

def owner_result(t):
    l=glow((13,29,34)).copy()
    e=ease(t)
    type_at(l,(W//2,61),'Остаётся у владельца.',49,anchor='mt')
    plane(l,'result',(W//2,354),1000+68*e,.11*(1-e),-.04)
    if .4<t<.94:ring(l,985,395,(t-.4)/.54)
    return l

def closing(t):
    l=glow((10,18,19)).copy()
    e=ease(t)
    im=sedan.resize((875,287),L)
    l.paste(im,(135,278+round(11*(1-e))),im)
    type_at(l,(W//2,115),'Apollo Garage',78,anchor='mt',weight=800)
    type_at(l,(W//2,224),'Сервисная история автомобиля.',26,(198,226,213),anchor='mt')
    return l

def sound(path,seconds,hits):
    """A quiet original chord bed + per-shot glass tones. No third-party audio."""
    rate=44100
    t=np.arange(round(rate*seconds))/rate
    x=np.zeros_like(t)
    for i,f in enumerate((55,82.41,110,164.81,220,329.63)):
        drift=.37*np.sin(2*np.pi*(.06+i*.013)*t)
        x+=(.016/(1+i*.18))*(np.sin(2*np.pi*f*t+drift)+.25*np.sin(2*np.pi*2*f*t))
    for i,at in enumerate(hits):
        d=t-at
        env=np.where(d>0,(1-np.exp(-np.maximum(d,0)*75))*np.exp(-np.maximum(d,0)*3.9),0)
        f=(440,523.25,659.26,698.46,587.33)[i%5]
        x+=.048*env*(np.sin(2*np.pi*f*d)+.21*np.sin(2*np.pi*f*2.002*d))
        u=t-at+.30
        air=np.maximum(0,1-np.abs(u/.38))**2
        x+=.025*air*np.sin(2*np.pi*(70*u+180*u*u))
    env=np.minimum(1,t/.65)*np.minimum(1,(seconds-t)/.77)
    s=np.column_stack((x*env, .91*x*env+np.sin(t*2*np.pi*111)*env*.005))
    with wave.open(str(path),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate)
        f.writeframes(np.int16(np.clip(s,-1,1)*32767).tobytes())

def render(stem,seq,poster):
    file=OUT/(stem+'-film.mp4')
    poster(.53).save(OUT/(stem+'-film-poster.webp'),quality=88,method=6)
    counts=[round(d*FPS) for _,d in seq]
    seconds=sum(counts)/FPS
    hits=np.cumsum(counts)[:-1]/FPS
    with TemporaryDirectory() as tmp:
        wav=Path(tmp)/'score.wav'
        sound(wav,seconds,hits)
        cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(wav),'-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','80k','-movflags','+faststart','-shortest',str(file)]
        ff=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        for i,((fn,d),n) in enumerate(zip(seq,counts)):
            for j in range(n):
                p=j/(n-1)
                im=fn(p)
                # Hard cuts for actions; quick fades only at the entrance and exit.
                if i==0 and j<10:im=Image.blend(BLACK,im,.30+.70*ease(j/10))
                if i==len(seq)-1 and j>=n-10:im=Image.blend(im,BLACK,.72*ease((j-n+10)/10))
                ff.stdin.write(im.tobytes())
        ff.stdin.close()
        if ff.wait():raise RuntimeError('Encoding failed')
    print(file,seconds,file.stat().st_size,flush=True)

targets=sys.argv[3:] or ['owner','service']
if 'owner' in targets:render('garage-owner',[(opening,3.2),(map_scene,3.3),(part_scene,3.25),(history_scene,3.8),(staff_intro,2.35),(owner_result,3.15),(closing,2.75)],opening)
if 'service' in targets:render('garage-service',[(staff_intro,2.65),(edit_scene,3.9),(owner_result,3.35),(closing,2.1)],owner_result)
