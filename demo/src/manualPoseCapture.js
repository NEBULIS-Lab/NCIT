export const ASSEMBLY1_TCP_SITES = ['r0_tcp', 'r1_tcp', 'r2_tcp', 'r3_tcp'];

export const ASSEMBLY1_CAPTURE_BODIES = [
  'assembly_frame',
  'cross_member',
  'double_face_hammer',
  'fastener_1',
  'fastener_2',
  'fastener_3',
];

export const ASSEMBLY1_GRIPPER_JOINTS = Array.from(
  { length: 4 },
  (_, armIndex) => [
    `r${armIndex}_finger_joint1`,
    `r${armIndex}_finger_joint2`,
  ],
).flat();

export function sanitizePoseLabel(value) {
  const label = String(value ?? '').trim();
  if (label.length > 64) {
    throw new Error('Pose names must not exceed 64 characters');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(label)) {
    throw new Error('Pose names may contain only letters, numbers, hyphens and underscores, and must start with a letter or number');
  }
  return label;
}

export function createAssembly1PoseSnapshot(robotDemo, {
  label,
  selectedControlTarget,
  capturedAt = new Date().toISOString(),
}) {
  const safeLabel = sanitizePoseLabel(label);
  return {
    schemaVersion: 'franka-assembly1-manual-pose-v1',
    scene: 'frankaAssembly1',
    label: safeLabel,
    capturedAt,
    selectedControlTarget,
    controls: {
      ctrl: robotDemo.getCtrl(),
      qpos: robotDemo.getQpos(),
      qvel: robotDemo.getQvel(),
    },
    tcpPositions: robotDemo.getSitePositions(ASSEMBLY1_TCP_SITES),
    tcpOrientations: robotDemo.getSiteOrientations(ASSEMBLY1_TCP_SITES),
    gripperJointPositions: robotDemo.getJointPositions(ASSEMBLY1_GRIPPER_JOINTS),
    bodyPositions: robotDemo.getBodyPositions(ASSEMBLY1_CAPTURE_BODIES),
    bodyOrientations: robotDemo.getBodyOrientations(ASSEMBLY1_CAPTURE_BODIES),
    contacts: robotDemo.getContacts(),
  };
}

export function createManualPoseDownload(snapshot) {
  const label = sanitizePoseLabel(snapshot?.label);
  return {
    filename: `franka-assembly1-${label}.json`,
    mimeType: 'application/json',
    contents: `${JSON.stringify(snapshot, null, 2)}\n`,
  };
}
