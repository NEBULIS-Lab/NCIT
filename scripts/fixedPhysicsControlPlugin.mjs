// The upstream render loop calls beforeStep once per DISPLAY frame. Assembly's
// opt-in control clock must instead run at a fixed simulation-time frequency.
// Keep this dependency adaptation reproducible in both Vite dev and production.
export const clockDeclaration = `const assemblyControlClocks = new WeakMap();
function assemblyControlTick(model, data, period, callbacks) {
  const tick = Math.floor((data.time + 1e-9) / period);
  if (assemblyControlClocks.get(data) === tick) return;
  assemblyControlClocks.set(data, tick);
  for (let i = 0; i < model.nv; i++) data.qfrc_applied[i] = 0;
  for (const cb of callbacks) cb(model, data);
}
`;

export function patchPhysicsControl(code) {
  const start = code.indexOf('    for (let i = 0; i < model.nv; i++) {\n      data.qfrc_applied[i] = 0;\n    }\n    for (const cb of beforeStepCallbacks.current)');
  const end = code.indexOf('    for (const cb of afterStepCallbacks.current)', start);
  if (start < 0 || end < 0) throw new Error('mujoco-react physics loop changed: review fixed-control adaptation');
  const original = code.slice(start, end);
  if ((original.match(/mujoco\.mj_step\(model, data\);/g) ?? []).length !== 2) throw new Error('Unexpected MuJoCo stepping loop');
  const fixed = original
    .replace(/    for \(let i = 0;[\s\S]*?    const numSubsteps/, '    const numSubsteps')
    .replaceAll('mujoco.mj_step(model, data);', 'assemblyControlTick(model, data, controlPeriod, beforeStepCallbacks.current);\n          mujoco.mj_step(model, data);');
  return clockDeclaration + code.slice(0, start)
    + `    const controlPeriod = configRef.current.controlTimestep;\n    if (controlPeriod > 0) {\n${fixed}    } else {\n${original}    }\n`
    + code.slice(end);
}

/** @returns {import('vite').Plugin} */
export function fixedPhysicsControlPlugin() {
  return {
    name: 'assembly-fixed-physics-control',
    enforce: 'pre',
    transform(code, id) {
      // Vite dev imports include cache queries; production IDs usually do not.
      const pathname = id.replaceAll('\\', '/').split('?')[0];
      if (!pathname.endsWith('/mujoco-react/dist/index.js')) return null;
      return { code: patchPhysicsControl(code), map: null };
    },
  };
}
