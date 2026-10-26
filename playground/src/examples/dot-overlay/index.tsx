import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function DotOverlayExample() {
  const sceneState = useSceneState();
  const [position, setPosition] = useState<Point>({ x: 80, y: 80 });

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.note}>
          Click the Dot to select it: its <code>overlay</code> shows only while
          it is selected, and clicking elsewhere takes it away.
        </span>
      </div>
      <Stage>
        <Scene state={sceneState}>
          <Dot
            x={position.x}
            y={position.y}
            onMove={(x, y) => setPosition({ x, y })}
            overlay={
              <div className={styles.dotChip}>
                {Math.round(position.x)}, {Math.round(position.y)}
              </div>
            }
          >
            <div className={styles.card}>
              <strong>Short</strong>
            </div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
