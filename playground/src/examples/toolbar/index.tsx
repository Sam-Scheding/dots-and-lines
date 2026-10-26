import { Dot, Scene, useScene, useSceneState } from '@dots-and-lines/react';
import { useRef } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';
import { zoomAboutCenter } from '../zoom-about-center';

const PAN_STEP = 100;

export function ToolbarExample() {
  const sceneState = useSceneState();
  const zoom = useScene(sceneState, (s) => s.getView().zoom);
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => sceneState.panBy(-PAN_STEP, 0)}
          aria-label="Move content left"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => sceneState.panBy(0, -PAN_STEP)}
          aria-label="Move content up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => sceneState.panBy(0, PAN_STEP)}
          aria-label="Move content down"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => sceneState.panBy(PAN_STEP, 0)}
          aria-label="Move content right"
        >
          →
        </button>

        <button
          type="button"
          onClick={() =>
            zoomAboutCenter(sceneState, stageRef.current, 1 / 1.25)
          }
        >
          −
        </button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => zoomAboutCenter(sceneState, stageRef.current, 1.25)}
        >
          +
        </button>

        <button
          type="button"
          onClick={() => sceneState.setView({ panX: 0, panY: 0, zoom: 1 })}
        >
          Reset
        </button>
      </div>
      <p className={styles.note}>
        The buttons and the mouse / trackpad drive the same camera: wheel pans,
        ctrl/cmd + wheel zooms, space + drag pans.
      </p>
      <Stage ref={stageRef}>
        <Scene state={sceneState}>
          <Dot x={80} y={80}>
            <div className={styles.staticCard}>One</div>
          </Dot>
          <Dot x={320} y={140}>
            <div className={styles.staticCard}>Two</div>
          </Dot>
          <Dot x={160} y={280}>
            <div className={styles.staticCard}>Three</div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
