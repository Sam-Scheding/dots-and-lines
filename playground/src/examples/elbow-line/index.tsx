import type { Point } from '@dots-and-lines/core';
import {
  ElbowLine,
  Scene,
  useScene,
  useSceneState,
} from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

type Line = { id: string; start: Point; end: Point };

export function ElbowLineExample() {
  const sceneState = useSceneState();
  const mode = useScene(sceneState, (s) => s.getMode());
  const [lines, setLines] = useState<Line[]>([]);

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
          {mode === 'connect'
            ? 'Click once for the start, again for the end.'
            : 'Add a line, then click it to drag its handles. Click the background to deselect.'}
        </span>
      </div>
      <Stage>
        <Scene
          state={sceneState}
          onConnect={({ start, end }) => {
            const id = crypto.randomUUID();
            setLines((all) => [...all, { id, start, end }]);
          }}
        >
          {lines.map((line) => (
            <ElbowLine
              key={line.id}
              autoFocus // a new line starts selected, ready to edit
              initialStart={line.start}
              initialEnd={line.end}
              className={styles.line}
              handle={<span className={styles.handle} />}
            />
          ))}
        </Scene>
      </Stage>
    </>
  );
}
