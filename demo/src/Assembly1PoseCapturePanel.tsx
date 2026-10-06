import { useCallback, useState } from 'react';
import {
  createAssembly1PoseSnapshot,
  createManualPoseDownload,
} from './manualPoseCapture.js';

interface Assembly1PoseCapturePanelProps {
  sceneReady: boolean;
  selectedControlTarget: string;
  manualMode: boolean;
  onManualModeChange: (enabled: boolean) => void;
}

interface SaveResponse {
  ok?: boolean;
  path?: string;
  error?: string;
}

export function Assembly1PoseCapturePanel({
  sceneReady,
  selectedControlTarget,
  manualMode,
  onManualModeChange,
}: Assembly1PoseCapturePanelProps) {
  const [label, setLabel] = useState('handover-pose-01');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const saveCurrentPose = useCallback(async () => {
    setSaving(true);
    setMessage('');
    setHasError(false);
    try {
      if (!window.robotDemo) throw new Error('Simulation diagnostics are not ready yet');
      const snapshot = createAssembly1PoseSnapshot(window.robotDemo, {
        label,
        selectedControlTarget,
      });
      const artifact = createManualPoseDownload(snapshot);
      const objectUrl = URL.createObjectURL(new Blob([artifact.contents], {
        type: artifact.mimeType,
      }));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = artifact.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      if (import.meta.env.DEV) {
        const response = await fetch('/__manual-pose-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });
        const result = await response.json() as SaveResponse;
        if (!response.ok || !result.ok || !result.path) {
          throw new Error(result.error ?? `Save request failed (HTTP ${response.status})`);
        }
        setMessage(`Downloaded: ${artifact.filename}; saved on server: ${result.path}`);
      } else {
        setMessage(`Downloaded: ${artifact.filename}`);
      }
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }, [label, selectedControlTarget]);

  return (
    <section className="assembly-pose-panel" aria-label="Assembly1 manual pose capture">
      <div className="assembly-pose-panel__title">Manual Pose Capture</div>
      <div className="assembly-pose-panel__hint">
        Select a Control target at the top right, then pose the arm with the IK gizmo or keyboard. Save to download JSON; local development also saves a server copy.
      </div>
      <button
        type="button"
        className={manualMode ? 'assembly-pose-panel__mode assembly-pose-panel__mode--active' : 'assembly-pose-panel__mode'}
        disabled={!sceneReady}
        onClick={() => onManualModeChange(!manualMode)}
      >
        {manualMode ? 'Exit manual posing' : 'Enter manual posing'}
      </button>
      <label className="assembly-pose-panel__label">
        Pose name
        <input
          value={label}
          maxLength={64}
          spellCheck={false}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={!sceneReady || saving}
        onClick={saveCurrentPose}
      >
        {saving ? 'Saving…' : 'Save current pose'}
      </button>
      <div
        className={hasError ? 'assembly-pose-panel__message assembly-pose-panel__message--error' : 'assembly-pose-panel__message'}
        aria-live="polite"
      >
        {message || `Control target: ${selectedControlTarget}`}
      </div>
    </section>
  );
}
