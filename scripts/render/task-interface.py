"""Encode Task interface recordings. Source: captured actions in a synthetic Task workspace.
Run from the site root: python scripts/render/task-interface.py CAPTURE_DIR
"""
from dataclasses import dataclass
from functools import lru_cache
from math import sin,pi
from pathlib import Path
from subprocess import Popen,PIPE
import json
import sys

from PIL import Image,ImageDraw

SOURCE=Path(sys.argv[1])
OUT=Path('dist/assets/task')
W,H,FPS=1280,720,30

@dataclass(frozen=True)
class Action:
    key:str
    hold:float
    dwell:float
    y_before:int=0
    y_after:int=0

CUTS={
    'hero':[Action('hero-open-projects',1.30,1.04),Action('hero-open-order',.48,1.92)],
    'project':[Action('project-open-tasks',1.12,.92),Action('project-open-task',.55,2.07,y_after=-1),
               Action('project-back-materials',.48,1.42,y_before=93)],
    'proposal':[Action('proposal-open-editor',.72,1.22),Action('proposal-open-cost',.45,1.05),
                Action('proposal-quantity',.67,1.95,y_after=82),
                Action('proposal-open-preview',.24,1.95,y_before=82,y_after=61)],
    'review':[Action('review-open-decision',.97,1.78),Action('review-save-decision',1.00,1.69,y_after=118)]
}

@lru_cache(maxsize=96)
def frame(filename,y):
    im=Image.open(SOURCE/(filename+'.png')).convert('RGB')
    # Keep the original application layout and scale it uniformly.
    if y<0:
        # Keep the entire task dialog visible, including its footer.
        im.thumbnail((W,H),Image.Resampling.LANCZOS)
        fit=Image.new('RGB',(W,H),(5,9,10))
        fit.paste(im,((W-im.width)//2,(H-im.height)//2))
        return fit,None
    x=0;max_width=min(im.width,1348); crop_h=round(max_width*H/W)
    crop_y=min(max(y,0),im.height-crop_h)
    crop=(x,crop_y,max_width,crop_y+crop_h)
    return im.crop(crop).resize((W,H),Image.Resampling.LANCZOS),crop

@lru_cache(maxsize=32)
def point(name):
    v=json.loads((SOURCE/(name+'.json')).read_text())
    return v['x'],v['y']

def mark(image,p,crop,phase):
    if crop is None:
        return image
    x=(p[0]-crop[0])*W/(crop[2]-crop[0])
    y=(p[1]-crop[1])*H/(crop[3]-crop[1])
    if not (0<x<W and 0<y<H):
        return image
    out=image.copy()
    d=ImageDraw.Draw(out,'RGBA')
    opacity=round((sin(pi*phase)**.85)*218)
    r=8+9*phase
    d.ellipse((x-r,y-r,x+r,y+r),outline=(191,248,151,opacity),width=2)
    d.ellipse((x-3,y-3,x+3,y+3),fill=(208,255,184,opacity))
    return out

def render(name,actions):
    target='task-'+name+'-interface'
    first,_=frame(actions[0].key+'-before',actions[0].y_before)
    first.save(OUT/(target+'.webp'),quality=88,method=5)
    with Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','22','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/(target+'.mp4'))],stdin=PIPE) as enc:
        def add(im,n=1):
            bits=im.tobytes()
            for _ in range(n):enc.stdin.write(bits)
        for action in actions:
            before,crop=frame(action.key+'-before',action.y_before)
            n=round(action.hold*FPS)
            cue=min(11,n)
            add(before,n-cue)
            p=point(action.key)
            for j in range(cue):
                add(mark(before,p,crop,(j+1)/(cue+1)))
            for j in range(2):
                image,_=frame(action.key+'-'+str(j),action.y_after)
                add(image,3)
            result,_=frame(action.key+'-2',action.y_after)
            add(result,max(1,round(action.dwell*FPS)-6))
        if name=='review':
            held,_=frame('review-persisted',160)
            add(held,36)
        else:
            held=result
        for i in range(7):
            add(Image.blend(held,first,(i+1)/7))
        enc.stdin.close()
        if enc.wait():raise RuntimeError(target)
    print(target,(OUT/(target+'.mp4')).stat().st_size,flush=True)

for name in (sys.argv[2:] or CUTS):
    render(name,CUTS[name])
