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
import { useRef, useState } from 'react';

import styles from './styles.module.css';
import { ViewControls } from './view-controls';
import { Stage } from '../stage';
import { zoomAboutCenter } from '../zoom-about-center';

const GRID = 20;
const snap = (value: number) => Math.round(value / GRID) * GRID;

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2;

// Each card is 110 x 52. The first line runs from A's right edge to the
// middle of B's top edge, so it attaches to both when it mounts.
const STARTING_BOARD: CreateSceneStateOptions = {
  zoom: { min: ZOOM_MIN, max: ZOOM_MAX },
  defaultDots: [
    { id: 'dot-1', x: 80, y: 80 },
    { id: 'dot-2', x: 380, y: 200 },
  ],
  defaultLines: [
    {
      id: 'line-1',
      route: seedElbowPoints({ x: 190, y: 106 }, { x: 435, y: 200 }),
    },
  ],
};

export function PlaygroundExample() {
  const sceneState = useSceneState(STARTING_BOARD);
  const stageRef = useRef<HTMLDivElement>(null);
  const mode = useScene(sceneState, (s) => s.getMode());
  const dots = useScene(sceneState, (s) => s.getDots());
  const lines = useScene(sceneState, (s) => s.getLines());
  const panX = useScene(sceneState, (s) => s.getView().panX);
  const panY = useScene(sceneState, (s) => s.getView().panY);
  const zoom = useScene(sceneState, (s) => s.getView().zoom);

  const [snapToGrid, setSnapToGrid] = useState(false);
  // Whether the next Dot you add is magnetic. Each Dot keeps the setting it
  // was added with, so the ones already on the board don't change.
  const [newDotsMagnetic, setNewDotsMagnetic] = useState(true);
  const [nonMagnetic, setNonMagnetic] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // The Dot or line just added starts selected.
  const [newId, setNewId] = useState<string | null>(null);
  const nextNumber = useRef(3);

  const addDot = () => {
    const stage = stageRef.current;
    // The middle of what you can see, in Scene px, nudged so repeated adds
    // don't stack. The card is about 110 x 52.
    const nudge = (dots.length % 5) * GRID;
    const x = ((stage?.clientWidth ?? 400) / 2 - panX) / zoom - 55 + nudge;
    const y = ((stage?.clientHeight ?? 300) / 2 - panY) / zoom - 26 + nudge;
    const id = sceneState.addDot({
      id: `dot-${nextNumber.current++}`,
      x: snapToGrid ? snap(x) : x,
      y: snapToGrid ? snap(y) : y,
    });
    if (id === null) return;
    if (!newDotsMagnetic) setNonMagnetic((ids) => new Set(ids).add(id));
    setNewId(id);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <button type="button" onClick={addDot}>
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

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Dragging Dots</legend>
          <label>
            <input
              type="radio"
              name="dragging"
              checked={!snapToGrid}
              onChange={() => setSnapToGrid(false)}
            />
            Free
          </label>
          <label>
            <input
              type="radio"
              name="dragging"
              checked={snapToGrid}
              onChange={() => setSnapToGrid(true)}
            />
            Snap to grid
          </label>
        </fieldset>

        <label>
          <input
            type="checkbox"
            checked={newDotsMagnetic}
            onChange={(event) => setNewDotsMagnetic(event.target.checked)}
          />
          New Dots are magnetic
        </label>
      </div>
      <Stage ref={stageRef} grid={snapToGrid} gridView={{ panX, panY, zoom }}>
        <Scene
          state={sceneState}
          previewClassName={styles.line}
          onConnect={({ start, end }) =>
            setNewId(sceneState.addLine({ route: seedElbowPoints(start, end) }))
          }
        >
          {dots.map((dot) => (
            <Dot
              key={dot.id}
              x={dot.x}
              y={dot.y}
              isMagnetic={!nonMagnetic.has(dot.id)}
              autoFocus={dot.id === newId}
              onMove={(x, y) =>
                sceneState.moveDot(
                  dot.id,
                  snapToGrid ? snap(x) : x,
                  snapToGrid ? snap(y) : y,
                )
              }
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
              <div className={styles.card}>
                {dot.id}
                <span className={styles.cardNote}>
                  {nonMagnetic.has(dot.id) ? 'not magnetic' : 'magnetic'}
                </span>
              </div>
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
        <ViewControls
          zoom={zoom}
          zoomMin={ZOOM_MIN}
          zoomMax={ZOOM_MAX}
          onZoomChange={(next) =>
            zoomAboutCenter(sceneState, stageRef.current, next / zoom)
          }
          onZoomReset={() =>
            zoomAboutCenter(sceneState, stageRef.current, 1 / zoom)
          }
          onPanDelta={(dx, dy) => sceneState.panBy(dx, dy)}
          onPanReset={() =>
            sceneState.setView({ ...sceneState.getView(), panX: 0, panY: 0 })
          }
        />
      </Stage>
    </>
  );
}
