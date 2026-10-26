import type { ChangeEvent } from 'react';

import styles from './styles.module.css';
import { PanJoystick } from '../pan-joystick';

type ViewControlsProps = {
  zoom: number;
  zoomMin: number;
  zoomMax: number;
  onZoomChange: (zoom: number) => void;
  onZoomReset: () => void;
  onPanDelta: (deltaXPx: number, deltaYPx: number) => void;
  onPanReset: () => void;
};

const SHORTCUTS = [
  ['Two-finger drag', 'Pan'],
  ['Space + drag', 'Pan'],
  ['⌘ / Ctrl + scroll', 'Zoom'],
  ['Shift + scroll', 'Pan horizontally'],
] as const;

/**
 * A panel for the corner of the Stage: a zoom slider, a pan joystick, a reset
 * for each, and the mouse shortcuts. It sits over the Scene, not inside it.
 */
export function ViewControls({
  zoom,
  zoomMin,
  zoomMax,
  onZoomChange,
  onZoomReset,
  onPanDelta,
  onPanReset,
}: ViewControlsProps) {
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <label htmlFor="playground-zoom">Zoom</label>
        <input
          id="playground-zoom"
          className={styles.slider}
          type="range"
          min={zoomMin}
          max={zoomMax}
          step={0.05}
          value={zoom}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onZoomChange(Number(event.target.value))
          }
        />
        <button type="button" aria-label="Reset zoom" onClick={onZoomReset}>
          ×
        </button>
      </div>
      <div className={styles.row}>
        <span>Pan</span>
        <PanJoystick onPanDelta={onPanDelta} />
        <button type="button" aria-label="Reset pan" onClick={onPanReset}>
          ×
        </button>
      </div>
      <dl className={styles.shortcuts}>
        {SHORTCUTS.map(([keys, action]) => (
          <div key={keys}>
            <dt>{keys}:</dt> <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
