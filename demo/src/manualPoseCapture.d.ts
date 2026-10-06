export interface ManualPoseRobotDiagnostics {
  getCtrl(): number[];
  getQpos(): number[];
  getQvel(): number[];
  getBodyPositions(names: string[]): Record<string, [number, number, number]>;
  getSitePositions(names: string[]): Record<string, [number, number, number]>;
  getSiteOrientations(names: string[]): Record<string, number[]>;
  getBodyOrientations(names: string[]): Record<string, [number, number, number, number]>;
  getJointPositions(names: string[]): Record<string, number>;
  getContacts(): Array<Record<string, unknown>>;
}

export interface Assembly1PoseSnapshotOptions {
  label: string;
  selectedControlTarget: string;
  capturedAt?: string;
}

export interface Assembly1PoseSnapshot {
  schemaVersion: 'franka-assembly1-manual-pose-v1';
  scene: 'frankaAssembly1';
  label: string;
  capturedAt: string;
  selectedControlTarget: string;
  controls: { ctrl: number[]; qpos: number[]; qvel: number[] };
  tcpPositions: Record<string, [number, number, number]>;
  tcpOrientations: Record<string, number[]>;
  gripperJointPositions: Record<string, number>;
  bodyPositions: Record<string, [number, number, number]>;
  bodyOrientations: Record<string, [number, number, number, number]>;
  contacts: Array<Record<string, unknown>>;
}

export const ASSEMBLY1_TCP_SITES: string[];
export const ASSEMBLY1_CAPTURE_BODIES: string[];
export const ASSEMBLY1_GRIPPER_JOINTS: string[];
export function sanitizePoseLabel(value: unknown): string;
export function createAssembly1PoseSnapshot(
  robotDemo: ManualPoseRobotDiagnostics,
  options: Assembly1PoseSnapshotOptions,
): Assembly1PoseSnapshot;
export function createManualPoseDownload(snapshot: Assembly1PoseSnapshot): {
  filename: string;
  mimeType: 'application/json';
  contents: string;
};
