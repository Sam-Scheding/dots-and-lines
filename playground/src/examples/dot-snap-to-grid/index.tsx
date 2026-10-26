import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

const GRID = 20;
const snap = (value: number) => Math.round(value / GRID) * GRID;

export function DotSnapToGridExample() {
  const sceneState = useSceneState();
  const [position, setPosition] = useState<Point>({ x: 80, y: 80 });

  return (
    <>
      <p className={styles.note}>
        The Dot follows the pointer freely, then snaps to the grid when you let
        go (<code>onMoveEnd</code>). Pan/zoom is off so the grid stays aligned.
      </p>
      <Stage grid>
        <Scene state={sceneState} panZoom={false}>
          <Dot
            x={position.x}
            y={position.y}
            onMove={(x, y) => setPosition({ x, y })}
            onMoveEnd={() =>
              setPosition(({ x, y }) => ({ x: snap(x), y: snap(y) }))
            }
          >
            <div className={styles.card}>Snaps on release</div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
