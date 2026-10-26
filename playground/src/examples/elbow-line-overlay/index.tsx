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

export function ElbowLineOverlayExample() {
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
          Lines made through “Add line” take an <code>overlay</code> like any
          other: the selected line shows a delete button.
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
              overlay={
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() =>
                    // Removing the selected line clears the selection.
                    setLines((all) => all.filter((l) => l.id !== line.id))
                  }
                >
                  Delete line
                </button>
              }
            />
          ))}
        </Scene>
      </Stage>
    </>
  );
}
