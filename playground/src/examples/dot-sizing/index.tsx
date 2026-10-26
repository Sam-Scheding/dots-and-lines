import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function DotSizingExample() {
  const sceneState = useSceneState();
  const [small, setSmall] = useState<Point>({ x: 60, y: 60 });
  const [wrapped, setWrapped] = useState<Point>({ x: 240, y: 60 });
  const [block, setBlock] = useState<Point>({ x: 60, y: 220 });

  return (
    <Stage>
      <Scene state={sceneState}>
        <Dot x={small.x} y={small.y} onMove={(x, y) => setSmall({ x, y })}>
          <div className={styles.card}>Tiny</div>
        </Dot>

        <Dot
          x={wrapped.x}
          y={wrapped.y}
          onMove={(x, y) => setWrapped({ x, y })}
        >
          <div className={styles.card}>
            <strong>Wraps at its own max-width</strong>
            <p>
              A Dot is exactly as large as its children, so nothing is measured
              and nothing is squeezed.
            </p>
          </div>
        </Dot>

        <Dot x={block.x} y={block.y} onMove={(x, y) => setBlock({ x, y })}>
          <div
            className={styles.card}
            style={{ width: 220, height: 90, maxWidth: 'none' }}
          >
            A fixed 220 × 90 box
          </div>
        </Dot>
      </Scene>
    </Stage>
  );
}
