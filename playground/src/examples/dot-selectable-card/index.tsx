import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

type Position = { x: number; y: number };

// A Dot is selectable by default and draws a ring when selected. Here the Card
// is focusable and draws its own :focus / :active look, so the Dot opts out
// with `selectable={false}` and the two looks don't stack.
export function DotSelectableCardExample() {
  const sceneState = useSceneState();
  const [first, setFirst] = useState<Position>({ x: 60, y: 60 });
  const [second, setSecond] = useState<Position>({ x: 280, y: 140 });

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.note}>
          Each Card is focusable and styled with plain <code>:focus</code> and{' '}
          <code>:active</code>, so its Dot is{' '}
          <code>selectable={'{false}'}</code>
          and adds no ring. Drag one by its card.
        </span>
      </div>
      <Stage>
        <Scene state={sceneState}>
          <Dot
            selectable={false}
            x={first.x}
            y={first.y}
            onMove={(x, y) => setFirst({ x, y })}
          >
            <div className={styles.focusCard} tabIndex={0}>
              Card one
            </div>
          </Dot>
          <Dot
            selectable={false}
            x={second.x}
            y={second.y}
            onMove={(x, y) => setSecond({ x, y })}
          >
            <div className={styles.focusCard} tabIndex={0}>
              Card two
            </div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
