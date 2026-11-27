"""Remaster the real Apollo Task recordings as four continuous product loops.

Run from the site root: python scripts/render/task-glide.py [hero|project|proposal|review ...]
The interface, values and decisions come from the previous Task recordings of a test order.
"""
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from subprocess import run
import sys

from PIL import Image, ImageDraw
from interface_motion import W, H, Shot, AQUA, GOLD, LIME, VIOLET, render

OUT = Path('dist/assets/task')

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


def render_task(key):
    render(CUTS[key], OUT/f'task-{key}-glide', plate)


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render_task,sys.argv[1:] or CUTS))
