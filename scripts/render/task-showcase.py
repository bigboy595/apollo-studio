"""Create the three Task loops from screenshots of the isolated sample workspace.
Usage: python scripts/render/task-showcase.py CAPTURE_DIR
"""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from math import sin,cos,pi
from pathlib import Path
from subprocess import PIPE,Popen
import sys

import numpy as np
from PIL import Image,ImageChops,ImageDraw,ImageFilter,ImageFont,ImageOps

W,H,FPS=1024,576,30
CAP=Path(sys.argv[1])
DIR=Path('dist/assets/task')
MINT,ICE,AMBER=(151,235,197),(145,209,244),(233,192,147)
font=ImageFont.truetype('dist/assets/manrope-800.ttf',35)
X,Y=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
GX,GY=X[::4,::4],Y[::4,::4]

@dataclass(frozen=True)
class Shot:
    file:str
    crop:tuple
    title:str
    accent:tuple
    focus:tuple
    seconds:float

CUTS={
 'project':[
  Shot('project',(223,63,1334,704),'Всё по заказу — в проекте.',ICE,(.44,.27),2.75),
  Shot('project-tasks',(232,134,1334,657),'Задачи, сроки и ответственные.',MINT,(.26,.60),3.5),
 ],
 'proposal':[
  Shot('proposal-editor',(239,75,1328,789),'Клиент и задача.',ICE,(.30,.37),2.35),
  Shot('proposal-prices',(252,48,1330,784),'Позиции и расчёт стоимости.',AMBER,(.87,.45),2.6),
  Shot('proposal-check',(245,50,1328,848),'Проверка и предпросмотр.',ICE,(.38,.57),2.65),
 ],
 'review':[
  Shot('approvals',(227,64,1335,679),'Материал ждёт проверки.',ICE,(.74,.52),2.4),
  Shot('approval-dialog',(349,275,1008,667),'Решение по версии.',AMBER,(.56,.72),2.05),
  Shot('approved',(226,106,1335,688),'Решение осталось в истории.',MINT,(.79,.75),2.6),
 ],
}

def smooth(v):
    v=min(1.,max(0.,v));return v*v*(3-2*v)

def board(s):
    ui=Image.open(CAP/(s.file+'.png')).convert('RGB').crop(s.crop)
    ow,oh=(843,432) if s.file!='approval-dialog' else (780,412)
    ui=ImageOps.contain(ui,(ow,oh),Image.Resampling.LANCZOS)
    border=Image.new('RGBA',(ui.width+4,ui.height+4))
    pen=ImageDraw.Draw(border)
    pen.rounded_rectangle((0,0,border.width-1,border.height-1),radius=12,outline=(*s.accent,176),fill=(16,26,31,255),width=1)
    clip=Image.new('L',ui.size);ImageDraw.Draw(clip).rounded_rectangle((0,0,ui.width-1,ui.height-1),radius=9,fill=255)
    border.paste(ui,(2,2),clip)
    return border

def base(s,t):
    v=2*pi*t
    a=np.exp(-(((X-(525-58*cos(v)))/550)**2+((Y-331)/260)**2))
    c=np.exp(-(((X-(755+52*sin(v)))/390)**2+((Y-414)/130)**2))
    pixels=np.stack([5+a*s.accent[0]*.070+c*.7,10+a*s.accent[1]*.092+c*4,14+a*s.accent[2]*.116+c*8],axis=2)
    img=Image.fromarray(pixels.astype(np.uint8))
    d=ImageDraw.Draw(img)
    for x in range(28,W,38):
        d.line((x,85,x,H-27),fill=(16,29,33),width=1)
    for y in range(85,H-14,38):
        d.line((28,y,W-28,y),fill=(16,29,33),width=1)
    return img

def scene(s,src,t):
    v=2*pi*t
    drift=sin(v);push=.5-.5*cos(v)
    img=base(s,t)
    scale=1.+.036*push
    layer=src.resize((round(src.width*scale),round(src.height*scale)),Image.Resampling.BICUBIC)
    layer=layer.rotate(.45*drift,resample=Image.Resampling.BICUBIC,expand=True)
    x=(W-layer.width)//2+round(10*drift);y=322-layer.height//2-round(7*push)
    film=Image.new('RGBA',(W,H));film.paste(layer,(x,y))
    alpha=film.getchannel('A')
    img.paste((2,4,6),(0,12),alpha.filter(ImageFilter.GaussianBlur(23)).point(lambda b:b//2))
    img.paste(film,(0,0),alpha)
    amp=sin(pi*t)**2
    hx=x+layer.width*s.focus[0];hy=y+layer.height*s.focus[1]
    glow=np.exp(-(((GX-hx+.24*(GY-hy))/147)**2+((GY-hy)/69)**2))*amp**2*.24
    rim=np.exp(-(((GX-(250+540*t)+.22*(GY-y))/160)**2+((GY-y)/11)**2))*amp*.35
    light=Image.fromarray(np.uint8((glow+rim)[:,:,None]*np.array(s.accent))).resize((W,H),Image.Resampling.BICUBIC)
    img=ImageChops.screen(img,light)
    d=ImageDraw.Draw(img)
    d.text((W//2,44),s.title,font=font,fill=(237,249,246),anchor='mm')
    return img

def cut(a,b,u,tone):
    w=smooth(u)
    g=np.clip(.5+(-240+1510*w-(GX+(GY-288)*.29))/370,0,1)
    matte=Image.fromarray(np.uint8(g*g*(3-2*g)*255)).resize((W,H),Image.Resampling.BICUBIC)
    img=Image.composite(b,a,matte)
    flare=.10*sin(pi*u)**2*np.exp(-((GX-(82+876*w)+(GY-288)*.27)/115)**2-((GY-345)/309)**2)
    tint=Image.fromarray(np.uint8(flare[:,:,None]*np.array(tone))).resize((W,H),Image.Resampling.BICUBIC)
    return ImageChops.screen(img,tint)

def render(item):
    name,shots=item
    trays=[board(s) for s in shots]
    slug='task-'+name
    scene(shots[0],trays[0],.08).save(DIR/(slug+'.webp'),quality=86,method=5)
    with Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','25','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(DIR/(slug+'.mp4'))],stdin=PIPE) as ff:
        for i,s in enumerate(shots):
            n=round(s.seconds*FPS);k=(i+1)%len(shots)
            next_frame=scene(shots[k],trays[k],0)
            for j in range(n):
                img=scene(s,trays[i],j/n)
                if j>=n-8:
                    img=cut(img,next_frame,(j-(n-8)+1)/8,s.accent)
                ff.stdin.write(img.tobytes())
        ff.stdin.close()
        if ff.wait():raise RuntimeError(slug)
    print(slug,(DIR/(slug+'.mp4')).stat().st_size,flush=True)

with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(render,CUTS.items()))
