import type { SceneObject } from 'mujoco-react';

import type { SceneLayout } from './sceneLayouts.js';

export const SO101_GEARBOX_LAYOUT: SceneLayout & {
  ringRadius: number;
  workSurfaceHeight: number;
  primaryTcpSite: string;
  taskStations: {
    fixture: [number, number, number];
    housing: [number, number, number];
    shaftsAndSpacers: [number, number, number];
    gears: [number, number, number];
    coverAndPins: [number, number, number];
  };
  reachEnvelope: {
    baseRadius: number;
    nominalChainReach: number;
    nearestStationDistance: number;
    homeTcpRadius: number;
  };
};

export const SO101_HOME_LAB_LAYOUT: typeof SO101_GEARBOX_LAYOUT & {
  roomBounds: {
    halfWidth: number;
    halfDepth: number;
    wallHeight: number;
    openSide: 'south';
  };
  protectedWorkcellRadius: number;
  workcellCenter: [number, number];
  roomZones: {
    lounge: [number, number];
    office: [number, number];
    g1: [number, number];
    go2Arm: [number, number];
  };
  mobileRobots: {
    g1: { rootBody: string; controlled: true };
    go2Arm: { rootBody: string; controlled: true };
  };
};

export const XLEROBOT_KITTING_LAYOUT: SceneLayout & {
  spacing: number;
  armBaseHeight: number;
  tableTopHeight: number;
  chassisCollisionTop: number;
  tableObjects: SceneObject[];
  taskStations: {
    sourceTote: [number, number, number];
    handoffSouth: [number, number, number];
    handoffNorth: [number, number, number];
    scannerDock: [number, number, number];
    orderTray: [number, number, number];
  };
  reachEnvelope: {
    chassisTableClearance: number;
    inwardArmBaseToCenter: number;
    nominalArmReach: number;
  };
  navigationClearances: {
    north: number;
    south: number;
    west: number;
  };
};
