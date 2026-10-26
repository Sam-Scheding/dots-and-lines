import type { Point } from '@dots-and-lines/core';
import { Dot, ElbowLine, Scene, useSceneState } from '@dots-and-lines/react';
import { useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

// A Dot is only as styled as its children, and a line is only as styled as its
// `className`, so everything below is plain CSS. The sizes are fixed in the CSS
// (160 x 64 inputs, a 160 x 88 mixer, a 160 x 44 output) so each line can start
// and end on an edge and attach to the Dot there when it mounts.
export function CustomStylingExample() {
  const sceneState = useSceneState();
  const [inputA, setInputA] = useState<Point>({ x: 60, y: 60 });
  const [inputB, setInputB] = useState<Point>({ x: 60, y: 300 });
  const [mixer, setMixer] = useState<Point>({ x: 360, y: 180 });
  const [output, setOutput] = useState<Point>({ x: 640, y: 300 });

  return (
    <>
      <p className={styles.note}>
        Three lines, three looks, all from a <code>className</code>: thick and
        rounded, dashed, and glowing. The Dots are just custom content. Click a
        line to reshape it, and drag a Dot to see the lines follow.
      </p>
      <div className={styles.root}>
        <Stage>
          <Scene state={sceneState}>
            <Dot
              x={inputA.x}
              y={inputA.y}
              onMove={(x, y) => setInputA({ x, y })}
            >
              <div className={styles.input}>
                <span className={styles.led} />
                <span className={styles.inputText}>
                  <strong>Input A</strong>
                  <small>Signal in</small>
                </span>
              </div>
            </Dot>
            <Dot
              x={inputB.x}
              y={inputB.y}
              onMove={(x, y) => setInputB({ x, y })}
            >
              <div className={styles.input}>
                <span className={styles.led} />
                <span className={styles.inputText}>
                  <strong>Input B</strong>
                  <small>Signal in</small>
                </span>
              </div>
            </Dot>
            <Dot x={mixer.x} y={mixer.y} onMove={(x, y) => setMixer({ x, y })}>
              <div className={styles.mixer}>
                <div className={styles.knobs}>
                  <span className={styles.knob} />
                  <span className={`${styles.knob} ${styles.knobTurned}`} />
                  <span className={styles.knob} />
                </div>
                <strong>Mixer</strong>
              </div>
            </Dot>
            <Dot
              x={output.x}
              y={output.y}
              onMove={(x, y) => setOutput({ x, y })}
            >
              <div className={styles.output}>Output ▸</div>
            </Dot>

            {/* After the Dots, so each line's end handles stay on top. */}
            <ElbowLine
              initialStart={{ x: 220, y: 92 }}
              initialEnd={{ x: 440, y: 180 }}
              className={styles.thick}
              handle={<span className={styles.handle} />}
            />
            <ElbowLine
              initialStart={{ x: 220, y: 332 }}
              initialEnd={{ x: 440, y: 268 }}
              className={styles.dashed}
              handle={<span className={styles.handle} />}
            />
            <ElbowLine
              initialStart={{ x: 520, y: 224 }}
              initialEnd={{ x: 720, y: 300 }}
              className={styles.glow}
              handle={<span className={styles.handle} />}
            />
          </Scene>
        </Stage>
      </div>
    </>
  );
}
