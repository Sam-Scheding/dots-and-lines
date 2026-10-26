import type { Point } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState, useSelected } from '@dots-and-lines/react';
import { useState } from 'react';

import { Stage } from '../stage';
import styles from './styles.module.css';

type Position = Point;

/** Content inside a Dot can ask whether that Dot is selected. */
function Card({ name }: { name: string }) {
  const selected = useSelected();
  return (
    <div className={styles.card}>
      <strong>{name}</strong>
      <div>{selected ? 'Selected' : 'Not selected'}</div>
    </div>
  );
}

export function UseSelectedExample() {
  const sceneState = useSceneState();
  const [first, setFirst] = useState<Position>({ x: 60, y: 60 });
  const [second, setSecond] = useState<Position>({ x: 280, y: 140 });

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.note}>
          Each Card calls <code>useSelected()</code>. Click a Dot to select it;
          click the background to deselect.
        </span>
      </div>
      <Stage>
        <Scene state={sceneState}>
          <Dot x={first.x} y={first.y} onMove={(x, y) => setFirst({ x, y })}>
            <Card name="One" />
          </Dot>
          <Dot x={second.x} y={second.y} onMove={(x, y) => setSecond({ x, y })}>
            <Card name="Two" />
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
