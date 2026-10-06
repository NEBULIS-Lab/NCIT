const QUARTER_TURN_DEGREES = 90;
const HALF_TURN_DEGREES = 180;

const cube = (name, position, rgba, size = [0.025, 0.025, 0.025]) => ({
  name,
  type: 'box',
  size,
  position,
  rgba,
  mass: 0.05,
  freejoint: true,
  friction: '1.5 0.3 0.1',
  solref: '0.01 1',
  solimp: '0.95 0.99 0.001 0.5 2',
  condim: 4,
});

export const fixedBox = (name, size, position, rgba) => ({
  name,
  type: 'box',
  size,
  position,
  rgba,
});

export function repeatPose(pose, count) {
  return Array.from({ length: count }, () => [...pose]).flat();
}

function attachmentFrames(model, body, poses) {
  return poses
    .map(({ position, yaw }, index) => {
      const euler = yaw === 0 ? '' : ` euler="0 0 ${yaw}"`;
      return `<frame pos="${position.join(' ')}"${euler}><attach model="${model}" body="${body}" prefix="r${index}_"/></frame>`;
    })
    .join('');
}

export const FRANKA_HOME = [1.707, -1.754, 0.003, -2.702, 0.003, 0.951, 2.49, 0];

export const FRANKA_LAYOUT = {
  instanceCount: 4,
  yawStepDegrees: 90,
  ringRadius: 0.72,
  primaryTcpSite: 'r0_tcp',
  primaryGripperActuator: 'r0_gripper',
  homeJoints: repeatPose(FRANKA_HOME, 4),
  xmlPatches: [
    {
      target: 'panda.xml',
      replace: ['name="actuator8"', 'name="gripper"'],
    },
    {
      target: 'panda.xml',
      inject:
        '<site name="tcp" pos="0 0 0.1" size="0.01" rgba="0.75 0.18 0.12 0.7" group="1"/>',
      injectAfter: '<body name="hand"',
    },
    {
      target: 'scene.xml',
      replace: [
        '  <include file="panda.xml"/>',
        '  <asset><model name="panda_model" file="panda.xml"/></asset>',
      ],
    },
    {
      target: 'scene.xml',
      replace: [
        '  <worldbody>',
        `  <worldbody>${attachmentFrames('panda_model', 'link0', [
          { position: [0, -0.72, 0], yaw: 0 },
          { position: [0.72, 0, 0], yaw: QUARTER_TURN_DEGREES },
          { position: [0, 0.72, 0], yaw: HALF_TURN_DEGREES },
          { position: [-0.72, 0, 0], yaw: -QUARTER_TURN_DEGREES },
        ])}`,
      ],
    },
    {
      target: 'panda.xml',
      replace: [
        '  <keyframe>\n    <key name="home" qpos="0 0 0 -1.57079 0 1.57079 -0.7853 0.04 0.04" ctrl="0 0 0 -1.57079 0 1.57079 -0.7853 255"/>\n  </keyframe>\n\n',
        '',
      ],
    },
  ],
  sceneObjects: [
    cube('red_cube', [-0.07, 0, 0.025], [0.72, 0.18, 0.14, 1]),
    cube('green_cube', [0.07, 0, 0.025], [0.18, 0.56, 0.28, 1]),
    cube('blue_cube', [0, 0.08, 0.025], [0.18, 0.35, 0.66, 1]),
  ],
  camera: { position: [2.3, -2.3, 2.55], fov: 45 },
  orbitTarget: [0, 0, 0.42],
};

const FRANKA_ASSEMBLY_PLATFORM_TOP = 0.1;
const FRANKA_ASSEMBLY_RING_RADIUS = 0.9;

const FRANKA_ASSEMBLY_WORKCELL_XML = `
    <!-- Central frame supported above the common platform. -->
    <body name="frame_supports">
      <geom name="frame_support_nw" type="box" pos="-0.27 0.18 0.155" size="0.055 0.045 0.055" rgba="0.16 0.18 0.2 1"/>
      <geom name="frame_support_ne" type="box" pos="0.27 0.18 0.155" size="0.055 0.045 0.055" rgba="0.16 0.18 0.2 1"/>
      <geom name="frame_support_sw" type="box" pos="-0.27 -0.18 0.155" size="0.055 0.045 0.055" rgba="0.16 0.18 0.2 1"/>
      <geom name="frame_support_se" type="box" pos="0.27 -0.18 0.155" size="0.055 0.045 0.055" rgba="0.16 0.18 0.2 1"/>
    </body>

    <body name="assembly_frame" pos="0 0 0.235">
      <freejoint/>
      <geom name="frame_rail_north" type="box" pos="0 0.23 0" size="0.34 0.025 0.025" rgba="0.56 0.58 0.59 1"/>
      <geom name="frame_rail_south" type="box" pos="0 -0.23 0" size="0.34 0.025 0.025" rgba="0.56 0.58 0.59 1"/>
      <geom name="frame_rail_west" type="box" pos="-0.315 0 0" size="0.025 0.205 0.025" rgba="0.56 0.58 0.59 1"/>
      <geom name="frame_rail_east" type="box" pos="0.315 0 0" size="0.025 0.205 0.025" rgba="0.56 0.58 0.59 1"/>
      <geom name="frame_grip_west" type="box" pos="-0.354 0 0.006" size="0.014 0.08 0.034" rgba="0.15 0.17 0.18 1"/>
      <geom name="frame_grip_east" type="box" pos="0.354 0 0.006" size="0.014 0.08 0.034" rgba="0.15 0.17 0.18 1"/>
      <geom name="corner_nw" type="box" pos="-0.295 0.21 0.032" size="0.045 0.045 0.007" rgba="0.24 0.27 0.29 1"/>
      <geom name="corner_ne" type="box" pos="0.295 0.21 0.032" size="0.045 0.045 0.007" rgba="0.24 0.27 0.29 1"/>
      <geom name="corner_sw" type="box" pos="-0.295 -0.21 0.032" size="0.045 0.045 0.007" rgba="0.24 0.27 0.29 1"/>
      <geom name="corner_se" type="box" pos="0.295 -0.21 0.032" size="0.045 0.045 0.007" rgba="0.24 0.27 0.29 1"/>
      <geom name="installed_fastener_nw" type="cylinder" pos="-0.295 0.21 0.047" size="0.014 0.008" rgba="0.12 0.13 0.14 1"/>
      <geom name="installed_fastener_ne" type="cylinder" pos="0.295 0.21 0.047" size="0.014 0.008" rgba="0.12 0.13 0.14 1"/>
      <geom name="installed_fastener_sw" type="cylinder" pos="-0.295 -0.21 0.047" size="0.014 0.008" rgba="0.12 0.13 0.14 1"/>
      <geom name="installed_fastener_se" type="cylinder" pos="0.295 -0.21 0.047" size="0.014 0.008" rgba="0.12 0.13 0.14 1"/>
    </body>

    <!-- Long parts tray: cross-member and mounting plate remain movable. -->
    <body name="parts_tray" pos="-0.57 0.44 0.11">
      <geom name="parts_tray_floor" type="box" size="0.25 0.29 0.01" rgba="0.24 0.3 0.34 1"/>
      <geom name="parts_tray_west_wall" type="box" pos="-0.245 0 0.035" size="0.008 0.29 0.035" rgba="0.19 0.24 0.28 1"/>
      <geom name="parts_tray_east_wall" type="box" pos="0.245 0 0.035" size="0.008 0.29 0.035" rgba="0.19 0.24 0.28 1"/>
      <geom name="parts_tray_north_wall" type="box" pos="0 0.285 0.035" size="0.25 0.008 0.035" rgba="0.19 0.24 0.28 1"/>
      <geom name="parts_tray_south_wall" type="box" pos="0 -0.285 0.035" size="0.25 0.008 0.035" rgba="0.19 0.24 0.28 1"/>
    </body>
    <body name="cross_member" pos="-0.49 0.44 0.14">
      <freejoint/>
      <geom name="cross_member_bar" type="box" size="0.026 0.245 0.018" rgba="0.58 0.6 0.61 1" mass="0.35" friction="1.2 0.2 0.02"/>
      <geom name="cross_member_end_a" type="box" pos="0 -0.215 0.024" size="0.055 0.03 0.008" rgba="0.23 0.26 0.28 1" mass="0.03"/>
      <geom name="cross_member_end_b" type="box" pos="0 0.215 0.024" size="0.055 0.03 0.008" rgba="0.23 0.26 0.28 1" mass="0.03"/>
    </body>
    <body name="mounting_plate" pos="-0.72 0.44 0.135">
      <freejoint/>
      <geom name="mounting_plate_body" type="box" size="0.065 0.09 0.012" rgba="0.48 0.5 0.52 1" mass="0.18" friction="1.2 0.2 0.02"/>
      <geom name="mounting_plate_boss" type="cylinder" pos="0 0 0.02" size="0.026 0.008" rgba="0.22 0.24 0.25 1" mass="0.02"/>
    </body>

    <!-- Fastener tray and individually movable bolts. -->
    <body name="fastener_tray" pos="0.56 0.42 0.11">
      <geom name="fastener_tray_floor" type="box" size="0.18 0.18 0.01" rgba="0.3 0.32 0.34 1"/>
      <geom name="fastener_tray_west_wall" type="box" pos="-0.175 0 0.03" size="0.008 0.18 0.03" rgba="0.21 0.23 0.25 1"/>
      <geom name="fastener_tray_east_wall" type="box" pos="0.175 0 0.03" size="0.008 0.18 0.03" rgba="0.21 0.23 0.25 1"/>
      <geom name="fastener_tray_north_wall" type="box" pos="0 0.175 0.03" size="0.18 0.008 0.03" rgba="0.21 0.23 0.25 1"/>
      <geom name="fastener_tray_south_wall" type="box" pos="0 -0.175 0.03" size="0.18 0.008 0.03" rgba="0.21 0.23 0.25 1"/>
    </body>
    <body name="fastener_1" pos="0.50 0.36 0.152">
      <freejoint/>
      <geom name="fastener_1_shaft" type="cylinder" size="0.007 0.025" rgba="0.42 0.43 0.44 1" mass="0.012"/>
      <geom name="fastener_1_head" type="cylinder" pos="0 0 0.032" size="0.015 0.007" rgba="0.16 0.17 0.18 1" mass="0.006"/>
    </body>
    <body name="fastener_2" pos="0.60 0.36 0.152">
      <freejoint/>
      <geom name="fastener_2_shaft" type="cylinder" size="0.007 0.025" rgba="0.42 0.43 0.44 1" mass="0.012"/>
      <geom name="fastener_2_head" type="cylinder" pos="0 0 0.032" size="0.015 0.007" rgba="0.16 0.17 0.18 1" mass="0.006"/>
    </body>
    <body name="fastener_3" pos="0.50 0.48 0.152">
      <freejoint/>
      <geom name="fastener_3_shaft" type="cylinder" size="0.007 0.025" rgba="0.42 0.43 0.44 1" mass="0.012"/>
      <geom name="fastener_3_head" type="cylinder" pos="0 0 0.032" size="0.015 0.007" rgba="0.16 0.17 0.18 1" mass="0.006"/>
    </body>
    <body name="fastener_4" pos="0.60 0.48 0.152">
      <freejoint/>
      <geom name="fastener_4_shaft" type="cylinder" size="0.007 0.025" rgba="0.42 0.43 0.44 1" mass="0.012"/>
      <geom name="fastener_4_head" type="cylinder" pos="0 0 0.032" size="0.015 0.007" rgba="0.16 0.17 0.18 1" mass="0.006"/>
    </body>

    <!-- Tools are in separate approach zones to create a future handoff need. -->
    <body name="torque_driver" pos="0.53 -0.42 0.185">
      <freejoint/>
      <geom name="torque_driver_motor" type="box" pos="0 0 0.07" size="0.065 0.04 0.035" rgba="0.58 0.34 0.12 1" mass="0.3" friction="1.3 0.2 0.02"/>
      <geom name="torque_driver_handle" type="box" pos="0.02 0 0" size="0.025 0.026 0.07" rgba="0.13 0.14 0.15 1" mass="0.16"/>
      <geom name="torque_driver_battery" type="box" pos="0.02 0 -0.065" size="0.048 0.042 0.015" rgba="0.12 0.13 0.14 1" mass="0.12"/>
      <geom name="torque_driver_chuck" type="cylinder" fromto="-0.065 0 0.07 -0.105 0 0.07" size="0.018" rgba="0.18 0.19 0.2 1" mass="0.04"/>
      <geom name="torque_driver_bit" type="cylinder" fromto="-0.105 0 0.07 -0.175 0 0.07" size="0.006" rgba="0.5 0.51 0.52 1" mass="0.015"/>
    </body>
    <body name="manual_screwdriver" pos="-0.53 -0.42 0.132">
      <freejoint/>
      <geom name="manual_screwdriver_handle" type="cylinder" fromto="-0.09 0 0 0.035 0 0" size="0.026" rgba="0.55 0.27 0.11 1" mass="0.11" friction="1.3 0.2 0.02"/>
      <geom name="manual_screwdriver_collar" type="cylinder" fromto="0.035 0 0 0.065 0 0" size="0.015" rgba="0.16 0.17 0.18 1" mass="0.02"/>
      <geom name="manual_screwdriver_shaft" type="cylinder" fromto="0.065 0 0 0.19 0 0" size="0.006" rgba="0.5 0.51 0.52 1" mass="0.035"/>
    </body>`;

export const FRANKA_ASSEMBLY_LAYOUT = {
  instanceCount: 4,
  yawStepDegrees: 90,
  ringRadius: FRANKA_ASSEMBLY_RING_RADIUS,
  workSurfaceHeight: FRANKA_ASSEMBLY_PLATFORM_TOP,
  primaryTcpSite: 'r0_tcp',
  primaryGripperActuator: 'r0_gripper',
  homeJoints: repeatPose(FRANKA_HOME, 4),
  taskStations: {
    frame: [0, 0, 0.275],
    parts: [-0.56, 0.42, 0.125],
    poweredTool: [0.53, -0.42, 0.135],
    manualTool: [-0.53, -0.42, 0.13],
    fasteners: [0.56, 0.42, 0.125],
    handover: [0, -0.48, 0.112],
  },
  xmlPatches: [
    {
      target: 'panda.xml',
      replace: ['name="actuator8"', 'name="gripper"'],
    },
    {
      target: 'panda.xml',
      inject:
        '<site name="tcp" pos="0 0 0.1" size="0.01" rgba="0.75 0.18 0.12 0.7" group="1"/>',
      injectAfter: '<body name="hand"',
    },
    {
      target: 'scene.xml',
      replace: [
        '  <include file="panda.xml"/>',
        '  <asset><model name="panda_model" file="panda.xml"/></asset>',
      ],
    },
    {
      target: 'scene.xml',
      replace: [
        '  <worldbody>',
        `  <worldbody>${attachmentFrames('panda_model', 'link0', [
          { position: [0, -FRANKA_ASSEMBLY_RING_RADIUS, FRANKA_ASSEMBLY_PLATFORM_TOP], yaw: 0 },
          { position: [FRANKA_ASSEMBLY_RING_RADIUS, 0, FRANKA_ASSEMBLY_PLATFORM_TOP], yaw: QUARTER_TURN_DEGREES },
          { position: [0, FRANKA_ASSEMBLY_RING_RADIUS, FRANKA_ASSEMBLY_PLATFORM_TOP], yaw: HALF_TURN_DEGREES },
          { position: [-FRANKA_ASSEMBLY_RING_RADIUS, 0, FRANKA_ASSEMBLY_PLATFORM_TOP], yaw: -QUARTER_TURN_DEGREES },
        ])}`,
      ],
    },
    {
      target: 'scene.xml',
      replace: ['</worldbody>', `${FRANKA_ASSEMBLY_WORKCELL_XML}\n  </worldbody>`],
    },
    {
      target: 'panda.xml',
      replace: [
        '  <keyframe>\n    <key name="home" qpos="0 0 0 -1.57079 0 1.57079 -0.7853 0.04 0.04" ctrl="0 0 0 -1.57079 0 1.57079 -0.7853 255"/>\n  </keyframe>\n\n',
        '',
      ],
    },
  ],
  sceneObjects: [
    fixedBox('assembly_platform', [1.15, 1.15, 0.05], [0, 0, 0.05], [0.25, 0.27, 0.29, 1]),
    fixedBox('platform_inset', [0.82, 0.82, 0.006], [0, 0, 0.106], [0.33, 0.35, 0.36, 1]),
    fixedBox('handover_pad', [0.16, 0.11, 0.006], [0, -0.48, 0.112], [0.24, 0.31, 0.36, 1]),
    fixedBox('tool_mat_powered', [0.2, 0.13, 0.006], [0.53, -0.42, 0.112], [0.31, 0.27, 0.21, 1]),
    fixedBox('tool_mat_manual', [0.2, 0.13, 0.006], [-0.53, -0.42, 0.112], [0.31, 0.27, 0.21, 1]),
  ],
  camera: { position: [2.7, -2.7, 2.55], fov: 45 },
  orbitTarget: [0, 0, 0.32],
};

const SO101_HOME = [0.0158, 2.052, 2.1307, -0.0845, 1.5857, -0.3745];
const SO101_TABLE_TOP = 0.8;
const SO101_TABLE_THICKNESS = 0.07;
const SO101_TABLE_UNDERSIDE = SO101_TABLE_TOP - SO101_TABLE_THICKNESS;
const SO101_PARENT_WORLDBODY = `  <worldbody>
    <!-- Manipulable objects for SO101 single arm -->
    <body name="sphere1" pos="0.55 -0.6 1">
      <freejoint/>
      <geom type="sphere" size="0.02" material="obj_green" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="cylinder1" pos="0.45 -0.6 1">
      <freejoint/>
      <geom type="cylinder" size="0.02 0.06" material="obj_blue" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="box2" pos="0.25 -0.6 1">
      <freejoint/>
      <geom type="box" size="0.015 0.015 0.03" material="obj_yellow" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="sphere2" pos="0.15 -0.6 1">
      <freejoint/>
      <geom type="sphere" size="0.025" material="obj_red" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>
  </worldbody>`;

export const SO101_LAYOUT = {
  instanceCount: 4,
  yawStepDegrees: 90,
  ringRadius: 0.34,
  workSurfaceHeight: SO101_TABLE_TOP,
  primaryTcpSite: 'r0_tcp',
  homeJoints: repeatPose(SO101_HOME, 4),
  xmlPatches: [
    {
      target: 'objects_SO101.xml',
      inject: '<model name="so101_model" file="SO101.xml"/>',
      injectAfter: '<asset>',
    },
    {
      target: 'objects_SO101.xml',
      replace: [
        SO101_PARENT_WORLDBODY,
        `  <worldbody>${attachmentFrames('so101_model', 'Base', [
          { position: [0, 0.34, 0.8], yaw: 0 },
          { position: [0.34, 0, 0.8], yaw: -QUARTER_TURN_DEGREES },
          { position: [0, -0.34, 0.8], yaw: HALF_TURN_DEGREES },
          { position: [-0.34, 0, 0.8], yaw: QUARTER_TURN_DEGREES },
        ])}</worldbody>`,
      ],
    },
    {
      target: 'SO101.xml',
      inject:
        '<site name="tcp" pos="0 -0.04 -0.01" size="0.005" rgba="0.16 0.55 0.26 0.7" group="1"/>',
      injectAfter: '<body name="Fixed_Jaw"',
    },
    {
      target: 'SO101.xml',
      replace: [
        '<body name="Base" pos="0.35 -0.3 0.8" euler="0 0 0">',
        '<body name="Base" pos="0 0 0" euler="0 0 0">',
      ],
    },
    {
      target: 'SO101.xml',
      replace: [
        '  <keyframe>\n    <key name="home" qpos="0 0 0 0 0 -0.37453" ctrl="0 0 0 0 0 -0.37453"/>\n  </keyframe>\n',
        '',
      ],
    },
  ],
  sceneObjects: [
    fixedBox('floor', [2, 2, 0.005], [0, 0, -0.005], [0.12, 0.13, 0.15, 1]),
    fixedBox(
      'shared_work_surface',
      [0.52, 0.52, SO101_TABLE_THICKNESS / 2],
      [0, 0, SO101_TABLE_UNDERSIDE + SO101_TABLE_THICKNESS / 2],
      [0.34, 0.3, 0.25, 1],
    ),
    fixedBox('table_leg_a', [0.035, 0.035, SO101_TABLE_UNDERSIDE / 2], [-0.44, -0.44, SO101_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
    fixedBox('table_leg_b', [0.035, 0.035, SO101_TABLE_UNDERSIDE / 2], [0.44, -0.44, SO101_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
    fixedBox('table_leg_c', [0.035, 0.035, SO101_TABLE_UNDERSIDE / 2], [-0.44, 0.44, SO101_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
    fixedBox('table_leg_d', [0.035, 0.035, SO101_TABLE_UNDERSIDE / 2], [0.44, 0.44, SO101_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
    cube('red_cube', [-0.055, 0, 0.815], [0.72, 0.18, 0.14, 1], [0.015, 0.015, 0.015]),
    cube('blue_cube', [0.055, 0, 0.815], [0.18, 0.35, 0.66, 1], [0.015, 0.015, 0.015]),
    cube('green_cube', [0, 0.06, 0.815], [0.18, 0.56, 0.28, 1], [0.015, 0.015, 0.015]),
  ],
  camera: { position: [1.6, -1.6, 1.9], fov: 45 },
  orbitTarget: [0, 0, 0.78],
};

const XLEROBOT_HOME = [
  0,
  0,
  1.5708,
  1.5785,
  1.5777,
  0.0008,
  1.57,
  -0.25,
  -1.5708,
  1.5785,
  1.5777,
  0.0008,
  1.57,
  -0.25,
  0,
  0,
];
const XLEROBOT_ARM_BASE_HEIGHT = 0.775;
const XLEROBOT_CHASSIS_COLLISION_TOP = 0.775;
const XLEROBOT_TABLE_HALF_HEIGHT = 0.025;
const XLEROBOT_TABLE_UNDERSIDE = XLEROBOT_ARM_BASE_HEIGHT - 2 * XLEROBOT_TABLE_HALF_HEIGHT;
const XLEROBOT_PARENT_WORLDBODY = `  <worldbody>
    <!-- Manipulable objects with freejoint for physics simulation -->
    <body name="box1" pos="0.1 -0.4 1">
      <freejoint/>
      <geom type="box" size="0.015 0.02 0.05" material="obj_red" mass="0.1"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4" group="3"/>
    </body>

    <body name="sphere1" pos="0.5 -0.4 1">
      <freejoint/>
      <geom type="sphere" size="0.02" material="obj_green" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="cylinder1" pos="0.4 -0.4 1">
      <freejoint/>
      <geom type="cylinder" size="0.02 0.06" material="obj_blue" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="box2" pos="0.3 -0.4 1">
      <freejoint/>
      <geom type="box" size="0.04 0.04 0.04" material="obj_yellow" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>

    <body name="sphere2" pos="0.2 -0.4 1">
      <freejoint/>
      <geom type="sphere" size="0.025" material="obj_red" mass="0.04"
            contype="1" conaffinity="1" friction="1.2 0.05 0.01" condim="4"/>
    </body>
  </worldbody>`;

const xlerobotTableObjects = [
  fixedBox(
    'table_top',
    [0.46, 0.34, XLEROBOT_TABLE_HALF_HEIGHT],
    [0, 0, XLEROBOT_ARM_BASE_HEIGHT - XLEROBOT_TABLE_HALF_HEIGHT],
    [0.34, 0.3, 0.25, 1],
  ),
  fixedBox('table_leg_a', [0.035, 0.035, XLEROBOT_TABLE_UNDERSIDE / 2], [-0.37, -0.27, XLEROBOT_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
  fixedBox('table_leg_b', [0.035, 0.035, XLEROBOT_TABLE_UNDERSIDE / 2], [0.37, -0.27, XLEROBOT_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
  fixedBox('table_leg_c', [0.035, 0.035, XLEROBOT_TABLE_UNDERSIDE / 2], [-0.37, 0.27, XLEROBOT_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
  fixedBox('table_leg_d', [0.035, 0.035, XLEROBOT_TABLE_UNDERSIDE / 2], [0.37, 0.27, XLEROBOT_TABLE_UNDERSIDE / 2], [0.2, 0.19, 0.18, 1]),
];

export const XLEROBOT_LAYOUT = {
  instanceCount: 2,
  yawStepDegrees: 180,
  spacing: 1.7,
  armBaseHeight: XLEROBOT_ARM_BASE_HEIGHT,
  tableTopHeight: XLEROBOT_ARM_BASE_HEIGHT,
  chassisCollisionTop: XLEROBOT_CHASSIS_COLLISION_TOP,
  homeJoints: repeatPose(XLEROBOT_HOME, 2),
  xmlPatches: [
    {
      target: 'objects.xml',
      inject: '<model name="xlerobot_model" file="xlerobot.xml"/>',
      injectAfter: '<asset>',
    },
    {
      target: 'objects.xml',
      replace: [
        XLEROBOT_PARENT_WORLDBODY,
        `  <worldbody>${attachmentFrames('xlerobot_model', 'chassis', [
          { position: [-0.85, 0, 0], yaw: HALF_TURN_DEGREES },
          { position: [0.85, 0, 0], yaw: 0 },
        ])}</worldbody>`,
      ],
    },
    {
      target: 'xlerobot.xml',
      replace: [
        '<geom type="box" size="0.1575 0.2025 0.295" pos="0 0 0.015" class="collision" friction="1 0.005 0.0001" rgba="0.9 0.3 0.3 0.4"/>',
        '<geom name="chassis_rack_collision" type="box" size="0.21 0.24 0.3375" pos="0 0 0.0575" class="collision" friction="1 0.005 0.0001" rgba="0 0 0 0"/>',
      ],
    },
  ],
  tableObjects: xlerobotTableObjects,
  sceneObjects: [
    fixedBox('floor', [3, 3, 0.005], [0, 0, -0.005], [0.12, 0.13, 0.15, 1]),
    ...xlerobotTableObjects,
  ],
  camera: { position: [2.0, -2.25, 1.65], fov: 45 },
  orbitTarget: [0, 0, 0.62],
};
