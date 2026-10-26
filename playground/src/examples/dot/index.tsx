import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function DotExample() {
  const sceneState = useSceneState();
  const [position, setPosition] = useState<Point>({ x: 80, y: 80 });

  return (
    <Stage>
      <Scene state={sceneState}>
        <Dot
          x={position.x}
          y={position.y}
          onMove={(x, y) => setPosition({ x, y })}
        >
          <div className={styles.card}>Drag me</div>
        </Dot>
      </Scene>
    </Stage>
  );
}
