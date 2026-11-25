"""Make the public Garage films from local browser captures with fixture data.
Usage: python scripts/render/garage-films.py <directory with 01-owner.jpg … 07-client-result.jpg>
"""
from functools import lru_cache
from pathlib import Path
import math
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

CAP = Path(sys.argv[1])
OUT = Path('dist/assets/garage')
FONT = Path('dist/assets')
W, H, FPS = 1152, 648, 24
RES = Image.Resampling.LANCZOS

@lru_cache(None)
def font(size, weight=600):
    return ImageFont.truetype(str(FONT / f'manrope-{weight}.ttf'), size)

def ease(v):
    v=max(0,min(1,v))
    return v*v*(3-2*v)

def text(d,x,y,value,size,color=(231,245,239),weight=600):
    d.text((x,y),value,font=font(size,weight),fill=color,anchor='lt')

@lru_cache(None)
def ambient(rgb):
    layer=Image.new('RGB',(W,H))
    for y in range(H):
        for x in range(W):
            a=math.exp(-((x/W-.72)**2/.35+(y/H-.70)**2/.29)*4)
            b=math.exp(-((x/W-.20)**2/.34+(y/H-.20)**2/.42)*6)
            layer.putpixel((x,y),(5+int(rgb[0]*a+5*b),9+int(rgb[1]*a+13*b),11+int(rgb[2]*a+16*b)))
    d=ImageDraw.Draw(layer)
    for x in range(43,W,42):d.line((x,118,x,H-36),fill=(17,31,33),width=1)
    for y in range(130,H-36,42):d.line((43,y,W-43,y),fill=(17,31,33),width=1)
    return layer

@lru_cache(None)
def capture(name,crop=None):
    im=Image.open(CAP/(name+'.jpg')).convert('RGB')
    return im.crop(crop) if crop else im

studio=Image.open(OUT/'studio.webp').convert('RGB')
sedan=Image.open(OUT/'sedan.webp').convert('RGBA')

def fit_at(im, rect, motion, shade=0, contain=False):
    x,y,w,h=rect
    if contain:
        s=min(w/im.width,h/im.height)
        iw,ih=round(im.width*s),round(im.height*s)
        pic=im.resize((iw,ih),RES)
        pic=pic.convert('RGB')
        return pic,(x+(w-iw)//2,y+(h-ih)//2)
    s=max(w/im.width,h/im.height)*(1+motion*.055)
    iw,ih=round(im.width*s),round(im.height*s)
    pic=im.resize((iw,ih),RES)
    fx=.5+.18*(motion-.5)
    fy=.5-.14*(motion-.5)
    cx=int((iw-w)*fx);cy=int((ih-h)*fy)
    return pic.crop((cx,cy,cx+w,cy+h)),(x,y)

def frame_window(layer,im,rect,t,contain=False):
    pic,(x,y)=fit_at(im,rect,t,contain=contain)
    w,h=pic.size
    d=ImageDraw.Draw(layer)
    d.rounded_rectangle((x-2,y-2,x+w+1,y+h+1),radius=13,fill=(58,90,91))
    mask=Image.new('L',(w,h))
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=11,fill=255)
    layer.paste(pic,(x,y),mask)
    return x,y,w,h

def title(d, section,n,headline,sub):
    text(d,44,34,section,14,(162,202,192),800)
    text(d,W-148,34,'APOLLO  /  '+n,14,(162,202,192),800)
    text(d,44,62,headline,41,weight=800)
    text(d,46,580,sub,23,(181,214,204))
    d.line((44,553,W-44,553),fill=(58,87,86))

def spotlight(layer,x,y,t,color=(191,244,168),start=.28):
    q=(t-start)/.42
    if not 0<q<1:return
    radius=7+int(40*ease(q))
    glow=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(glow)
    k=int(230*(1-q))
    d.ellipse((x-radius,y-radius,x+radius,y+radius),outline=(*color,k),width=2)
    d.ellipse((x-5,y-5,x+5,y+5),fill=(*color,min(255,k+55)))
    layer.paste(glow,(0,0),glow)

def intro(t):
    im,_=fit_at(studio,(0,0,W,H),t)
    dark=Image.new('L',(W,1))
    dark.putdata([int(231*(1-min(1,x/(W*.85)))**1.5+25) for x in range(W)])
    im.paste((3,8,9),(0,0,W,H),dark.resize((W,H)))
    d=ImageDraw.Draw(im)
    d.line((48,46,W-48,46),fill=(94,125,117),width=1)
    y=166+int((1-ease(t*3))*19)
    text(d,50,68,'01   /   APOLLO GARAGE',16,(201,229,206),800)
    text(d,48,y,'Ваш автомобиль.',63,weight=800)
    text(d,48,y+72,'В деталях.',63,(199,239,153),800)
    text(d,50,y+168,'Личный кабинет автовладельца',20)
    text(d,50,580,'ИНТЕРФЕЙС ПРОДУКТА  ·  ТЕСТОВЫЕ ДАННЫЕ',14,(162,202,192),800)
    return im

def overview(t):
    l=ambient((12,32,34)).copy()
    title(ImageDraw.Draw(l),'01 / ВЛАДЕЛЕЦ','GARAGE','Автомобиль на карте','Откройте узел прямо на модели автомобиля.')
    frame_window(l,capture('01-owner',(28,355,1306,924)),(44,127,1064,416),t)
    spotlight(l,231,469,t)
    return l

def part(t):
    l=ambient((15,29,37)).copy()
    title(ImageDraw.Draw(l),'01 / ВЛАДЕЛЕЦ','GARAGE','От узла к конкретной детали','На схеме видно, где мастер оставил замечание.')
    frame_window(l,capture('02-part',(29,184,1302,693)),(44,128,1064,415),t)
    spotlight(l,908,390,t)
    return l

def history(t):
    l=ambient((13,30,33)).copy()
    d=ImageDraw.Draw(l)
    title(d,'01 / ВЛАДЕЛЕЦ','GARAGE','История и следующее ТО','Работы сохраняются по визитам. Ближайшее ТО видно по пробегу и дате.')
    frame_window(l,capture('03-history',(25,351,1305,669)),(44,132,1064,275),t)
    frame_window(l,capture('01-owner',(394,360,905,452)),(44,417,570,106),t)
    text(ImageDraw.Draw(l),652,453,'Что уже сделано. Что впереди.',22,(190,235,195),800)
    return l

def end(t):
    l=ambient((15,40,36)).copy()
    d=ImageDraw.Draw(l)
    text(d,45,42,'APOLLO GARAGE  /  КАБИНЕТ АВТОВЛАДЕЛЬЦА',15,(171,213,195),800)
    x=178+int(12*ease(t));y=258;img=sedan.resize((790,259),RES)
    l.paste(img,(x,y),img)
    text(d,48,125,'Вся история автомобиля.',57,weight=800)
    text(d,48,192,'В одном месте.',57,(198,240,159),800)
    text(d,49,574,'КАРТА УЗЛОВ   /   ИСТОРИЯ РАБОТ   /   ПЛАН ТО',17,(164,206,191),800)
    return l

def staff(t):
    l=ambient((23,26,37)).copy()
    title(ImageDraw.Draw(l),'02 / МАСТЕР','GARAGE','Визит в автосервис','Мастер находит автомобиль и открывает новую запись.')
    frame_window(l,capture('04-staff',(27,87,1330,653)),(44,127,1064,416),t)
    spotlight(l,1028,345,t,(250,173,149))
    return l

def write(t):
    l=ambient((25,24,39)).copy()
    d=ImageDraw.Draw(l)
    text(d,44,37,'02 / МАСТЕР',14,(162,202,192),800)
    text(d,44,120,'Одна точная',50,weight=800)
    text(d,44,178,'запись.',50,(198,240,159),800)
    for y,label in [(286,'01   Узел и деталь'),(342,'02   Сторона автомобиля'),(398,'03   Что проверить')]:
        d.line((44,y-13,490,y-13),fill=(56,81,81))
        text(d,44,y,label,20,(185,217,206),800)
    text(d,44,560,'Мастер сохраняет рекомендацию.',19)
    src=capture('05-new',(357,64,1007,875))
    frame_window(l,src,(584,35,522,575),t,contain=True)
    spotlight(l,1015,587,t,(250,173,149),start=.64)
    return l

def result(t):
    l=ambient((15,29,34)).copy()
    title(ImageDraw.Draw(l),'02 / РЕЗУЛЬТАТ','GARAGE','У владельца та же запись','Рекомендация появляется в кабинете рядом со схемой детали.')
    frame_window(l,capture('07-client-result',(30,188,1294,695)),(44,129,1064,415),t)
    spotlight(l,985,412,t)
    return l

def make(stem,scenes):
    target=OUT/(stem+'.mp4')
    ff=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
    black=Image.new('RGB',(W,H),(5,9,11))
    for i,(fn,dur) in enumerate(scenes):
        for j in range(round(dur*FPS)):
            f=j/FPS;t=f/dur;im=fn(t)
            if i>0 and f<.37:
                im=Image.blend(scenes[i-1][0](1),im,ease(f/.37))
            if i==0 and j==0:
                im.save(OUT/(stem+'-poster.webp'),quality=86,method=6)
            if i==len(scenes)-1 and dur-f<.42:
                im=Image.blend(im,black,(1-(dur-f)/.42)*.30)
            ff.stdin.write(im.tobytes())
    ff.stdin.close()
    if ff.wait():raise RuntimeError('Video encoding failed')
    print(target, target.stat().st_size, flush=True)

make('garage-owner',[(intro,3.1),(overview,4.5),(part,4.0),(history,4.3),(end,2.8)])
make('garage-service',[(staff,3.5),(write,4.7),(result,4.7)])
