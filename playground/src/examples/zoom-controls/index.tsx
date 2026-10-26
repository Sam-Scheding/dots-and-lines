import type { CreateSceneStateOptions } from '@dots-and-lines/core';
import { Dot, Scene, useScene, useSceneState } from '@dots-and-lines/react';
import { useRef } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';
import { zoomAboutCenter } from '../zoom-about-center';

const ZOOM_LIMITS = { min: 0.5, max: 2 };
const sceneConfig: CreateSceneStateOptions = { zoom: ZOOM_LIMITS };

export function ZoomControlsExample() {
  const sceneState = useSceneState(sceneConfig);
  const zoom = useScene(sceneState, (s) => s.getView().zoom);
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          disabled={zoom <= ZOOM_LIMITS.min}
          onClick={() =>
            zoomAboutCenter(sceneState, stageRef.current, 1 / 1.25)
          }
        >
          −
        </button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          disabled={zoom >= ZOOM_LIMITS.max}
          onClick={() => zoomAboutCenter(sceneState, stageRef.current, 1.25)}
        >
          +
        </button>
        <span className={styles.note}>
          Limited to {ZOOM_LIMITS.min * 100}%–{ZOOM_LIMITS.max * 100}%. Ctrl/cmd
          + wheel zooms too.
        </span>
      </div>
      <Stage ref={stageRef}>
        <Scene state={sceneState}>
          <Dot x={80} y={80}>
            <div className={styles.staticCard}>Zoom around me</div>
          </Dot>
          <Dot x={300} y={200}>
            <div className={styles.staticCard}>…or me</div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
