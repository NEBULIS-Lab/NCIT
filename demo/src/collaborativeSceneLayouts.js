import { fixedBox, repeatPose } from './sceneLayouts.js';

const QUARTER_TURN_DEGREES = 90;
const HALF_TURN_DEGREES = 180;
const WORK_SURFACE_HEIGHT = 0.8;
const XLEROBOT_ARM_BASE_HEIGHT = 0.775;

const SO101_HOME = [0.0158, 2.052, 2.1307, -0.0845, 1.5857, -0.3745];
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

function attachmentFrames(model, body, poses) {
  return poses
    .map(({ position, yaw }, index) => {
      const euler = yaw === 0 ? '' : ` euler="0 0 ${yaw}"`;
      return `<frame pos="${position.join(' ')}"${euler}><attach model="${model}" body="${body}" prefix="r${index}_"/></frame>`;
    })
    .join('');
}

function radialGearGeometry(name, outerRadius, rgba) {
  const segmentCount = 12;
  const toothCount = 16;
  const innerRadius = 0.0055;
  const ringCenter = (innerRadius + outerRadius) / 2;
  const radialHalfSize = (outerRadius - innerRadius) / 2;
  const tangentialHalfSize = ringCenter * Math.sin(Math.PI / segmentCount) * 0.93;
  const segmentGeoms = Array.from({ length: segmentCount }, (_, index) => {
    const angle = (index * 2 * Math.PI) / segmentCount;
    const x = (ringCenter * Math.cos(angle)).toFixed(5);
    const y = (ringCenter * Math.sin(angle)).toFixed(5);
    const yaw = ((angle * 180) / Math.PI).toFixed(3);
    return `<geom name="${name}_ring_segment_${index}" type="box" pos="${x} ${y} 0" size="${radialHalfSize.toFixed(5)} ${tangentialHalfSize.toFixed(5)} 0.005" euler="0 0 ${yaw}" rgba="${rgba}" mass="0.003" friction="1.1 0.08 0.002"/>`;
  }).join('');
  const toothGeoms = Array.from({ length: toothCount }, (_, index) => {
    const angle = (index * 2 * Math.PI) / toothCount;
    const radius = outerRadius + 0.002;
    const x = (radius * Math.cos(angle)).toFixed(5);
    const y = (radius * Math.sin(angle)).toFixed(5);
    const yaw = ((angle * 180) / Math.PI).toFixed(3);
    return `<geom name="${name}_tooth_${index}" type="box" pos="${x} ${y} 0" size="0.003 0.0022 0.005" euler="0 0 ${yaw}" rgba="${rgba}" mass="0.001" friction="1.1 0.08 0.002"/>`;
  }).join('');
  return `${segmentGeoms}${toothGeoms}<site name="${name}_bore_site" pos="0 0 0" size="0.0045" rgba="0.52 0.16 0.12 0.45" group="1"/><site name="${name}_keyway_site" type="box" pos="0.0052 0 0" size="0.0014 0.0022 0.0052" rgba="0.14 0.15 0.15 0.9" group="1"/>`;
}

function annularGeometry(
  name,
  innerRadius,
  outerRadius,
  halfHeight,
  rgba,
  mass,
  center = [0, 0, 0],
) {
  const segmentCount = 12;
  const ringCenter = (innerRadius + outerRadius) / 2;
  const radialHalfSize = (outerRadius - innerRadius) / 2;
  const tangentialHalfSize = ringCenter * Math.sin(Math.PI / segmentCount) * 0.93;
  return Array.from({ length: segmentCount }, (_, index) => {
    const angle = (index * 2 * Math.PI) / segmentCount;
    const x = center[0] + ringCenter * Math.cos(angle);
    const y = center[1] + ringCenter * Math.sin(angle);
    const yaw = (angle * 180) / Math.PI;
    return `<geom name="${name}_segment_${index}" type="box" pos="${x.toFixed(5)} ${y.toFixed(5)} ${center[2].toFixed(5)}" size="${radialHalfSize.toFixed(5)} ${tangentialHalfSize.toFixed(5)} ${halfHeight}" euler="0 0 ${yaw.toFixed(3)}" rgba="${rgba}" mass="${(mass / segmentCount).toFixed(5)}" friction="1.2 0.08 0.002"/>`;
  }).join('');
}

function perforatedPlateCollision(prefix, halfX, halfY, holeX, halfZ, rgba) {
  const holeHalf = 0.0075;
  const edgeSpan = halfX - (holeX + holeHalf);
  const centerSpan = holeX - holeHalf;
  const yStripHalf = (halfY - holeHalf) / 2;
  const yStripCenter = holeHalf + yStripHalf;
  return `
      <geom name="${prefix}_floor_left" type="box" pos="${-(holeX + holeHalf + edgeSpan / 2)} 0 0" size="${edgeSpan / 2} ${halfY} ${halfZ}" rgba="${rgba}" mass="0.025"/>
      <geom name="${prefix}_floor_center" type="box" pos="0 0 0" size="${centerSpan} ${halfY} ${halfZ}" rgba="${rgba}" mass="0.03"/>
      <geom name="${prefix}_floor_right" type="box" pos="${holeX + holeHalf + edgeSpan / 2} 0 0" size="${edgeSpan / 2} ${halfY} ${halfZ}" rgba="${rgba}" mass="0.025"/>
      <geom name="${prefix}_floor_input_north" type="box" pos="${-holeX} ${yStripCenter} 0" size="${holeHalf} ${yStripHalf} ${halfZ}" rgba="${rgba}" mass="0.012"/>
      <geom name="${prefix}_floor_input_south" type="box" pos="${-holeX} ${-yStripCenter} 0" size="${holeHalf} ${yStripHalf} ${halfZ}" rgba="${rgba}" mass="0.012"/>
      <geom name="${prefix}_floor_intermediate_north" type="box" pos="${holeX} ${yStripCenter} 0" size="${holeHalf} ${yStripHalf} ${halfZ}" rgba="${rgba}" mass="0.012"/>
      <geom name="${prefix}_floor_intermediate_south" type="box" pos="${holeX} ${-yStripCenter} 0" size="${holeHalf} ${yStripHalf} ${halfZ}" rgba="${rgba}" mass="0.012"/>`;
}

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

const SO101_GEARBOX_WORKCELL_XML = `
    <body name="gearbox_fixture" pos="0 0 0.806">
      <geom name="gearbox_fixture_base" type="box" size="0.09 0.09 0.006" rgba="0.24 0.27 0.28 1"/>
      <geom name="gearbox_fixture_nw" type="box" pos="-0.071 0.056 0.018" size="0.009 0.012 0.018" rgba="0.12 0.14 0.15 1"/>
      <geom name="gearbox_fixture_ne" type="box" pos="0.071 0.056 0.018" size="0.009 0.012 0.018" rgba="0.12 0.14 0.15 1"/>
      <geom name="gearbox_fixture_sw" type="box" pos="-0.071 -0.056 0.018" size="0.009 0.012 0.018" rgba="0.12 0.14 0.15 1"/>
      <geom name="gearbox_fixture_se" type="box" pos="0.071 -0.056 0.018" size="0.009 0.012 0.018" rgba="0.12 0.14 0.15 1"/>
      <site name="fixture_center_site" pos="0 0 0.013" size="0.005" rgba="0.55 0.2 0.15 0.5" group="1"/>
    </body>

    <body name="gearbox_lower_housing" pos="0 0.21 0.805">
      <freejoint/>
      <geom name="housing_floor_visual" type="box" size="0.065 0.05 0.004" rgba="0.48 0.5 0.5 1" contype="0" conaffinity="0"/>
      ${perforatedPlateCollision('housing', 0.065, 0.05, 0.027, 0.004, '0.48 0.5 0.5 1')}
      ${annularGeometry('housing_input_bearing_seat', 0.005, 0.01, 0.002, '0.25 0.27 0.28 1', 0.018, [-0.027, 0, 0.006])}
      ${annularGeometry('housing_intermediate_bearing_seat', 0.005, 0.01, 0.002, '0.25 0.27 0.28 1', 0.018, [0.027, 0, 0.006])}
      <geom name="housing_wall_north" type="box" pos="0 0.047 0.019" size="0.065 0.003 0.015" rgba="0.37 0.39 0.4 1" mass="0.035"/>
      <geom name="housing_wall_south" type="box" pos="0 -0.047 0.019" size="0.065 0.003 0.015" rgba="0.37 0.39 0.4 1" mass="0.035"/>
      <geom name="housing_wall_west" type="box" pos="-0.062 0 0.019" size="0.003 0.044 0.015" rgba="0.37 0.39 0.4 1" mass="0.03"/>
      <geom name="housing_wall_east" type="box" pos="0.062 0 0.019" size="0.003 0.044 0.015" rgba="0.37 0.39 0.4 1" mass="0.03"/>
      <geom name="housing_rib_north_1" type="box" pos="-0.034 0.051 0.019" size="0.004 0.004 0.017" rgba="0.3 0.32 0.33 1" mass="0.008"/>
      <geom name="housing_rib_north_2" type="box" pos="0.034 0.051 0.019" size="0.004 0.004 0.017" rgba="0.3 0.32 0.33 1" mass="0.008"/>
      <geom name="housing_rib_south_1" type="box" pos="-0.034 -0.051 0.019" size="0.004 0.004 0.017" rgba="0.3 0.32 0.33 1" mass="0.008"/>
      <geom name="housing_rib_south_2" type="box" pos="0.034 -0.051 0.019" size="0.004 0.004 0.017" rgba="0.3 0.32 0.33 1" mass="0.008"/>
      <site name="housing_input_bearing_site" pos="-0.027 0 0.006" size="0.005" rgba="0.55 0.2 0.15 0.55" group="1"/>
      <site name="housing_intermediate_bearing_site" pos="0.027 0 0.006" size="0.005" rgba="0.55 0.2 0.15 0.55" group="1"/>
    </body>

    <body name="shaft_rack_input" pos="0.18 0 0.806">
      <geom name="shaft_rack_input_base" type="box" size="0.022 0.058 0.006" rgba="0.22 0.24 0.25 1"/>
      <geom name="shaft_rack_input_left" type="box" pos="-0.013 -0.032 0.013" size="0.006 0.012 0.006" euler="0 35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_input_right" type="box" pos="0.013 -0.032 0.013" size="0.006 0.012 0.006" euler="0 -35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_input_left_far" type="box" pos="-0.013 0.032 0.013" size="0.006 0.012 0.006" euler="0 35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_input_right_far" type="box" pos="0.013 0.032 0.013" size="0.006 0.012 0.006" euler="0 -35 0" rgba="0.31 0.33 0.34 1"/>
    </body>
    <body name="shaft_rack_intermediate" pos="0.235 0 0.806">
      <geom name="shaft_rack_intermediate_base" type="box" size="0.022 0.053 0.006" rgba="0.22 0.24 0.25 1"/>
      <geom name="shaft_rack_intermediate_left" type="box" pos="-0.013 -0.028 0.013" size="0.006 0.012 0.006" euler="0 35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_intermediate_right" type="box" pos="0.013 -0.028 0.013" size="0.006 0.012 0.006" euler="0 -35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_intermediate_left_far" type="box" pos="-0.013 0.028 0.013" size="0.006 0.012 0.006" euler="0 35 0" rgba="0.31 0.33 0.34 1"/>
      <geom name="shaft_rack_intermediate_right_far" type="box" pos="0.013 0.028 0.013" size="0.006 0.012 0.006" euler="0 -35 0" rgba="0.31 0.33 0.34 1"/>
    </body>
    <body name="input_shaft" pos="0.18 0 0.824">
      <freejoint/>
      <geom name="input_shaft_body" type="cylinder" fromto="0 -0.045 0 0 0.045 0" size="0.004" rgba="0.58 0.59 0.6 1" mass="0.032" friction="1.25 0.08 0.002"/>
      <geom name="input_shaft_grip" type="cylinder" fromto="0 -0.016 0 0 0.016 0" size="0.006" rgba="0.23 0.25 0.26 1" mass="0.01"/>
      <geom name="input_shaft_key" type="box" pos="0 0 0.0046" size="0.0015 0.014 0.0012" rgba="0.18 0.19 0.2 1" mass="0.003"/>
    </body>
    <body name="intermediate_shaft" pos="0.235 0 0.824">
      <freejoint/>
      <geom name="intermediate_shaft_body" type="cylinder" fromto="0 -0.04 0 0 0.04 0" size="0.004" rgba="0.58 0.59 0.6 1" mass="0.029" friction="1.25 0.08 0.002"/>
      <geom name="intermediate_shaft_grip" type="cylinder" fromto="0 -0.014 0 0 0.014 0" size="0.006" rgba="0.23 0.25 0.26 1" mass="0.01"/>
      <geom name="intermediate_shaft_key" type="box" pos="0 0 0.0046" size="0.0015 0.012 0.0012" rgba="0.18 0.19 0.2 1" mass="0.003"/>
    </body>
    <body name="spacer_input" pos="0.285 -0.025 0.812">
      <freejoint/>
      ${annularGeometry('spacer_input_ring', 0.0048, 0.009, 0.006, '0.28 0.3 0.31 1', 0.018)}
      <site name="spacer_input_bore_site" size="0.0042" rgba="0.55 0.2 0.15 0.45" group="1"/>
    </body>
    <body name="spacer_intermediate" pos="0.285 0.025 0.812">
      <freejoint/>
      ${annularGeometry('spacer_intermediate_ring', 0.0048, 0.009, 0.006, '0.28 0.3 0.31 1', 0.018)}
      <site name="spacer_intermediate_bore_site" size="0.0042" rgba="0.55 0.2 0.15 0.45" group="1"/>
    </body>

    <body name="gear_parts_tray" pos="0 -0.21 0.804">
      <geom name="gear_parts_tray_floor" type="box" size="0.095 0.052 0.004" rgba="0.2 0.23 0.24 1"/>
      <geom name="gear_parts_tray_north" type="box" pos="0 0.05 0.009" size="0.095 0.003 0.009" rgba="0.16 0.18 0.19 1"/>
      <geom name="gear_parts_tray_south" type="box" pos="0 -0.05 0.009" size="0.095 0.003 0.009" rgba="0.16 0.18 0.19 1"/>
      <geom name="gear_parts_tray_west" type="box" pos="-0.093 0 0.009" size="0.003 0.047 0.009" rgba="0.16 0.18 0.19 1"/>
      <geom name="gear_parts_tray_east" type="box" pos="0.093 0 0.009" size="0.003 0.047 0.009" rgba="0.16 0.18 0.19 1"/>
      <geom name="gear_pocket_divider_a" type="box" pos="-0.027 0 0.006" size="0.0004 0.047 0.006" rgba="0.16 0.18 0.19 1"/>
      <geom name="gear_pocket_divider_b" type="box" pos="0.0275 0 0.006" size="0.0005 0.047 0.006" rgba="0.16 0.18 0.19 1"/>
    </body>
    <body name="gear_large" pos="-0.057 -0.21 0.818">
      <freejoint/>
      ${radialGearGeometry('gear_large', 0.024, '0.55 0.43 0.18 1')}
    </body>
    <body name="gear_medium" pos="0 -0.21 0.818">
      <freejoint/>
      ${radialGearGeometry('gear_medium', 0.021, '0.48 0.49 0.5 1')}
    </body>
    <body name="gear_small" pos="0.05 -0.21 0.818">
      <freejoint/>
      ${radialGearGeometry('gear_small', 0.016, '0.36 0.38 0.39 1')}
    </body>

    <body name="gearbox_top_cover" pos="-0.21 0.025 0.809">
      <freejoint/>
      <geom name="cover_plate_visual" type="box" size="0.065 0.05 0.004" rgba="0.43 0.45 0.46 1" contype="0" conaffinity="0"/>
      ${perforatedPlateCollision('cover', 0.065, 0.05, 0.027, 0.004, '0.43 0.45 0.46 1')}
      ${annularGeometry('cover_input_bearing_seat', 0.005, 0.01, 0.002, '0.22 0.24 0.25 1', 0.016, [-0.027, 0, 0.006])}
      ${annularGeometry('cover_intermediate_bearing_seat', 0.005, 0.01, 0.002, '0.22 0.24 0.25 1', 0.016, [0.027, 0, 0.006])}
      <geom name="cover_grip_tab" type="box" pos="-0.077 0 0" size="0.012 0.028 0.008" rgba="0.24 0.26 0.27 1" mass="0.025"/>
      <site name="cover_pin_socket_1" type="cylinder" pos="-0.052 -0.037 0.005" size="0.0042 0.001" rgba="0.13 0.14 0.15 0.9" group="1"/>
      <site name="cover_pin_socket_2" type="cylinder" pos="-0.052 0.037 0.005" size="0.0042 0.001" rgba="0.13 0.14 0.15 0.9" group="1"/>
      <site name="cover_pin_socket_3" type="cylinder" pos="0.052 -0.037 0.005" size="0.0042 0.001" rgba="0.13 0.14 0.15 0.9" group="1"/>
      <site name="cover_pin_socket_4" type="cylinder" pos="0.052 0.037 0.005" size="0.0042 0.001" rgba="0.13 0.14 0.15 0.9" group="1"/>
      <site name="cover_input_bearing_site" pos="-0.027 0 0" size="0.005" rgba="0.55 0.2 0.15 0.55" group="1"/>
      <site name="cover_intermediate_bearing_site" pos="0.027 0 0" size="0.005" rgba="0.55 0.2 0.15 0.55" group="1"/>
    </body>
    <body name="pin_holder" pos="-0.21 -0.065 0.805">
      <geom name="pin_holder_base" type="box" size="0.082 0.018 0.005" rgba="0.19 0.21 0.22 1"/>
      <geom name="pin_holder_back" type="box" pos="0 0.016 0.012" size="0.082 0.003 0.012" rgba="0.15 0.17 0.18 1"/>
      <geom name="pin_holder_front" type="box" pos="0 -0.016 0.012" size="0.082 0.003 0.012" rgba="0.15 0.17 0.18 1"/>
      ${[-0.045, -0.015, 0.015, 0.045].map((x, index) => `
      <geom name="pin_holder_support_${index + 1}_left" type="box" pos="${x - 0.006} 0 0.012" size="0.002 0.012 0.012" rgba="0.27 0.29 0.3 1"/>
      <geom name="pin_holder_support_${index + 1}_right" type="box" pos="${x + 0.006} 0 0.012" size="0.002 0.012 0.012" rgba="0.27 0.29 0.3 1"/>`).join('')}
    </body>
    ${[-0.255, -0.225, -0.195, -0.165].map((x, index) => `
    <body name="press_pin_${index + 1}" pos="${x} -0.065 0.826">
      <freejoint/>
      <geom name="press_pin_${index + 1}_shaft" type="cylinder" size="0.003 0.016" rgba="0.57 0.58 0.59 1" mass="0.011" friction="1.2 0.08 0.002"/>
      <geom name="press_pin_${index + 1}_grip" type="cylinder" pos="0 0 0.012" size="0.0042 0.004" rgba="0.25 0.27 0.28 1" mass="0.003"/>
    </body>`).join('')}`;

const SO101_ARM_FRAMES_XML = attachmentFrames('so101_model', 'Base', [
  { position: [0, 0.42, 0.8], yaw: 0 },
  { position: [0.42, 0, 0.8], yaw: -QUARTER_TURN_DEGREES },
  { position: [0, -0.42, 0.8], yaw: HALF_TURN_DEGREES },
  { position: [-0.42, 0, 0.8], yaw: QUARTER_TURN_DEGREES },
]);

const SO101_TASK_STATIONS = {
  fixture: [0, 0, 0.81],
  housing: [0, 0.21, 0.805],
  shaftsAndSpacers: [0.21, 0, 0.82],
  gears: [0, -0.21, 0.814],
  coverAndPins: [-0.21, 0, 0.809],
};

const SO101_HOME_LAB_WORKCELL_OFFSET = [-2.25, -1.85];
const SO101_HOME_LAB_TASK_STATIONS = {
  fixture: [-2.25, -1.85, 0.81],
  housing: [-2.25, -1.64, 0.805],
  shaftsAndSpacers: [-2.04, -1.85, 0.82],
  gears: [-2.25, -2.06, 0.814],
  coverAndPins: [-2.46, -1.85, 0.809],
};

const SO101_REACH_ENVELOPE = {
  baseRadius: 0.42,
  nominalChainReach: 0.455,
  nearestStationDistance: 0.21,
  homeTcpRadius: 0.1366,
};

function so101GearboxPatches({ includeHomeLab = false } = {}) {
  const roomAssets = includeHomeLab
    ? '<model name="g1_room_model" file="robots/g1/g1_static.xml"/>'
      + '<model name="go2_arm_room_model" file="robots/go2_arm/go2_arm_static.xml"/>'
    : '';
  const roomWorld = includeHomeLab
    ? SO101_HOME_LAB_ROOM_XML + SO101_HOME_LAB_STATIC_ROBOTS_XML
    : '';
  const workcellWorld = includeHomeLab
    ? `<frame pos="${SO101_HOME_LAB_WORKCELL_OFFSET.join(' ')} 0">${SO101_ARM_FRAMES_XML}${SO101_GEARBOX_WORKCELL_XML}</frame>`
    : SO101_ARM_FRAMES_XML + SO101_GEARBOX_WORKCELL_XML;

  const patches = [
    {
      target: 'objects_SO101.xml',
      inject: '<model name="so101_model" file="SO101.xml"/>' + roomAssets,
      injectAfter: '<asset>',
    },
    {
      target: 'objects_SO101.xml',
      replace: [
        SO101_PARENT_WORLDBODY,
        `  <worldbody>${workcellWorld}${roomWorld}\n  </worldbody>`,
      ],
    },
    {
      target: 'SO101.xml',
      inject: '<site name="tcp" pos="0 -0.04 -0.01" size="0.005" rgba="0.16 0.55 0.26 0.7" group="1"/>',
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
  ];

  if (includeHomeLab) {
    patches.push({
      target: 'objects_SO101.xml',
      replace: [
        '\n</mujoco>',
        `${SO101_HOME_LAB_MOBILE_ACTUATORS_XML}\n</mujoco>`,
      ],
    });
  }

  return patches;
}

function so101GearboxSceneObjects(floorHalfSize, floorRgba, workcellOffset = [0, 0]) {
  const [offsetX, offsetY] = workcellOffset;
  const shifted = ([x, y, z]) => [x + offsetX, y + offsetY, z];
  return [
    fixedBox('gearbox_floor', [...floorHalfSize, 0.005], [0, 0, -0.005], floorRgba),
    fixedBox('gearbox_work_surface', [0.52, 0.52, 0.035], shifted([0, 0, 0.765]), [0.31, 0.29, 0.25, 1]),
    fixedBox('gearbox_table_leg_a', [0.035, 0.035, 0.365], shifted([-0.44, -0.44, 0.365]), [0.18, 0.18, 0.17, 1]),
    fixedBox('gearbox_table_leg_b', [0.035, 0.035, 0.365], shifted([0.44, -0.44, 0.365]), [0.18, 0.18, 0.17, 1]),
    fixedBox('gearbox_table_leg_c', [0.035, 0.035, 0.365], shifted([-0.44, 0.44, 0.365]), [0.18, 0.18, 0.17, 1]),
    fixedBox('gearbox_table_leg_d', [0.035, 0.035, 0.365], shifted([0.44, 0.44, 0.365]), [0.18, 0.18, 0.17, 1]),
  ];
}

const SO101_GEARBOX_SHARED = {
  instanceCount: 4,
  yawStepDegrees: 90,
  ringRadius: 0.42,
  workSurfaceHeight: WORK_SURFACE_HEIGHT,
  primaryTcpSite: 'r0_tcp',
  homeJoints: repeatPose(SO101_HOME, 4),
  taskStations: SO101_TASK_STATIONS,
  reachEnvelope: SO101_REACH_ENVELOPE,
};

export const SO101_GEARBOX_LAYOUT = {
  ...SO101_GEARBOX_SHARED,
  xmlPatches: so101GearboxPatches(),
  sceneObjects: so101GearboxSceneObjects([2, 2], [0.1, 0.11, 0.12, 1]),
  camera: { position: [1.15, -1.15, 1.28], fov: 40 },
  orbitTarget: [0, 0, 0.81],
};

export const SO101_HOME_LAB_LAYOUT = {
  ...SO101_GEARBOX_SHARED,
  workcellCenter: SO101_HOME_LAB_WORKCELL_OFFSET,
  homeJoints: [0, 0, 0, 0, 0, 0, ...repeatPose(SO101_HOME, 4)],
  taskStations: SO101_HOME_LAB_TASK_STATIONS,
  roomBounds: {
    halfWidth: 5,
    halfDepth: 4.2,
    wallHeight: 2.7,
    openSide: 'south',
  },
  protectedWorkcellRadius: 1.15,
  roomZones: {
    lounge: [-3.55, 1.55],
    office: [2.65, 3.35],
    g1: [2.45, -0.9],
    go2Arm: [3.55, -2.35],
  },
  mobileRobots: {
    g1: { rootBody: 'home_lab_g1_mobile_root', controlled: true },
    go2Arm: { rootBody: 'home_lab_go2_mobile_root', controlled: true },
  },
  xmlPatches: so101GearboxPatches({ includeHomeLab: true }),
  sceneObjects: so101GearboxSceneObjects(
    [5, 4.2],
    [0.16, 0.15, 0.14, 1],
    SO101_HOME_LAB_WORKCELL_OFFSET,
  ),
  camera: { position: [0, -9.2, 4.8], fov: 48 },
  orbitTarget: [0, 0.15, 1.05],
};

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

const XLEROBOT_PAYLOAD_DECK_XML = `
      <body name="payload_deck" pos="0.255 0 0.405">
        <geom name="payload_deck_floor" type="box" size="0.11 0.17 0.008" rgba="0.2 0.23 0.25 1" mass="0.45" friction="1.3 0.08 0.002"/>
        <geom name="payload_deck_left_rail" type="box" pos="0 0.166 0.028" size="0.11 0.004 0.028" rgba="0.17 0.19 0.2 1" mass="0.08"/>
        <geom name="payload_deck_right_rail" type="box" pos="0 -0.166 0.028" size="0.11 0.004 0.028" rgba="0.17 0.19 0.2 1" mass="0.08"/>
        <geom name="payload_deck_back_rail" type="box" pos="0.106 0 0.028" size="0.004 0.162 0.028" rgba="0.17 0.19 0.2 1" mass="0.06"/>
      </body>`;

const XLEROBOT_KITTING_WORKCELL_XML = `
    <body name="source_tote_bay" pos="-0.15 -0.36 0.777">
      <geom name="source_tote_bay_marker" type="box" size="0.14 0.11 0.002" rgba="0.33 0.3 0.24 1" contype="0" conaffinity="0"/>
    </body>
    <body name="order_tray_bay" pos="0.1 0.36 0.777">
      <geom name="order_tray_bay_marker" type="box" size="0.15 0.11 0.002" rgba="0.28 0.31 0.32 1" contype="0" conaffinity="0"/>
    </body>

    <body name="handoff_cradle_south" pos="0 -0.1 0.781">
      <geom name="handoff_cradle_south_base" type="box" size="0.06 0.035 0.006" rgba="0.2 0.23 0.24 1"/>
      <geom name="handoff_cradle_south_left" type="box" pos="-0.033 0 0.018" size="0.025 0.035 0.005" euler="0 -28 0" rgba="0.31 0.34 0.35 1"/>
      <geom name="handoff_cradle_south_right" type="box" pos="0.033 0 0.018" size="0.025 0.035 0.005" euler="0 28 0" rgba="0.31 0.34 0.35 1"/>
      <site name="handoff_south_site" pos="0 0 0.025" size="0.005" rgba="0.58 0.24 0.16 0.5" group="1"/>
    </body>
    <body name="handoff_cradle_north" pos="0 0.1 0.781">
      <geom name="handoff_cradle_north_base" type="box" size="0.06 0.035 0.006" rgba="0.2 0.23 0.24 1"/>
      <geom name="handoff_cradle_north_left" type="box" pos="-0.033 0 0.018" size="0.025 0.035 0.005" euler="0 -28 0" rgba="0.31 0.34 0.35 1"/>
      <geom name="handoff_cradle_north_right" type="box" pos="0.033 0 0.018" size="0.025 0.035 0.005" euler="0 28 0" rgba="0.31 0.34 0.35 1"/>
      <site name="handoff_north_site" pos="0 0 0.025" size="0.005" rgba="0.58 0.24 0.16 0.5" group="1"/>
    </body>
    <body name="scanner_dock" pos="0.16 0 0.781">
      <geom name="scanner_dock_base" type="box" size="0.075 0.055 0.006" rgba="0.18 0.2 0.21 1"/>
      <geom name="scanner_dock_north" type="box" pos="0 0.049 0.016" size="0.075 0.006 0.016" rgba="0.28 0.3 0.31 1"/>
      <geom name="scanner_dock_south" type="box" pos="0 -0.049 0.016" size="0.075 0.006 0.016" rgba="0.28 0.3 0.31 1"/>
      <site name="scanner_dock_site" pos="0 0 0.02" size="0.005" rgba="0.55 0.2 0.15 0.5" group="1"/>
    </body>

    <body name="source_tote" pos="-0.15 -0.36 0.781">
      <freejoint/>
      <geom name="source_tote_floor" type="box" size="0.13 0.1 0.006" rgba="0.26 0.29 0.3 1" mass="0.3" friction="1.25 0.08 0.002"/>
      <geom name="source_tote_north_wall" type="box" pos="0 0.096 0.045" size="0.13 0.004 0.04" rgba="0.22 0.25 0.26 1" mass="0.06"/>
      <geom name="source_tote_south_wall" type="box" pos="0 -0.096 0.045" size="0.13 0.004 0.04" rgba="0.22 0.25 0.26 1" mass="0.06"/>
      <geom name="source_tote_west_wall" type="box" pos="-0.126 0 0.045" size="0.004 0.092 0.04" rgba="0.22 0.25 0.26 1" mass="0.05"/>
      <geom name="source_tote_east_wall" type="box" pos="0.126 0 0.045" size="0.004 0.092 0.04" rgba="0.22 0.25 0.26 1" mass="0.05"/>
      <geom name="source_tote_handle_west" type="box" pos="-0.143 0 0.055" size="0.018 0.045 0.008" rgba="0.15 0.17 0.18 1" mass="0.025"/>
      <geom name="source_tote_handle_east" type="box" pos="0.143 0 0.055" size="0.018 0.045 0.008" rgba="0.15 0.17 0.18 1" mass="0.025"/>
      <geom name="source_tote_divider" type="box" pos="0 0 0.025" size="0.003 0.09 0.02" rgba="0.19 0.22 0.23 1" mass="0.035"/>
      <geom name="source_tote_label_plate" type="box" pos="0 -0.101 0.04" size="0.05 0.0015 0.018" rgba="0.65 0.61 0.5 1" contype="0" conaffinity="0"/>
      <geom name="source_tote_rib_west_1" type="box" pos="-0.131 -0.05 0.045" size="0.004 0.006 0.042" rgba="0.16 0.19 0.2 1" mass="0.008"/>
      <geom name="source_tote_rib_west_2" type="box" pos="-0.131 0.05 0.045" size="0.004 0.006 0.042" rgba="0.16 0.19 0.2 1" mass="0.008"/>
      <geom name="source_tote_rib_east_1" type="box" pos="0.131 -0.05 0.045" size="0.004 0.006 0.042" rgba="0.16 0.19 0.2 1" mass="0.008"/>
      <geom name="source_tote_rib_east_2" type="box" pos="0.131 0.05 0.045" size="0.004 0.006 0.042" rgba="0.16 0.19 0.2 1" mass="0.008"/>
    </body>

    <body name="pill_bottle" pos="-0.205 -0.4 0.821">
      <freejoint/>
      <geom name="pill_bottle_body" type="cylinder" size="0.016 0.029" rgba="0.83 0.82 0.76 1" mass="0.045" friction="1.15 0.06 0.002"/>
      <geom name="pill_bottle_cap" type="cylinder" pos="0 0 0.034" size="0.018 0.006" rgba="0.38 0.26 0.17 1" mass="0.012"/>
      <geom name="pill_bottle_label" type="cylinder" pos="0 0 -0.002" size="0.0164 0.012" rgba="0.72 0.68 0.56 1" contype="0" conaffinity="0"/>
      <site name="pill_bottle_barcode_site" pos="0 -0.016 0" size="0.006 0.001 0.012" type="box" rgba="0.12 0.12 0.11 0.85" group="1"/>
    </body>
    <body name="tea_box" pos="-0.1 -0.4 0.827">
      <freejoint/>
      <geom name="tea_box_body" type="box" size="0.027 0.018 0.04" rgba="0.48 0.31 0.2 1" mass="0.065" friction="1.2 0.08 0.002"/>
      <geom name="tea_box_label" type="box" pos="0 -0.0185 0" size="0.018 0.001 0.026" rgba="0.72 0.65 0.49 1" contype="0" conaffinity="0"/>
      <geom name="tea_box_top_flap" type="box" pos="0 0 0.042" size="0.024 0.016 0.003" rgba="0.37 0.23 0.15 1" mass="0.005"/>
      <site name="tea_box_barcode_site" pos="0.0275 0 0" size="0.001 0.012 0.018" type="box" rgba="0.12 0.12 0.11 0.85" group="1"/>
    </body>
    <body name="drink_carton" pos="-0.205 -0.315 0.833">
      <freejoint/>
      <geom name="drink_carton_body" type="box" size="0.023 0.018 0.045" rgba="0.63 0.5 0.34 1" mass="0.075" friction="1.2 0.08 0.002"/>
      <geom name="drink_carton_top" type="box" pos="0 0 0.05" size="0.021 0.016 0.006" rgba="0.75 0.69 0.57 1" mass="0.008"/>
      <geom name="drink_carton_cap" type="cylinder" pos="0.01 0 0.059" size="0.005 0.003" rgba="0.2 0.26 0.28 1" mass="0.003"/>
      <geom name="drink_carton_side_label" type="box" pos="0.0235 0 -0.003" size="0.001 0.012 0.025" rgba="0.33 0.25 0.19 1" contype="0" conaffinity="0"/>
      <site name="drink_carton_barcode_site" pos="0 -0.0185 0" size="0.012 0.001 0.02" type="box" rgba="0.12 0.12 0.11 0.85" group="1"/>
    </body>
    <body name="water_bottle" pos="-0.1 -0.315 0.827">
      <freejoint/>
      <geom name="water_bottle_body" type="cylinder" size="0.017 0.034" rgba="0.42 0.52 0.55 0.9" mass="0.055" friction="1.15 0.06 0.002"/>
      <geom name="water_bottle_shoulder" type="capsule" fromto="0 0 0.028 0 0 0.047" size="0.012" rgba="0.42 0.52 0.55 0.9" mass="0.012"/>
      <geom name="water_bottle_cap" type="cylinder" pos="0 0 0.053" size="0.01 0.006" rgba="0.24 0.3 0.32 1" mass="0.008"/>
      <geom name="water_bottle_label_band" type="cylinder" pos="0 0 -0.004" size="0.0174 0.011" rgba="0.66 0.64 0.55 0.95" contype="0" conaffinity="0"/>
      <site name="water_bottle_barcode_site" pos="0 -0.017 0" size="0.007 0.001 0.014" type="box" rgba="0.12 0.12 0.11 0.85" group="1"/>
    </body>

    <body name="handheld_scanner" pos="0.16 0 0.857" euler="0 90 0">
      <freejoint/>
      <geom name="scanner_handle" type="box" pos="-0.032 0 -0.012" size="0.042 0.018 0.018" rgba="0.18 0.19 0.2 1" mass="0.09" friction="1.25 0.08 0.002"/>
      <geom name="scanner_head" type="box" pos="0.035 0 0.012" size="0.035 0.03 0.027" rgba="0.34 0.35 0.35 1" mass="0.11"/>
      <geom name="scanner_trigger" type="box" pos="-0.006 -0.019 -0.007" size="0.012 0.003 0.009" rgba="0.56 0.22 0.16 1" mass="0.004"/>
      <geom name="scanner_lens" type="box" pos="0.071 0 0.012" size="0.002 0.022 0.018" rgba="0.08 0.09 0.09 1" contype="0" conaffinity="0"/>
      <geom name="scanner_status_button" type="cylinder" pos="0.035 -0.0305 0.02" size="0.005 0.0015" euler="90 0 0" rgba="0.48 0.23 0.15 1" contype="0" conaffinity="0"/>
      <geom name="scanner_speaker_slot_1" type="box" pos="0.028 0.0305 0.005" size="0.009 0.001 0.0015" rgba="0.1 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="scanner_speaker_slot_2" type="box" pos="0.042 0.0305 0.005" size="0.009 0.001 0.0015" rgba="0.1 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="scanner_battery_seam" type="box" pos="-0.057 0 -0.0305" size="0.018 0.014 0.001" rgba="0.08 0.09 0.09 1" contype="0" conaffinity="0"/>
      <site name="scanner_lens_site" pos="0.074 0 0.012" size="0.004" rgba="0.55 0.16 0.12 0.65" group="1"/>
    </body>

    <body name="order_tray" pos="0.1 0.36 0.781">
      <freejoint/>
      <geom name="order_tray_floor" type="box" size="0.14 0.1 0.006" rgba="0.32 0.35 0.36 1" mass="0.32" friction="1.25 0.08 0.002"/>
      <geom name="order_tray_north_wall" type="box" pos="0 0.096 0.035" size="0.14 0.004 0.03" rgba="0.24 0.27 0.28 1" mass="0.055"/>
      <geom name="order_tray_south_wall" type="box" pos="0 -0.096 0.035" size="0.14 0.004 0.03" rgba="0.24 0.27 0.28 1" mass="0.055"/>
      <geom name="order_tray_west_wall" type="box" pos="-0.136 0 0.035" size="0.004 0.092 0.03" rgba="0.24 0.27 0.28 1" mass="0.045"/>
      <geom name="order_tray_east_wall" type="box" pos="0.136 0 0.035" size="0.004 0.092 0.03" rgba="0.24 0.27 0.28 1" mass="0.045"/>
      <geom name="order_tray_divider_a" type="box" pos="-0.045 0 0.025" size="0.003 0.092 0.02" rgba="0.23 0.26 0.27 1" mass="0.025"/>
      <geom name="order_tray_divider_b" type="box" pos="0.045 0 0.025" size="0.003 0.092 0.02" rgba="0.23 0.26 0.27 1" mass="0.025"/>
      <geom name="order_tray_handle_left" type="box" pos="-0.158 0 0.025" size="0.018 0.052 0.009" rgba="0.15 0.17 0.18 1" mass="0.025"/>
      <geom name="order_tray_handle_right" type="box" pos="0.158 0 0.025" size="0.018 0.052 0.009" rgba="0.15 0.17 0.18 1" mass="0.025"/>
      <geom name="order_tray_corner_bumper_nw" type="box" pos="-0.137 0.097 0.018" size="0.009 0.009 0.018" rgba="0.13 0.15 0.16 1" mass="0.012"/>
      <geom name="order_tray_corner_bumper_ne" type="box" pos="0.137 0.097 0.018" size="0.009 0.009 0.018" rgba="0.13 0.15 0.16 1" mass="0.012"/>
      <geom name="order_tray_corner_bumper_sw" type="box" pos="-0.137 -0.097 0.018" size="0.009 0.009 0.018" rgba="0.13 0.15 0.16 1" mass="0.012"/>
      <geom name="order_tray_corner_bumper_se" type="box" pos="0.137 -0.097 0.018" size="0.009 0.009 0.018" rgba="0.13 0.15 0.16 1" mass="0.012"/>
      <site name="order_tray_center_site" pos="0 0 0.012" size="0.005" rgba="0.55 0.2 0.15 0.5" group="1"/>
    </body>`;

const XLEROBOT_HOME_ENVIRONMENT_XML = `
    <body name="kitchen_back_wall" pos="0 1.82 1.2">
      <geom name="kitchen_back_wall_panel" type="box" size="2.1 0.04 1.2" rgba="0.72 0.69 0.62 1"/>
      <geom name="kitchen_backsplash" type="box" pos="-0.2 -0.045 -0.25" size="1.35 0.012 0.34" rgba="0.48 0.49 0.47 1"/>
    </body>

    <body name="kitchen_west_wall" pos="-2.16 0 1.2">
      <geom name="kitchen_west_wall_panel" type="box" size="0.04 2.01 1.2" rgba="0.72 0.69 0.62 1"/>
    </body>
    <body name="kitchen_east_wall" pos="2.16 0 1.2">
      <geom name="kitchen_east_wall_panel" type="box" size="0.04 2.01 1.2" rgba="0.72 0.69 0.62 1"/>
    </body>

    <body name="kitchen_west_window" pos="-2.105 0.68 1.52">
      <geom name="kitchen_west_window_reveal" type="box" size="0.008 0.64 0.54" rgba="0.2 0.22 0.22 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_glass" type="box" pos="0.01 0 0" size="0.006 0.57 0.47" rgba="0.32 0.48 0.54 0.45" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_north" type="box" pos="0.02 0.605 0" size="0.018 0.035 0.51" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_south" type="box" pos="0.02 -0.605 0" size="0.018 0.035 0.51" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_top" type="box" pos="0.02 0 0.495" size="0.018 0.64 0.035" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_bottom" type="box" pos="0.02 0 -0.495" size="0.018 0.64 0.035" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_vertical" type="box" pos="0.025 0 0" size="0.018 0.025 0.47" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_frame_horizontal" type="box" pos="0.025 0 0" size="0.018 0.57 0.025" rgba="0.76 0.74 0.68 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_west_window_sill" type="box" pos="0.07 0 -0.56" size="0.09 0.69 0.035" rgba="0.52 0.48 0.4 1" contype="0" conaffinity="0"/>
    </body>

    <body name="kitchen_east_wall_art_1" pos="2.105 0.92 1.73">
      <geom name="kitchen_east_wall_art_1_frame" type="box" size="0.012 0.38 0.31" rgba="0.24 0.2 0.17 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_1_mat" type="box" pos="-0.014 0 0" size="0.008 0.33 0.26" rgba="0.76 0.72 0.63 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_1_canvas" type="box" pos="-0.024 0 0" size="0.004 0.28 0.21" rgba="0.35 0.43 0.39 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_1_horizon" type="box" pos="-0.03 0 -0.035" size="0.003 0.27 0.012" rgba="0.62 0.51 0.38 1" contype="0" conaffinity="0"/>
    </body>
    <body name="kitchen_east_wall_art_2" pos="2.105 -1.05 1.62">
      <geom name="kitchen_east_wall_art_2_frame" type="box" size="0.012 0.31 0.38" rgba="0.23 0.2 0.18 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_2_mat" type="box" pos="-0.014 0 0" size="0.008 0.26 0.33" rgba="0.73 0.7 0.63 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_2_canvas" type="box" pos="-0.024 0 0" size="0.004 0.21 0.28" rgba="0.5 0.39 0.31 1" contype="0" conaffinity="0"/>
      <geom name="kitchen_east_wall_art_2_accent" type="cylinder" pos="-0.03 0.02 0.02" size="0.095 0.003" euler="0 90 0" rgba="0.32 0.38 0.35 1" contype="0" conaffinity="0"/>
    </body>

    <body name="kitchen_refrigerator" pos="1.8 -0.1 0">
      <geom name="refrigerator_case" type="box" pos="0 0 0.72" size="0.28 0.3 0.72" rgba="1 1 1 1"/>
      <geom name="refrigerator_top" type="box" pos="0 0 1.455" size="0.295 0.315 0.015" rgba="1 1 1 1"/>
      <geom name="refrigerator_toe_kick" type="box" pos="-0.282 0 0.06" size="0.015 0.255 0.06" rgba="0.11 0.13 0.13 1"/>
      <geom name="refrigerator_upper_door" type="box" pos="-0.294 0 1.03" size="0.014 0.275 0.34" rgba="1 1 1 1"/>
      <geom name="refrigerator_freezer_drawer" type="box" pos="-0.294 0 0.41" size="0.014 0.275 0.22" rgba="1 1 1 1"/>
      <geom name="refrigerator_door_seam" type="box" pos="-0.311 0 0.66" size="0.004 0.268 0.012" rgba="0.12 0.14 0.14 1" contype="0" conaffinity="0"/>
      <geom name="refrigerator_upper_handle" type="capsule" fromto="-0.322 0.18 0.86 -0.322 0.18 1.21" size="0.011" rgba="0.14 0.16 0.16 1"/>
      <geom name="refrigerator_freezer_handle" type="capsule" fromto="-0.322 -0.15 0.51 -0.322 0.15 0.51" size="0.01" rgba="0.14 0.16 0.16 1"/>
      <geom name="refrigerator_water_dispenser_frame" type="box" pos="-0.314 -0.1 1.02" size="0.006 0.082 0.105" rgba="0.16 0.18 0.18 1" contype="0" conaffinity="0"/>
      <geom name="refrigerator_water_dispenser" type="box" pos="-0.321 -0.1 1.01" size="0.003 0.064 0.08" rgba="0.045 0.055 0.055 1" contype="0" conaffinity="0"/>
      <geom name="refrigerator_dispenser_nozzle" type="box" pos="-0.326 -0.1 1.06" size="0.004 0.02 0.014" rgba="0.28 0.3 0.29 1" contype="0" conaffinity="0"/>
      <geom name="refrigerator_brand_badge" type="box" pos="-0.323 0.175 1.325" size="0.003 0.04 0.01" rgba="0.12 0.14 0.14 1" contype="0" conaffinity="0"/>
    </body>

    <body name="kitchen_sink_cabinet" pos="-0.85 1.47 0">
      <geom name="sink_cabinet_case" type="box" pos="0 0 0.4" size="0.34 0.27 0.4" rgba="0.54 0.46 0.36 1"/>
      <geom name="sink_cabinet_door_left" type="box" pos="-0.17 -0.276 0.42" size="0.16 0.006 0.35" rgba="0.64 0.57 0.47 1"/>
      <geom name="sink_cabinet_door_right" type="box" pos="0.17 -0.276 0.42" size="0.16 0.006 0.35" rgba="0.64 0.57 0.47 1"/>
      <geom name="sink_cabinet_handle_left" type="capsule" fromto="-0.05 -0.287 0.5 -0.05 -0.287 0.65" size="0.009" rgba="0.19 0.2 0.2 1"/>
      <geom name="sink_cabinet_handle_right" type="capsule" fromto="0.05 -0.287 0.5 0.05 -0.287 0.65" size="0.009" rgba="0.19 0.2 0.2 1"/>
      <geom name="sink_counter_left" type="box" pos="-0.27 0 0.835" size="0.07 0.29 0.025" rgba="0.36 0.36 0.34 1"/>
      <geom name="sink_counter_right" type="box" pos="0.27 0 0.835" size="0.07 0.29 0.025" rgba="0.36 0.36 0.34 1"/>
      <geom name="sink_counter_front" type="box" pos="0 -0.225 0.835" size="0.2 0.065 0.025" rgba="0.36 0.36 0.34 1"/>
      <geom name="sink_counter_back" type="box" pos="0 0.21 0.835" size="0.2 0.08 0.025" rgba="0.36 0.36 0.34 1"/>
      <body name="kitchen_sink_basin" pos="0 -0.03 0.76">
        <geom name="sink_basin_floor" type="box" size="0.2 0.13 0.015" rgba="0.45 0.47 0.47 1"/>
        <geom name="sink_basin_front" type="box" pos="0 -0.126 0.04" size="0.2 0.008 0.055" rgba="0.4 0.42 0.42 1"/>
        <geom name="sink_basin_back" type="box" pos="0 0.126 0.04" size="0.2 0.008 0.055" rgba="0.4 0.42 0.42 1"/>
        <geom name="sink_basin_left" type="box" pos="-0.196 0 0.04" size="0.008 0.118 0.055" rgba="0.4 0.42 0.42 1"/>
        <geom name="sink_basin_right" type="box" pos="0.196 0 0.04" size="0.008 0.118 0.055" rgba="0.4 0.42 0.42 1"/>
        <geom name="sink_drain" type="cylinder" pos="0 0 0.017" size="0.028 0.003" rgba="0.17 0.18 0.18 1"/>
      </body>
      <body name="kitchen_faucet" pos="0 0.19 0.855">
        <geom name="kitchen_faucet_base" type="cylinder" size="0.035 0.018" rgba="0.35 0.37 0.37 1"/>
        <geom name="kitchen_faucet_riser" type="capsule" fromto="0 0 0.01 0 0 0.23" size="0.018" rgba="0.46 0.48 0.48 1"/>
        <geom name="kitchen_faucet_spout" type="capsule" fromto="0 0 0.23 0 -0.17 0.23" size="0.017" rgba="0.46 0.48 0.48 1"/>
        <geom name="kitchen_faucet_nozzle" type="cylinder" pos="0 -0.17 0.205" size="0.022 0.027" rgba="0.31 0.33 0.33 1"/>
        <geom name="kitchen_faucet_lever_pivot" type="cylinder" pos="0.022 0 0.085" size="0.014 0.012" euler="0 90 0" rgba="0.34 0.36 0.36 1"/>
        <geom name="kitchen_faucet_lever" type="capsule" fromto="0.03 0 0.09 0.095 0 0.135" size="0.01" rgba="0.39 0.41 0.41 1"/>
      </body>
    </body>

    <body name="kitchen_prep_cabinet" pos="-0.2 1.47 0">
      <geom name="prep_cabinet_case" type="box" pos="0 0 0.4" size="0.28 0.27 0.4" rgba="0.57 0.49 0.39 1"/>
      <geom name="prep_counter" type="box" pos="0 0 0.835" size="0.29 0.29 0.025" rgba="0.36 0.36 0.34 1"/>
      <geom name="prep_drawer_1" type="box" pos="0 -0.276 0.67" size="0.26 0.006 0.09" rgba="0.66 0.59 0.49 1"/>
      <geom name="prep_drawer_2" type="box" pos="0 -0.276 0.47" size="0.26 0.006 0.09" rgba="0.66 0.59 0.49 1"/>
      <geom name="prep_drawer_3" type="box" pos="0 -0.276 0.27" size="0.26 0.006 0.09" rgba="0.66 0.59 0.49 1"/>
      <geom name="prep_drawer_handle_1" type="capsule" fromto="-0.09 -0.288 0.67 0.09 -0.288 0.67" size="0.008" rgba="0.18 0.19 0.19 1"/>
      <geom name="prep_drawer_handle_2" type="capsule" fromto="-0.09 -0.288 0.47 0.09 -0.288 0.47" size="0.008" rgba="0.18 0.19 0.19 1"/>
      <geom name="prep_drawer_handle_3" type="capsule" fromto="-0.09 -0.288 0.27 0.09 -0.288 0.27" size="0.008" rgba="0.18 0.19 0.19 1"/>
      <body name="kitchen_cutting_board" pos="0 -0.03 0.872">
        <geom name="cutting_board_top" type="box" size="0.19 0.15 0.012" rgba="0.57 0.39 0.23 1"/>
        <geom name="cutting_board_grip" type="cylinder" pos="0.15 0 0.014" size="0.018 0.003" rgba="0.24 0.18 0.13 1"/>
      </body>
    </body>

    <body name="kitchen_stove" pos="0.42 1.47 0">
      <geom name="stove_cabinet" type="box" pos="0 0 0.4" size="0.32 0.27 0.4" rgba="0.34 0.34 0.33 1"/>
      <geom name="stove_cooktop" type="box" pos="0 0 0.835" size="0.33 0.29 0.025" rgba="0.12 0.13 0.13 1"/>
      <geom name="kitchen_burner_front_left" type="cylinder" pos="-0.16 -0.13 0.864" size="0.082 0.004" rgba="0.29 0.3 0.29 1"/>
      <geom name="kitchen_burner_front_right" type="cylinder" pos="0.16 -0.13 0.864" size="0.067 0.004" rgba="0.29 0.3 0.29 1"/>
      <geom name="kitchen_burner_back_left" type="cylinder" pos="-0.16 0.13 0.864" size="0.067 0.004" rgba="0.29 0.3 0.29 1"/>
      <geom name="kitchen_burner_back_right" type="cylinder" pos="0.16 0.13 0.864" size="0.082 0.004" rgba="0.29 0.3 0.29 1"/>
      <geom name="stove_control_panel" type="box" pos="0 -0.278 0.72" size="0.29 0.008 0.075" rgba="0.2 0.21 0.21 1"/>
      <geom name="stove_knob_1" type="cylinder" pos="-0.21 -0.291 0.72" size="0.026 0.012" euler="90 0 0" rgba="0.45 0.46 0.45 1"/>
      <geom name="stove_knob_2" type="cylinder" pos="-0.07 -0.291 0.72" size="0.026 0.012" euler="90 0 0" rgba="0.45 0.46 0.45 1"/>
      <geom name="stove_knob_3" type="cylinder" pos="0.07 -0.291 0.72" size="0.026 0.012" euler="90 0 0" rgba="0.45 0.46 0.45 1"/>
      <geom name="stove_knob_4" type="cylinder" pos="0.21 -0.291 0.72" size="0.026 0.012" euler="90 0 0" rgba="0.45 0.46 0.45 1"/>
      <body name="kitchen_oven" pos="0 -0.282 0.36">
        <geom name="oven_door" type="box" size="0.28 0.009 0.24" rgba="0.16 0.17 0.17 1"/>
        <geom name="oven_window" type="box" pos="0 -0.01 0" size="0.21 0.003 0.15" rgba="0.08 0.09 0.09 1"/>
        <geom name="oven_handle" type="capsule" fromto="-0.21 -0.025 0.2 0.21 -0.025 0.2" size="0.014" rgba="0.47 0.48 0.47 1"/>
      </body>
      <body name="stove_saucepan" pos="-0.16 0.13 0.91">
        <geom name="saucepan_bottom" type="cylinder" pos="0 0 -0.034" size="0.082 0.006" rgba="0.22 0.24 0.24 1"/>
        ${annularGeometry('saucepan_wall', 0.074, 0.09, 0.034, '0.27 0.29 0.29 1', 0.25)}
        ${annularGeometry('saucepan_rim', 0.071, 0.096, 0.004, '0.38 0.4 0.4 1', 0.05, [0, 0, 0.035])}
        <geom name="saucepan_inner_bottom" type="cylinder" pos="0 0 -0.027" size="0.073 0.0015" rgba="0.12 0.13 0.13 1" contype="0" conaffinity="0"/>
        <geom name="saucepan_handle_socket" type="box" pos="0.092 0 0" size="0.018 0.026 0.021" rgba="0.19 0.2 0.2 1"/>
        <geom name="saucepan_handle" type="capsule" fromto="0.09 0 0 0.25 0 0" size="0.017" rgba="0.13 0.14 0.14 1"/>
        <geom name="saucepan_handle_end_cap" type="sphere" pos="0.255 0 0" size="0.021" rgba="0.11 0.12 0.12 1"/>
      </body>
    </body>

    <body name="kitchen_pantry" pos="1.15 1.52 1.0">
      <geom name="pantry_case" type="box" size="0.3 0.23 1" rgba="0.5 0.43 0.35 1"/>
      <geom name="pantry_door_left" type="box" pos="-0.15 -0.236 0" size="0.14 0.006 0.94" rgba="0.61 0.54 0.44 1"/>
      <geom name="pantry_door_right" type="box" pos="0.15 -0.236 0" size="0.14 0.006 0.94" rgba="0.61 0.54 0.44 1"/>
      <geom name="pantry_handle_left" type="capsule" fromto="-0.055 -0.25 -0.28 -0.055 -0.25 0.28" size="0.012" rgba="0.18 0.19 0.19 1"/>
      <geom name="pantry_handle_right" type="capsule" fromto="0.055 -0.25 -0.28 0.055 -0.25 0.28" size="0.012" rgba="0.18 0.19 0.19 1"/>
      <geom name="pantry_top_trim" type="box" pos="0 0 0.96" size="0.31 0.24 0.035" rgba="0.38 0.33 0.28 1"/>
    </body>

    <body name="dining_table" pos="0 -1.45 0">
      <geom name="dining_table_top" type="box" pos="0 0 0.73" size="0.62 0.3 0.02" rgba="0.48 0.36 0.25 1"/>
      <geom name="dining_table_leg_nw" type="box" pos="-0.53 0.22 0.355" size="0.035 0.035 0.355" rgba="0.28 0.22 0.18 1"/>
      <geom name="dining_table_leg_ne" type="box" pos="0.53 0.22 0.355" size="0.035 0.035 0.355" rgba="0.28 0.22 0.18 1"/>
      <geom name="dining_table_leg_sw" type="box" pos="-0.53 -0.22 0.355" size="0.035 0.035 0.355" rgba="0.28 0.22 0.18 1"/>
      <geom name="dining_table_leg_se" type="box" pos="0.53 -0.22 0.355" size="0.035 0.035 0.355" rgba="0.28 0.22 0.18 1"/>
      <geom name="dining_table_runner" type="box" pos="0 0 0.755" size="0.5 0.11 0.006" rgba="0.56 0.5 0.4 1" contype="0" conaffinity="0"/>
    </body>
    <body name="produce_crate" pos="-0.25 -1.45 0.758">
      <freejoint/>
      <geom name="produce_crate_floor" type="box" size="0.16 0.1 0.008" rgba="0.43 0.3 0.19 1" mass="0.18" friction="1.2 0.08 0.002"/>
      <geom name="produce_crate_slatted_side" type="box" pos="0 0.096 0.055" size="0.16 0.007 0.047" rgba="0.49 0.35 0.22 1" mass="0.035"/>
      <geom name="produce_crate_side_south" type="box" pos="0 -0.096 0.055" size="0.16 0.007 0.047" rgba="0.49 0.35 0.22 1" mass="0.035"/>
      <geom name="produce_crate_side_west" type="box" pos="-0.156 0 0.055" size="0.007 0.089 0.047" rgba="0.49 0.35 0.22 1" mass="0.03"/>
      <geom name="produce_crate_side_east" type="box" pos="0.156 0 0.055" size="0.007 0.089 0.047" rgba="0.49 0.35 0.22 1" mass="0.03"/>
      <geom name="produce_crate_slat_north" type="box" pos="0 0.102 0.055" size="0.13 0.003 0.01" rgba="0.31 0.22 0.15 1" mass="0.01"/>
    </body>
    <body name="tomato" pos="-0.31 -1.47 0.81">
      <freejoint/>
      <geom name="tomato_fruit" type="sphere" size="0.027" rgba="0.55 0.16 0.1 1" mass="0.065" friction="1.1 0.08 0.002"/>
      <geom name="tomato_stem" type="cylinder" pos="0 0 0.029" size="0.004 0.009" rgba="0.19 0.31 0.13 1" mass="0.003"/>
    </body>
    <body name="cucumber" pos="-0.15 -1.45 0.81">
      <freejoint/>
      <geom name="cucumber_body" type="capsule" fromto="0 -0.055 0 0 0.055 0" size="0.019" rgba="0.2 0.37 0.16 1" mass="0.09" friction="1.15 0.08 0.002"/>
      <geom name="cucumber_tip" type="sphere" pos="0 0.058 0" size="0.013" rgba="0.16 0.3 0.12 1" mass="0.005"/>
    </body>
    <body name="bell_pepper" pos="-0.25 -1.41 0.815">
      <freejoint/>
      <geom name="bell_pepper_lobe_1" type="sphere" pos="0.014 0 0" size="0.024" rgba="0.57 0.35 0.1 1" mass="0.025" friction="1.1 0.08 0.002"/>
      <geom name="bell_pepper_lobe_2" type="sphere" pos="-0.014 0 0" size="0.024" rgba="0.57 0.35 0.1 1" mass="0.025"/>
      <geom name="bell_pepper_lobe_3" type="sphere" pos="0 0.014 0" size="0.024" rgba="0.57 0.35 0.1 1" mass="0.025"/>
      <geom name="bell_pepper_lobe_4" type="sphere" pos="0 -0.014 0" size="0.024" rgba="0.57 0.35 0.1 1" mass="0.025"/>
      <geom name="bell_pepper_stem" type="cylinder" pos="0 0 0.03" size="0.004 0.012" rgba="0.2 0.3 0.12 1" mass="0.003"/>
    </body>

    <body name="produce_table_scale" pos="0.1 -1.45 0.762">
      <geom name="produce_scale_base" type="box" size="0.14 0.105 0.012" rgba="0.73 0.78 0.76 1"/>
      <geom name="produce_scale_platform" type="box" pos="0 0 0.022" size="0.12 0.085 0.008" rgba="0.86 0.88 0.84 1"/>
      <geom name="produce_scale_display_housing" type="box" pos="0 -0.112 0.034" size="0.06 0.016 0.026" euler="18 0 0" rgba="0.65 0.72 0.7 1"/>
      <geom name="produce_scale_display" type="box" pos="0 -0.128 0.041" size="0.043 0.002 0.012" euler="18 0 0" rgba="0.38 0.61 0.54 1" contype="0" conaffinity="0"/>
      <geom name="produce_scale_button_left" type="cylinder" pos="-0.075 -0.108 0.032" size="0.009 0.002" euler="90 0 0" rgba="0.82 0.72 0.5 1" contype="0" conaffinity="0"/>
      <geom name="produce_scale_button_right" type="cylinder" pos="0.075 -0.108 0.032" size="0.009 0.002" euler="90 0 0" rgba="0.82 0.72 0.5 1" contype="0" conaffinity="0"/>
    </body>
    <body name="produce_prep_bowl" pos="0.43 -1.42 0.767">
      <geom name="prep_bowl_bottom" type="cylinder" size="0.085 0.006" rgba="0.76 0.82 0.8 1"/>
      ${annularGeometry('prep_bowl_wall', 0.075, 0.105, 0.045, '0.8 0.86 0.84 1', 0.2, [0, 0, 0.043])}
      ${annularGeometry('prep_bowl_rim', 0.072, 0.112, 0.004, '0.9 0.91 0.86 1', 0.04, [0, 0, 0.088])}
      <geom name="prep_bowl_inner_bottom" type="cylinder" pos="0 0 0.008" size="0.074 0.0015" rgba="0.61 0.69 0.67 1" contype="0" conaffinity="0"/>
    </body>

    <body name="kitchen_trash_bin" pos="1.55 -1.25 0" euler="0 0 -90">
      <geom name="trash_bin_base" type="box" pos="0 0 0.025" size="0.18 0.14 0.025" rgba="0.1 0.12 0.12 1"/>
      <geom name="trash_bin_wall_west" type="box" pos="-0.17 0 0.34" size="0.01 0.14 0.29" rgba="0.17 0.19 0.19 1"/>
      <geom name="trash_bin_wall_east" type="box" pos="0.17 0 0.34" size="0.01 0.14 0.29" rgba="0.17 0.19 0.19 1"/>
      <geom name="trash_bin_wall_north" type="box" pos="0 0.13 0.34" size="0.16 0.01 0.29" rgba="0.15 0.17 0.17 1"/>
      <geom name="trash_bin_wall_south" type="box" pos="0 -0.13 0.34" size="0.16 0.01 0.29" rgba="0.2 0.22 0.21 1"/>
      <geom name="trash_bin_rim_west" type="box" pos="-0.17 0 0.64" size="0.014 0.15 0.018" rgba="0.07 0.085 0.085 1"/>
      <geom name="trash_bin_rim_east" type="box" pos="0.17 0 0.64" size="0.014 0.15 0.018" rgba="0.07 0.085 0.085 1"/>
      <geom name="trash_bin_rim_north" type="box" pos="0 0.14 0.64" size="0.156 0.014 0.018" rgba="0.07 0.085 0.085 1"/>
      <geom name="trash_bin_rim_south" type="box" pos="0 -0.14 0.64" size="0.156 0.014 0.018" rgba="0.07 0.085 0.085 1"/>
      <geom name="trash_bin_opening" type="box" pos="0 0 0.61" size="0.15 0.115 0.004" rgba="0.025 0.03 0.03 1" contype="0" conaffinity="0"/>
      <geom name="trash_bin_lid_hinge" type="cylinder" pos="0 0.145 0.69" size="0.025 0.175" euler="0 90 0" rgba="0.08 0.1 0.1 1"/>
      <geom name="trash_bin_lid" type="box" pos="0 0.07 0.81" size="0.18 0.14 0.022" euler="-58 0 0" rgba="0.13 0.15 0.15 1"/>
      <geom name="trash_bin_foot_pedal" type="box" pos="0 -0.18 0.035" size="0.07 0.05 0.015" rgba="0.28 0.3 0.29 1"/>
      <geom name="trash_bin_front_badge" type="box" pos="0 -0.141 0.39" size="0.045 0.002 0.018" rgba="0.52 0.48 0.38 1" contype="0" conaffinity="0"/>
    </body>

    <body name="storage_shelf" pos="-1.92 -0.4 0">
      <geom name="storage_shelf_back" type="box" pos="-0.17 0 0.75" size="0.018 0.28 0.75" rgba="0.58 0.5 0.41 1"/>
      <geom name="storage_shelf_post_front" type="box" pos="0.15 -0.25 0.75" size="0.025 0.025 0.75" rgba="0.48 0.42 0.35 1"/>
      <geom name="storage_shelf_post_back" type="box" pos="0.15 0.25 0.75" size="0.025 0.025 0.75" rgba="0.48 0.42 0.35 1"/>
      <geom name="storage_shelf_level_1" type="box" pos="0 0 0.18" size="0.18 0.28 0.025" rgba="0.68 0.59 0.48 1"/>
      <geom name="storage_shelf_level_2" type="box" pos="0 0 0.58" size="0.18 0.28 0.025" rgba="0.68 0.59 0.48 1"/>
      <geom name="storage_shelf_level_3" type="box" pos="0 0 0.98" size="0.18 0.28 0.025" rgba="0.68 0.59 0.48 1"/>
      <geom name="storage_shelf_level_4" type="box" pos="0 0 1.38" size="0.18 0.28 0.025" rgba="0.68 0.59 0.48 1"/>
      <body name="storage_bin_1" pos="0 -0.12 0.25">
        <geom name="storage_bin_1_body" type="box" size="0.14 0.11 0.055" rgba="0.64 0.72 0.69 1"/>
        <geom name="storage_bin_1_label" type="box" pos="0 -0.112 0" size="0.06 0.002 0.025" rgba="0.88 0.84 0.7 1" contype="0" conaffinity="0"/>
      </body>
      <body name="storage_bin_2" pos="0 0.1 0.65">
        <geom name="storage_bin_2_body" type="box" size="0.14 0.11 0.055" rgba="0.72 0.65 0.55 1"/>
      </body>
      <body name="storage_bin_3" pos="0 -0.1 1.05">
        <geom name="storage_bin_3_body" type="box" size="0.14 0.11 0.055" rgba="0.62 0.69 0.73 1"/>
        <geom name="storage_bin_3_label" type="box" pos="0 -0.112 0" size="0.06 0.002 0.025" rgba="0.88 0.84 0.7 1" contype="0" conaffinity="0"/>
      </body>
    </body>`;

const xlerobotKittingTableObjects = [
  fixedBox('kitting_table_spine', [0.24, 0.5, 0.025], [0, 0, 0.75], [0.31, 0.29, 0.25, 1]),
  fixedBox('kitting_table_north_wing', [0.36, 0.115, 0.025], [0, 0.385, 0.75], [0.34, 0.32, 0.28, 1]),
  fixedBox('kitting_table_south_wing', [0.36, 0.115, 0.025], [0, -0.385, 0.75], [0.34, 0.32, 0.28, 1]),
  fixedBox('kitting_table_leg_a', [0.035, 0.035, 0.3625], [-0.19, -0.44, 0.3625], [0.18, 0.18, 0.17, 1]),
  fixedBox('kitting_table_leg_b', [0.035, 0.035, 0.3625], [0.19, -0.44, 0.3625], [0.18, 0.18, 0.17, 1]),
  fixedBox('kitting_table_leg_c', [0.035, 0.035, 0.3625], [-0.19, 0.44, 0.3625], [0.18, 0.18, 0.17, 1]),
  fixedBox('kitting_table_leg_d', [0.035, 0.035, 0.3625], [0.19, 0.44, 0.3625], [0.18, 0.18, 0.17, 1]),
];

export const XLEROBOT_KITTING_LAYOUT = {
  instanceCount: 2,
  yawStepDegrees: 180,
  spacing: 1,
  roomBounds: {
    halfWidth: 2.2,
    halfDepth: 2.05,
    wallHeight: 2.4,
    openSide: 'south',
  },
  armBaseHeight: XLEROBOT_ARM_BASE_HEIGHT,
  tableTopHeight: XLEROBOT_ARM_BASE_HEIGHT,
  chassisCollisionTop: XLEROBOT_ARM_BASE_HEIGHT,
  homeJoints: repeatPose(XLEROBOT_HOME, 2),
  taskStations: {
    sourceTote: [-0.15, -0.36, 0.781],
    handoffSouth: [0, -0.1, 0.787],
    handoffNorth: [0, 0.1, 0.787],
    scannerDock: [0.16, 0, 0.787],
    orderTray: [0.1, 0.36, 0.781],
  },
  reachEnvelope: {
    chassisTableClearance: 0.05,
    inwardArmBaseToCenter: 0.41,
    nominalArmReach: 0.413,
  },
  navigationClearances: {
    north: 0.65,
    south: 0.65,
    west: 1.11,
  },
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
          { position: [-0.5, 0, 0], yaw: HALF_TURN_DEGREES },
          { position: [0.5, 0, 0], yaw: 0 },
        ])}${XLEROBOT_KITTING_WORKCELL_XML}${XLEROBOT_HOME_ENVIRONMENT_XML}\n  </worldbody>`,
      ],
    },
    {
      target: 'xlerobot.xml',
      replace: [
        '<geom type="box" size="0.1575 0.2025 0.295" pos="0 0 0.015" class="collision" friction="1 0.005 0.0001" rgba="0.9 0.3 0.3 0.4"/>',
        '<geom name="chassis_rack_collision" type="box" size="0.21 0.24 0.3375" pos="0 0 0.0575" class="collision" friction="1 0.005 0.0001" rgba="0 0 0 0"/>',
      ],
    },
    {
      target: 'xlerobot.xml',
      inject: XLEROBOT_PAYLOAD_DECK_XML,
      injectAfter: '<freejoint/',
    },
  ],
  tableObjects: xlerobotKittingTableObjects,
  sceneObjects: [
    fixedBox('kitting_floor', [2.2, 2.05, 0.005], [0, 0, -0.005], [0.32, 0.29, 0.25, 1]),
    ...xlerobotKittingTableObjects,
  ],
  camera: { position: [0, -4.8, 2.75], fov: 48 },
  orbitTarget: [0, 0.08, 0.72],
};
import {
  SO101_HOME_LAB_MOBILE_ACTUATORS_XML,
  SO101_HOME_LAB_ROOM_XML,
  SO101_HOME_LAB_STATIC_ROBOTS_XML,
} from './so101HomeLabEnvironment.js';
