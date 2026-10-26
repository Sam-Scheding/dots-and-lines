import type { View } from '@dots-and-lines/core';
import { Dot, Scene, useSceneState } from '@dots-and-lines/react';
import { useEffect, useState } from 'react';

import styles from './styles.module.css';
import { Stage } from '../stage';

const STORAGE_KEY = 'dots-and-lines:persist-view';

function loadView(): View | undefined {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? 'null',
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'panX' in parsed &&
      'panY' in parsed &&
      'zoom' in parsed &&
      typeof parsed.panX === 'number' &&
      typeof parsed.panY === 'number' &&
      typeof parsed.zoom === 'number'
    ) {
      return { panX: parsed.panX, panY: parsed.panY, zoom: parsed.zoom };
    }
  } catch {
    // Missing or corrupt: start from the default view.
  }
  return undefined;
}

export function PersistViewExample() {
  const [initialView] = useState(loadView);
  const sceneState = useSceneState({ defaultView: initialView });

  // `sceneState` never changes identity, so this subscribes once.
  useEffect(
    () =>
      sceneState.subscribe(() => {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(sceneState.getView()),
        );
      }),
    [sceneState],
  );

  return (
    <>
      <p className={styles.note}>
        Pan and zoom, then reload the page: the camera comes back where you left
        it.
      </p>
      <Stage>
        <Scene state={sceneState}>
          <Dot x={80} y={80}>
            <div className={styles.staticCard}>Anchor</div>
          </Dot>
          <Dot x={360} y={200}>
            <div className={styles.staticCard}>Another</div>
          </Dot>
        </Scene>
      </Stage>
    </>
  );
}
