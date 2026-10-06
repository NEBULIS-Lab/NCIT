import * as THREE from 'three';

export const CAMERA_KEYS=['global','arm1','arm2','arm3','arm4'];
export const CAMERA_LABELS=['Global · D435','Arm 1 · D435','Arm 2 · D435','Arm 3 · D435','Arm 4 · D435'];
export function selectedCameraViews(selection){return selection==='all'?[...CAMERA_KEYS]:[CAMERA_KEYS.includes(selection)?selection:'global'];}

export function withCameraOverlaysHidden(scene,render){
  const restore=[];
  scene.traverse(object=>{if(object.userData.sensorOverlay){restore.push([object,object.visible]);object.visible=false;}});
  try{return render();}finally{for(const [object,visible] of restore)object.visible=visible;}
}

// D435 source mesh axes: X lateral, Y vertical, +Z out of the front glass.
// The optical child uses Three's -Z forward. Never track/lookAt the gripper:
// extrinsics must stay rigid, including during handovers.
export function createAssemblyCameraRig(){
  const wrists=[],views=[];
  const global=new THREE.Group();global.name='global-d435-housing';
  global.position.set(.90,1.30,1.65);global.up.set(0,0,1);global.lookAt(0,0,.16);
  const addCamera=(parent,key,label)=>{
    const camera=new THREE.PerspectiveCamera(42.5,16/9,.004,20);
    camera.name=`sensor-${key}`;camera.position.set(.0325,0,.001);camera.rotation.y=Math.PI;
    parent.add(camera);views.push({key,label,camera});
  };
  addCamera(global,CAMERA_KEYS[0],CAMERA_LABELS[0]);
  for(let i=0;i<4;i++){
    const wrist=new THREE.Group();wrist.name=`arm${i+1}-camera-mount`;
    // The opposite flange side leaves room between donor and receiver wrists.
    wrist.rotation.z=Math.PI;
    const housing=new THREE.Group();housing.name=`arm${i+1}-d435-housing`;
    housing.position.set(.056,.0,.027);housing.rotation.z=Math.PI/2;
    wrist.add(housing);wrists.push(wrist);addCamera(housing,CAMERA_KEYS[i+1],CAMERA_LABELS[i+1]);
  }
  return {global,wrists,views};
}

// Conservative camera casing envelope; the source mesh remains the visual.
// Separate welded body contributes camera + holder mass without rewriting the
// original Panda inertial. Normal collisions stay enabled.
export const ASSEMBLY_CAMERA_PATCHES=[{
  target:'panda.xml',injectAfter:'<body name="hand"',
  inject:`<body name="wrist_camera" pos="-.056 0 .014475">
    <geom name="wrist_camera_casing_collision" type="box" size=".0125 .045 .012525" mass=".072" rgba="0 0 0 0"/>
    <geom name="wrist_camera_holder_collision" type="box" pos=".020 0 -.014475" size=".028 .028 .0025" mass=".015" rgba="0 0 0 0"/>
  </body>`,
},{
  target:'scene.xml',injectAfter:'<worldbody>',
  inject:`<body name="global_camera_mast">
    <geom name="camera_mast_pole_collision" type="box" pos=".90 1.34 .81" size=".01 .01 .79" rgba="0 0 0 0"/>
    <geom name="camera_mast_foot_collision" type="box" pos=".90 1.34 .012" size=".14 .01 .01" rgba="0 0 0 0"/>
  </body>`,
}];
