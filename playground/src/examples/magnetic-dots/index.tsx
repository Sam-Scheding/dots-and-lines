import type { Point } from '@dots-and-lines/core';
import {
  Dot,
  ElbowLine,
  Scene,
  useScene,
  useSceneState,
} from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

type Line = { id: string; start: Point; end: Point };

// Each card is 120 x 56. The first line starts on A's right edge and ends on
// the middle of B's top edge, so it attaches to both when it mounts.
const FIRST_LINE: Line = {
  id: 'first',
  start: { x: 200, y: 108 },
  end: { x: 440, y: 200 },
};

export function MagneticDotsExample() {
  const sceneState = useSceneState();
  const mode = useScene(sceneState, (s) => s.getMode());
  const [a, setA] = useState<Point>({ x: 80, y: 80 });
  const [b, setB] = useState<Point>({ x: 380, y: 200 });
  const [lines, setLines] = useState<Line[]>([FIRST_LINE]);

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() =>
            sceneState.setMode(mode === 'connect' ? 'select' : 'connect')
          }
        >
          {mode === 'connect' ? 'Cancel' : 'Add line'}
        </button>
        <span className={styles.note}>
          Drag a Dot and the line follows. Click the line, then drag an end next
          to a Dot to snap it, or away to let go. Clicks that start or end near
          a Dot snap to it too.
        </span>
      </div>
      <Stage>
        <Scene
          state={sceneState}
          onConnect={({ start, end }) =>
            setLines((all) => [...all, { id: crypto.randomUUID(), start, end }])
          }
        >
          <Dot x={a.x} y={a.y} onMove={(x, y) => setA({ x, y })}>
            <div className={styles.card}>A</div>
          </Dot>
          <Dot x={b.x} y={b.y} onMove={(x, y) => setB({ x, y })}>
            <div className={styles.card}>B</div>
          </Dot>
          {lines.map((line) => (
            <ElbowLine
              key={line.id}
              initialStart={line.start}
              initialEnd={line.end}
              autoFocus={line.id !== FIRST_LINE.id}
              className={styles.line}
              handle={<span className={styles.handle} />}
            />
          ))}
        </Scene>
      </Stage>
    </>
  );
}
