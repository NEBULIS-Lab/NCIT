import { announce, useDemoLanguage } from './embed';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { OrbitControls, Html, Stats, Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Leva, useControls, button } from 'leva';
import {
  MujocoProvider,
  MujocoCanvas,
  IkGizmo,
  DragInteraction,
  ContactMarkers,
  Debug,
  useSelectionHighlight,
  useMujoco,
  useGravityCompensation,
  findBodyByName,
  findJointByName,
  findSiteByName,
} from 'mujoco-react';
import type { MujocoData, MujocoModel, MujocoSimAPI } from 'mujoco-react';
import { consumeMujocoContacts } from './mujocoContact.js';
import { robots } from './configs';
import type { ControlTarget } from './controlTargets.js';
import { FrankaController } from './controllers/FrankaController';
import { IndustrialArmController } from './controllers/IndustrialArmController';
import { SO101Controller } from './controllers/SO101Controller';
import { XLeRobotController } from './controllers/XLeRobotController';
import { PlanarMobileController } from './controllers/PlanarMobileController';
import { useSelectedIkController } from './controllers/useSelectedIkController';
import { useClickSelect } from './useClickSelect';
import { KeyboardHelp } from './KeyboardHelp';
import { GitHubLink } from './GitHubLink';
import { AssemblyStep1Controller } from './AssemblyStep1Controller';
import { EggTransferController } from './EggTransferController';
import { EggSortingController } from './EggSortingController';
import { EggSortingPanel } from './EggSortingPanel';
import type { SortingState } from './eggSorting.js';
import { sortingLocksControls } from './eggSorting.js';
import type { EggTransferState } from './eggTransfer.js';
import { AssemblyStep2Controller } from './AssemblyStep2Controller';
import { AssemblyStep3Controller } from './AssemblyStep3Controller';
import { AssemblyStep4Controller } from './AssemblyStep4Controller';
import { AssemblySequencePanel } from './AssemblySequencePanel';
import { Assembly1PoseCapturePanel } from './Assembly1PoseCapturePanel';
import { FrankaDemo1Panel } from './FrankaDemo1Panel';
import { AssemblyPresentation } from './AssemblyPresentation';
import { AssemblyCameras } from './AssemblyCameras';
import { AssemblyCameraPanel } from './AssemblyCameraPanel';
import { frankaDemo1DisplayAction, nextFrankaDemo1Action } from './frankaDemo1.js';
import type { FrankaDemo1Action } from './frankaDemo1.js';
import { FrankaAssembly2DataRecorderPanel } from './FrankaAssembly2DataRecorderPanel';
import type { AssemblyStep1Status } from './assemblyStep1.js';
import { ASSEMBLY1_STEP2_ARMS } from './assemblyStep2.js';
import type {
  AssemblyStep1CompletionSnapshot,
  AssemblyStep2RuntimeDiagnostics,
  AssemblyStep2State,
} from './assemblyStep2.js';
import type {
  AssemblyStep3RuntimeDiagnostics,
  AssemblyStep3State,
} from './assemblyStep3.js';
import type {
  AssemblyStep4RuntimeDiagnostics,
  AssemblyStep4State,
} from './assemblyStep4.js';
import { UnitreeActionController } from './UnitreeActionController';
import { UnitreeActionPanel } from './UnitreeActionPanel';
import {
  createInitialUnitreeActionState,
  pauseAction,
  resetAction,
  resumeAction,
  selectActionProgram,
  startAction,
} from './unitreeActionState.js';
import type { UnitreeActionState } from './unitreeActionState.js';
import type { UnitreeActionProgramId } from './unitreeActionSequence.js';
import type { UnitreeRuntimeDiagnostics } from './unitreeDynamicsAdapter.js';

function LoadingOverlay() {
  const language=useDemoLanguage();
  const sim = useMujoco();
  if (sim.isReady) return null;
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        color: sim.isError ? '#f87171' : '#94a3b8',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {sim.isError ? (
          <span style={{ fontSize: 14 }}>{sim.error}</span>
        ) : (
          <>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #334155',
              borderTop: '3px solid #38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 14 }}>{language==='zh'?'正在加载模型…':'Loading model…'}</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </>
        )}
      </div>
    </Html>
  );
}

/** Composable gravity compensation — uses the hook. */
function GravityCompensation({ enabled }: { enabled: boolean }) {
  useGravityCompensation(enabled);
  return null;
}

/** Composable click-to-select — uses hooks. */
function ClickSelectOverlay() {
  const selectedBodyId = useClickSelect();
  useSelectionHighlight(selectedBodyId);
  return null;
}

function modelName(model: MujocoModel, address: number) {
  let name = '';
  for (let index = address; model.names[index] !== 0; index += 1) {
    name += String.fromCharCode(model.names[index]);
  }
  return name;
}

function captureAssemblyStep1Snapshot(
  model: MujocoModel,
  data: MujocoData,
): AssemblyStep1CompletionSnapshot {
  const objectPoses = Object.fromEntries(
    ['assembly_frame', 'double_face_hammer', 'cross_member'].map((name) => {
      const bodyId = findBodyByName(model, name);
      if (bodyId < 0) throw new Error(`Could not capture Assembly1 body: ${name}`);
      const positionOffset = bodyId * 3;
      const quaternionOffset = bodyId * 4;
      return [name, {
        position: [
          data.xpos[positionOffset],
          data.xpos[positionOffset + 1],
          data.xpos[positionOffset + 2],
        ],
        quaternion: [
          data.xquat[quaternionOffset],
          data.xquat[quaternionOffset + 1],
          data.xquat[quaternionOffset + 2],
          data.xquat[quaternionOffset + 3],
        ],
      }];
    }),
  ) as AssemblyStep1CompletionSnapshot['objectPoses'];
  const tcpPositions = Object.fromEntries(ASSEMBLY1_STEP2_ARMS.map((arm) => {
    const siteId = findSiteByName(model, arm.siteName);
    if (siteId < 0) throw new Error(`Could not capture Assembly1 site: ${arm.siteName}`);
    const offset = siteId * 3;
    return [arm.siteName, [
      data.site_xpos[offset],
      data.site_xpos[offset + 1],
      data.site_xpos[offset + 2],
    ]];
  })) as AssemblyStep1CompletionSnapshot['tcpPositions'];
  const tcpOrientations = Object.fromEntries(ASSEMBLY1_STEP2_ARMS.map((arm) => {
    const siteId = findSiteByName(model, arm.siteName);
    const offset = siteId * 9;
    return [arm.siteName, Array.from(data.site_xmat.slice(offset, offset + 9))];
  }));
  return {
    tcpPositions,
    tcpOrientations,
    objectPoses,
    gripperControls: ASSEMBLY1_STEP2_ARMS.map(
      (arm) => data.ctrl[arm.gripperActuatorIndex],
    ) as [number, number, number, number],
  };
}

/** Selection-aware IK and keyboard controllers for the active physical instance. */
function SceneChildren({
  robotKey,
  controlFamily,
  target,
  resetGeneration,
  showGizmo,
  gizmoScale,
  assemblyStep1RequestId,
  assemblyStep1Status,
  assemblyStep2RequestId,
  assemblyStep2State,
  assemblyStep3RequestId,
  assemblyStep3State,
  assemblyStep4RequestId,
  assemblyStep4State,
  manualPoseMode,
  assemblyOwnershipRef,
  step1SnapshotRef,
  step2DiagnosticsRef,
  step3DiagnosticsRef,
  step4DiagnosticsRef,
  onAssemblyStep1StatusChange,
  onAssemblyStep2StateChange,
  onAssemblyStep3StateChange,
  onAssemblyStep4StateChange,
  onRunAssemblyStep1,
  onRunAssemblyStep2,
  onRunAssemblyStep3,
  onRunAssemblyStep4,
  onResetAssemblySequence,
  unitreeActionStateRef,
  unitreeActionDiagnosticsRef,
  onRunUnitreeAction,
  onPauseUnitreeAction,
  onResumeUnitreeAction,
  onSelectUnitreeActionProgram,
  eggRequestId,
  eggProgram,
  onEggReseatReady,
  eggLocked,
  onEggStateChange,
  sortingRequestId,
  onSortingStateChange,
}: {
  robotKey: string;
  controlFamily: 'franka' | 'industrialArm' | 'so101' | 'xlerobot' | 'unitreeAction';
  target: ControlTarget;
  resetGeneration: number;
  showGizmo: boolean;
  gizmoScale?: number;
  assemblyStep1RequestId: number;
  assemblyStep1Status: AssemblyStep1Status;
  assemblyStep2RequestId: number;
  assemblyStep2State: AssemblyStep2State;
  assemblyStep3RequestId: number;
  assemblyStep3State: AssemblyStep3State;
  assemblyStep4RequestId: number;
  assemblyStep4State: AssemblyStep4State;
  manualPoseMode: boolean;
  assemblyOwnershipRef: React.MutableRefObject<'manual' | 'step1' | 'step2' | 'step3' | 'step4'>;
  step1SnapshotRef: React.MutableRefObject<AssemblyStep1CompletionSnapshot | null>;
  step2DiagnosticsRef: React.MutableRefObject<AssemblyStep2RuntimeDiagnostics | null>;
  step3DiagnosticsRef: React.MutableRefObject<AssemblyStep3RuntimeDiagnostics | null>;
  step4DiagnosticsRef: React.MutableRefObject<AssemblyStep4RuntimeDiagnostics | null>;
  onAssemblyStep1StatusChange: (status: AssemblyStep1Status) => void;
  onAssemblyStep2StateChange: (state: AssemblyStep2State) => void;
  onAssemblyStep3StateChange: (state: AssemblyStep3State) => void;
  onAssemblyStep4StateChange: (state: AssemblyStep4State) => void;
  onRunAssemblyStep1: () => boolean;
  onRunAssemblyStep2: () => boolean;
  onRunAssemblyStep3: () => boolean;
  onRunAssemblyStep4: () => boolean;
  onResetAssemblySequence: () => void;
  unitreeActionStateRef: React.MutableRefObject<UnitreeActionState>;
  unitreeActionDiagnosticsRef: React.MutableRefObject<UnitreeRuntimeDiagnostics | null>;
  onRunUnitreeAction: () => boolean;
  onPauseUnitreeAction: () => boolean;
  onResumeUnitreeAction: () => boolean;
  onSelectUnitreeActionProgram: (programId: UnitreeActionProgramId) => boolean;
  eggRequestId:number;
  eggProgram:'transfer'|'reseat';
  onEggReseatReady:(ready:boolean)=>void;
  eggLocked:boolean;
  onEggStateChange:(state:EggTransferState)=>void;
  sortingRequestId:number;
  onSortingStateChange:(state:SortingState)=>void;
}) {
  const simulation = useMujoco();
  const { camera, controls: viewControls } = useThree();
  const isAssembly1Scene = robotKey === 'frankaAssembly1' || robotKey === 'frankaDemo1';
  const assemblyAutomationActive = assemblyStep1Status === 'planning'
    || assemblyStep1Status === 'running'
    || assemblyStep2State.phase !== 'idle'
    || assemblyStep3State.phase !== 'idle'
    || assemblyStep4State.phase !== 'idle';
  const assemblyControlsLocked = (assemblyAutomationActive && !manualPoseMode) || eggLocked;
  const { controller: ik, resolvedSiteName } = useSelectedIkController(
    target,
    resetGeneration,
    assemblyControlsLocked,
  );

  useEffect(() => {
    document.documentElement.dataset.controlTarget = target.key;
    if (resolvedSiteName) {
      document.documentElement.dataset.ikSite = resolvedSiteName;
    } else {
      delete document.documentElement.dataset.ikSite;
    }
  }, [target.key, resolvedSiteName]);

  useEffect(() => {
    if (simulation.status !== 'ready') return;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return;
    const collectPositions = (
      names: string[],
      findId: (name: string) => number,
      positions: Float64Array,
    ) => Object.fromEntries(names.map((name) => {
      const id = findId(name);
      if (id < 0) throw new Error(`Could not resolve diagnostic position: ${name}`);
      const offset = id * 3;
      return [name, [positions[offset], positions[offset + 1], positions[offset + 2]]];
    })) as Record<string, [number, number, number]>;
    const diagnostics = {
      getPhysicsDiagnostics() {
        const warnings=data.warning as {size():number;get(index:number):{number:number;lastinfo:number;delete():void}|undefined;delete():void};
        const counts=[];
        try {for(let i=0;i<warnings.size();i++) {const warning=warnings.get(i);if(!warning)continue;try {counts.push({index:i,count:warning.number,lastInfo:warning.lastinfo});}finally {warning.delete();}}}finally {warnings.delete();}
        return {contacts:data.ncon,constraints:Number(data.nefc),arenaBytes:Number(data.narena),peakArenaBytes:Number(data.maxuse_arena),warnings:counts};
      },
      setInspectionCamera(position: [number,number,number], target: [number,number,number]) {
        camera.position.set(...position);
        camera.lookAt(...target);
        const orbit = viewControls as unknown as { target?: { set(x:number,y:number,z:number):void }; update?():void } | null;
        orbit?.target?.set(...target);
        orbit?.update?.();
      },
      getCtrl: () => Array.from(simulation.api.getCtrl()),
      getQpos: () => Array.from(simulation.api.getQpos()),
      getQvel: () => Array.from(data.qvel),
      getBodyPositions: (names: string[]) => collectPositions(
        names,
        (name) => findBodyByName(model, name),
        data.xpos,
      ),
      getSitePositions: (names: string[]) => collectPositions(
        names,
        (name) => findSiteByName(model, name),
        data.site_xpos,
      ),
      getSiteOrientations: (names: string[]) => Object.fromEntries(names.map((name) => {
        const id = findSiteByName(model, name);
        if (id < 0) throw new Error(`Could not resolve diagnostic orientation: ${name}`);
        const offset = id * 9;
        return [name, Array.from(data.site_xmat.slice(offset, offset + 9))];
      })),
      getBodyOrientations: (names: string[]) => Object.fromEntries(names.map((name) => {
        const id = findBodyByName(model, name);
        if (id < 0) throw new Error(`Could not resolve diagnostic body: ${name}`);
        const offset = id * 4;
        return [name, [
          data.xquat[offset],
          data.xquat[offset + 1],
          data.xquat[offset + 2],
          data.xquat[offset + 3],
        ] as [number, number, number, number]];
      })) as Record<string, [number, number, number, number]>,
      getJointPositions: (names: string[]) => Object.fromEntries(names.map((name) => {
        const id = findJointByName(model, name);
        if (id < 0) throw new Error(`Could not resolve diagnostic joint: ${name}`);
        return [name, data.qpos[model.jnt_qposadr[id]]];
      })),
      getContacts: () => consumeMujocoContacts(data.contact, data.ncon).map((contact) => {
        const body1 = model.geom_bodyid[contact.geom1];
        const body2 = model.geom_bodyid[contact.geom2];
        return {
          geom1: contact.geom1,
          geom2: contact.geom2,
          geomName1: modelName(model, model.name_geomadr[contact.geom1]),
          geomName2: modelName(model, model.name_geomadr[contact.geom2]),
          distance: contact.distance,
          body1: modelName(model, model.name_bodyadr[body1]),
          body2: modelName(model, model.name_bodyadr[body2]),
        };
      }),
      reset: onResetAssemblySequence,
      moveIkTargetBy: (x: number, y: number, z: number) => {
        if (!ik) return false;
        ik.syncTargetToSite();
        const nextTarget = ik.ikTargetRef.current.position.clone();
        nextTarget.x += x;
        nextTarget.y += y;
        nextTarget.z += z;
        ik.moveTarget(nextTarget);
        return true;
      },
      runAssemblyStep1: onRunAssemblyStep1,
      runAssemblyStep2: onRunAssemblyStep2,
      runAssemblyStep3: onRunAssemblyStep3,
      runAssemblyStep4: onRunAssemblyStep4,
      getAssemblyStep2Diagnostics: () => step2DiagnosticsRef.current,
      getAssemblyStep3Diagnostics: () => step3DiagnosticsRef.current,
      getAssemblyStep4Diagnostics: () => step4DiagnosticsRef.current,
      runUnitreeAction: onRunUnitreeAction,
      pauseUnitreeAction: onPauseUnitreeAction,
      resumeUnitreeAction: onResumeUnitreeAction,
      selectUnitreeActionProgram: onSelectUnitreeActionProgram,
      getUnitreeActionState: () => ({ ...unitreeActionStateRef.current }),
      getUnitreeActionDiagnostics: () => unitreeActionDiagnosticsRef.current,
    };
    window.robotDemo = diagnostics;
    return () => {
      if (window.robotDemo === diagnostics) delete window.robotDemo;
    };
  }, [
    simulation,
    camera,
    viewControls,
    ik,
    target.key,
    onResetAssemblySequence,
    onRunAssemblyStep1,
    onRunAssemblyStep2,
    onRunAssemblyStep3,
    onRunAssemblyStep4,
    step2DiagnosticsRef,
    step3DiagnosticsRef,
    step4DiagnosticsRef,
    onRunUnitreeAction,
    onPauseUnitreeAction,
    onResumeUnitreeAction,
    onSelectUnitreeActionProgram,
    unitreeActionStateRef,
    unitreeActionDiagnosticsRef,
  ]);

  return (
    <>
      {robotKey === 'frankaDemo2' && <EggTransferController requestId={eggRequestId} program={eggProgram} resetGeneration={resetGeneration} onStateChange={onEggStateChange} onReseatReady={onEggReseatReady} />}
      {robotKey === 'frankaDemo2' && <EggSortingController requestId={sortingRequestId} resetGeneration={resetGeneration} onStateChange={onSortingStateChange} />}
      {ik && showGizmo && !assemblyControlsLocked && (
        <group userData={{sensorOverlay:true}}>
        <IkGizmo
          key={`gizmo-${target.key}`}
          controller={ik}
          siteName={target.ik?.siteName}
          scale={gizmoScale}
        />
        </group>
      )}

      {controlFamily === 'franka' && (
        <FrankaController
          key={`franka-${target.key}-${assemblyStep1Status === 'complete' ? 'open' : 'closed'}-${robotKey === 'frankaDemo2' ? resetGeneration : ''}`}
          target={target}
          enabled={!assemblyControlsLocked}
          initiallyOpen={assemblyStep1Status === 'complete' || robotKey === 'frankaDemo2'}
        />
      )}
      {controlFamily === 'industrialArm' && (
        <IndustrialArmController
          key={`industrial-${target.key}`}
          target={target}
          enabled={!assemblyControlsLocked}
        />
      )}
      {target.controlMode === 'planar-mobile' && (
        <PlanarMobileController key={`mobile-${target.key}`} target={target} />
      )}
      {controlFamily === 'so101' && target.controlMode !== 'planar-mobile' && (
        <SO101Controller key={`so101-${target.key}`} target={target} ik={ik} />
      )}
      {controlFamily === 'xlerobot' && (
        <XLeRobotController key={`xlerobot-${target.key}`} target={target} ik={ik} />
      )}
      {isAssembly1Scene && (
        <AssemblyStep1Controller
          requestId={assemblyStep1RequestId}
          resetGeneration={resetGeneration}
          ownershipRef={assemblyOwnershipRef}
          onStatusChange={onAssemblyStep1StatusChange}
          onMotionComplete={(model, data) => {
            step1SnapshotRef.current = captureAssemblyStep1Snapshot(model, data);
            ik?.syncTargetToSite();
            ik?.setIkEnabled(false);
          }}
        />
      )}
      {isAssembly1Scene && (
        <AssemblyStep2Controller
          requestId={assemblyStep2RequestId}
          resetGeneration={resetGeneration}
          step1Complete={assemblyStep1Status === 'complete'}
          step1SnapshotRef={step1SnapshotRef}
          ownershipRef={assemblyOwnershipRef}
          diagnosticsRef={step2DiagnosticsRef}
          onStateChange={onAssemblyStep2StateChange}
        />
      )}
      {isAssembly1Scene && (
        <AssemblyStep3Controller
          requestId={assemblyStep3RequestId}
          resetGeneration={resetGeneration}
          step2Complete={assemblyStep2State.phase === 'complete'}
          ownershipRef={assemblyOwnershipRef}
          diagnosticsRef={step3DiagnosticsRef}
          onStateChange={onAssemblyStep3StateChange}
        />
      )}
      {isAssembly1Scene && (
        <AssemblyStep4Controller
          requestId={assemblyStep4RequestId}
          resetGeneration={resetGeneration}
          step3Complete={assemblyStep3State.phase === 'complete'}
          ownershipRef={assemblyOwnershipRef}
          diagnosticsRef={step4DiagnosticsRef}
          onStateChange={onAssemblyStep4StateChange}
        />
      )}
      {robotKey === 'frankaAssembly2' && (
        <FrankaAssembly2DataRecorderPanel
          targets={robots[robotKey].controlTargets}
          activeTarget={target}
          resetGeneration={resetGeneration}
        />
      )}
    </>
  );
}

const robotOptions = Object.fromEntries(
  Object.entries(robots).map(([key, r]) => [r.label, key])
);

const replicatedRootPatterns: Record<string, RegExp> = {
  franka: /^r\d+_link0$/,
  frankaDemo1: /^r\d+_link0$/,
  frankaDemo2: /^r\d+_link0$/,
  frankaAssembly1: /^r\d+_link0$/,
  frankaAssembly2: /^r\d+_link0$/,
  piperAssembly1: /^r\d+_base_link$/,
  ur5eAssembly1: /^r\d+_base$/,
  so101: /^r\d+_Base$/,
  so101Gearbox: /^r\d+_Base$/,
  so101HomeLab: /^r\d+_Base$/,
  xlerobot: /^r\d+_chassis$/,
  xlerobotKitting: /^r\d+_chassis$/,
  unitreeActionLab: /^(g1_pelvis|go2_base)$/,
};

export function App() {
  const apiRef = useRef<MujocoSimAPI>(null);
  const [resetGeneration, setResetGeneration] = useState(0);
  const [eggRequestId,setEggRequestId]=useState(0);
  const [eggProgram,setEggProgram]=useState<'transfer'|'reseat'>('transfer');
  const [eggReseatReady,setEggReseatReady]=useState(false);
  const [sortingRequestId,setSortingRequestId]=useState(0);
  const [sortingState,setSortingState]=useState<SortingState>({phase:'loading',label:'Loading four-arm motion',counts:[0,0,0,0],arms:Array(4).fill('Ready')});
  const [eggState,setEggState]=useState<EggTransferState>({phase:'loading',label:'Loading checked motion',phaseIndex:0});
  const [assemblyStep1RequestId, setAssemblyStep1RequestId] = useState(0);
  const [assemblyStep1Status, setAssemblyStep1Status] = useState<AssemblyStep1Status>('idle');
  const [assemblyStep2RequestId, setAssemblyStep2RequestId] = useState(0);
  const [assemblyStep2State, setAssemblyStep2State] = useState<AssemblyStep2State>({
    phase: 'idle',
    failure: null,
  });
  const [assemblyStep3RequestId, setAssemblyStep3RequestId] = useState(0);
  const [assemblyStep3State, setAssemblyStep3State] = useState<AssemblyStep3State>({
    phase: 'idle',
    failure: null,
  });
  const [assemblyStep4RequestId, setAssemblyStep4RequestId] = useState(0);
  const [assemblyStep4State, setAssemblyStep4State] = useState<AssemblyStep4State>({
    phase: 'idle',
    failure: null,
  });
  const [unitreeActionState, setUnitreeActionState] = useState<UnitreeActionState>(
    createInitialUnitreeActionState,
  );
  const [unitreeActionRequestId, setUnitreeActionRequestId] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [manualPoseMode, setManualPoseMode] = useState(false);
  const [frankaDemo1Active, setFrankaDemo1Active] = useState(false);
  const [embedPaused,setEmbedPaused]=useState(false);
  const [pageHidden,setPageHidden]=useState(document.hidden);
  const [offscreen,setOffscreen]=useState(false);
  useEffect(()=>{
    const visibility=()=>setPageHidden(document.hidden);
    const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='ncit-demo-visibility')setOffscreen(!event.data.visible)};
    document.addEventListener('visibilitychange',visibility);addEventListener('message',receive);
    return()=>{document.removeEventListener('visibilitychange',visibility);removeEventListener('message',receive)};
  },[]);
  const assemblyOwnershipRef = useRef<'manual' | 'step1' | 'step2' | 'step3' | 'step4'>('manual');
  const step1SnapshotRef = useRef<AssemblyStep1CompletionSnapshot | null>(null);
  const step2DiagnosticsRef = useRef<AssemblyStep2RuntimeDiagnostics | null>(null);
  const step3DiagnosticsRef = useRef<AssemblyStep3RuntimeDiagnostics | null>(null);
  const step4DiagnosticsRef = useRef<AssemblyStep4RuntimeDiagnostics | null>(null);
  const unitreeActionStateRef = useRef(unitreeActionState);
  const unitreeActionDiagnosticsRef = useRef<UnitreeRuntimeDiagnostics | null>(null);
  unitreeActionStateRef.current = unitreeActionState;
  const performanceStatsRef = useRef<HTMLDivElement>(null!);
  // Drei's Stats type omits the null state that every DOM ref has before mount.
  const performanceStatsParentRef = performanceStatsRef as unknown as RefObject<HTMLElement>;

  const [robotControlValues, setRobotControl] = useControls(() => ({
    robot: { value: 'frankaDemo1', options: robotOptions, label: 'Robot' },
  }));
  const robotKey = robotControlValues.robot;

  const entry = robots[robotKey];
  const controlTargetOptions = useMemo(
    () => Object.fromEntries(entry.controlTargets.map((target) => [target.label, target.key])),
    [entry],
  );
  const controlTargetControlKey = `controlTarget_${robotKey}`;
  const controlTargetValues = useControls({
    [controlTargetControlKey]: {
      value: entry.controlTargets[0].key,
      options: controlTargetOptions,
      label: 'Control target',
    },
  }, [robotKey]) as unknown as Record<string, string>;
  const controlTargetKey = controlTargetValues[controlTargetControlKey];
  const controlTarget = entry.controlTargets.find(({ key }) => key === controlTargetKey)
    ?? entry.controlTargets[0];
  const assemblyAutomationActive = assemblyStep1Status === 'planning'
    || assemblyStep1Status === 'running'
    || assemblyStep2State.phase !== 'idle'
    || assemblyStep3State.phase !== 'idle'
    || assemblyStep4State.phase !== 'idle';
  const assemblyControlsLocked = assemblyAutomationActive && !manualPoseMode;
  const isUnitreeActionScene = robotKey === 'unitreeActionLab';
  const isAssembly1Scene = robotKey === 'frankaAssembly1' || robotKey === 'frankaDemo1';
  const isFrankaDemo1 = robotKey === 'frankaDemo1';
  const sortingLocked=sortingLocksControls(sortingState);
  const eggLocked = robotKey === 'frankaDemo2' && (eggState.phase === 'running' || eggState.phase === 'error' || sortingLocked);

  const handleRunAssemblyStep1 = useCallback(() => {
    if (!isAssembly1Scene || assemblyStep1Status !== 'idle') return false;
    setManualPoseMode(false);
    setAssemblyStep1Status('planning');
    setAssemblyStep1RequestId((requestId) => requestId + 1);
    return true;
  }, [assemblyStep1Status, isAssembly1Scene]);

  const handleRunAssemblyStep2 = useCallback(() => {
    if (
      !isAssembly1Scene
      || assemblyStep1Status !== 'complete'
      || assemblyStep2State.phase !== 'idle'
      || !step1SnapshotRef.current
    ) return false;
    setManualPoseMode(false);
    setAssemblyStep2State({ phase: 'planning', failure: null });
    setAssemblyStep2RequestId((requestId) => requestId + 1);
    return true;
  }, [assemblyStep1Status, assemblyStep2State.phase, isAssembly1Scene]);

  const handleRunAssemblyStep3 = useCallback(() => {
    if (
      !isAssembly1Scene
      || assemblyStep2State.phase !== 'complete'
      || assemblyStep3State.phase !== 'idle'
    ) return false;
    setManualPoseMode(false);
    setAssemblyStep3State({ phase: 'planning', failure: null });
    setAssemblyStep3RequestId((requestId) => requestId + 1);
    return true;
  }, [assemblyStep2State.phase, assemblyStep3State.phase, isAssembly1Scene]);

  const handleRunAssemblyStep4 = useCallback(() => {
    if (
      !isAssembly1Scene
      || assemblyStep3State.phase !== 'complete'
      || assemblyStep4State.phase !== 'idle'
    ) return false;
    setManualPoseMode(false);
    setAssemblyStep4State({ phase: 'planning', failure: null });
    setAssemblyStep4RequestId((requestId) => requestId + 1);
    return true;
  }, [assemblyStep3State.phase, assemblyStep4State.phase, isAssembly1Scene]);

  const handleResetAssemblySequence = useCallback(() => {
    apiRef.current?.reset();
    setEmbedPaused(false);
    setFrankaDemo1Active(false);
    assemblyOwnershipRef.current = 'manual';
    setManualPoseMode(false);
    step1SnapshotRef.current = null;
    step2DiagnosticsRef.current = null;
    step3DiagnosticsRef.current = null;
    step4DiagnosticsRef.current = null;
    setAssemblyStep1Status('idle');
    setAssemblyStep2State({ phase: 'idle', failure: null });
    setAssemblyStep3State({ phase: 'idle', failure: null });
    setAssemblyStep4State({ phase: 'idle', failure: null });
    setUnitreeActionState(resetAction());
    unitreeActionDiagnosticsRef.current = null;
    setResetGeneration((generation) => generation + 1);
  }, []);

  const frankaDemo1SequenceState = {
    active: frankaDemo1Active && isFrankaDemo1,
    sceneReady,
    step1: assemblyStep1Status,
    step2: assemblyStep2State.phase,
    step3: assemblyStep3State.phase,
    step4: assemblyStep4State.phase,
  };
  const frankaDemo1Action = nextFrankaDemo1Action(
    frankaDemo1SequenceState,
  ) as FrankaDemo1Action | null;
  const frankaDemo1Display = frankaDemo1DisplayAction(
    frankaDemo1SequenceState,
  ) as FrankaDemo1Action | null;

  useEffect(() => {
    if (!isFrankaDemo1 || !frankaDemo1Active) return;
    if (frankaDemo1Action === 'step1') handleRunAssemblyStep1();
    else if (frankaDemo1Action === 'step2') handleRunAssemblyStep2();
    else if (frankaDemo1Action === 'step3') handleRunAssemblyStep3();
    else if (frankaDemo1Action === 'step4') handleRunAssemblyStep4();
  }, [
    frankaDemo1Action,
    frankaDemo1Active,
    handleRunAssemblyStep1,
    handleRunAssemblyStep2,
    handleRunAssemblyStep3,
    handleRunAssemblyStep4,
    isFrankaDemo1,
  ]);

  const handleManualPoseModeChange = useCallback((enabled: boolean) => {
    assemblyOwnershipRef.current = 'manual';
    setManualPoseMode(enabled);
  }, []);

  const handleRunUnitreeAction = useCallback(() => {
    if (
      robotKey !== 'unitreeActionLab'
      || (unitreeActionStateRef.current.status !== 'idle'
        && unitreeActionStateRef.current.status !== 'complete')
    ) return false;
    if (unitreeActionStateRef.current.status === 'complete') {
      apiRef.current?.reset();
    setEmbedPaused(false);
      setResetGeneration((generation) => generation + 1);
    }
    setUnitreeActionState(startAction(unitreeActionStateRef.current));
    setUnitreeActionRequestId((requestId) => requestId + 1);
    return true;
  }, [robotKey]);

  const handlePauseUnitreeAction = useCallback(() => {
    if (robotKey !== 'unitreeActionLab' || unitreeActionStateRef.current.status !== 'running') return false;
    setUnitreeActionState(pauseAction(unitreeActionStateRef.current));
    return true;
  }, [robotKey]);

  const handleResumeUnitreeAction = useCallback(() => {
    if (robotKey !== 'unitreeActionLab' || unitreeActionStateRef.current.status !== 'paused') return false;
    setUnitreeActionState(resumeAction(unitreeActionStateRef.current));
    return true;
  }, [robotKey]);

  const handleSelectUnitreeActionProgram = useCallback((programId: UnitreeActionProgramId) => {
    if (
      robotKey !== 'unitreeActionLab'
      || unitreeActionStateRef.current.status === 'running'
      || unitreeActionStateRef.current.status === 'paused'
    ) return false;
    apiRef.current?.reset();
    setEmbedPaused(false);
    unitreeActionDiagnosticsRef.current = null;
    setResetGeneration((generation) => generation + 1);
    setUnitreeActionState(selectActionProgram(unitreeActionStateRef.current, programId));
    return true;
  }, [robotKey]);

  const handleRestartUnitreeAction = useCallback(() => {
    if (robotKey !== 'unitreeActionLab') return false;
    apiRef.current?.reset();
    setEmbedPaused(false);
    setResetGeneration((generation) => generation + 1);
    setUnitreeActionState(startAction(resetAction(unitreeActionStateRef.current)));
    setUnitreeActionRequestId((requestId) => requestId + 1);
    return true;
  }, [robotKey]);

  useEffect(() => {
    document.documentElement.dataset.sceneStatus = 'loading';
    document.documentElement.dataset.sceneKey = robotKey;
    delete document.documentElement.dataset.sceneBodies;
    delete document.documentElement.dataset.sceneInstances;
    delete document.documentElement.dataset.sceneError;
    delete document.documentElement.dataset.controlTarget;
    delete document.documentElement.dataset.ikSite;
    delete document.documentElement.dataset.assemblyStep4Status;
    delete document.documentElement.dataset.unitreeActionStatus;
    delete document.documentElement.dataset.unitreeActionPhase;
    delete document.documentElement.dataset.unitreeActionProgram;
    setSceneReady(false);
    setManualPoseMode(false);
    setFrankaDemo1Active(false);
    assemblyOwnershipRef.current = 'manual';
    step1SnapshotRef.current = null;
    step2DiagnosticsRef.current = null;
    step3DiagnosticsRef.current = null;
    step4DiagnosticsRef.current = null;
    setAssemblyStep1Status('idle');
    setAssemblyStep2State({ phase: 'idle', failure: null });
    setAssemblyStep3State({ phase: 'idle', failure: null });
    setAssemblyStep4State({ phase: 'idle', failure: null });
    setUnitreeActionState(resetAction());
    unitreeActionDiagnosticsRef.current = null;
  }, [robotKey]);

  useEffect(() => {
    if (robotKey !== 'unitreeActionLab') return;
    document.documentElement.dataset.unitreeActionStatus = unitreeActionState.status;
    document.documentElement.dataset.unitreeActionPhase = unitreeActionState.phase;
    document.documentElement.dataset.unitreeActionProgram = unitreeActionState.programId;
  }, [robotKey, unitreeActionState.phase, unitreeActionState.programId, unitreeActionState.status]);

  useEffect(() => {
    if (isAssembly1Scene) {
      document.documentElement.dataset.assemblyStep1Status = assemblyStep1Status;
    } else {
      delete document.documentElement.dataset.assemblyStep1Status;
    }
  }, [assemblyStep1Status, isAssembly1Scene]);

  useEffect(() => {
    if (isAssembly1Scene) {
      document.documentElement.dataset.assemblyStep2Status = assemblyStep2State.phase;
    } else {
      delete document.documentElement.dataset.assemblyStep2Status;
    }
  }, [assemblyStep2State.phase, isAssembly1Scene]);

  useEffect(() => {
    if (isAssembly1Scene) {
      document.documentElement.dataset.assemblyStep3Status = assemblyStep3State.phase;
    } else {
      delete document.documentElement.dataset.assemblyStep3Status;
    }
  }, [assemblyStep3State.phase, isAssembly1Scene]);

  useEffect(() => {
    if (isAssembly1Scene) {
      document.documentElement.dataset.assemblyStep4Status = assemblyStep4State.phase;
    } else {
      delete document.documentElement.dataset.assemblyStep4Status;
    }
  }, [assemblyStep4State.phase, isAssembly1Scene]);

  const handleSceneReady = useCallback((api: MujocoSimAPI) => {
    const bodies = api.getBodies();
    const instanceCount = bodies.filter(({ name }) => replicatedRootPatterns[robotKey].test(name)).length;
    document.documentElement.dataset.sceneStatus = 'ready';
    document.documentElement.dataset.sceneBodies = String(bodies.length);
    document.documentElement.dataset.sceneInstances = String(instanceCount);
    setSceneReady(true);
    announce('ncit-demo-ready');
    console.info(`[scene] ${robotKey} ready with ${instanceCount} instances and ${bodies.length} bodies`);
  }, [robotKey]);

  const handleSceneError = useCallback((error: Error) => {
    setSceneReady(false);
    document.documentElement.dataset.sceneStatus = 'error';
    document.documentElement.dataset.sceneError = error.message;
    announce('ncit-demo-error',{message:error.message});
    console.error(`[scene] ${robotKey} failed: ${error.message}`);
  }, [robotKey]);

  const sim = useControls('Simulation', {
    paused: false,
    speed: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
    gravityCompensation: { value: false, label: 'gravity compensation', disabled: robotKey === 'frankaDemo2' },
    gizmo: { value: true, label: 'IK gizmo' },
    reset: button(handleResetAssemblySequence),
  });

  const debug = useControls('Debug', {
    contacts: false,
    sites: false,
    joints: false,
  });

  const canvasKey = useMemo(() => robotKey, [robotKey]);
  const cameraTiles=useRef(new Map<string,HTMLDivElement>());
  const [cameraSelection,setCameraSelection]=useState('arm2');
  const [cameraStatus,setCameraStatus]=useState('loading');
  const simulationConfig = useMemo(() => ({ ...entry.config, controlTimestep: isAssembly1Scene ? .01 : robotKey === 'frankaDemo2' ? .002 : undefined }), [entry.config, isAssembly1Scene, robotKey]);

  return (
    <MujocoProvider>
      <Leva
        hidden={isFrankaDemo1}
        theme={{ sizes: { rootWidth: '320px', controlWidth: '185px' } }}
      />
      <MujocoCanvas
        key={canvasKey}
        ref={apiRef}
        config={simulationConfig}
        onReady={handleSceneReady}
        onError={handleSceneError}
        camera={{
          position: entry.camera.position,
          up: [0, 0, 1] satisfies [number, number, number],
          fov: entry.camera.fov,
          near: 0.01,
          far: 100,
        }}
        paused={sim.paused || embedPaused || pageHidden || offscreen}
        speed={sim.speed}
        shadows
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          target={entry.orbitTarget}
          makeDefault
        />

        {/* Core scene */}
        <LoadingOverlay />
        <GravityCompensation enabled={sim.gravityCompensation && robotKey !== 'frankaDemo2'} />

        {/* IK + per-robot controllers */}
        <SceneChildren
          robotKey={robotKey}
          controlFamily={entry.controlFamily}
          target={controlTarget}
          resetGeneration={resetGeneration}
          showGizmo={sim.gizmo && !isUnitreeActionScene && !isFrankaDemo1}
          gizmoScale={entry.gizmoScale}
          assemblyStep1RequestId={assemblyStep1RequestId}
          assemblyStep1Status={assemblyStep1Status}
          assemblyStep2RequestId={assemblyStep2RequestId}
          assemblyStep2State={assemblyStep2State}
          assemblyStep3RequestId={assemblyStep3RequestId}
          assemblyStep3State={assemblyStep3State}
          assemblyStep4RequestId={assemblyStep4RequestId}
          assemblyStep4State={assemblyStep4State}
          manualPoseMode={manualPoseMode}
          assemblyOwnershipRef={assemblyOwnershipRef}
          step1SnapshotRef={step1SnapshotRef}
          step2DiagnosticsRef={step2DiagnosticsRef}
          step3DiagnosticsRef={step3DiagnosticsRef}
          step4DiagnosticsRef={step4DiagnosticsRef}
          onAssemblyStep1StatusChange={setAssemblyStep1Status}
          onAssemblyStep2StateChange={setAssemblyStep2State}
          onAssemblyStep3StateChange={setAssemblyStep3State}
          onAssemblyStep4StateChange={setAssemblyStep4State}
          onRunAssemblyStep1={handleRunAssemblyStep1}
          onRunAssemblyStep2={handleRunAssemblyStep2}
          onRunAssemblyStep3={handleRunAssemblyStep3}
          onRunAssemblyStep4={handleRunAssemblyStep4}
          onResetAssemblySequence={handleResetAssemblySequence}
          unitreeActionStateRef={unitreeActionStateRef}
          unitreeActionDiagnosticsRef={unitreeActionDiagnosticsRef}
          onRunUnitreeAction={handleRunUnitreeAction}
          onPauseUnitreeAction={handlePauseUnitreeAction}
          onResumeUnitreeAction={handleResumeUnitreeAction}
          onSelectUnitreeActionProgram={handleSelectUnitreeActionProgram}
          eggRequestId={eggRequestId}
          eggProgram={eggProgram}
          onEggReseatReady={setEggReseatReady}
          eggLocked={eggLocked}
          onEggStateChange={setEggState}
          sortingRequestId={sortingRequestId}
          onSortingStateChange={setSortingState}
        />

        {isUnitreeActionScene && (
          <UnitreeActionController
            requestId={unitreeActionRequestId}
            resetGeneration={resetGeneration}
            state={unitreeActionState}
            diagnosticsRef={unitreeActionDiagnosticsRef}
            onStateChange={setUnitreeActionState}
          />
        )}

        {/* Opt-in interaction */}
        {!assemblyControlsLocked && !eggLocked && !isUnitreeActionScene && !isFrankaDemo1 && <DragInteraction />}
        {!isFrankaDemo1 && <ClickSelectOverlay />}

        {/* Debug overlays */}
        <group userData={{sensorOverlay:true}}>
          <ContactMarkers visible={debug.contacts} />
          <Debug showSites={debug.sites} showJoints={debug.joints} />
        </group>

        {/* Scene decoration — lights, environment, grid */}
        {isAssembly1Scene && <AssemblyPresentation />}
        {isAssembly1Scene && <AssemblyCameras tiles={cameraTiles} onStatus={setCameraStatus} />}
        {isAssembly1Scene || robotKey === 'frankaDemo2' ? <color attach="background" args={['#d8d2b5']} /> : robotKey.startsWith('frankaAssembly')
          ? <color attach="background" args={['#d8d2b5']} />
          : <Environment preset="lobby" background backgroundBlurriness={1} backgroundIntensity={0.6} environmentIntensity={0.5} />}
        <ambientLight intensity={isAssembly1Scene || robotKey === 'frankaDemo2' ? .65 : .4} />
        <directionalLight position={[2, -2, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-1, 1, 3]} intensity={0.3} />
        <gridHelper
          args={[entry.gridSize ?? 4, entry.gridDivisions ?? 40, isAssembly1Scene ? '#a2aaa6' : '#64748b', isAssembly1Scene ? '#c0c6c0' : '#94a3b8']}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.001]}
        />
        {!isFrankaDemo1 && <Stats parent={performanceStatsParentRef} showPanel={0} />}
        {!isFrankaDemo1 && <Stats parent={performanceStatsParentRef} showPanel={1} />}
        {!isFrankaDemo1 && <Stats parent={performanceStatsParentRef} showPanel={2} />}
      </MujocoCanvas>

      {/* HTML overlay — outside R3F canvas */}
      {robotKey === 'frankaDemo2' && (
        <EggSortingPanel state={sortingState} paused={sim.paused} canRun={sceneReady&&sortingState.phase==='ready'&&eggState.phase==='ready'}
          onRun={()=>{setSortingState(s=>({...s,phase:'running',label:'Starting four-arm sorting'}));setSortingRequestId(id=>id+1);}}>
          <details style={{marginTop:10}}><summary>Single-egg checks</summary>
          <div style={{marginTop:8,color:'#66695e'}}>First transfer: Arm 1 picks one ivory egg, aligns it and places it in its tray. Arms 2–4 wait.</div>
          <button disabled={eggState.phase!=='ready'||sortingLocked||sortingState.phase==='complete'} onClick={()=>{setEggProgram('transfer');setEggState({phase:'running',label:'Starting first egg',phaseIndex:0});setEggRequestId(id=>id+1);}} style={{marginTop:12,padding:'9px 14px',borderRadius:7,border:'1px solid #858773',background:eggState.phase==='ready'?'#e1dfc9':'#e8e6dc',color:'#34382f',cursor:eggState.phase==='ready'?'pointer':'default'}}>Run first egg</button>
          <div style={{marginTop:8,color:'#66695e'}}>Correction trial: release tilted, regrasp, lift and reseat upright. Reset between trials.</div>
          <button disabled={eggState.phase!=='ready'||!eggReseatReady||sortingLocked||sortingState.phase==='complete'} onClick={()=>{setEggProgram('reseat');setEggState({phase:'running',label:'Starting correction trial',phaseIndex:0});setEggRequestId(id=>id+1);}} style={{marginTop:8,padding:'9px 14px',borderRadius:7,border:'1px solid #858773',background:'#e8e6dc',color:'#34382f',cursor:eggState.phase==='ready'&&eggReseatReady?'pointer':'default'}}>Run correction trial</button>
          <div role="status" style={{marginTop:8}}>{eggState.label}</div>
          {eggState.reason && <div style={{color:'#8a3b2c'}}>{eggState.reason} · Reset to retry</div>}
          </details>
        </EggSortingPanel>
      )}
      {isAssembly1Scene && <AssemblyCameraPanel key={`cameras-${robotKey}`} selection={cameraSelection} onSelection={setCameraSelection} tiles={cameraTiles} status={cameraStatus} />}
      {!isFrankaDemo1 && (
        <div
          ref={performanceStatsRef}
          className="performance-stats"
          aria-label="Performance statistics: frames per second, frame time, and memory"
        >
          <span className="performance-stats__label">Scene performance</span>
        </div>
      )}
      {robotKey === 'frankaAssembly1' && (
        <AssemblySequencePanel
          step1Status={assemblyStep1Status}
          step2State={assemblyStep2State}
          step3State={assemblyStep3State}
          step4State={assemblyStep4State}
          canRunStep2={
            assemblyStep1Status === 'complete'
            && assemblyStep2State.phase === 'idle'
            && Boolean(step1SnapshotRef.current)
          }
          canRunStep3={
            assemblyStep2State.phase === 'complete'
            && assemblyStep3State.phase === 'idle'
          }
          canRunStep4={
            assemblyStep3State.phase === 'complete'
            && assemblyStep4State.phase === 'idle'
          }
          onRunStep1={handleRunAssemblyStep1}
          onRunStep2={handleRunAssemblyStep2}
          onRunStep3={handleRunAssemblyStep3}
          onRunStep4={handleRunAssemblyStep4}
        />
      )}
      {isFrankaDemo1 && (
        <FrankaDemo1Panel
          paused={embedPaused}
          onPause={()=>setEmbedPaused(value=>!value)}
          action={frankaDemo1Display}
          active={frankaDemo1Active}
          sceneReady={sceneReady}
          page={robotKey}
          pages={robotOptions}
          onPageChange={(page) => setRobotControl({ robot: page })}
          onPlay={() => setFrankaDemo1Active(true)}
          onReset={handleResetAssemblySequence}
        />
      )}
      {robotKey === 'frankaAssembly1' && (
        <Assembly1PoseCapturePanel
          sceneReady={sceneReady}
          selectedControlTarget={controlTarget.key}
          manualMode={manualPoseMode}
          onManualModeChange={handleManualPoseModeChange}
        />
      )}
      {isUnitreeActionScene && (
        <UnitreeActionPanel
          state={unitreeActionState}
          loading={!sceneReady}
          onRun={handleRunUnitreeAction}
          onPause={handlePauseUnitreeAction}
          onResume={handleResumeUnitreeAction}
          onRestart={handleRestartUnitreeAction}
          onProgramChange={handleSelectUnitreeActionProgram}
        />
      )}
      {!isUnitreeActionScene && !isFrankaDemo1 && (
        <KeyboardHelp
          robotKey={entry.controlFamily}
          controlTargetLabel={controlTarget.label}
          controlMode={controlTarget.controlMode}
        />
      )}
      {!isFrankaDemo1 && <GitHubLink />}
    </MujocoProvider>
  );
}
