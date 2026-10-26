import {
  seedElbowPoints,
  type CreateSceneStateOptions,
} from '@dots-and-lines/core';
import {
  Dot,
  ElbowLine,
  Scene,
  useScene,
  useSceneState,
} from '@dots-and-lines/react';
import LZString from 'lz-string';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

// Everything about the URL lives here, not in dots-and-lines. The library only
// promises that `JSON.stringify(sceneState)` can be passed back to
// `useSceneState`.
const PARAM = 'board';
const SAVE_DELAY_MS = 200;

const STARTING_BOARD: CreateSceneStateOptions = {
  defaultDots: [
    { id: 'a', x: 80, y: 80 },
    { id: 'b', x: 380, y: 200 },
  ],
  defaultLines: [
    {
      id: 'first',
      // Ends on A's right edge and the middle of B's top edge.
      route: seedElbowPoints({ x: 190, y: 106 }, { x: 435, y: 200 }),
    },
  ],
};

function loadBoard(): CreateSceneStateOptions {
  const encoded = new URLSearchParams(window.location.search).get(PARAM);
  if (!encoded) return STARTING_BOARD;
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    const parsed: unknown = JSON.parse(json);
    // The Scene's state drops anything in here that isn't valid.
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as CreateSceneStateOptions;
    }
  } catch {
    // Corrupt link: start from the default board.
  }
  return STARTING_BOARD;
}

function saveBoard(json: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, LZString.compressToEncodedURIComponent(json));
  window.history.replaceState(null, '', url);
}

export function UrlStateExample() {
  const [initialBoard] = useState(loadBoard);
  const sceneState = useSceneState(initialBoard);
  const mode = useScene(sceneState, (s) => s.getMode());
  const dots = useScene(sceneState, (s) => s.getDots());
  const lines = useScene(sceneState, (s) => s.getLines());
  // The Dot or line just added starts selected, ready to move.
  const [newId, setNewId] = useState<string | null>(null);

  // `sceneState` never changes identity, so this subscribes once. The state
  // notifies on every drag move, so save after a pause.
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = sceneState.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => saveBoard(JSON.stringify(sceneState)),
        SAVE_DELAY_MS,
      );
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [sceneState]);

  const reset = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM);
    window.history.replaceState(null, '', url);
    window.location.reload();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => {
            const id = sceneState.addDot({
              x: 60 + (dots.length % 6) * 30,
              y: 280 + (dots.length % 6) * 20,
            });
            setNewId(id);
          }}
        >
          Add Dot
        </button>
        <button
          type="button"
          onClick={() =>
            sceneState.setMode(mode === 'connect' ? 'select' : 'connect')
          }
        >
          {mode === 'connect' ? 'Cancel' : 'Add line'}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <span className={styles.note}>
          Move things, bend a line, pan or zoom, then reload: the board is in
          the URL (<code>?{PARAM}=</code>).
        </span>
      </div>
      <Stage>
        <Scene
          state={sceneState}
          onConnect={({ start, end }) =>
            setNewId(sceneState.addLine({ route: seedElbowPoints(start, end) }))
          }
        >
          {dots.map((dot) => (
            <Dot
              key={dot.id}
              x={dot.x}
              y={dot.y}
              autoFocus={dot.id === newId}
              onMove={(x, y) => sceneState.moveDot(dot.id, x, y)}
              overlay={
                <button
                  type="button"
                  className={`${styles.chip} ${styles.dotChip}`}
                  // Lines attached to it keep a free end.
                  onClick={() => sceneState.removeDot(dot.id)}
                >
                  Delete Dot
                </button>
              }
            >
              <div className={styles.card}>{dot.id.slice(0, 8)}</div>
            </Dot>
          ))}
          {lines.map((line) => (
            <ElbowLine
              key={line.id}
              initialRoute={line.route}
              autoFocus={line.id === newId}
              className={styles.line}
              handle={<span className={styles.handle} />}
              onRouteChange={(route) => sceneState.setLineRoute(line.id, route)}
              overlay={
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => sceneState.removeLine(line.id)}
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
