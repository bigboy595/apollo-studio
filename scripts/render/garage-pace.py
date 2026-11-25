"""Build muted Garage web cuts from the first campaign exports in dist/assets/garage."""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from math import pi, sin
from pathlib import Path
from subprocess import PIPE, Popen, run
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path('dist/assets/garage')
OUT_FPS = 30
SOURCE_FPS = 24
ICE, SILVER, MINT, AMBER = (151, 235, 247), (205, 229, 245), (185, 242, 157), (251, 183, 154)
BICUBIC = Image.Resampling.BICUBIC


@dataclass(frozen=True)
class Shot:
    action: str
    start: int
    end: int
    seconds: float


def ease(t):
    t = min(1, max(0, t))
    return t*t*(3-2*t)


def envelope(t, begin, end):
    u = (t-begin)/(end-begin)
    return sin(pi*u)**2 if 0 < u < 1 else 0


def render_specs():
    return (
        ('garage-loop-hero', 'garage-hero-cut', (Shot('car', 0, 120, 4.27),), False),
        ('garage-owner-motion', 'garage-owner-cut', (
            Shot('opening', 8, 72, 2.48), Shot('map', 72, 170, 3.55),
            Shot('detail',170,256,3.15), Shot('save',256,347,3.30),
            Shot('receive',347,431,3), Shot('history',431,527,3.45),
            Shot('signoff',527,576,1.92),
        ), True),
        ('garage-service-motion', 'garage-staff-cut', (
            Shot('save',8,98,3.50), Shot('receive',98,201,3.70),
            Shot('signoff',201,255,2.10),
        ), True),
        ('garage-loop-history', 'garage-history-cut', (Shot('history',0,137,4.88),), False),
    )


class Composer:
    def __init__(self, width, height):
        self.w, self.h = width, height
        self.grid = (width//4, height//4)
        self.y, self.x = np.mgrid[:self.grid[1], :self.grid[0]].astype(np.float32)
        self.y *= 648 / self.grid[1]
        self.x *= 1152 / self.grid[0]

    def light(self, img, specs, use_luma=False):
        if not specs:
            return img
        falloff = np.zeros((*self.x.shape, 3), dtype=np.float32)
        for x, y, rx, ry, tilt, amount, color in specs:
            if amount <= .003:
                continue
            dx, dy = self.x-x, self.y-y
            mask = np.exp(-((dx+dy*tilt)/rx)**2-(dy/ry)**2)
            if use_luma:
                # Let the beam follow the existing highlights in the photographed bodywork.
                luminance = np.asarray(img.resize(self.grid, Image.Resampling.BOX).convert('L'), dtype=np.float32)
                mask *= np.clip((luminance-27)/125, .08, 1.)
            falloff += mask[:,:,None]*np.asarray(color, dtype=np.float32)*amount
        glow = Image.fromarray(np.clip(falloff,0,255).astype(np.uint8)).resize(img.size, BICUBIC)
        return ImageChops.screen(img, glow)

    def outline(self, img, box, amp, color, lean=0):
        if amp <= .008:
            return img
        x, y, w, h = box
        sx, sy = self.w/1152, self.h/648
        tint = Image.new('RGBA', img.size)
        pen = ImageDraw.Draw(tint)
        x0, y0, x1, y1 = x-w/2, y-h/2, x+w/2, y+h/2
        lx, ly = min(24,w*.27), min(14,h*.33)
        for x, y, kx, ky in ((x0,y0,1,1),(x1,y1,-1,-1)):
            points = [(x*sx,(y+ky*ly)*sy), (x*sx,y*sy), ((x+kx*lx)*sx,(y+lean*kx)*sy)]
            pen.line(points,fill=(*color,round(amp*200)),width=max(1,round(2*sx)),joint='curve')
        img.paste(tint, (0,0), tint.getchannel('A').filter(ImageFilter.GaussianBlur(4*sx)).point(lambda k:min(255,k*2)))
        img.paste(tint,(0,0),tint)
        return img

    def frame(self, img, action, t, main):
        q = sin(pi*t)**2
        if action in {'car','opening'}:
            if action=='car':
                # A small push and return leaves identical framing at the seam.
                z=1+.031*q
                mx,my=self.w*(.50+.003*q),self.h*.60
                halfw,halfh=self.w/2/z,self.h/2/z
                img=img.transform(img.size,Image.Transform.EXTENT,(mx-halfw,max(0,self.h/2-(self.h/2-my)*q*.08-halfh),mx+halfw,min(self.h,self.h/2-(self.h/2-my)*q*.08+halfh)),BICUBIC)
            a=envelope(t,.07,.52)
            b=envelope(t,.41,.89)
            sweep=126+934*ease((t-.07)/.45)
            return self.light(img,[(sweep,307,166,79,-.82,.22*a,ICE),
                                   (110+sweep*.86,518,216,27,.30,.17*a,SILVER),
                                   (1057-582*ease((t-.41)/.48),409,136,87,.75,.16*b,SILVER),
                                   (920,364,66,19,-.87,.32*envelope(t,.55,.74),ICE)],True)
        if action=='map':
            a=envelope(t,.17,.61)
            b=envelope(t,.41,.88)
            img=self.light(img,[(239,444,133,58,.35,.22*a,ICE),(839,455,209,67,-.15,.23*b,MINT)])
            return self.outline(img,(822,454,363,144),b*.80,MINT,-.7)
        if action=='detail':
            a=envelope(t,.21,.80)
            img=self.light(img,[(332,316,153,170,-.22,.13*a,ICE),(841,371,193,65,-.12,.20*a,AMBER)])
            return self.outline(img,(843,364,418,166),a*.85,AMBER,.5)
        if action=='save':
            pulse=envelope(t,.52,.76)
            early=envelope(t,.16,.53)
            img=self.light(img,[(812,306,131,173,.35,.16*early,AMBER),
                                (913,526,85,34,.21,.36*pulse,AMBER),
                                (905,526,24,12,.21,.25*pulse,SILVER)])
            return self.outline(img,(913,526,82,36),pulse*.88,AMBER)
        if action=='receive':
            a=envelope(t,.28,.80)
            drift=526+362*ease((t-.21)/.57)
            img=self.light(img,[(drift,365,151,34,-.74,.12*a,ICE),(860,376,194,77,.21,.22*a,MINT)])
            return self.outline(img,(853,363,421,168),a*.94,MINT,.8)
        if action=='history':
            a=envelope(t,.22,.74)
            b=envelope(t,.41,.94)
            y=447-27*q if main else 441-27*q
            x=760+46*q
            img=self.light(img,[(280+426*ease(t),y-145,184,46,-.37,.13*a,ICE),(x-56,y+6,211,46,.12,.26*b,MINT)])
            return self.outline(img,(x,y,599+29*q,100+5*q),b*.87,MINT)
        return self.light(img,[(788-500*ease(t),491,255,38,.24,.17*q,ICE)])

    def seam(self, earlier, later, t):
        # Blend a narrow highlight through the change of shot, with no black frame.
        u=ease(t)
        cut=-300+1752*u
        g=np.clip((cut-(self.x+(self.y-324)*.28))/530+.5,0,1)
        g=g*g*(3-2*g)
        matte=Image.fromarray((255*g).astype(np.uint8)).resize(earlier.size,BICUBIC)
        img=Image.composite(later,earlier,matte)
        return self.light(img,[(cut,395,156,142,.28,.14*sin(pi*t)**2,ICE)])


def read_specs(path):
    import json
    j=run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate','-of','json',str(path)], check=True,capture_output=True)
    return json.loads(j.stdout)['streams'][0]


def output(spec):
    source, dest, shots, wrap = spec
    source, dest = ROOT/(source+'.mp4'), ROOT/(dest+'.mp4')
    info=read_specs(source)
    assert info['r_frame_rate']==f'{SOURCE_FPS}/1' and int(info['nb_frames'])>=max(s.end for s in shots)
    w,h=info['width'],info['height']
    nbytes=w*h*3
    compose=Composer(w,h)
    overlap=9 if wrap else 0
    length=sum(round(s.seconds*OUT_FPS) for s in shots)-overlap
    with TemporaryDirectory() as work:
        temp=Path(work)
        raw=temp/'source.rgb'
        rendered=temp/'release.mp4'
        run(['ffmpeg','-v','error','-threads','2','-i',str(source),'-an','-sn','-filter_threads','1','-pix_fmt','rgb24','-f','rawvideo','-threads','1',str(raw)],check=True)
        frames=np.memmap(raw,dtype=np.uint8,mode='r',shape=(int(info['nb_frames']),h,w,3))
        initial=[]
        with Popen(['ffmpeg','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h}','-framerate',str(OUT_FPS),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','medium','-crf','24' if wrap else '25','-pix_fmt','yuv420p','-movflags','+faststart',str(rendered)],stdin=PIPE) as enc:
            prev=None
            for i,shot in enumerate(shots):
                n=round(shot.seconds*OUT_FPS)
                for j in range(n):
                    u=j/(n-1)
                    pos=shot.start+(shot.end-shot.start-1)*u
                    left=int(pos)
                    frame=Image.fromarray(frames[left])
                    angle=pos-left
                    if angle>.04 and left+1<shot.end:
                        frame=Image.blend(frame,Image.fromarray(frames[left+1]),angle)
                    phase=pos/(shot.end-1) if i==0 and wrap else u
                    img=compose.frame(frame,shot.action,phase,wrap)
                    if i==0 and j<overlap:
                        initial.append(img)
                        continue
                    if 0<i<len(shots) and prev is not None and j<5:
                        img=compose.seam(prev,img,(j+1)/5)
                    if wrap and i==len(shots)-1 and j>=n-overlap:
                        k=j-(n-overlap)
                        img=compose.seam(img,initial[k],(k+1)/overlap)
                    enc.stdin.write(img.tobytes())
                    if j==n-1:
                        prev=img
            enc.stdin.close()
            if enc.wait()!=0:
                raise RuntimeError(dest)
        dest.write_bytes(rendered.read_bytes())
    print(f'{dest.name}: {length/OUT_FPS:.2f} s, {dest.stat().st_size:,} bytes',flush=True)


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as workers:
        for _ in workers.map(output,render_specs()):
            pass
