"""Render the product title sequence: blender -b -t 6 --python scripts/render/task-hero.py -- FRAMES_DIR"""
from math import pi,sin,cos,radians
from pathlib import Path
import sys
import bpy
from mathutils import Vector

out=Path(sys.argv[sys.argv.index('--')+1])
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=27
scene.cycles.use_denoising=False
scene.render.resolution_x=960
scene.render.resolution_y=540
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Dark studio')
scene.world.use_nodes=True
world=scene.world.node_tree.nodes['Background']
world.inputs[0].default_value=(.055,.13,.19,1)
world.inputs[1].default_value=.32

def material(name,color,metal=0,rough=.4):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m

paper=material('Warm stock',(.76,.76,.66),.10,.43)
pale=material('Arctic stock',(.58,.71,.70),.18,.38)
steel=material('Black zirconium',(.085,.15,.18),.80,.235)
nickel=material('Satin steel',(.35,.48,.53),.86,.22)
mint=material('Mint anodized',(.34,.75,.57),.62,.26)
ink=material('Ink',(.038,.085,.11),.22,.35)
fine=material('Fine ink',(.25,.36,.38),.27,.47)
floor=material('Stage',(.022,.043,.071),.38,.35)

def block(name,dims,xyz,mat,r=.05,parent=None):
    bpy.ops.mesh.primitive_cube_add()
    ob=bpy.context.object;ob.name=name
    ob.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if parent:ob.parent=parent
    ob.location=xyz;ob.data.materials.append(mat)
    if r:
        bevel=ob.modifiers.new('Soft milled edge','BEVEL');bevel.width=r;bevel.segments=3;bevel.limit_method='ANGLE'
        ob.modifiers.new('Weighted smooth faces','WEIGHTED_NORMAL')
        for face in ob.data.polygons:face.use_smooth=True
    return ob

def group(name):
    ob=bpy.data.objects.new(name,None);scene.collection.objects.link(ob)
    return ob

def aim(ob,point):
    ob.rotation_euler=(Vector(point)-ob.location).to_track_quat('-Z','Y').to_euler()

def light(name,where,color,energy,width,height):
    d=bpy.data.lights.new(name,'AREA');d.shape='RECTANGLE';d.color=color;d.energy=energy;d.size=width;d.size_y=height
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=where;aim(o,(0,0,.6));return o

block('Floor',(200,200,.1),(0,0,-.17),floor,0)
tray=group('Desk plate')
block('Milled tray',(2.88,3.25,.18),(0,0,0),steel,.085,tray)
block('Inner edge',(2.68,3.02,.04),(0,0,.105),nickel,.065,tray)
block('Inner well',(2.61,2.96,.067),(0,0,.124),steel,.041,tray)
block('Signal stripe',(.48,.045,.022),(.84,-1.41,.164),mint,.01,tray)

sheets=[]
for i,(name,mat) in enumerate([('Back panel',nickel),('Cover',pale),('Printed sheet',paper)]):
    layer=group(name)
    block(name,(2.28,2.70,.057),(0,0,0),mat,.028,layer)
    if i==2:
        font=bpy.data.fonts.load('dist/assets/manrope-800.ttf')
        data=bpy.data.curves.new('Imprint','FONT');data.body='APOLLO / TASK';data.font=font;data.size=.170;data.materials.append(ink)
        mark=bpy.data.objects.new('Imprint',data);scene.collection.objects.link(mark);mark.parent=layer;mark.location=(-.891,.77,.034)
        for y,rows in [(0.43,2),(-.05,3),(-.61,3)]:
            for j in range(rows):
                w=1.04-.12*(j%3)
                block('Printed rule',(w,.023,.005),(-.895+w/2,y-j*.096,.0305),fine,.002,layer)
                block('Margin rule',(.42-.04*j,.023,.005),(.64,y-j*.096,.0305),fine,.002,layer)
        block('Accent rule',(1.76,.017,.003),(0,.577,.031),ink,.001,layer)
        block('Tab',(.47,.21,.044),(.79,1.322,.029),mint,.019,layer)
    sheets.append(layer)

key=light('Sweep',(-3,-3,5.6),(.81,.94,1),870,5.0,2.7)
rim=light('Cyan rim',(1.5,4.8,3.2),(.35,.75,1),1150,5.3,1.35)
light('Warm panel',(3.6,-1.6,4.2),(1,.88,.67),480,2.3,4.6)
light('Mint fill',(-3.3,1.8,1.9),(.43,1,.78),320,3.7,2.1)
camera_data=bpy.data.cameras.new('Lens');cam=bpy.data.objects.new('Lens',camera_data);scene.collection.objects.link(cam);scene.camera=cam
cam.data.type='ORTHO';cam.data.ortho_scale=6.55
scene.view_settings.view_transform='AgX'
for i in range(13):
    t=i/12;u=2*pi*t
    spread=.5-.5*cos(u)
    cam.location=(3.3+.44*sin(u),-5.55+.25*cos(u),6.1+.24*sin(u+.5))
    aim(cam,(0,.03,.67))
    cam.rotation_euler.rotate_axis('Z',radians(-8+2.7*sin(u)))
    tray.location.z=.05+.06*spread;tray.rotation_euler.z=radians(-11)
    for j,layer in enumerate(sheets):
        layer.location=(.08+(j-1)*.11*spread,.13+j*.091*spread,.34+j*.19+(j+1)*.073*spread)
        layer.rotation_euler.z=radians(-11+(-5+j*8)*spread+2*sin(u+.16*j))
    key.location.x=-3.8+2.9*sin(u-.43)
    aim(key,(0,0,.5))
    key.data.energy=870+180*sin(u)
    rim.data.energy=1090+200*sin(u+1.1)
    scene.render.filepath=str(out/('%03d.png'%i))
    bpy.ops.render.render(write_still=True)
