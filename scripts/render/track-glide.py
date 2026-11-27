"""Render the actual Apollo Track demo interaction as four continuous loops.

Run from the repository root: python scripts/render/track-glide.py [hero|order|drawing|update ...]
The raw JPEGs are captured from /demos/track/ with the built-in test order.
"""
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from io import BytesIO
from pathlib import Path
import sys
from zipfile import ZipFile

from PIL import Image, ImageDraw
from interface_motion import W, H, INK, Shot, AQUA, LIME, GOLD, render


OUT = Path('dist/assets/track')
SOURCE = Path(__file__).with_name('track-demo-captures.zip')
MINT = (137, 235, 192)
BLUE = (127, 206, 248)

# Native bounds in the 1363×936 browser captures. Crop the browser surround
# and choose a closer framing only where it makes the real UI easier to read.
FRAMES = {
    'overview': (132, 92, 1232, 711),
    'order-overview': (132, 166, 1232, 785),
    'manager-current': (132, 67, 1232, 686),
    'manager-approval': (132, 215, 1232, 834),
    'client-required': (132, 92, 1232, 711),
    'drawing': (87, 113, 1276, 822),
    'client-approved': (132, 92, 1232, 711),
    'documents': (132, 118, 1232, 737),
    'history-approved': (132, 66, 1232, 685),
    'manager-ready': (132, 199, 1232, 818),
    'client-ready': (132, 92, 1232, 711),
    'history-ready': (132, 66, 1232, 685),
}


def fit(name):
    x,y,r,b = FRAMES[name]
    k = min(W/(r-x),H/(b-y))
    return k, ((W-(r-x)*k)/2,(H-(b-y)*k)/2)


def shot(name,seconds,area,zoom,tint,effect='edge',direction=1):
    k,(u,v) = fit(name)
    x,y,*_ = FRAMES[name]
    a,b,c,d = area
    spot = (u+(a-x)*k,v+(b-y)*k,u+(c-x)*k,v+(d-y)*k)
    return Shot(name,0,seconds,spot,zoom,tint,effect,direction)


CUTS = {
    'hero': [
        shot('overview',1.92,(167,371,769,607),1.04,BLUE,'rail'),
        shot('manager-current',1.77,(815,287,1192,613),1.09,AQUA,'edge',-1),
        shot('drawing',1.69,(955,759,1070,803),1.00,MINT),
        shot('client-ready',2.20,(163,372,772,621),1.06,LIME,'rail',-1),
    ],
    'order': [
        shot('order-overview',2.42,(166,704,458,778),1.04,BLUE,'edge'),
        shot('documents',2.43,(166,283,1193,622),1.06,AQUA,'rail',-1),
        shot('history-approved',2.33,(165,283,1180,427),1.10,MINT,'rail'),
    ],
    'drawing': [
        shot('manager-approval',1.81,(825,418,1191,480),1.06,AQUA,'edge'),
        shot('client-required',2.19,(165,619,769,691),1.11,GOLD,'edge',-1),
        shot('drawing',2.50,(948,758,1072,803),1.03,MINT),
        shot('client-approved',2.02,(164,370,773,618),1.10,LIME,'rail',-1),
    ],
    'update': [
        shot('manager-ready',2.56,(952,755,1190,805),1.08,BLUE,'edge'),
        shot('client-ready',2.83,(168,370,769,621),1.09,LIME,'edge',-1),
        shot('history-ready',2.34,(163,288,1180,405),1.10,MINT,'rail'),
    ],
}


@lru_cache(maxsize=16)
def plate(name,_time):
    with ZipFile(SOURCE) as z:
        capture = 'overview' if name=='order-overview' else name
        with Image.open(BytesIO(z.read(capture+'.jpg'))) as orig:
            x,y,r,b = FRAMES[name]
            k,offset = fit(name)
            clip = orig.convert('RGB').crop((x,y,r,b)).resize((round((r-x)*k),round((b-y)*k)),Image.Resampling.LANCZOS)
    image = Image.new('RGB',(W,H),INK)
    image.paste(clip,tuple(map(round,offset)))
    alpha = Image.new('L',(W,H))
    ImageDraw.Draw(alpha).rounded_rectangle((0,0,W-1,H-1),radius=15,fill=255)
    image.putalpha(alpha)
    return image


def render_track(key):
    render(CUTS[key], OUT/f'track-{key}-glide', plate)


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render_track,sys.argv[1:] or CUTS))
