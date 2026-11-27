"""Cut the four Garage motion loops from the original interface recordings.

Published frames supply all UI content. Camera, spotlight and transitions are
composited at 48 fps; the video contains no reconstructed UI or personal data.
Run from the site root with ffmpeg, Pillow and NumPy.
"""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import lru_cache
from math import cos, sin, pi, radians
from pathlib import Path
from subprocess import PIPE, Popen, run
import io
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H, FPS = 1280, 720, 48
ROOT = Path('dist/assets/garage')
ICE, MINT, BRASS = (139,207,242), (145,238,198), (255,169,138)
B = Image.Resampling.BICUBIC
L = Image.Resampling.LANCZOS
INK = (4, 10, 15)
QX, QY = np.meshgrid(np.linspace(0,W,320,endpoint=False,dtype=np.float32),np.linspace(0,H,180,endpoint=False,dtype=np.float32))


@dataclass(frozen=True)
class Shot:
    clip: str
    at: float
    seconds: float
    spot: tuple
    hue: tuple
    mode: str
    move: int = 1


# The spots trace meaningful features in the original recordings: service
# estimate, rear axle, recommendation, form, save result and history rows.
CUTS = {
    'hero': [
        Shot('hero',.46,2.32,(358,194,854,274),ICE,'rail'),
        Shot('hero',3.23,2.03,(88,244,778,522),MINT,'map',-1),
        Shot('map',5.16,2.45,(837,349,1228,529),MINT,'trace'),
    ],
    'map': [
        Shot('map',.45,1.65,(91,245,763,519),ICE,'map'),
        Shot('map',1.98,1.95,(134,215,688,475),MINT,'map',-1),
        Shot('map',5.16,3.16,(850,353,1241,536),BRASS,'lift'),
    ],
    'staff': [
        Shot('staff',.42,1.45,(1090,240,1244,302),BRASS,'trace'),
        Shot('staff',3.53,2.24,(238,190,1057,412),BRASS,'rail',-1),
        Shot('staff',5.52,2.20,(108,223,1082,497),ICE,'trace'),
        Shot('staff',7.02,1.38,(900,592,1130,690),BRASS,'trace'),
        Shot('staff',8.53,2.47,(280,295,1220,510),MINT,'rail',-1),
    ],
    'history': [
        Shot('history',.44,1.45,(838,342,1224,535),MINT,'trace'),
        Shot('history',2.04,2.54,(33,307,1240,440),ICE,'rail'),
        Shot('history',4.91,2.87,(34,391,1240,554),MINT,'rail',-1),
    ],
}


def smooth(t):
    t = min(1.,max(0.,t))
    return t*t*(3-2*t)


def turn(t):
    t=min(1.,max(0.,t))
    return t*t*t*(t*(t*6-15)+10)


@lru_cache(maxsize=24)
def picture(clip, at):
    data = run(['ffmpeg','-v','error','-ss',str(at),'-i',str(ROOT/f'garage-{clip}-interface.mp4'),
                '-frames:v','1','-c:v','png','-threads','1','-f','image2pipe','pipe:1'],
               capture_output=True,check=True).stdout
    image = Image.open(io.BytesIO(data)).convert('RGB')
    # The few pixels at the right are the recording viewport's scrollbar.
    image=image.crop((7,3,image.width-16,image.height-4)).resize((W,H),L)
    rounded=Image.new('L',(W,H))
    ImageDraw.Draw(rounded).rounded_rectangle((0,0,W-1,H-1),radius=15,fill=255)
    image.putalpha(rounded)
    return image


@lru_cache(maxsize=1)
def grid():
    out=Image.new('RGBA',(W,H))
    pen=ImageDraw.Draw(out)
    for x in range(6,W,29):
        pen.line((x,0,x,H),fill=(89,142,153,17))
    for y in range(9,H,29):
        pen.line((0,y,W,y),fill=(89,142,153,17))
    for x in range(26,W,116):
        for y in (20,49,672,701):
            pen.line((x-2,y,x+2,y),fill=(130,197,205,32))
            pen.line((x,y-2,x,y+2),fill=(130,197,205,32))
    return out


def backdrop(phase,tone):
    angle=2*pi*phase
    b=np.exp(-(((QX-(677+231*sin(angle)))/690)**2+((QY-(295+79*cos(angle)))/342)**2)*1.47)
    c=np.exp(-(((QX-(397+133*cos(angle)))/546)**2+((QY-689)/122)**2)*1.35)
    field=b[:,:,None]*np.asarray(tone)*.12+c[:,:,None]*np.asarray((75,154,159))*.15
    pixels=Image.fromarray(np.uint8(np.clip(field+np.array(INK),0,255))).resize((W,H),B)
    g=grid()
    pixels.paste(g,(0,0),g)
    return pixels


def camera(shot,t,phase):
    """Stable reading plateau, with a slow dolly and a separate trailing edge."""
    p=smooth(t)
    a=2*pi*phase
    n=shot.move
    middle=sin(pi*t)**2
    x0,y0,x1,y1=shot.spot
    tx=640-(x0+x1)/2
    ty=360-(y0+y1)/2
    cx=640+n*(9-18*p)+.038*tx*middle+7*sin(a)
    cy=358+4.9*cos(a)+.05*ty*middle+3*n*sin(pi*t)
    scale=1+(24*middle+7*(p-.5))/1196
    width=1196*scale
    height=width*H/W
    yaw=n*(.032-.064*p)+.014*sin(a)
    pitch=-.014*cos(a)+n*.010*sin(pi*t)
    roll=radians(n*(.48-.96*p)+.33*sin(a))
    z=1200
    result=[]
    for x,y in [(-width/2,-height/2),(width/2,-height/2),(width/2,height/2),(-width/2,height/2)]:
        h=x*cos(yaw)
        v=y*cos(pitch)+x*sin(yaw)*sin(pitch)
        d=x*sin(yaw)*cos(pitch)-y*sin(pitch)
        result.append((cx+(h*cos(roll)-v*sin(roll))*z/(z+d),cy+(h*sin(roll)+v*cos(roll))*z/(z+d)))
    return result


def homography(points):
    a=[];b=[]
    for (sx,sy),(x,y) in zip([(0,0),(W,0),(W,H),(0,H)],points):
        a+= [[sx,sy,1,0,0,0,-x*sx,-x*sy],[0,0,0,sx,sy,1,-y*sx,-y*sy]]
        b+= [x,y]
    f=np.append(np.linalg.solve(a,b),1).reshape(3,3)
    inv=np.linalg.inv(f);inv/=inv[2,2]
    return f,tuple(inv.reshape(-1)[:8])


def xy(matrix,point):
    q=matrix @ np.array([*point,1])
    return tuple(q[:2]/q[2])


def highlight(scene,shot,matrix,progress):
    # All these traces are outside the text baselines. The highlight gives the
    # eye a destination but never replaces, repeats, or polishes the actual UI.
    env=sin(pi*progress)**1.44
    if env<.008:
        return scene
    tint=shot.hue
    x0,y0,x1,y1=shot.spot
    x,y=xy(matrix,((x0+x1)/2,(y0+y1)/2))
    if shot.mode=='map':
        env*=.8
        x,y=xy(matrix,(x0+(x1-x0)*(.23+.42*turn(progress)),(y0+y1)*.5))
    glow=np.exp(-(((QX-x+.32*(QY-y))/212)**2+((QY-y)/121)**2))*env*.080
    light=Image.fromarray(np.uint8(glow[:,:,None]*np.array(tint))).resize((W,H),B)
    scene=ImageChops.screen(scene,light)
    layer=Image.new('RGBA',(W,H));draw=ImageDraw.Draw(layer)
    if shot.mode=='rail':
        q=turn(progress)
        yy=y1+5
        ax=x0+(x1-x0)*max(0,q-.17);bx=x0+(x1-x0)*min(1,q+.16)
        draw.line((xy(matrix,(ax,yy)),xy(matrix,(bx,yy))),fill=(*tint,round(160*env)),width=2)
        gx,gy=xy(matrix,(bx,yy))
        draw.ellipse((gx-3,gy-3,gx+3,gy+3),fill=(*tint,round(184*env)))
    elif shot.mode=='trace':
        for u,v,dx,dy in [(x0-6,y0-6,25,17),(x1+6,y1+6,-25,-17)]:
            for i,weight in enumerate([.10,.22,1.]):
                k=(2-i)*2
                draw.line([xy(matrix,(u-k,v+dy)),xy(matrix,(u-k,v-k)),xy(matrix,(u+dx,v-k))],
                          fill=(*tint,round(161*env*weight)),width=1 if i!=2 else 2,joint='curve')
    else:
        q=turn(progress)
        for r,a in [(5+13*q,.6),(9+16*q,.36)]:
            draw.ellipse((x-r,y-r,x+r,y+r),outline=(*tint,round(160*env*a)),width=1)
    scene.paste(layer,(0,0),layer)
    return scene


def lift(scene,shot,matrix,progress):
    q=turn((progress-.09)/.25)*(1-turn((progress-.77)/.21))
    if q<.007:
        return scene
    x0,y0,x1,y1=shot.spot
    source=picture(shot.clip,shot.at).crop((x0,y0,x1,y1)).convert('RGB')
    ax,ay=xy(matrix,(x0,y0));bx,by=xy(matrix,(x1,y1))
    w=round((bx-ax)*(1+.38*q))
    h=round(w*source.height/source.width)
    tile=source.resize((w,h),B)
    x=round(min(W-35-w,(ax+bx-w)/2-16*q));y=round((ay+by-h)/2-11*q)

    mask=Image.new('L',(w,h))
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=11,fill=255)
    layer=Image.new('L',(W,H))
    layer.paste(mask,(x,y+round(9*q)))
    shadow=layer.filter(ImageFilter.GaussianBlur(14)).point(lambda a:round(a*.81*q))
    scene.paste((3,7,10),(0,0),shadow)
    scene.paste(tile,(x,y),mask.point(lambda a:round(a*min(1,q*4))))
    contour=Image.new('RGBA',(W,H))
    ImageDraw.Draw(contour).rounded_rectangle((x,y,x+w-1,y+h-1),radius=11,outline=(*shot.hue,round(154*q)),width=1)
    scene.paste(contour,(0,0),contour)
    return scene


def stage(shot,progress,phase):
    tone=shot.hue
    base=backdrop(phase,tone)
    f,inv=homography(camera(shot,progress,phase))
    screen=picture(shot.clip,shot.at).transform((W,H),Image.Transform.PERSPECTIVE,inv,B)
    alpha=screen.getchannel('A')
    shadow=alpha.filter(ImageFilter.GaussianBlur(24)).point(lambda x:round(x*.88))
    base.paste((1,5,9),(0,12),shadow)
    base.paste(screen,(0,0),alpha)
    # Moving glass reflection on the top edge, away from the reading area.
    px=104+1115*turn(progress)
    seam=np.exp(-((QX-px)/198)**2-((QY-21)/14)**2)*sin(pi*progress)**2
    glint=Image.fromarray(np.uint8(seam[:,:,None]*np.array(tone)*.41)).resize((W,H),B)
    base=ImageChops.screen(base,glint)
    border=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(border)
    corners=[xy(f,p) for p in [(7,1),(W-9,1),(W-2,8),(W-2,H-8),(W-10,H-2),(9,H-2),(2,H-8),(2,9),(7,1)]]
    d.line(corners,fill=(*tone,75),width=1)
    base.paste(border,(0,0),border)
    if shot.mode=='lift':
        return lift(base,shot,f,progress)
    return highlight(base,shot,f,progress)


def shift(image,dx,dy,zoom):
    a=1/zoom
    return image.transform((W,H),Image.Transform.AFFINE,(a,0,W*.5*(1-a)-dx*a,0,a,H*.5*(1-a)-dy*a),B,fillcolor=INK)


def transition(earlier,later,t,direction,hue):
    v=turn(t)
    strength=sin(pi*t)**1.15
    # No double-exposed text. A broad light strip hides the narrow boundary
    # where the old viewport moves out and the next viewport moves in.
    a=shift(earlier,-66*direction*v,9*v,1+.043*strength)
    b=shift(later,66*direction*(1-v),-9*(1-v),1+.036*strength)
    axis=(QX if direction>0 else W-QX)+(QY-360)*.32
    path=-233+1752*v
    mix=np.clip(.5+(path-axis)/162,0,1)
    matte=Image.fromarray(np.uint8((3*mix*mix-2*mix**3)*255)).resize((W,H),B)
    c=Image.composite(b,a,matte)
    edge=np.exp(-((axis-path)/68)**2)*strength
    rear=np.exp(-((axis-path-89)/195)**2)*strength
    light=Image.fromarray(np.uint8((edge*.30+rear*.12)[:,:,None]*np.array(hue))).resize((W,H),B)
    return ImageChops.screen(c,light)


def render(name):
    seq=CUTS[name]
    lengths=[round(shot.seconds*FPS) for shot in seq]
    bridge=round(.61*FPS)
    total=sum(lengths)+len(seq)*bridge
    stem=f'garage-{name}-glide'
    stage(seq[0],0,0).save(ROOT/(stem+'.webp'),quality=88,method=5)
    with Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0',
                '-an','-c:v','libx264','-preset','fast','-crf','23','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/(stem+'.mp4'))],stdin=PIPE) as ff:
        now=0
        for i,shot in enumerate(seq):
            n=lengths[i]
            for j in range(n):
                ff.stdin.write(stage(shot,j/n,now/total).tobytes())
                now+=1
            following=seq[(i+1)%len(seq)]
            for j in range(bridge):
                phase=now/total
                old=stage(shot,1,phase)
                new=stage(following,0,phase)
                img=transition(old,new,j/bridge,shot.move,following.hue)
                ff.stdin.write(img.tobytes())
                now+=1
        ff.stdin.close()
        if ff.wait():raise RuntimeError(stem)
    print(stem,round(total/FPS,2),(ROOT/(stem+'.mp4')).stat().st_size,flush=True)


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render,sys.argv[1:] or CUTS))
