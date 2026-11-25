"""Blender: blender -b -t 5 --python scripts/render/track-bolt.py -- /absolute/path/bolt.png"""
import bpy
import math
import sys
from mathutils import Vector
from math import sin,cos,pi

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=92
scene.cycles.use_denoising=False
scene.render.resolution_x=1248
scene.render.resolution_y=832
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.19,.29,.35,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.24

def steel(name,color,rough):
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    n=mat.node_tree.nodes;p=n.get('Principled BSDF');l=mat.node_tree.links
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=.96
    noise=n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value=143
    noise.inputs['Detail'].default_value=2.
    coords=n.new('ShaderNodeTexCoord')
    stretch=n.new('ShaderNodeVectorMath');stretch.operation='MULTIPLY';stretch.inputs[1].default_value=(.2,6.,6.)
    l.new(coords.outputs['Object'],stretch.inputs[0]);l.new(stretch.outputs[0],noise.inputs['Vector'])
    ramp=n.new('ShaderNodeMapRange');ramp.inputs['To Min'].default_value=rough-.075;ramp.inputs['To Max'].default_value=rough+.09
    l.new(noise.outputs['Fac'],ramp.inputs['Value']);l.new(ramp.outputs[0],p.inputs['Roughness'])
    b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.17;b.inputs['Distance'].default_value=.012
    l.new(noise.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
    return mat

shaft=steel('Satin steel',(.37,.40,.44),.255)
polish=steel('Cut steel',(.53,.57,.61),.21)
thread=steel('Thread',(.28,.30,.33),.24)

def mesh(name,verts,quads,mat,shade=True):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],quads);data.update()
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    for p in data.polygons:p.use_smooth=shade
    return ob

def loft(name,sections,mat,close=True,N=96):
    v=[(x,r*cos(a),r*sin(a)) for x,rng in sections for i in range(N) for a in [2*pi*i/N] for r in [rng(a)]]
    segs=len(sections) if close else len(sections)-1
    return mesh(name,v,[(i*N+j,i*N+(j+1)%N,((i+1)%len(sections))*N+(j+1)%N,((i+1)%len(sections))*N+j) for i in range(segs) for j in range(N)],mat)

# The bent anchor and its terminal joint, seen in the order's sample drawing.
bend=[]
for i in range(33):
    q=(pi/2)*i/32
    bend.append((-2.01-.36*sin(q),.36-.36*cos(q),q))
rings=[(2.49,0.,0.),(2.45,0.,0.),(.56,0.,0.),(-2.01,0.,0.),*bend[1:],(-2.37,1.01,pi/2),(-2.37,1.045,pi/2)]
N=80; vv=[]
for i,(x,z,q) in enumerate(rings):
    r=.119 if i in (0,len(rings)-1) else .146
    for j in range(N):
        a=2*pi*j/N; n=r*sin(a)
        vv.append((x+n*sin(q),r*cos(a),z+n*cos(q)))
mesh('Bent foundation bolt',vv,[*( (i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j) for i in range(len(rings)-1) for j in range(N)),tuple(range(N-1,-1,-1)),tuple((len(rings)-1)*N+j for j in range(N))],shaft)

def hexrad(a,r):
    sector=(a+pi/6)%(pi/3)-pi/6
    return r*cos(pi/6)/cos(sector)

for x in (1.68,2.02):
    sections=[]
    for off,r,hexagonal in [(-.102,.207,False),(-.067,.251,True),(.067,.251,True),(.102,.207,False),(.102,.151,False),(-.102,.151,False)]:
        sections.append((x+off,(lambda a,r=r:hexrad(a,r)) if hexagonal else (lambda a,r=r:r)))
    ob=loft('Hex nut',sections,polish)
    bevel=ob.modifiers.new('Cut edges','BEVEL'); bevel.width=.008;bevel.segments=2;bevel.limit_method='ANGLE'
    norm=ob.modifiers.new('Normals','WEIGHTED_NORMAL')

for x in (1.55,1.90):
    loft('Hardened washer',[(x-.026,lambda _: .230),(x-.018,lambda _: .246),(x+.018,lambda _: .246),(x+.026,lambda _: .230),(x+.026,lambda _: .151),(x-.026,lambda _: .151)],polish)

pitch=.085
def thread_radius(x,a):
    q=(x/pitch-a/(2*pi))%1
    rise=max(0,1-abs(q-.50)/.36)
    onset=min(1,max(0,(x-.92)/.15),max(0,(2.50-x)/.11))
    return .145+onset*.031*rise
loft('Spiral cut thread',[(x:=.92+i*.004, lambda a,x=x:thread_radius(x,a)) for i in range(392)],thread,False)

def aim(obj,pt):
    obj.rotation_euler=(Vector(pt)-obj.location).to_track_quat('-Z','Y').to_euler()

def area(name,loc,target,energy,color,w,h):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.color=color;data.shape='RECTANGLE';data.size=w;data.size_y=h
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;aim(ob,target)

area('Soft key',(0,-3,4),(0,0,0),790,(.93,.97,1),7,2.8)
area('Cyan edge',(-1,3.2,2.1),(0,0,.2),1000,(.38,.82,1),6,1.24)
area('Raking silver',(4,-1.6,2),(1.4,0,0),565,(.84,.94,1),1.5,4)
area('Mint bounce',(-2.8,-.5,-1.8),(-1,0,0),395,(.57,1,.77),5,1.45)
area('Front card',(0,-5,.8),(0,0,.3),260,(.73,.83,1),3.8,2)
cam_data=bpy.data.cameras.new('Lens')
cam=bpy.data.objects.new('Lens',cam_data);scene.collection.objects.link(cam);scene.camera=cam
def camera_pose(t):
    u=2*pi*t
    cam.location=(3.2+.34*sin(u),-10+.26*(1-cos(u)),6.7+.52*sin(u+.5))
    aim(cam,(0,0,.12))
    cam.rotation_euler.rotate_axis('Z',math.radians(-31+2.4*sin(u-.40)))
    cam.data.ortho_scale=5.9-.18*(1-cos(u))*.5
    edge=bpy.data.objects['Cyan edge']
    edge.location.x=-1.0+1.2*sin(u-.32)
    edge.data.energy=1030+175*sin(u)
    aim(edge,(0,0,.2))
    bpy.data.objects['Raking silver'].data.energy=565+160*sin(u-1.2)

cam.data.type='ORTHO'
scene.view_settings.view_transform='AgX'
args=sys.argv[sys.argv.index('--')+1:]
if args[0]=='--sequence':
    from pathlib import Path
    directory=Path(args[1]);directory.mkdir(parents=True,exist_ok=True)
    scene.render.resolution_x=960
    scene.render.resolution_y=640
    scene.cycles.samples=55
    count=32
    for i in range(count):
        camera_pose(i/count)
        scene.render.filepath=str(directory/('%03d.png'%i))
        bpy.ops.render.render(write_still=True)
else:
    camera_pose(0)
    scene.render.filepath=args[0]
    bpy.ops.render.render(write_still=True)
