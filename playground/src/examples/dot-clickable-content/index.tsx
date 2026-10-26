import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function DotClickableContentExample() {
  const sceneState = useSceneState();
  const [position, setPosition] = useState<Point>({ x: 80, y: 80 });
  const [clicks, setClicks] = useState(0);

  return (
    <Stage>
      <Scene state={sceneState}>
        <Dot
          x={position.x}
          y={position.y}
          onMove={(x, y) => setPosition({ x, y })}
        >
          <div className={styles.card}>
            <strong>Interactive child</strong>
            <button type="button" onClick={() => setClicks((n) => n + 1)}>
              Clicked {clicks}×
            </button>
          </div>
        </Dot>
      </Scene>
    </Stage>
  );
}
