import { Dot, Scene, useScene, useSceneState } from '@dots-and-lines/react';
import { useRef } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';
import { zoomAboutCenter } from '../zoom-about-center';

export function PanZoomDisabledExample() {
  const sceneState = useSceneState();
  const zoom = useScene(sceneState, (s) => s.getView().zoom);
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className={styles.toolbar}>
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
        <span className={styles.note}>
          Wheel, trackpad and space + drag do nothing. Only the buttons move the
          camera.
        </span>
      </div>
      <Stage ref={stageRef}>
        <Scene state={sceneState} panZoom={false}>
          <Dot x={80} y={80}>
            <div className={styles.staticCard}>Try the wheel</div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
