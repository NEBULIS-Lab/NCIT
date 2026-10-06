import { fixedBox, FRANKA_HOME, repeatPose } from './sceneLayouts.js';
import { HAMMER_COLLISION_ASSETS, HAMMER_COLLISION_GEOMS } from './hammerCollisionGeometry.js';
import { WRENCH_ASSET_XML, WRENCH_BODY_XML } from './robodojoWrench.js';

const QUARTER_TURN_DEGREES = 90;
const HALF_TURN_DEGREES = 180;
const PLATFORM_TOP = 0.1;
const RING_RADIUS = 0.9;

const TASK_STATIONS = {
  frame: [0, 0, 0.275],
  parts: [-0.56, 0.42, 0.125],
  poweredTool: [0.53, -0.42, 0.146],
  manualTool: [-0.53, -0.42, 0.13],
  hammer: [0.65, 0, 0.229],
  fasteners: [0.56, 0.42, 0.125],
  handover: [0, -0.48, 0.112],
};

export const FRANKA_ASSEMBLY_INTERFACE = {
  // Install the beam 80 mm west of center, toward Arm 4, while preserving
  // the same four-hole interface geometry.
  crossMemberTargetPose: [-0.08, 0, 0.278],
  frameReceiverPositions: [
    [-0.12, 0.215, 0.275],
    [-0.04, 0.215, 0.275],
    [-0.12, -0.215, 0.275],
    [-0.04, -0.215, 0.275],
  ],
  crossMemberHoleLocalPositions: [
    [-0.04, 0.215, -0.003],
    [0.04, 0.215, -0.003],
    [-0.04, -0.215, -0.003],
    [0.04, -0.215, -0.003],
  ],
};

export function applyAssemblyTargetPose(points, targetPose) {
  return points.map((point) => point.map((value, axis) => value + targetPose[axis]));
}

function attachmentFrames(northArmX = 0, northArmY = RING_RADIUS, westArmX = -RING_RADIUS) {
  return [
    { position: [0, -RING_RADIUS, PLATFORM_TOP], yaw: 0 },
    { position: [RING_RADIUS, 0, PLATFORM_TOP], yaw: QUARTER_TURN_DEGREES },
    { position: [northArmX, northArmY, PLATFORM_TOP], yaw: HALF_TURN_DEGREES },
    { position: [westArmX, 0, PLATFORM_TOP], yaw: -QUARTER_TURN_DEGREES },
  ].map(({ position, yaw }, index) => {
    const euler = yaw === 0 ? '' : ` euler="0 0 ${yaw}"`;
    return `<frame pos="${position.join(' ')}"${euler}><attach model="panda_model" body="link0" prefix="r${index}_"/></frame>`;
  }).join('');
}

function octagonalHandleMesh() {
  const rings = [
    [-0.105, 0.021], [-0.098, 0.0255], [-0.071, 0.0255], [-0.066, 0.022],
    [-0.058, 0.022], [-0.053, 0.0255], [-0.023, 0.0255], [-0.018, 0.022],
    [-0.010, 0.022], [-0.005, 0.0255], [0.027, 0.0255], [0.039, 0.020],
  ];
  const vertices = rings.flatMap(([x, radius]) => Array.from({ length: 8 }, (_, index) => {
    const angle = Math.PI / 8 + index * Math.PI / 4;
    return [x, radius * Math.cos(angle), radius * Math.sin(angle)];
  }));
  const faces = [];
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < 8; side += 1) {
      const next = (side + 1) % 8;
      const a = ring * 8 + side;
      const b = ring * 8 + next;
      const c = (ring + 1) * 8 + next;
      const d = (ring + 1) * 8 + side;
      faces.push([a, b, c], [a, c, d]);
    }
  }
  for (let side = 1; side < 7; side += 1) {
    faces.push([0, side + 1, side]);
    const end = (rings.length - 1) * 8;
    faces.push([end, end + side, end + side + 1]);
  }
  return `vertex="${vertices.flat().map((value) => value.toFixed(6)).join(' ')}" face="${faces.flat().join(' ')}"`;
}

function cleanDecimal(value) {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function recessedCrossMemberFlangesXml() {
  const segments = [
    ['south_outer', -0.19875, 0.04625, 0, 0.018, 0.0085],
    ['south_grip_recess', -0.1275, 0.025, 0.006, 0.012, 0.003],
    ['center', 0, 0.1025, 0, 0.018, 0.01875],
    ['north_grip_recess', 0.1275, 0.025, 0.006, 0.012, 0.003],
    ['north_outer', 0.19875, 0.04625, 0, 0.018, 0.0085],
  ];
  return [
    ['left', -0.016, '.56 .58 .59 1'],
    ['right', 0.016, '.68 .69 .69 1'],
  ].flatMap(([flange, x, rgba]) => segments.map(([name, y, halfY, z, halfZ, mass]) => {
    const halfX = name.includes('grip_recess') ? '.0045' : '.009';
    const contact = name.includes('grip_recess')
      ? 'friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"'
      : 'friction="1.2 .2 .02"';
    return `<geom name="cross_member_flange_${flange}_${name}" type="box" `
      + `pos="${x} ${y} ${z}" size="${halfX} ${halfY} ${halfZ}" `
      + `rgba="${rgba}" mass="${mass}" ${contact}/>`;
  })).join('\n      ');
}

function connectorInterfaceXml(side, y) {
  const direction = Math.sign(y);
  const platePieces = [
    ['outer', 0, cleanDecimal(y + direction * 0.018), '.076 .006 .015'],
    ['inner', 0, cleanDecimal(y - direction * 0.018), '.076 .006 .015'],
    ['left', -0.071, y, '.005 .012 .015'],
    ['center', 0, y, '.008 .012 .015'],
    ['right', 0.071, y, '.005 .012 .015'],
    ['round_bridge_west', -0.061, y, '.005 .012 .015'],
    ['round_bridge_east', -0.014, y, '.006 .012 .015'],
    ['square_opening_west_fill', 0.018, y, '.010 .012 .015'],
    ['square_opening_east_fill', 0.059, y, '.007 .012 .015'],
  ].map(([name, x, pieceY, size]) => (
    `<geom name="cross_member_${side}_plate_${name}" type="box" `
    + `pos="${x} ${pieceY} .033" size="${size}" `
    + 'rgba=".24 .27 .29 1" mass=".002"/>'
  )).join('\n      ');
  const circleCenterX = -0.038;
  const circleRadius = 0.015;
  const circleSegments = Array.from({ length: 12 }, (_, index) => {
    const angleDegrees = index * 30;
    const angle = angleDegrees * Math.PI / 180;
    const x = cleanDecimal(circleCenterX + circleRadius * Math.cos(angle));
    const segmentY = cleanDecimal(y + circleRadius * Math.sin(angle));
    return `<geom name="cross_member_${side}_round_opening_segment_${String(index + 1).padStart(2, '0')}" `
      + `type="box" pos="${x} ${segmentY} .033" size=".005 .003 .015" `
      + `euler="0 0 ${angleDegrees + 90}" rgba=".24 .27 .29 1" mass=".001"/>`;
  }).join('\n      ');
  const squareOpening = `<site name="cross_member_${side}_square_opening" `
    + `pos=".04 ${y} .033" type="box" size=".012 .012 .002" rgba="0 0 0 0"/>`;
  return `${platePieces}\n      ${circleSegments}\n      ${squareOpening}`;
}

function hollowConnectorInterfacesXml() {
  return `${connectorInterfaceXml('north', 0.215)}\n      ${connectorInterfaceXml('south', -0.215)}`;
}

function fastenerPickFixtureXml() {
  const segments = Array.from({ length: 8 }, (_, index) => {
    const angleDegrees = index * 45;
    const angle = angleDegrees * Math.PI / 180;
    const x = cleanDecimal(.010 * Math.cos(angle));
    const y = cleanDecimal(.010 * Math.sin(angle));
    return `<geom name="fastener_1_pick_fixture_segment_${index + 1}" type="box" `
      + `pos="${x} ${y} .002" size=".005 .0025 .002" euler="0 0 ${angleDegrees + 90}" `
      + 'rgba=".22 .24 .25 1" friction=".3 .02 .001"/>';
  }).join('\n      ');
  return `<body name="fastener_1_pick_fixture" pos=".10 .38 .12">\n      ${segments}\n    </body>`;
}

export const SHARED_ASSEMBLY1_WORKCELL_XML = `
    <!-- Four supports hold the movable frame at the same height as its installation pose. -->
    <body name="frame_supports">
      <geom name="frame_support_nw" type="box" pos="-.27 .18 .155" size=".055 .045 .055" rgba=".16 .18 .2 1"/>
      <geom name="frame_support_ne" type="box" pos=".27 .18 .155" size=".055 .045 .055" rgba=".16 .18 .2 1"/>
      <geom name="frame_support_sw" type="box" pos="-.27 -.18 .155" size=".055 .045 .055" rgba=".16 .18 .2 1"/>
      <geom name="frame_support_se" type="box" pos=".27 -.18 .155" size=".055 .045 .055" rgba=".16 .18 .2 1"/>
    </body>

    <!-- Paired silver flanges and dark T-slots make the aluminum extrusion readable. -->
    <body name="assembly_frame" pos="0 0 .235">
      <freejoint/>
      <geom name="frame_rail_north_outer" type="box" pos="0 .242 0" size=".34 .012 .025" rgba=".55 .57 .58 1"/>
      <geom name="frame_rail_north_inner" type="box" pos="0 .218 0" size=".34 .008 .025" rgba=".68 .69 .69 1"/>
      <geom name="frame_rail_north_slot" type="box" pos="0 .229 .026" size=".31 .006 .003" rgba=".08 .09 .1 1" contype="0" conaffinity="0"/>
      <geom name="frame_rail_south_outer" type="box" pos="0 -.242 0" size=".34 .012 .025" rgba=".55 .57 .58 1"/>
      <geom name="frame_rail_south_inner" type="box" pos="0 -.218 0" size=".34 .008 .025" rgba=".68 .69 .69 1"/>
      <geom name="frame_rail_south_slot" type="box" pos="0 -.229 .026" size=".31 .006 .003" rgba=".08 .09 .1 1" contype="0" conaffinity="0"/>
      <geom name="frame_rail_west_outer" type="box" pos="-.327 0 0" size=".013 .205 .025" rgba=".55 .57 .58 1"/>
      <geom name="frame_rail_west_inner" type="box" pos="-.303 0 0" size=".008 .205 .025" rgba=".68 .69 .69 1"/>
      <geom name="frame_rail_west_slot" type="box" pos="-.315 0 .026" size=".006 .18 .003" rgba=".08 .09 .1 1" contype="0" conaffinity="0"/>
      <geom name="frame_rail_east_outer" type="box" pos=".327 0 0" size=".013 .205 .025" rgba=".55 .57 .58 1"/>
      <geom name="frame_rail_east_inner" type="box" pos=".303 0 0" size=".008 .205 .025" rgba=".68 .69 .69 1"/>
      <geom name="frame_rail_east_slot" type="box" pos=".315 0 .026" size=".006 .18 .003" rgba=".08 .09 .1 1" contype="0" conaffinity="0"/>
      <geom name="frame_grip_west" type="box" pos="-.354 0 .006" size=".014 .08 .034" rgba=".15 .17 .18 1"/>
      <geom name="frame_grip_east" type="box" pos=".354 0 .006" size=".014 .08 .034" rgba=".15 .17 .18 1"/>
      <site name="frame_receiver_nw" pos="-.12 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="frame_receiver_ne" pos="-.04 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="frame_receiver_sw" pos="-.12 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="frame_receiver_se" pos="-.04 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
    </body>

    <body name="parts_tray" pos="-.57 .44 .11">
      <geom name="parts_tray_floor" type="box" size=".25 .29 .01" rgba=".24 .3 .34 1"/>
      <geom name="parts_tray_west_wall" type="box" pos="-.245 0 .035" size=".008 .29 .035" rgba=".19 .24 .28 1"/>
      <geom name="parts_tray_east_wall" type="box" pos=".245 0 .035" size=".008 .29 .035" rgba=".19 .24 .28 1"/>
      <geom name="parts_tray_north_wall" type="box" pos="0 .285 .035" size=".25 .008 .035" rgba=".19 .24 .28 1"/>
      <geom name="parts_tray_south_wall" type="box" pos="0 -.285 .035" size=".25 .008 .035" rgba=".19 .24 .28 1"/>
      <geom name="cross_member_stand_south" type="box" pos=".08 -.20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>
      <geom name="cross_member_stand_north" type="box" pos=".08 .20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>
    </body>

    <!-- At target pose (0, 0, .278), the beam rests on the frame instead of intersecting it. -->
    <body name="cross_member" pos="-.49 .44 .20">
      <freejoint/>
      <geom name="cross_member_flange_left" type="box" pos="-.016 0 0" size=".009 .245 .018" rgba=".56 .58 .59 1" mass=".18" friction="1.2 .2 .02"/>
      <geom name="cross_member_flange_right" type="box" pos=".016 0 0" size=".009 .245 .018" rgba=".68 .69 .69 1" mass=".18" friction="1.2 .2 .02"/>
      <!-- Side-stop pairs retain both grippers during carry without blocking upward withdrawal. -->
      <geom name="cross_member_grip_stop_north_outer" type="box" pos="0 .1525 0" size=".035 .004 .025" rgba=".14 .16 .17 1" mass=".01" friction="2 .2 .03"/>
      <geom name="cross_member_grip_stop_north_inner" type="box" pos="0 .1025 0" size=".035 .004 .025" rgba=".14 .16 .17 1" mass=".01" friction="2 .2 .03"/>
      <geom name="cross_member_grip_stop_south_outer" type="box" pos="0 -.1525 0" size=".035 .004 .025" rgba=".14 .16 .17 1" mass=".01" friction="2 .2 .03"/>
      <geom name="cross_member_grip_stop_south_inner" type="box" pos="0 -.1025 0" size=".035 .004 .025" rgba=".14 .16 .17 1" mass=".01" friction="2 .2 .03"/>
      <geom name="cross_member_slot" type="box" pos="0 0 .019" size=".005 .205 .002" rgba=".08 .09 .1 1" contype="0" conaffinity="0"/>
      <geom name="cross_member_north_plate_mount" type="box" pos="0 .215 .025" size=".076 .024 .007" rgba=".31 .34 .36 1" mass=".015" friction="1.2 .2 .02"/>
      <geom name="cross_member_north_plate_outer" type="box" pos="0 .239 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_north_plate_inner" type="box" pos="0 .191 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_north_plate_left" type="box" pos="-.071 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_north_plate_center" type="box" pos="0 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_north_plate_right" type="box" pos=".071 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_mount" type="box" pos="0 -.215 .025" size=".076 .024 .007" rgba=".31 .34 .36 1" mass=".015" friction="1.2 .2 .02"/>
      <geom name="cross_member_south_plate_outer" type="box" pos="0 -.239 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_south_plate_inner" type="box" pos="0 -.191 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_south_plate_left" type="box" pos="-.071 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_center" type="box" pos="0 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_right" type="box" pos=".071 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <site name="cross_member_north_hole_left" pos="-.04 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="cross_member_north_hole_right" pos=".04 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="cross_member_south_hole_left" pos="-.04 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="cross_member_south_hole_right" pos=".04 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>
      <site name="cross_member_hole_nw" pos="-.04 .215 -.003" size=".004" rgba=".8 .55 .18 .35"/>
      <site name="cross_member_hole_ne" pos=".04 .215 -.003" size=".004" rgba=".8 .55 .18 .35"/>
      <site name="cross_member_hole_sw" pos="-.04 -.215 -.003" size=".004" rgba=".8 .55 .18 .35"/>
      <site name="cross_member_hole_se" pos=".04 -.215 -.003" size=".004" rgba=".8 .55 .18 .35"/>
    </body>

    <body name="mounting_plate" pos="-.72 .44 .135">
      <freejoint/>
      <geom name="mounting_plate_body" type="box" size=".065 .09 .012" rgba=".48 .5 .52 1" mass=".18" friction="1.2 .2 .02"/>
      <geom name="mounting_plate_boss" type="cylinder" pos="0 0 .02" size=".026 .008" rgba=".22 .24 .25 1" mass=".02"/>
      <site name="mounting_plate_hole" pos="0 0 .031" type="cylinder" size=".009 .002" rgba=".06 .07 .08 1"/>
    </body>

    <body name="fastener_tray" pos=".56 .42 .11">
      <geom name="fastener_tray_floor" type="box" size=".18 .18 .01" rgba=".3 .32 .34 1"/>
      <geom name="fastener_tray_west_wall" type="box" pos="-.175 0 .03" size=".008 .18 .03" rgba=".21 .23 .25 1"/>
      <geom name="fastener_tray_east_wall" type="box" pos=".175 0 .03" size=".008 .18 .03" rgba=".21 .23 .25 1"/>
      <geom name="fastener_tray_north_wall" type="box" pos="0 .175 .03" size=".18 .008 .03" rgba=".21 .23 .25 1"/>
      <geom name="fastener_tray_south_wall" type="box" pos="0 -.175 .03" size=".18 .008 .03" rgba=".21 .23 .25 1"/>
    </body>
    <body name="fastener_1" pos=".50 .36 .152"><freejoint/><geom name="fastener_1_shaft" type="cylinder" size=".007 .025" rgba=".42 .43 .44 1" mass=".012"/><geom name="fastener_1_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"/></body>
    <body name="fastener_2" pos=".60 .36 .152"><freejoint/><geom name="fastener_2_shaft" type="cylinder" size=".007 .025" rgba=".42 .43 .44 1" mass=".012"/><geom name="fastener_2_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"/></body>
    <body name="fastener_3" pos=".50 .48 .152"><freejoint/><geom name="fastener_3_shaft" type="cylinder" size=".007 .025" rgba=".42 .43 .44 1" mass=".012"/><geom name="fastener_3_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"/></body>
    <body name="fastener_4" pos=".60 .48 .152"><freejoint/><geom name="fastener_4_shaft" type="cylinder" size=".007 .025" rgba=".42 .43 .44 1" mass=".012"/><geom name="fastener_4_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"/></body>`;

export const SHARED_ASSEMBLY1_ASSET_XML = `<mesh name="manual_screwdriver_octagonal_handle" ${octagonalHandleMesh()}/>`;

export const SHARED_ASSEMBLY1_TOOL_XML = `
    <body name="manual_screwdriver" pos="-.53 -.42 .145">
      <joint name="manual_screwdriver_free" type="free" damping=".08"/>
      <geom name="manual_screwdriver_handle" type="mesh" mesh="manual_screwdriver_octagonal_handle" rgba=".48 .19 .07 1" contype="0" conaffinity="0" mass=".001"/>
      <geom name="manual_screwdriver_handle_collision" type="box" pos="-.033 0 0" size=".072 .022 .022" rgba="0 0 0 0" mass=".109" friction="1.6 .25 .03"/>
      <geom name="manual_screwdriver_collar" type="cylinder" fromto=".039 0 0 .066 0 0" size=".015" rgba=".16 .17 .18 1" mass=".02"/>
      <geom name="manual_screwdriver_shaft" type="cylinder" fromto=".066 0 0 .19 0 0" size=".006" rgba=".5 .51 .52 1" mass=".035"/>
      <geom name="manual_screwdriver_tip" type="box" pos=".199 0 0" size=".012 .004 .002" rgba=".2 .21 .22 1" mass=".005"/>
    </body>

    <body name="torque_driver" pos=".53 -.42 .166" euler="90 0 0">
      <freejoint/>
      <geom name="torque_driver_housing" type="capsule" fromto="-.045 0 .064 .055 0 .064" size=".038" rgba=".42 .22 .07 1" mass=".2" friction="1.3 .2 .02"/>
      <geom name="torque_driver_rear_cap" type="box" pos=".055 0 .064" size=".018 .035 .033" rgba=".14 .15 .16 1" mass=".03"/>
      <geom name="torque_driver_gearbox" type="cylinder" fromto="-.045 0 .064 -.082 0 .064" size=".029" rgba=".24 .25 .26 1" mass=".05"/>
      <geom name="torque_driver_selector" type="cylinder" fromto="-.082 0 .064 -.099 0 .064" size=".023" rgba=".1 .11 .12 1" mass=".02"/>
      <geom name="torque_driver_chuck" type="cylinder" fromto="-.099 0 .064 -.132 0 .064" size=".017" rgba=".18 .19 .2 1" mass=".03"/>
      <geom name="torque_driver_bit" type="cylinder" fromto="-.132 0 .064 -.196 0 .064" size=".005" rgba=".5 .51 .52 1" mass=".012"/>
      <geom name="torque_driver_grip" type="capsule" fromto=".015 0 .044 .043 0 -.043" size=".025" rgba=".12 .13 .14 1" mass=".12"/>
      <geom name="torque_driver_trigger" type="box" pos="-.006 -.027 .018" size=".015 .008 .018" euler="-18 0 0" rgba=".62 .33 .09 1" mass=".01"/>
      <geom name="torque_driver_battery" type="box" pos=".047 0 -.078" size=".054 .044 .015" rgba=".1 .11 .12 1" mass=".13"/>
      <geom name="torque_driver_battery_foot" type="box" pos=".047 0 -.095" size=".06 .048 .007" rgba=".2 .21 .22 1" mass=".03"/>
      <geom name="torque_driver_vent_left" type="box" pos=".048 -.036 .074" size=".026 .002 .003" rgba=".05 .06 .07 1" contype="0" conaffinity="0"/>
      <geom name="torque_driver_vent_right" type="box" pos=".048 .036 .074" size=".026 .002 .003" rgba=".05 .06 .07 1" contype="0" conaffinity="0"/>
      <geom name="torque_driver_vent_left_2" type="box" pos=".048 -.036 .062" size=".026 .002 .003" rgba=".05 .06 .07 1" contype="0" conaffinity="0"/>
      <geom name="torque_driver_vent_right_2" type="box" pos=".048 .036 .062" size=".026 .002 .003" rgba=".05 .06 .07 1" contype="0" conaffinity="0"/>
    </body>

    <body name="double_face_hammer" pos=".65 0 .229" euler="0 0 180">
      <freejoint/>
      <geom name="hammer_handle_core" type="box" pos="-.045 0 -.005" size=".105 .014 .014" rgba=".43 .22 .08 1" mass=".1" friction="1.4 .22 .03"/>
      <geom name="hammer_handle_grip" type="box" pos="-.083 0 -.005" size=".073 .021 .018" rgba=".11 .12 .13 1" mass=".12" friction="10 2 1" condim="6"/>
      <geom name="hammer_eye" type="cylinder" fromto=".048 0 0 .102 0 0" size=".021" rgba=".18 .19 .2 1" mass=".08"/>
      <geom name="hammer_cheek" type="box" pos=".075 0 0" size=".032 .03 .025" rgba=".32 .33 .34 1" mass=".18"/>
      <geom name="hammer_face_neck_a" type="cylinder" fromto=".075 -.030 0 .075 -.053 0" size=".019" rgba=".36 .37 .38 1" mass=".04"/>
      <geom name="hammer_striking_face_a" type="cylinder" fromto=".075 -.053 0 .075 -.073 0" size=".027" rgba=".5 .51 .52 1" mass=".08"/>
      <geom name="hammer_face_neck_b" type="cylinder" fromto=".075 .030 0 .075 .053 0" size=".019" rgba=".36 .37 .38 1" mass=".04"/>
      <geom name="hammer_striking_face_b" type="cylinder" fromto=".075 .053 0 .075 .073 0" size=".027" rgba=".5 .51 .52 1" mass=".08"/>
    </body>`;

const FRANKA_ASSEMBLY1_TOOL_XML = SHARED_ASSEMBLY1_TOOL_XML
  .replace(
    '<body name="torque_driver" pos=".53 -.42 .166" euler="90 0 0">',
    '<body name="torque_driver" pos=".65 0 .238" euler="90 0 0">',
  )
  .replace(
    '<body name="double_face_hammer" pos=".65 0 .229" euler="0 0 180">',
    '<body name="double_face_hammer" pos=".642 -.421 .171">',
  )
  .replace(
    'name="hammer_handle_grip" type="box" pos="-.083 0 -.005" size=".073 .021 .018"',
    'name="hammer_handle_grip" type="box" pos="-.0655 0 -.005" size=".0905 .021 .018"',
  )
  .replace('mass=".1" friction="1.4 .22 .03"', 'mass=".003" friction="2 .3 .04"')
  .replace(
    'mass=".12" friction="10 2 1" condim="6"/>\n      <geom name="hammer_eye"',
    'mass=".003" friction="10 2 1" condim="6"/>\n      <geom name="hammer_eye"',
  )
  .replace('mass=".08"/>\n      <geom name="hammer_cheek"', 'mass=".002"/>\n      <geom name="hammer_cheek"')
  .replace('mass=".18"/>\n      <geom name="hammer_face_neck_a"', 'mass=".004"/>\n      <geom name="hammer_face_neck_a"')
  .replaceAll('mass=".04"/>\n      <geom name="hammer_striking_face_', 'mass=".001"/>\n      <geom name="hammer_striking_face_')
  .replaceAll('mass=".08"/>', 'mass=".002"/>')
  .replace(
    '<geom name="hammer_handle_grip" type="box" pos="-.0655 0 -.005" size=".0905 .021 .018" rgba=".11 .12 .13 1" mass=".003" friction="10 2 1" condim="6"/>',
    `<geom name="hammer_handle_grip" type="box" pos="-.0655 0 -.005" size=".0905 .021 .018" rgba=".11 .12 .13 1" mass=".003" friction="10 2 1" condim="6"/>
      <geom name="hammer_grip_upper_guard" type="box" pos="-.0655 0 .017" size=".045 .026 .004" rgba=".08 .09 .1 1" mass=".001" friction="10 2 1" condim="6"/>
      <geom name="hammer_grip_lower_guard" type="box" pos="-.0655 0 -.027" size=".045 .026 .004" rgba=".08 .09 .1 1" mass=".001" friction="10 2 1" condim="6"/>`,
  );

function assembly1ReachableFastenerWorkcellXml() {
  return SHARED_ASSEMBLY1_WORKCELL_XML
    .replace(
      'name="frame_rail_south_outer" type="box" pos="0 -.242 0" size=".34 .012 .025"',
      'name="frame_rail_south_outer" type="box" pos="0 -.242 0" size=".34 .018 .025"',
    )
    .replace(
      `<geom name="cross_member_stand_south" type="box" pos=".08 -.20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>
      <geom name="cross_member_stand_north" type="box" pos=".08 .20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>`,
      `<geom name="cross_member_stand_south" type="box" pos=".08 -.20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>
      <geom name="cross_member_stand_north" type="box" pos=".08 .20 .041" size=".045 .025 .031" rgba=".16 .18 .2 1"/>
      <!-- Passive pickup guides keep the free beam centered while it settles;
           all four are low and remain behind when the beam is lifted. -->
      <geom name="cross_member_pickup_guide_west" type="box" pos=".043 0 .07" size=".005 .05 .01" rgba=".16 .18 .2 1" friction="2 .2 .03"/>
      <geom name="cross_member_pickup_guide_east" type="box" pos=".117 0 .07" size=".005 .05 .01" rgba=".16 .18 .2 1" friction="2 .2 .03"/>
      <geom name="cross_member_pickup_guide_north" type="box" pos=".08 .262 .07" size=".08 .005 .01" rgba=".16 .18 .2 1" friction="2 .2 .03"/>
      <geom name="cross_member_pickup_guide_south" type="box" pos=".08 -.262 .07" size=".08 .005 .01" rgba=".16 .18 .2 1" friction="2 .2 .03"/>`,
    )
    .replace(
      `<geom name="cross_member_flange_left" type="box" pos="-.016 0 0" size=".009 .245 .018" rgba=".56 .58 .59 1" mass=".18" friction="1.2 .2 .02"/>
      <geom name="cross_member_flange_right" type="box" pos=".016 0 0" size=".009 .245 .018" rgba=".68 .69 .69 1" mass=".18" friction="1.2 .2 .02"/>`,
      `${recessedCrossMemberFlangesXml()}
      <!-- Solid underside bridges stop the fingers entering the extrusion gap;
           they remain recessed and do not obstruct upward gripper withdrawal. -->
      <geom name="cross_member_grip_recess_bridge_north" type="box" pos="0 .1275 .006" size=".012 .025 .012" rgba=".61 .63 .64 1" mass=".005" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>
      <geom name="cross_member_grip_recess_bridge_south" type="box" pos="0 -.1275 .006" size=".012 .025 .012" rgba=".61 .63 .64 1" mass=".005" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>
      <!-- Recess shoulders mechanically retain the beam during carry.  Keep
           the upper shoulders inside the fingertip envelope so the Panda hand
           can reach the installed height without pushing the beam or frame. -->
      <geom name="cross_member_grip_lower_guard_north" type="box" pos="0 .1275 -.010" size=".026 .021 .004" rgba=".48 .50 .51 1" mass=".002" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>
      <geom name="cross_member_grip_lower_guard_south" type="box" pos="0 -.1275 -.010" size=".026 .021 .004" rgba=".48 .50 .51 1" mass=".002" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>
      <geom name="cross_member_grip_upper_guard_north" type="box" pos="0 .1275 .012" size=".026 .021 .002" rgba=".48 .50 .51 1" mass=".002" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>
      <geom name="cross_member_grip_upper_guard_south" type="box" pos="0 -.1275 .012" size=".026 .021 .002" rgba=".48 .50 .51 1" mass=".002" friction="10 2 1" condim="6" solref=".002 1" solimp=".95 .99 .001"/>`,
    )
    .replaceAll('mass=".01" friction="2 .2 .03"', 'mass=".005" friction="2 .2 .03"')
    .replace(
      `<geom name="cross_member_north_plate_mount" type="box" pos="0 .215 .025" size=".076 .024 .007" rgba=".31 .34 .36 1" mass=".015" friction="1.2 .2 .02"/>
      <geom name="cross_member_north_plate_outer" type="box" pos="0 .239 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_north_plate_inner" type="box" pos="0 .191 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_north_plate_left" type="box" pos="-.071 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_north_plate_center" type="box" pos="0 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_north_plate_right" type="box" pos=".071 .215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_mount" type="box" pos="0 -.215 .025" size=".076 .024 .007" rgba=".31 .34 .36 1" mass=".015" friction="1.2 .2 .02"/>
      <geom name="cross_member_south_plate_outer" type="box" pos="0 -.239 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_south_plate_inner" type="box" pos="0 -.191 .04" size=".076 .006 .008" rgba=".24 .27 .29 1" mass=".015"/>
      <geom name="cross_member_south_plate_left" type="box" pos="-.071 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_center" type="box" pos="0 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>
      <geom name="cross_member_south_plate_right" type="box" pos=".071 -.215 .04" size=".005 .018 .008" rgba=".24 .27 .29 1" mass=".01"/>`,
      hollowConnectorInterfacesXml(),
    )
    .replace(
      '<site name="cross_member_north_hole_left" pos="-.04 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>',
      '<site name="cross_member_north_hole_left" pos="-.04 .215 .04" type="cylinder" size=".012 .002" rgba="0 0 0 0"/>',
    )
    .replace(
      '<site name="cross_member_north_hole_right" pos=".04 .215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>',
      '<site name="cross_member_north_hole_right" pos=".04 .215 .04" type="box" size=".012 .012 .002" rgba="0 0 0 0"/>',
    )
    .replace(
      '<site name="cross_member_south_hole_left" pos="-.04 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>',
      '<site name="cross_member_south_hole_left" pos="-.04 -.215 .04" type="cylinder" size=".012 .002" rgba="0 0 0 0"/>',
    )
    .replace(
      '<site name="cross_member_south_hole_right" pos=".04 -.215 .04" type="cylinder" size=".012 .002" rgba=".07 .08 .09 1"/>',
      '<site name="cross_member_south_hole_right" pos=".04 -.215 .04" type="box" size=".012 .012 .002" rgba="0 0 0 0"/>',
    )
    .replace('name="fastener_tray" pos=".56 .42 .11"', 'name="fastener_tray" pos=".18 .48 .11"')
    .replace(
      '<geom name="fastener_tray_floor" type="box" size=".18 .18 .01"',
      '<geom name="fastener_tray_floor" type="box" pos="0 0 -.03" size=".18 .18 .04"',
    )
    // Keep the active fastener alone on the south side of the tray.  The two
    // spares stay together at the north edge, outside the closing fingers'
    // approach corridor.
    .replace('name="fastener_1" pos=".50 .36 .152"', 'name="fastener_1" pos=".10 .38 .152"')
    // Seat the spares on the tray (top .12 + shaft half-height .025).
    // Torsional/rolling contact friction dissipates spin and rocking without locking either
    // free body. Only spare shafts change; the picked fastener is untouched.
    .replace('name="fastener_2" pos=".60 .36 .152"', 'name="fastener_2" pos=".14 .55 .145"')
    .replace('name="fastener_3" pos=".50 .48 .152"', 'name="fastener_3" pos=".24 .55 .145"')
    .replace('name="fastener_2_shaft" type="cylinder" size=".007 .025"', 'name="fastener_2_shaft" type="cylinder" size=".007 .025" condim="6" friction="1 .005 .001" priority="1" solref=".004 1" solimp=".95 .99 .001"')
    .replace('name="fastener_3_shaft" type="cylinder" size=".007 .025"', 'name="fastener_3_shaft" type="cylinder" size=".007 .025" condim="6" friction="1 .005 .001" priority="1" solref=".004 1" solimp=".95 .99 .001"')
    .replace(
      '    <body name="fastener_1" pos=".10 .38 .152"><freejoint/>',
      `    ${fastenerPickFixtureXml()}\n    <body name="fastener_1" pos=".10 .38 .152"><freejoint/>`,
    )
    // Give the picked fastener head a firm, high-friction contact law.  Its
    // higher priority makes these parameters govern finger/head contacts,
    // avoiding the soft-contact penetration that otherwise substitutes for
    // real clamping force.  Shape, pose and free-joint dynamics are unchanged.
    .replace(
      'name="fastener_1_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"',
      'name="fastener_1_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006" friction="10 2 1" condim="6" priority="1" solref=".001 1" solimp=".99 .999 .0001"',
    )
    .replace(
      '    <body name="fastener_4" pos=".60 .48 .152"><freejoint/><geom name="fastener_4_shaft" type="cylinder" size=".007 .025" rgba=".42 .43 .44 1" mass=".012"/><geom name="fastener_4_head" type="cylinder" pos="0 0 .032" size=".015 .007" rgba=".16 .17 .18 1" mass=".006"/></body>',
      '',
    );
}

const ASSEMBLY2_ASSET_XML = `
      <material name="robotwin_screwdriver_primary_material" rgba=".90 .55 .06 1" specular=".2" shininess=".18"/>
      <material name="robotwin_screwdriver_dark_material" rgba=".08 .09 .10 1" specular=".16" shininess=".12"/>
      <material name="robotwin_screwdriver_metal_material" rgba=".58 .60 .62 1" specular=".55" shininess=".42"/>
      <material name="robotwin_drill_primary_material" rgba=".34 .32 .29 1" specular=".18" shininess=".15"/>
      <material name="robotwin_drill_dark_material" rgba=".07 .08 .09 1" specular=".18" shininess=".14"/>
      <material name="robotwin_drill_metal_material" rgba=".62 .64 .65 1" specular=".58" shininess=".45"/>
      <material name="robotwin_hammer_primary_material" rgba=".84 .55 .04 1" specular=".16" shininess=".12"/>
      <material name="robotwin_hammer_dark_material" rgba=".07 .08 .09 1" specular=".16" shininess=".12"/>
      <material name="robotwin_hammer_metal_material" rgba=".60 .62 .63 1" specular=".6" shininess=".48"/>
      <mesh name="robotwin_screwdriver_primary" file="tools/robotwin-screwdriver-primary.obj" scale=".095 .095 .095"/>
      <mesh name="robotwin_screwdriver_dark" file="tools/robotwin-screwdriver-dark.obj" scale=".095 .095 .095"/>
      <mesh name="robotwin_screwdriver_metal" file="tools/robotwin-screwdriver-metal.obj" scale=".095 .095 .095"/>
      <mesh name="robotwin_drill_primary" file="tools/robotwin-drill-primary.obj" scale=".105 .105 .105"/>
      <mesh name="robotwin_drill_dark" file="tools/robotwin-drill-dark.obj" scale=".105 .105 .105"/>
      <mesh name="robotwin_drill_metal" file="tools/robotwin-drill-metal.obj" scale=".105 .105 .105"/>
      <mesh name="robotwin_hammer_primary" file="tools/robotwin-hammer-primary.obj" scale=".11 .11 .11"/>
      <mesh name="robotwin_hammer_dark" file="tools/robotwin-hammer-dark.obj" scale=".11 .11 .11"/>
      <mesh name="robotwin_hammer_metal" file="tools/robotwin-hammer-metal.obj" scale=".11 .11 .11"/>`;

const ASSEMBLY2_TOOL_XML = `
    <body name="manual_screwdriver" pos="-.53 -.42 .145">
      <freejoint/>
      <geom name="robotwin_screwdriver_primary_visual_geom" type="mesh" mesh="robotwin_screwdriver_primary" material="robotwin_screwdriver_primary_material" pos="0 0 -.012" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_screwdriver_dark_visual_geom" type="mesh" mesh="robotwin_screwdriver_dark" material="robotwin_screwdriver_dark_material" pos="0 0 -.012" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_screwdriver_metal_visual_geom" type="mesh" mesh="robotwin_screwdriver_metal" material="robotwin_screwdriver_metal_material" pos="0 0 -.012" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_screwdriver_collision" type="capsule" fromto="-.09 0 0 .04 0 0" size=".025" rgba="0 0 0 0" mass=".1" friction="1.5 .25 .03"/>
      <geom name="robotwin_screwdriver_shaft_collision" type="capsule" fromto=".04 0 0 .19 0 0" size=".006" rgba="0 0 0 0" mass=".03"/>
    </body>
    <body name="torque_driver" pos=".53 -.42 .146" euler="90 0 0">
      <freejoint/>
      <geom name="robotwin_drill_primary_visual_geom" type="mesh" mesh="robotwin_drill_primary" material="robotwin_drill_primary_material" pos="0 0 -.018" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_drill_dark_visual_geom" type="mesh" mesh="robotwin_drill_dark" material="robotwin_drill_dark_material" pos="0 0 -.018" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_drill_metal_visual_geom" type="mesh" mesh="robotwin_drill_metal" material="robotwin_drill_metal_material" pos="0 0 -.018" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_drill_housing_collision" type="box" pos="0 0 .025" size=".099 .028 .040" rgba="0 0 0 0" mass=".28" friction="1.3 .2 .02"/>
      <geom name="robotwin_drill_grip_collision" type="box" pos=".03 0 -.022" size=".026 .023 .045" rgba="0 0 0 0" mass=".12" friction="1.5 .25 .03"/>
      <geom name="robotwin_drill_battery_collision" type="box" pos=".04 0 -.086" size=".055 .028 .014" rgba="0 0 0 0" mass=".12" friction="1.3 .2 .02"/>
    </body>
    <body name="claw_hammer" pos=".65 0 .229">
      <freejoint/>
      <geom name="robotwin_hammer_primary_visual_geom" type="mesh" mesh="robotwin_hammer_primary" material="robotwin_hammer_primary_material" pos="0 0 -.008" euler="90 0 0" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_hammer_dark_visual_geom" type="mesh" mesh="robotwin_hammer_dark" material="robotwin_hammer_dark_material" pos="0 0 -.008" euler="90 0 0" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_hammer_metal_visual_geom" type="mesh" mesh="robotwin_hammer_metal" material="robotwin_hammer_metal_material" pos="0 0 -.008" euler="90 0 0" contype="0" conaffinity="0" mass=".001"/>
      <geom name="robotwin_hammer_collision" type="capsule" fromto="-.14 0 -.008 .06 0 -.008" size=".02" rgba="0 0 0 0" mass=".16" friction="1.4 .22 .03"/>
      <geom name="robotwin_hammer_head_collision" type="box" pos=".075 0 0" size=".05 .03 .026" rgba="0 0 0 0" mass=".3"/>
    </body>`;

// Assembly1 stages the detailed RoboTwin tools at its task-specific pickup
// stations. The legacy procedural tools above remain available to other layouts.
const FRANKA_ASSEMBLY1_ROBOTWIN_TOOL_XML = ASSEMBLY2_TOOL_XML
  .replace(
    '<body name="torque_driver" pos=".53 -.42 .146" euler="90 0 0">',
    '<body name="torque_driver" pos=".55 0 .146" euler="90 90 0">',
  )
  .replace(
    '<body name="claw_hammer" pos=".65 0 .229">',
    '<body name="double_face_hammer" pos=".642 -.421 .198">',
  )
  .replace(
    '<geom name="robotwin_hammer_collision" type="capsule" fromto="-.14 0 -.008 .06 0 -.008" size=".02" rgba="0 0 0 0" mass=".16" friction="1.4 .22 .03"/>',
    HAMMER_COLLISION_GEOMS,
  )
  .replace(
    '<geom name="robotwin_hammer_head_collision" type="box" pos=".075 0 0" size=".05 .03 .026" rgba="0 0 0 0" mass=".3"/>',
    `<site name="hammer_donor_grasp" pos=".033 -.003 -.008" size=".003" rgba="0 0 0 0"/>
      <site name="hammer_receiver_grasp" pos="-.045 0 -.008" size=".003" rgba="0 0 0 0"/>
      <site name="hammer_strike_face" pos=".088 -.075 -.008" size=".003" rgba="0 0 0 0"/>`,
  );

export const createAssembly1SceneObjects = (includeTorqueDriverCradle = false) => [
  fixedBox('assembly_platform', [1.15, 1.15, .05], [0, 0, .05], [.25, .27, .29, 1]),
  fixedBox('platform_inset', [.82, .82, .006], [0, 0, .106], [.33, .35, .36, 1]),
  fixedBox('handover_pad', [.16, .11, .006], [0, -.48, .112], [.24, .31, .36, 1]),
  fixedBox('tool_mat_powered', [.2, .13, .006], [.53, -.42, .112], [.31, .27, .21, 1]),
  fixedBox('tool_mat_manual', [.2, .13, .006], [-.53, -.42, .112], [.31, .27, .21, 1]),
  fixedBox('tool_mat_hammer', [.16, .2, .01], [.65, 0, .19], [.27, .25, .22, 1]),
  fixedBox('hammer_shelf_support_north', [.025, .035, .037], [.65, .15, .143], [.17, .18, .19, 1]),
  fixedBox('hammer_shelf_support_south', [.025, .035, .037], [.65, -.15, .143], [.17, .18, .19, 1]),
  ...(includeTorqueDriverCradle ? [
    fixedBox('torque_driver_cradle_south', [.20, .008, .012], [.53, -.54, .130], [.17, .18, .19, 1]),
    fixedBox('torque_driver_cradle_north', [.20, .008, .012], [.53, -.30, .130], [.17, .18, .19, 1]),
  ] : []),
];

function createFrankaAssembly1SceneObjects() {
  return [
    fixedBox('assembly_platform', [1.15, 1.15, .05], [0, 0, .05], [.25, .27, .29, 1]),
    fixedBox('platform_inset', [.82, .82, .006], [0, 0, .106], [.33, .35, .36, 1]),
    fixedBox('handover_pad', [.16, .11, .006], [0, -.48, .112], [.24, .31, .36, 1]),
    { ...fixedBox('hammer_pickup_cradle_tail', [.028, .035, .037], [.565, -.421, .137], [.17, .18, .19, 1]), friction: '.8 .05 .01', condim: 4, solref: '.004 1', solimp: '.95 .99 .001' },
    { ...fixedBox('hammer_pickup_cradle_head', [.028, .05, .036], [.717, -.421, .136], [.17, .18, .19, 1]), friction: '.8 .05 .01', condim: 4, solref: '.004 1', solimp: '.95 .99 .001' },
    // The drill lies tangentially to the arm ring and farther from Arm 2. The
    // matching mat is rotated with it and remains fully inside the inset area.
    fixedBox('tool_mat_powered', [.13, .2, .006], [.55, 0, .112], [.31, .27, .21, 1]),
    fixedBox('tool_mat_manual', [.2, .13, .006], [-.53, -.42, .112], [.31, .27, .21, 1]),
    fixedBox('hammer_return_cradle_tail', [.008,.025,.043], [-.578,-.25,.155], [.17,.18,.19,1]),
    fixedBox('hammer_return_cradle_head', [.025,.045,.042], [-.405,-.25,.154], [.17,.18,.19,1]),
  ];
}

function createPatches(
  toolAssetXml,
  toolXml,
  northArmX,
  northArmY,
  westArmX,
  workcellXml = SHARED_ASSEMBLY1_WORKCELL_XML,
  gripperForceRange = '-100 100',
) {
  return [
    {
      target: 'scene.xml',
      injectAfter: '<mujoco',
      inject: '<option integrator="implicitfast" timestep=".002"/><size memory="64M"/>',
    },
    { target: 'panda.xml', replace: ['name="actuator8"', 'name="gripper"'] },
    {
      target: 'panda.xml',
      replace: ['<geom type="mesh" group="3"/>', '<geom type="mesh" group="3" solref=".002 1" solimp=".99 .999 .0001"/>'],
    },
    {
      target: 'panda.xml',
      replace: [
        '<general class="panda" name="gripper" tendon="split" forcerange="-100 100" ctrlrange="0 255"\n      gainprm="0.01568627451 0 0" biasprm="0 -100 -10"/>',
        `<general class="panda" name="gripper" tendon="split" forcerange="${gripperForceRange}" ctrlrange="0 255"\n      gainprm=".23529411765 0 0" biasprm="0 -1500 -40"/>`,
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '<default class="fingertip_pad_collision_1">\n          <geom type="box" size="0.0085 0.004 0.0085" pos="0 0.0055 0.0445"/>\n        </default>',
        '<default class="fingertip_pad_collision_1">\n          <geom type="box" size="0.0085 0.004 0.0085" pos="0 0.0055 0.0445" friction="10 .5 .1" condim="6" solref=".002 1" solimp=".99 .999 .0001"/>\n        </default>',
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '<default class="fingertip_pad_collision_2">\n          <geom type="box" size="0.003 0.002 0.003" pos="0.0055 0.002 0.05"/>\n        </default>',
        '<default class="fingertip_pad_collision_2">\n          <geom type="box" size="0.003 0.002 0.003" pos="0.0055 0.002 0.05" friction="10 .5 .1" condim="6" solref=".002 1" solimp=".99 .999 .0001"/>\n        </default>',
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '<default class="fingertip_pad_collision_3">\n          <geom type="box" size="0.003 0.002 0.003" pos="-0.0055 0.002 0.05"/>\n        </default>',
        '<default class="fingertip_pad_collision_3">\n          <geom type="box" size="0.003 0.002 0.003" pos="-0.0055 0.002 0.05" friction="10 .5 .1" condim="6" solref=".002 1" solimp=".99 .999 .0001"/>\n        </default>',
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '<default class="fingertip_pad_collision_4">\n          <geom type="box" size="0.003 0.002 0.0035" pos="0.0055 0.002 0.0395"/>\n        </default>',
        '<default class="fingertip_pad_collision_4">\n          <geom type="box" size="0.003 0.002 0.0035" pos="0.0055 0.002 0.0395" friction="10 .5 .1" condim="6" solref=".002 1" solimp=".99 .999 .0001"/>\n        </default>',
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '<default class="fingertip_pad_collision_5">\n          <geom type="box" size="0.003 0.002 0.0035" pos="-0.0055 0.002 0.0395"/>\n        </default>',
        '<default class="fingertip_pad_collision_5">\n          <geom type="box" size="0.003 0.002 0.0035" pos="-0.0055 0.002 0.0395" friction="10 .5 .1" condim="6" solref=".002 1" solimp=".99 .999 .0001"/>\n        </default>',
      ],
    },
    {
      target: 'panda.xml',
      inject: '<site name="tcp" pos="0 0 0.1" size="0.01" rgba="0.75 0.18 0.12 0.7" group="1"/>',
      injectAfter: '<body name="hand"',
    },
    {
      target: 'scene.xml',
      replace: [
        '  <include file="panda.xml"/>',
        `  <asset><model name="panda_model" file="panda.xml"/>${toolAssetXml}</asset>`,
      ],
    },
    { target: 'scene.xml', replace: ['  <worldbody>', `  <worldbody>${attachmentFrames(northArmX, northArmY, westArmX)}`] },
    { target: 'scene.xml', replace: ['</worldbody>', `${workcellXml}${toolXml}\n  </worldbody>`] },
    {
      target: 'panda.xml',
      replace: [
        '  <keyframe>\n    <key name="home" qpos="0 0 0 -1.57079 0 1.57079 -0.7853 0.04 0.04" ctrl="0 0 0 -1.57079 0 1.57079 -0.7853 255"/>\n  </keyframe>\n\n',
        '',
      ],
    },
  ];
}

function createLayout(
  toolAssetXml,
  toolXml,
  includeTorqueDriverCradle = false,
  northArmX = 0,
  northArmY = RING_RADIUS,
  westArmX = -RING_RADIUS,
  reachableFastenerStation = false,
  hammerPickupForArm2 = false,
  gripperForceRange = '-100 100',
) {
  const workcellXml = reachableFastenerStation
    ? assembly1ReachableFastenerWorkcellXml().replaceAll('solimp=".95 .99 .001"', 'solimp=".99 .999 .0001"')
    : SHARED_ASSEMBLY1_WORKCELL_XML;
  return {
    instanceCount: 4,
    yawStepDegrees: 90,
    ringRadius: RING_RADIUS,
    workSurfaceHeight: PLATFORM_TOP,
    primaryTcpSite: 'r0_tcp',
    primaryGripperActuator: 'r0_gripper',
    homeJoints: repeatPose(FRANKA_HOME, 4),
    taskStations: {
      ...TASK_STATIONS,
      ...(reachableFastenerStation ? { fasteners: [0.18, 0.48, 0.125] } : {}),
      ...(hammerPickupForArm2 ? {
        poweredTool: [0.55, 0, 0.146],
        hammer: [0.642, -0.421, 0.198],
      } : {}),
    },
    xmlPatches: createPatches(
      toolAssetXml,
      toolXml,
      northArmX,
      northArmY,
      westArmX,
      workcellXml,
      gripperForceRange,
    ),
    sceneObjects: hammerPickupForArm2
      ? createFrankaAssembly1SceneObjects()
      : createAssembly1SceneObjects(includeTorqueDriverCradle),
    camera: { position: [2.85, -2.85, 3.05], fov: 45 },
    orbitTarget: [0, 0, .32],
  };
}

export const FRANKA_ASSEMBLY1_LAYOUT = createLayout(
  ASSEMBLY2_ASSET_XML + HAMMER_COLLISION_ASSETS + WRENCH_ASSET_XML,
  FRANKA_ASSEMBLY1_ROBOTWIN_TOOL_XML + WRENCH_BODY_XML,
  true,
  -0.3,
  0.85,
  -0.8,
  true,
  true,
  '-180 180',
);
export const FRANKA_ASSEMBLY2_LAYOUT = createLayout(ASSEMBLY2_ASSET_XML, ASSEMBLY2_TOOL_XML);
