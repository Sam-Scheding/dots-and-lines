import type { Point } from '@dots-and-lines/core';
import { Dot, ElbowLine, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

const LINE_START: Point = { x: 200, y: 108 };
const LINE_END: Point = { x: 440, y: 200 };

export function MagneticOffExample() {
  const sceneState = useSceneState();
  const [a, setA] = useState<Point>({ x: 80, y: 80 });
  const [b, setB] = useState<Point>({ x: 380, y: 200 });
  const [isMagnetic, setIsMagnetic] = useState(false);

  return (
    <>
      <div className={styles.toolbar}>
        <label>
          <input
            type="checkbox"
            checked={isMagnetic}
            onChange={(event) => setIsMagnetic(event.target.checked)}
          />{' '}
          Dots are magnetic
        </label>
        <span className={styles.note}>
          With <code>isMagnetic=&#123;false&#125;</code> on the Dots, the line
          ignores them. Turn it on to snap; turn it off to let go.
        </span>
      </div>
      <Stage>
        <Scene state={sceneState}>
          <Dot
            x={a.x}
            y={a.y}
            isMagnetic={isMagnetic}
            onMove={(x, y) => setA({ x, y })}
          >
            <div className={styles.card}>A</div>
          </Dot>
          <Dot
            x={b.x}
            y={b.y}
            isMagnetic={isMagnetic}
            onMove={(x, y) => setB({ x, y })}
          >
            <div className={styles.card}>B</div>
          </Dot>
          <ElbowLine
            initialStart={LINE_START}
            initialEnd={LINE_END}
            className={styles.line}
            handle={<span className={styles.handle} />}
          />
        </Scene>
      </Stage>
    </>
  );
}
