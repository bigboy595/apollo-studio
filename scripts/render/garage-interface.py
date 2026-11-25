"""Encode the Garage showcase loops from real browser actions in a test workspace.
Run from the website root: python scripts/render/garage-interface.py CAPTURE_DIR
"""
from dataclasses import dataclass
from functools import lru_cache
from math import sin,pi
from pathlib import Path
from subprocess import PIPE,Popen
import json
import sys

from PIL import Image,ImageDraw

SOURCE=Path(sys.argv[1])
OUT=Path('dist/assets/garage')
W,H,FPS=1280,720,30

@dataclass(frozen=True)
class View:
    x:int=0
    y:int=0
    width:int=1348

@dataclass(frozen=True)
class Action:
    key:str
    hold:float
    dwell:float
    before:View=View()
    after:View=View()

form_full=View(0,-1)
form_location=View(273,53,800)
form_text=View(273,227,800)
form_save=View(273,431,800)
CUTS={
    'hero':[
        Action('hero-running',1.68,2.93,View(0,152),View(0,72)),
    ],
    'map':[
        Action('map-rear',1.01,1.45,View(0,40),View(0,102)),
        Action('map-note',.83,2.95,View(0,151),View(38,118,1280)),
    ],
    'staff':[
        Action('staff-new',1.15,1.06,View(0,18),form_full),
        Action('staff-location',.63,1.36,form_location,form_location),
        Action('staff-enter',.55,1.72,form_text,form_text),
        Action('staff-save',.82,2.32,form_save,View(0,48)),
    ],
    'history':[
        Action('history-open',.88,2.30,View(),View(0,122)),
        Action('history-planned',.58,2.33,View(0,122),View(0,146)),
    ],
}

@lru_cache(maxsize=96)
def frame(filename,view):
    image=Image.open(SOURCE/(filename+'.png')).convert('RGB')
    if view.y<0:
        image.thumbnail((W,H),Image.Resampling.LANCZOS)
        fit=Image.new('RGB',(W,H),(6,9,12))
        fit.paste(image,((W-image.width)//2,(H-image.height)//2))
        return fit,None
    pure_w=min(image.width,view.width)
    pure_h=round(pure_w*H/W)
    x,y=min(view.x,image.width-pure_w),min(view.y,image.height-pure_h)
    box=(x,y,x+pure_w,y+pure_h)
    return image.crop(box).resize((W,H),Image.Resampling.LANCZOS),box

@lru_cache(maxsize=32)
def point(name):
    source=json.loads((SOURCE/(name+'.json')).read_text())
    return source['x'],source['y']

def cue(image,xy,box,phase,accent):
    if box is None:
        return image
    x=(xy[0]-box[0])*W/(box[2]-box[0])
    y=(xy[1]-box[1])*H/(box[3]-box[1])
    if not 0<x<W or not 0<y<H:
        return image
    out=image.copy()
    d=ImageDraw.Draw(out,'RGBA')
    alpha=round((sin(pi*phase)**.77)*210)
    radius=8+11*phase
    d.ellipse((x-radius,y-radius,x+radius,y+radius),outline=(*accent,alpha),width=2)
    d.ellipse((x-2,y-2,x+2,y+2),fill=(*accent,alpha))
    return out

def render(name,actions):
    stem='garage-'+name+'-interface'
    first,_=frame(actions[0].key+'-before',actions[0].before)
    first.save(OUT/(stem+'.webp'),quality=88,method=5)
    accent=(249,173,155) if name=='staff' else (193,236,193)
    with Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','22','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/(stem+'.mp4'))],stdin=PIPE) as enc:
        def add(im,n=1):
            bits=im.tobytes()
            for _ in range(n):
                enc.stdin.write(bits)
        for action in actions:
            before,box=frame(action.key+'-before',action.before)
            n=round(action.hold*FPS)
            tick=min(10,n)
            add(before,n-tick)
            xy=point(action.key)
            for i in range(tick):
                add(cue(before,xy,box,(i+1)/(tick+1),accent))
            for i in range(2):
                current,_=frame(action.key+'-'+str(i),action.after)
                add(current,3)
            final,_=frame(action.key+'-2',action.after)
            add(final,max(1,round(action.dwell*FPS)-6))
        for i in range(7):
            add(Image.blend(final,first,(i+1)/7))
        enc.stdin.close()
        if enc.wait():
            raise RuntimeError(stem)
    print(stem,(OUT/(stem+'.mp4')).stat().st_size,flush=True)

for name in (sys.argv[2:] or CUTS):
    render(name,CUTS[name])
