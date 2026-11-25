"""Render the Garage motion campaign. python scripts/render/garage-motion.py CAPTURES"""
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import lru_cache
import math, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageOps, ImageFont, ImageFilter

W,H,FPS=1152,648,24
ROOT=Path('dist/assets/garage')
CAP=Path(sys.argv[1])
L=Image.Resampling.LANCZOS
B=Image.Resampling.BICUBIC
INK=(4,8,10)
MINT=(209,249,170)
ICE=(119,222,240)
WHITE=(242,251,247)
Y,X=np.mgrid[0:H,0:W].astype(np.float32)
SCALE=np.array((1.,1.,1.),dtype=np.float32)
black=Image.new('RGB',(W,H),INK)
hero=Image.open(ROOT/'garage-reveal.webp').convert('RGB')
car=Image.open(ROOT/'sedan.webp').convert('RGBA')

def smooth(t):
    t=min(1,max(0,t))
    return t*t*(3-2*t)

def window(t,a,b):
    return smooth((t-a)/(b-a))

def envelope(t,a,b,c,d):
    return window(t,a,b)*(1-window(t,c,d))

def pulse(t,at=.4,width=.14):
    return max(0,1-abs(t-at)/width)**2

def shot(n,box):
    return Image.open(CAP/(n+'.jpg')).convert('RGB').crop(box)

images={
 'map':shot('01-owner',(35,506,1299,925)),
 'part':shot('07-client-result',(35,185,866,689)),
 'note':shot('07-client-result',(890,478,1267,632)),
 'history':shot('03-history',(36,354,1295,616)),
 'soon':shot('01-owner',(400,370,899,447)),
 'form':shot('05-new',(364,65,1000,870)),
 'saved':shot('06-saved',(348,198,1325,691)),
}
@lru_cache(None)
def face(size,weight=600):
    return ImageFont.truetype(str(ROOT.parent/f'manrope-{weight}.ttf'),size)

def text(layer,x,y,value,size=48,color=WHITE,align='lt',weight=600):
    ImageDraw.Draw(layer).text((x,y),value,fill=color,font=face(size,weight),anchor=align)

def label(l,t,name,secondary=None):
    a=window(t,0,.16)
    if a<=0:return
    overlay=Image.new('RGBA',(W,H))
    text(overlay,W/2,51+round(14*(1-a)),name,46,(*WHITE,round(255*a)),'mt')
    if secondary:text(overlay,W/2,110,secondary,16,(*MINT,round(240*a)),'mt',800)
    l.paste(overlay,(0,0),overlay)

@lru_cache(None)
def background(tone):
    a=np.exp(-(((X-W*.52)/520)**2+((Y-H*.67)/270)**2)*1.4)
    b=np.exp(-(((X-W*.2)/430)**2+((Y-H*.3)/240)**2)*1.2)
    p=np.empty((H,W,3),np.float32)
    for i,k in enumerate(tone):p[:,:,i]=INK[i]+a*k+b*(4,4,7)[i]
    return Image.fromarray(p.astype(np.uint8))

@lru_cache(None)
def tray(key):
    im=images[key]
    if im.width>1100:im=ImageOps.contain(im,(1100,1000),L)
    width,height=im.size
    result=Image.new('RGBA',(width+10,height+10))
    mask=Image.new('L',im.size)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,width-1,height-1),11,fill=255)
    d=ImageDraw.Draw(result)
    d.rounded_rectangle((0,0,width+9,height+9),15,fill=(13,24,26),outline=(130,171,167),width=2)
    result.paste(im,(5,5),mask)
    return result

def project(l,key,x,y,w,yaw=0,pitch=0,fade=1):
    if fade<=.006:return
    src=tray(key);h=w*src.height/src.width;z=1150
    corners=[]
    for px,py in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]:
        ax=px*math.cos(yaw)
        ay=py*math.cos(pitch)+px*math.sin(yaw)*math.sin(pitch)
        az=px*math.sin(yaw)*math.cos(pitch)-py*math.sin(pitch)
        corners.append((x+ax*z/(z+az),y+ay*z/(z+az)))
    A=[];v=[]
    for (a,b),(c,d) in zip(corners,[(0,0),(src.width,0),(src.width,src.height),(0,src.height)]):
        A.extend([[a,b,1,0,0,0,-c*a,-c*b],[0,0,0,a,b,1,-d*a,-d*b]])
        v.extend([c,d])
    shaped=src.transform((W,H),Image.Transform.PERSPECTIVE,tuple(np.linalg.solve(A,v)),B)
    alpha=shaped.getchannel('A')
    if fade<.998:alpha=alpha.point(lambda k:round(k*fade))
    shade=alpha.filter(ImageFilter.GaussianBlur(24)).point(lambda k:k//3)
    l.paste((1,3,4),(0,0,W,H),shade)
    l.paste(shaped,(0,0),alpha)

def light(l,x,y,boost=1,color=ICE,rx=200,ry=27):
    if boost<.015:return
    a=np.exp(-(((X-x)/rx)**2+((Y-y)/ry)**2)*1.7)*boost
    lum=np.array(l,dtype=np.float32)
    lum+=a[:,:,None]*np.array(color,dtype=np.float32)[None,None,:]*.43
    l.paste(Image.fromarray(np.minimum(lum,255).astype(np.uint8)))

def ring(l,x,y,t,start=.24,end=.58,color=MINT):
    q=(t-start)/(end-start)
    if not 0<q<1:return
    a=round(255*math.sin(math.pi*q)**.65)
    glow=Image.new('RGBA',(W,H));d=ImageDraw.Draw(glow)
    for f,k in [(.7,1), (1,.53), (1.7,.23)]:
        r=(11+37*smooth(q))*f
        d.ellipse((x-r,y-r,x+r,y+r),outline=(*color,round(a*k)),width=2)
    d.ellipse((x-4,y-4,x+4,y+4),fill=(*WHITE,a))
    l.paste(glow,(0,0),glow)
    light(l,x,y,a/530,color,60,46)

def streak(l,t,at=.5,color=ICE,y=340):
    q=(t-at+.14)/.28
    if not 0<q<1:return
    x=-105+1360*smooth(q)
    amp=math.sin(math.pi*q)**1.7
    light(l,x,y,amp*.63,color,210,14)
    v=Image.new('RGBA',(W,H));d=ImageDraw.Draw(v)
    for i,k in enumerate([.46,.25,.11]):
        off=i*4
        d.line((x-138+i*28,y+off,x+90-i*15,y+off-4),fill=(*color,round(190*amp*k)),width=1)
    l.paste(v,(0,0),v)

def car_scene(t,caption=True):
    # A light sweep follows the silhouette on a slow, continuous camera orbit approximation.
    q=math.sin(math.pi*t)**2
    iw,ih=hero.size
    ww=min(iw,ih*W/H)/(1+q*.054)
    hh=ww*H/W
    cx=iw*(.51-.017*q)
    cy=ih*(.53-.02*q)
    l=hero.transform((W,H),Image.Transform.EXTENT,(cx-ww/2,cy-hh/2,cx+ww/2,cy+hh/2),B)
    streak(l,t,.49,(174,237,226),345)
    light(l,250+650*window(t,0,1),479,.28*q,(97,180,187),300,32)
    if caption:
        shade=Image.new('L',(1,H))
        shade.putdata([round(238*smooth((y-358)/289)) for y in range(H)])
        l.paste(INK,(0,0,W,H),shade.resize((W,H)))
        text(l,W/2,535,'У машины есть память.',56,WHITE,'mt')
    return l

def map_scene(t,caption=True):
    l=background((12,34,42)).copy()
    q=math.sin(math.pi*t)**2
    if caption:label(l,t,'От машины — к детали.')
    y=350 if caption else 322
    project(l,'map',576+19*q,y,1002+30*q,.11-.17*q,-.045)
    ring(l,239,y+109,t,.12,.46)
    p=envelope(t,.26,.44,.76,.97)
    project(l,'note',860-36*p,y+103,310+71*p,.08*(1-p),.01,p)
    streak(l,t,.41,ICE,y+89)
    return l

def detail_scene(t,caption=True):
    l=background((16,27,37)).copy()
    if caption:label(l,t,'Замечание — у нужного узла.')
    e=window(t,0,.74)
    project(l,'part',401-45*e,340,738,.13-.08*e,-.05)
    p=window(t,.1,.54)
    project(l,'note',837+31*(1-p),362,417,-.13+.11*p,.025,p)
    ring(l,721,351,t,.34,.64,(250,191,184))
    light(l,780,399,.25*p,(233,135,141),175,73)
    return l

def work_scene(t,caption=True):
    l=background((27,23,34)).copy()
    q=math.sin(math.pi*t)**2
    x=521-153*q;y=333
    if caption:label(l,t,'Мастер фиксирует замечание.')
    project(l,'saved',x,y+18,894-88*q,-.06+.12*q,-.035)
    p=envelope(t,.13,.36,.78,.98)
    project(l,'form',895-95*p,330,290+61*p,.19-.19*p,-.03,p)
    ring(l,906,527,t,.52,.75,(250,181,156))
    light(l,880,434,.35*p,(241,156,148),130,95)
    return l

def result_scene(t,caption=True):
    l=background((15,33,35)).copy()
    q=window(t,0,.7)
    if caption:label(l,t,'Владелец видит ту же запись.')
    project(l,'part',405-23*q,345,719+31*q,.14-.12*q,-.02)
    project(l,'note',857,361,403+21*q,-.1+.08*q,.005,window(t,.11,.40))
    ring(l,870,365,t,.34,.61,MINT)
    streak(l,t,.48,MINT,403)
    return l

def history_scene(t,caption=True):
    l=background((18,36,35)).copy()
    q=math.sin(math.pi*t)**2
    if caption:label(l,t,'История и следующее ТО.')
    y=275 if caption else 247
    project(l,'history',549-57*q,y,960,.025+.04*q,.04)
    project(l,'soon',760+46*q,447-27*q,612+27*q,-.09+.03*q,-.04)
    ring(l,609+46*q,448-27*q,t,.28,.70,MINT)
    streak(l,t,.51,MINT,454)
    return l

def close_scene(t):
    l=background((12,24,25)).copy()
    q=window(t,0,.6)
    c=car.resize((868,284),L)
    l.paste(c,(143,270+round(12*(1-q))),c)
    text(l,W/2,112,'Apollo Garage',84,WHITE,'mt',800)
    text(l,W/2,217,'Сервисная история автомобиля',25,MINT,'mt')
    light(l,550,553,.25*q,ICE,410,26)
    return l

def soundtrack(path,seconds,beats):
    rate=44100
    t=np.arange(round(rate*seconds),dtype=np.float64)/rate
    slow=np.sin(2*np.pi*.18*t)
    x=np.zeros_like(t);r=np.zeros_like(t)
    for i,f in enumerate((49,73.42,98,146.83,196,293.66)):
        wave_s=2*np.pi*f*t+.36*np.sin(2*np.pi*(.11+i*.027)*t)
        x+=(.022/(1+i*.3))*np.sin(wave_s)*(1+.12*slow)
        r+=(.021/(1+i*.3))*np.sin(wave_s+.11*i)*(1-.09*slow)
    for i,at in enumerate(beats):
        u=np.maximum(t-at,0)
        env=(1-np.exp(-u*72))*np.exp(-u*4.8)
        f=(392,493.88,587.33,440,659.25)[i%5]
        hit=.064*env*(np.sin(2*np.pi*f*u)+.19*np.sin(2*np.pi*f*2.006*u))
        low=.041*np.exp(-u*6)*np.sin(2*np.pi*(52*u+7*(1-np.exp(-8*u))))
        x+=hit+low;r+=.93*hit+1.07*low
    edge=np.minimum(t/.7,1)*np.minimum((seconds-t)/.72,1)
    data=np.int16(np.clip(np.column_stack((x,r))*edge[:,None],-1,1)*32767)
    with wave.open(str(path),'wb') as stream:
        stream.setparams((2,2,rate,0,'NONE','not compressed'));stream.writeframes(data.tobytes())

def render(stem,seq,loop=False,poster_at=.28):
    lengths=[round(d*FPS) for _,d in seq]
    poster=seq[0][0](poster_at)
    if not loop:poster.save(ROOT/(stem+'-poster.webp'),quality=87,method=6)
    with TemporaryDirectory() as d:
        raw=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-']
        if loop:
            raw+=['-an','-vf','scale=720:405:flags=lanczos,pad=720:406']
        else:
            wav=Path(d)/'score.wav'
            soundtrack(wav,sum(lengths)/FPS,np.cumsum([0]+lengths[:-1])/FPS+.09)
            raw+=['-i',str(wav),'-c:a','aac','-b:a','88k','-shortest']
        raw+=['-c:v','libx264','-preset','fast','-crf','27' if loop else '24','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/(stem+'.mp4'))]
        ff=subprocess.Popen(raw,stdin=subprocess.PIPE)
        for i,((fn,_),n) in enumerate(zip(seq,lengths)):
            for j in range(n):
                t=j/(n-1)
                l=fn(t)
                if not loop:
                    if i==0 and j<9:l=Image.blend(black,l,.25+.75*smooth(j/9))
                    if i==len(seq)-1 and j>=n-13:l=Image.blend(l,black,.98*smooth((j-n+13)/12))
                ff.stdin.write(l.tobytes())
        ff.stdin.close()
        if ff.wait():raise RuntimeError(stem)
    print(stem,round(sum(lengths)/FPS,2),(ROOT/(stem+'.mp4')).stat().st_size,flush=True)

if __name__=='__main__':
    pick=sys.argv[2:] or ['loops','films']
    if 'loops' in pick:
        render('garage-loop-hero',[(lambda t:car_scene(t,False),5)],True)
        render('garage-loop-map',[(lambda t:map_scene(t,False),5.7)],True)
        render('garage-loop-staff',[(lambda t:work_scene(t,False),5.7)],True)
        render('garage-loop-history',[(lambda t:history_scene(t,False),5.7)],True)
    if 'films' in pick:
        render('garage-owner-motion',[(car_scene,3),(map_scene,4.1),(detail_scene,3.6),(work_scene,3.8),(result_scene,3.5),(history_scene,4),(close_scene,2.6)])
        render('garage-service-motion',[(work_scene,4.1),(result_scene,4.3),(close_scene,2.8)])
