"""Remaster the real Apollo Task recordings as four continuous product loops.

Run from the site root: python scripts/render/task-glide.py [hero|project|proposal|review ...]
The interface, values and decisions come from the previous Task recordings of a test order.
"""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from math import cos, pi, sin
from pathlib import Path
from subprocess import PIPE, Popen, run
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H, FPS = 1280, 720, 48
OUT = Path('dist/assets/task')
INK = (4, 10, 13)
LIME, AQUA, GOLD, VIOLET = (177, 241, 111), (110, 220, 219), (245, 201, 108), (190, 174, 253)
RESAMPLE = Image.Resampling.BICUBIC
GX, GY = np.meshgrid(np.linspace(0, W, 320, endpoint=False, dtype=np.float32),
                     np.linspace(0, H, 180, endpoint=False, dtype=np.float32))


@dataclass(frozen=True)
class Shot:
    clip: str
    at: float
    seconds: float
    focus: tuple
    zoom: float
    tint: tuple
    effect: str = 'edge'
    direction: int = 1


# Each focus rectangle is placed over UI visible in the original 1280×720 recording.
CUTS = {
    'hero': [
        Shot('hero', .35, 1.48, (248, 278, 1229, 493), 1.00, AQUA, 'rail'),
        Shot('hero', 1.86, 1.62, (254, 297, 564, 601), 1.08, LIME),
        Shot('hero', 3.42, 2.46, (248, 144, 1245, 369), 1.07, AQUA, 'rail', -1),
    ],
    'project': [
        Shot('project', .35, 1.34, (249, 143, 1246, 349), 1.04, AQUA, 'rail'),
        Shot('project', 1.66, 1.86, (249, 461, 1253, 507), 1.11, LIME),
        Shot('project', 3.75, 3.08, (436, 27, 836, 690), 1.00, AQUA, 'dialog', -1),
    ],
    'proposal': [
        Shot('proposal', 1.28, 1.48, (247, 226, 1240, 277), 1.02, AQUA, 'rail'),
        Shot('proposal', 3.23, 1.49, (1096, 408, 1236, 445), 1.11, GOLD, 'edge', -1),
        Shot('proposal', 5.39, 2.90, (1091, 243, 1234, 281), 1.11, LIME, 'price'),
        Shot('proposal', 7.32, 1.99, (273, 510, 909, 638), 1.03, AQUA, 'rail', -1),
    ],
    'review': [
        Shot('review', .42, 1.59, (252, 337, 1259, 516), 1.08, VIOLET),
        Shot('review', 3.43, 2.58, (403, 239, 899, 649), 1.38, VIOLET, 'dialog'),
        Shot('review', 6.17, 2.70, (243, 462, 1239, 654), 1.14, LIME, 'rail', -1),
    ],
}


def smooth(t):
    t = max(0., min(1., t))
    return t*t*t*(t*(6*t-15)+10)


def bell(x, y, rx, ry):
    return np.exp(-(((GX-x)/rx)**2 + ((GY-y)/ry)**2))


def light(field, tint):
    rgb = np.clip(field[:, :, None]*np.asarray(tint), 0, 255).astype(np.uint8)
    return Image.fromarray(rgb).resize((W,H), RESAMPLE)


@lru_cache(maxsize=18)
def plate(clip, moment):
    raw = run(['ffmpeg','-v','error','-ss',str(moment),'-i',str(OUT/f'task-{clip}-interface.mp4'),
               '-frames:v','1','-threads','1','-c:v','png','-f','image2pipe','-'],
              capture_output=True,check=True).stdout
    with Image.open(BytesIO(raw)) as src:
        # Original UI remains intact; trim the browser scrollbar at the far right.
        im = src.convert('RGB').crop((0,0,W-14,H)).resize((W,H),Image.Resampling.LANCZOS)
    alpha = Image.new('L',(W,H))
    ImageDraw.Draw(alpha).rounded_rectangle((0,0,W-1,H-1),radius=16,fill=255)
    im.putalpha(alpha)
    return im


@lru_cache(maxsize=1)
def mesh():
    im = Image.new('RGBA',(W,H))
    d = ImageDraw.Draw(im)
    for y in range(21,H,35):
        d.line((0,y,W,y),fill=(147,193,191,18))
    for x in range(17,W,35):
        d.line((x,0,x,H),fill=(137,173,170,18))
    return im


def background(phase,tone):
    a = 2*pi*phase
    sky = light(.12*bell(603+267*sin(a),315+100*cos(a),718,321)+.026,tone)
    base = ImageChops.add(sky,Image.new('RGB',(W,H),INK))
    glow = light(.098*bell(650+208*cos(a),694,601,98),AQUA)
    base = ImageChops.screen(base,glow)
    grid = mesh()
    base.paste(grid,(0,0),grid)
    return base


def pose(shot,t,phase):
    p = smooth(t)
    a = phase*2*pi
    direction = shot.direction
    accent = .26 + .74*sin(pi*t)**2
    x0,y0,x1,y1 = shot.focus
    tx,ty = (x0+x1)/2,(y0+y1)/2
    z = 1 + (shot.zoom-1)*(.49+.51*p) + .019*sin(pi*t)**2 + .008*t
    # Trade unused screen edges for larger text on the intended area. Keep
    # the composition inside the window while the camera changes direction.
    cx = W/2 + np.clip((tx-W/2)*(z-1)*1.34,-W*(z-1)/2,W*(z-1)/2)
    cy = H/2 + np.clip((ty-H/2)*(z-1)*1.53,-H*(z-1)/2,H*(z-1)/2)
    s = .938*z
    dx = 10*direction*(1-2*p)+4*sin(a)
    dy = 4*cos(a)+2*sin(pi*t)
    yaw = direction*(.040-.080*p)+.011*sin(a)
    pitch = -.017*cos(a)+.008*accent
    roll = direction*(.011-.022*p)+.005*cos(a)
    dest = []
    for x,y in [(0,0),(W,0),(W,H),(0,H)]:
        u,v = (x-cx)*s,(y-cy)*s
        scale = 1210/(1210+u*sin(yaw)-v*sin(pitch))
        dest.append((W/2+dx+(u*cos(roll)-v*sin(roll))*scale,H/2+dy+(u*sin(roll)+v*cos(roll))*scale))
    a,b = [],[]
    for (u,v),(x,y) in zip([(0,0),(W,0),(W,H),(0,H)],dest):
        a.extend(([u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]))
        b.extend((x,y))
    fwd = np.append(np.linalg.solve(a,b),1).reshape((3,3))
    inv = np.linalg.inv(fwd)
    return fwd,tuple((inv/inv[2,2]).flat[:8])


def screen_point(matrix,x,y):
    p = matrix @ np.array((x,y,1.))
    return tuple(p[:2]/p[2])


def mark(frame,shot,matrix,t):
    strength = sin(pi*t)**1.25
    if strength < .005:
        return frame
    x0,y0,x1,y1 = shot.focus
    px,py = screen_point(matrix,(x0+x1)/2,(y0+y1)/2)
    tint = shot.tint
    frame = ImageChops.screen(frame,light(.105*strength*bell(px,py,208,107),tint))
    overlay = Image.new('RGBA',(W,H))
    d = ImageDraw.Draw(overlay)
    q = smooth(t)
    if shot.effect=='rail':
        yy = y1+7
        u,v = x0+(x1-x0)*max(0,q-.22),x0+(x1-x0)*min(1,q+.13)
        a,b = screen_point(matrix,u,yy),screen_point(matrix,v,yy)
        for width,alpha in ((9,16),(5,33),(2,185)):
            d.line((a,b),fill=(*tint,round(strength*alpha)),width=width)
        bx,by = b
        d.ellipse((bx-2,by-2,bx+2,by+2),fill=(*tint,round(200*strength)))
    else:
        for x,y,sgn in ((x0-5,y0-5,1),(x1+5,y1+5,-1)):
            length = 15+13*q
            pts = [screen_point(matrix,x,y+sgn*length),screen_point(matrix,x,y),
                   screen_point(matrix,x+sgn*length,y)]
            for width,alpha in ((8,15),(4,44),(2,171)):
                d.line(pts,fill=(*tint,round(strength*alpha)),width=width,joint='curve')
    if shot.effect=='price':
        # A light pulse travels from the changed quantity toward the new
        # total. The original amount and quantity are never replaced.
        v = smooth((t-.07)/.51)
        x = 311+(1072-311)*v
        y = 369+(262-369)*v
        xx,yy=screen_point(matrix,x,y)
        pulse = sin(pi*v)**1.2 if v<1 else 0.
        if pulse>.01:
            frame=ImageChops.screen(frame,light(.19*pulse*bell(xx,yy,134,45),tint))
        ax,ay = screen_point(matrix,x0,y0)
        bx,by = screen_point(matrix,x1,y1)
        margin = 6+11*q
        d.rounded_rectangle((ax-margin,ay-margin,bx+margin,by+margin),radius=8,
                            outline=(*tint,round(48*strength)),width=1)
    frame.paste(overlay,(0,0),overlay)
    return frame


def compose(shot,t,phase):
    base = background(phase,shot.tint)
    fw,iv = pose(shot,t,phase)
    image = plate(shot.clip,shot.at).transform((W,H),Image.Transform.PERSPECTIVE,iv,RESAMPLE)
    alpha = image.getchannel('A')
    shadow = alpha.filter(ImageFilter.GaussianBlur(16))
    base.paste((2,5,8),(0,8),shadow)
    base.paste(image,(0,0),alpha)
    contour = Image.new('RGBA',(W,H))
    pts = [(11,1),(W-12,1),(W-2,11),(W-2,H-12),(W-12,H-2),(11,H-2),(2,H-12),(2,11),(11,1)]
    ImageDraw.Draw(contour).line([screen_point(fw,*p) for p in pts], fill=(*shot.tint,77),width=1)
    base.paste(contour,(0,0),contour)
    # Rolling edge reflection follows the tilted frame rather than crossing the text.
    gx,gy = screen_point(fw,80+1120*smooth(t),5 if shot.zoom<1.20 else H-4)
    glint = light(.42*sin(pi*t)**2*bell(gx,gy,174,13),shot.tint)
    return mark(ImageChops.screen(base,glint),shot,fw,t)


def slide(image,dx,dy,zoom):
    z = 1/zoom
    return image.transform((W,H),Image.Transform.AFFINE,
                           (z,0,W/2*(1-z)-dx*z,0,z,H/2*(1-z)-dy*z),RESAMPLE,fillcolor=INK)


def bridge(left,right,t,direction,tone,price=False):
    p=smooth(t)
    power=sin(pi*t)**1.15
    travel=44 if price else 79
    old=slide(left,-travel*direction*p,19*p*(1 if price else .38),1+.037*power)
    new=slide(right,travel*direction*(1-p),-19*(1-p)*(1 if price else .38),1+.043*power)
    axis=(GX if direction>0 else W-GX)+(GY-360)*(.14 if price else .37)
    edge=-209+1699*p
    alpha=np.clip(.5+(edge-axis)/142,0.,1.)
    matte=Image.fromarray(np.uint8(alpha*alpha*(3-2*alpha)*255)).resize((W,H),RESAMPLE)
    sheet=Image.composite(new,old,matte)
    rim=np.exp(-((axis-edge)/48)**2)*.32
    falloff=np.exp(-((axis-edge+66)/156)**2)*.13
    return ImageChops.screen(sheet,light((rim+falloff)*power,tone))


def render(key):
    shots=CUTS[key]
    durations=[round(s.seconds*FPS) for s in shots]
    bridges=[round((.48 if shots[(i+1)%len(shots)].effect=='price' else .62)*FPS) for i in range(len(shots))]
    frames=sum(durations)+sum(bridges)
    target=OUT/f'task-{key}-glide'
    compose(shots[0],0,0).save(target.with_suffix('.webp'),quality=89,method=5)
    args=['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}',
          '-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','23',
          '-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(target.with_suffix('.mp4'))]
    with Popen(args,stdin=PIPE) as ff:
        frame=0
        for i,shot in enumerate(shots):
            for n in range(durations[i]):
                ff.stdin.write(compose(shot,n/durations[i],frame/frames).tobytes())
                frame+=1
            following=shots[(i+1)%len(shots)]
            for n in range(bridges[i]):
                t=frame/frames
                old,new=compose(shot,1,t),compose(following,0,t)
                ff.stdin.write(bridge(old,new,n/bridges[i],shot.direction,following.tint,following.effect=='price').tobytes())
                frame+=1
        ff.stdin.close()
        if ff.wait():
            raise RuntimeError(str(target))
    print(target.name,round(frames/FPS,2),target.with_suffix('.mp4').stat().st_size,flush=True)


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render,sys.argv[1:] or CUTS))
