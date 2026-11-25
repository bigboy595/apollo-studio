"""Compose the Track showcase reel from the Blender PNG sequence. Usage: python scripts/render/track-reel.py FRAMES."""
from pathlib import Path
from subprocess import PIPE, Popen
from math import cos, sin, pi
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W,H=960,640
source=Path(sys.argv[1])
root=Path('dist/assets/track')
root.mkdir(parents=True,exist_ok=True)
paths=sorted(source.glob('[0-9][0-9][0-9].png'))
assert len(paths)==32,'Render the complete 32-keyframe sequence first'
renders=[Image.open(p).convert('RGBA') for p in paths]
Y,X=np.mgrid[:H,:W].astype(np.float32)
scaledX=X[::4,::4];scaledY=Y[::4,::4]
rng=np.random.default_rng(2481)
noise=rng.uniform(-.65,.65,(H,W)).astype(np.float32)
plate=Image.new('RGBA',(W,H))
d=ImageDraw.Draw(plate)
for x in range(0,W,32):d.line((x,0,x,H),fill=(171,225,234,12),width=1)
for y in range(0,H,32):d.line((0,y,W,y),fill=(171,225,234,12),width=1)
for x in range(96,W,128):
    for y in range(96,H,128):
        d.line((x-3,y,x+3,y),fill=(171,225,234,46))
        d.line((x,y-3,x,y+3),fill=(171,225,234,46))
for delta in [0,39,77]:
    box=(179-delta,81-delta,769+delta,528+delta)
    d.arc(box,202,337,fill=(182,225,233,46-delta//3),width=1)
    d.arc(box,18,148,fill=(182,225,233,46-delta//3),width=1)
d.line((30,30,84,30),fill=(169,233,236,105));d.line((30,30,30,84),fill=(169,233,236,105))
d.line((930,608,876,608),fill=(169,233,236,105));d.line((930,608,930,554),fill=(169,233,236,105))

def composite(t):
    u=2*pi*t
    phase=t*len(renders)
    ix=int(phase)
    part=Image.blend(renders[ix%len(renders)],renders[(ix+1)%len(renders)],phase-ix)
    # Slow key light turns around the part; the steel reflection stays in the render.
    x=495+235*cos(u-.33)
    cool=np.exp(-(((X-x)/430)**2+((Y-(312+54*sin(u)))/242)**2))*1.15
    mint=np.exp(-(((X-(130+75*sin(u-.25)))/280)**2+((Y-435)/197)**2))
    fall=np.clip(1-((X-W/2)/639)**2-((Y-H/2)/510)**2,.12,1.)
    bg=np.stack([7+noise+9*cool+7*mint,13+noise+22*cool+26*mint,19+noise+27*cool+23*mint],axis=-1)
    img=Image.fromarray(np.uint8(bg*fall[:,:,None]))
    img.paste(plate,(0,0),plate)
    shadow=part.getchannel('A').filter(ImageFilter.GaussianBlur(26)).point(lambda v:v//2)
    img.paste((4,11,15),(0,15),shadow)
    # A brief sweep picks out the manufactured surface, with no flash over the captions.
    glow=np.exp(-((scaledX-(410+345*sin(u-1.7))+.48*(scaledY-320))/139)**2-((scaledY-320)/137)**2)
    strength=(.57+.43*cos(u-1.7))*.27
    tint=Image.fromarray(np.uint8(glow[:,:,None]*np.array([141,188,213])*strength)).resize((W,H),Image.Resampling.BICUBIC)
    from PIL import ImageChops
    metal=ImageChops.screen(part.convert('RGB'),tint)
    img.paste(metal,(0,-22),part.getchannel('A'))
    return img

composite(0).save(root/'track-bolt-poster.webp',quality=88,method=6)
with Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','25','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'track-bolt-loop.mp4')],stdin=PIPE) as ff:
    for i in range(159):
        ff.stdin.write(composite(i/159).tobytes())
    ff.stdin.close()
    if ff.wait():raise SystemExit('Could not encode Track reel')
