// Clean-workstation presentation, separate from the physical scene definition.
import * as THREE from 'three';

function materialFinish(geom,body) {
  if(geom.includes('_collision'))return null;
  if(body==='open_end_wrench')return {metalness:.65,roughness:.32};
  if(geom.startsWith('robotwin_')) {
    if(geom.includes('_metal_'))return {metalness:.78,roughness:.26,color:'#aeb3b5'};
    if(geom.includes('_dark_'))return {metalness:.02,roughness:.8,color:'#292d2d'};
    if(geom.includes('_primary_'))return {metalness:.05,roughness:.46,color:'#aa8746'};
  }
  // Keep the source model's pre-September-6 colors, including distinct inner
  // rails, tray walls and mats. Retain current surface response and tool paint.
  if(geom.includes('_slot')||geom.includes('grip_stop')||geom.startsWith('frame_grip'))return {metalness:.08,roughness:.72};
  if(body.includes('cradle')||geom.startsWith('frame_support')||geom.startsWith('cross_member_stand'))return {metalness:.02,roughness:.84};
  if(body.includes('tray'))return {metalness:.02,roughness:.82};
  if(body==='cross_member'||geom.startsWith('frame_rail'))return {metalness:.56,roughness:.32};
  if(geom.includes('_plate_')||body==='mounting_plate')return {metalness:.55,roughness:.36};
  if(/^fastener_\d+$/.test(body))return {metalness:.65,roughness:.25};
  if(body.startsWith('tool_mat'))return {metalness:0,roughness:.91};
  if(body==='handover_pad')return {metalness:0,roughness:.87};
  if(body==='platform_inset')return {metalness:.13,roughness:.73};
  if(body==='assembly_platform')return {metalness:.22,roughness:.6};
  if(/^r[0-3]_/.test(body))return {metalness:.08,roughness:.34};
  return null;
}

// Only clone render materials. Never alter opacity, geometry, body transforms,
// collision masks, model arrays or the original shared materials.
export function styleAssemblyMesh(mesh,geom,body) {
  const original=mesh.material;
  if(!original?.isMeshStandardMaterial||original.opacity===0)return ()=>{};
  const finish=materialFinish(geom,body);
  if(!finish)return ()=>{};
  const material=original.clone();
  material.metalness=finish.metalness;material.roughness=finish.roughness;
  if(finish.color)material.color.set(finish.color);
  material.envMapIntensity=.75;
  mesh.material=material;
  return ()=>{if(mesh.material===material)mesh.material=original;material.dispose();};
}

// Repaint the source scan's patchy face buckets in body coordinates. Every
// partition uses the same continuous field, so old texture stains cannot leak
// into the clean finish. Positions and triangles are copied without modification.
export function cleanToolSurface(mesh,body) {
  const originalGeometry=mesh.geometry,originalMaterial=mesh.material;
  const geometry=originalGeometry.clone(),positions=geometry.attributes.position;
  const colors=new Float32Array(positions.count*3),finishes=new Float32Array(positions.count*2);
  const primary=new THREE.Color('#aa8746');
  const rubber=new THREE.Color('#292f30'),steel=new THREE.Color('#b4babc');
  const p=new THREE.Vector3(),color=new THREE.Color();mesh.updateMatrix();
  const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
  for(let i=0;i<positions.count;i++){
    p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrix);
    let dark=0,metal=0;
    if(body==='double_face_hammer'){
      metal=smooth(.045,.06,p.x);
      dark=(1-smooth(-.01,.025,p.x))*smooth(.002,.008,Math.abs(p.y));
    }else if(body==='torque_driver'){
      // This scan's battery-to-motor axis is X, not Z. Keep the rubber
      // handle/battery and chuck dark, with only the actual nose metallic.
      metal=smooth(.051,.058,p.z)*smooth(.055,.068,p.x);
      dark=Math.max(1-smooth(.025,.047,p.x),smooth(.006,.020,p.z),1-smooth(-.087,-.073,p.z));
    }else{
      metal=smooth(.025,.04,p.x);
      dark=(1-smooth(-.025,.012,p.x))*smooth(.008,.014,Math.abs(p.y));
    }
    color.copy(primary).lerp(rubber,dark).lerp(steel,metal).toArray(colors,i*3);
    finishes[i*2]=THREE.MathUtils.lerp(.04,.8,metal);
    finishes[i*2+1]=THREE.MathUtils.lerp(THREE.MathUtils.lerp(.44,.79,dark),.26,metal);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('cleanFinish',new THREE.BufferAttribute(finishes,2));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.2,envMapIntensity:.75});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 cleanFinish;\nvarying vec2 vCleanFinish;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCleanFinish = cleanFinish;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vCleanFinish;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor = vCleanFinish.y;').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor = vCleanFinish.x;');
  };
  material.customProgramCacheKey=()=> 'clean-tool-surface-v1';
  mesh.geometry=geometry;mesh.material=material;
  return ()=>{mesh.geometry=originalGeometry;mesh.material=originalMaterial;geometry.dispose();material.dispose();};
}

export function assemblyStationDecals() {
  return [];
}

function surfaceTexture(draw,width=1024,height=128) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas unavailable for workstation markings');
  draw(ctx,width,height);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

function nameAt(model,kind,id) {
  let s='';for(let p=model[`name_${kind}adr`][id];model.names[p];p++)s+=String.fromCharCode(model.names[p]);return s;
}

// One continuous machined face instead of visible overlapping collision blocks.
// The two through-bores and the original .048 m seating plane stay unchanged.
export function createConnectorSurface() {
  const outline=new THREE.Shape();
  outline.moveTo(-.076,-.024);outline.lineTo(.076,-.024);outline.lineTo(.076,.024);outline.lineTo(-.076,.024);outline.closePath();
  const round=new THREE.Path();round.absarc(-.038,0,.012,0,Math.PI*2,true);
  const square=new THREE.Path();square.moveTo(.028,-.012);square.lineTo(.028,.012);square.lineTo(.052,.012);square.lineTo(.052,-.012);square.closePath();
  outline.holes.push(round,square);
  const geometry=new THREE.ExtrudeGeometry(outline,{depth:.03,steps:1,curveSegments:48,bevelEnabled:false});
  geometry.translate(0,0,.018);
  // Match the source connector plate's linear MuJoCo RGB, not an sRGB hex.
  return new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:new THREE.Color(.24,.27,.29),metalness:.56,roughness:.3,envMapIntensity:.75}));
}

export function installAssemblyPresentation(scene,model) {
  const restores=[],decals=[],textures=[],groups=new Map();
  scene.traverse(object=>{
    const bodyID=object.userData.bodyID,geomID=object.userData.geomID;
    if(object.isGroup&&Number.isInteger(bodyID))groups.set(nameAt(model,'body',bodyID),object);
    if(object.isMesh&&Number.isInteger(geomID)){
      const geom=nameAt(model,'geom',geomID),body=nameAt(model,'body',bodyID);
      if(geom.startsWith('robotwin_')&&geom.endsWith('_visual_geom'))restores.push(cleanToolSurface(object,body));
      else restores.push(styleAssemblyMesh(object,geom,body));
    }
  });
  const root=new THREE.Group();root.name='assembly-clean-presentation';scene.add(root);
  const beam=groups.get('cross_member');
  if(beam){
    for(const child of beam.children){
      const id=child.userData.geomID;
      if(!Number.isInteger(id))continue;
      if(/^cross_member_(north|south)_(plate_|round_opening_segment_)/.test(nameAt(model,'geom',id))){
        const visible=child.visible;child.visible=false;restores.push(()=>{child.visible=visible;});
      }
    }
    for(const y of [-.215,.215]){
      const surface=createConnectorSurface();surface.position.y=y;surface.name='machined-connector';
      surface.castShadow=true;surface.receiveShadow=true;surface.raycast=()=>{};beam.add(surface);
      restores.push(()=>{surface.removeFromParent();surface.geometry.dispose();surface.material.dispose();});
    }
  }
  function decal(parent,texture,size,position,yaw=0) {
    const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.74,metalness:.12,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);
    mesh.position.set(...position);mesh.rotation.z=yaw;mesh.receiveShadow=true;
    // Etched/printed surface detail must not intercept manual picking.
    mesh.raycast=()=>{};parent.add(mesh);decals.push(mesh);return mesh;
  }
  // Flush mounting outlines on the existing platform, not raised plates that
  // would change the robot mounting height. Bolt recesses are surface graphics.
  const mount=surfaceTexture((ctx,w,h)=>{
    ctx.strokeStyle='#939b99';ctx.lineWidth=5;ctx.strokeRect(5,5,w-10,h-10);
    for(const x of [.12,.88])for(const y of [.12,.88]){
      ctx.fillStyle='#92999a';ctx.beginPath();ctx.arc(x*w,y*h,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#313b3c';ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(x*w+9*Math.cos(a),y*h+9*Math.sin(a));}ctx.closePath();ctx.fill();
    }
  },512,512);textures.push(mount);
  const bases=[[0,-.9], [.9,0],[-.3,.85],[-.8,0]];
  bases.forEach(([x,y],i)=>{
    decal(root,mount,[.29,.29],[x,y,.1003],i*Math.PI/2);
  });
  // Rings and crosshair annotations are printed on the existing tray floor.
  const pinTray=groups.get('fastener_tray');
  if(pinTray){
    const tex=surfaceTexture((ctx,w,h)=>{
      ctx.strokeStyle='#bdc3bd';ctx.lineWidth=5;ctx.beginPath();ctx.arc(w/2,h/2,w*.37,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#9b947b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w*.05,h*.5);ctx.lineTo(w*.2,h*.5);ctx.moveTo(w*.8,h*.5);ctx.lineTo(w*.95,h*.5);ctx.stroke();
    },128,128);textures.push(tex);
    for(const [x,y] of [[-.08,-.10],[-.04,.07],[.06,.07]])decal(pinTray,tex,[.045,.045],[x,y,.0103]);
  }
  // Corner screw-recess markings remain flush and travel with the real frame.
  const frame=groups.get('assembly_frame');
  if(frame){
    const tex=surfaceTexture((ctx,w,h)=>{
      ctx.fillStyle='#909b9d';ctx.beginPath();ctx.arc(w/2,h/2,w*.45,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#d1d5d4';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#394346';ctx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(w/2+w*.20*Math.cos(a),h/2+h*.20*Math.sin(a));}ctx.closePath();ctx.fill();
    },128,128);textures.push(tex);
    for(const x of [-.326,.326])for(const y of [-.242,.242])decal(frame,tex,[.018,.018],[x,y,.0253]);
  }
  return ()=>{
    for(const restore of restores.reverse())restore();
    for(const mesh of decals){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}
    for(const texture of textures)texture.dispose();root.removeFromParent();
  };
}
