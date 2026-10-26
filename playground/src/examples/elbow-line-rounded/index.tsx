import { ElbowLine, Scene, useSceneState } from '@dots-and-lines/react';

import styles from './styles.module.css';
import { Stage } from '../stage';

export function ElbowLineRoundedExample() {
  const sceneState = useSceneState();

  return (
    <>
      <p className={styles.note}>
        Top: the default, square corners. Bottom: the same line with a{' '}
        <code>border-radius</code> in its <code>className</code>. Click a line
        and drag a handle to see the joints as it reshapes.
      </p>
      <Stage>
        <Scene state={sceneState}>
          <ElbowLine
            initialStart={{ x: 60, y: 60 }}
            initialEnd={{ x: 360, y: 200 }}
            className={styles.line}
            handle={<span className={styles.handle} />}
          />
          <ElbowLine
            initialStart={{ x: 60, y: 280 }}
            initialEnd={{ x: 360, y: 420 }}
            className={`${styles.line} ${styles.rounded}`}
            handle={<span className={styles.handle} />}
          />
        </Scene>
      </Stage>
    </>
  );
}
