import { ElbowLine, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function ElbowLineJsxExample() {
  const sceneState = useSceneState();
  // Changing a component's `key` remounts it, which is how you reset a line
  // back to its initial points.
  const [resetCount, setResetCount] = useState(0);

  return (
    <>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => setResetCount((n) => n + 1)}>
          Reset line
        </button>
        <span className={styles.note}>
          The line starts as an L between its two initial points. Click it, then
          drag a handle: segments and ends reshape it, and a sideways drag on an
          end segment adds a new one.
        </span>
      </div>
      <Stage>
        <Scene state={sceneState}>
          <ElbowLine
            key={resetCount}
            initialStart={{ x: 120, y: 100 }}
            initialEnd={{ x: 420, y: 280 }}
            className={styles.line}
            handle={<span className={styles.handle} />}
          />
        </Scene>
      </Stage>
    </>
  );
}
