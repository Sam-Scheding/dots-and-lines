import type { SceneState } from '@dots-and-lines/core';
import { createContext, useContext } from 'react';

type SceneContextValue = { state: SceneState };

export const SceneContext = createContext<SceneContextValue | null>(null);

/** Internal: lets `Dot` and `ElbowLine` read the camera of their enclosing Scene. */
export function useSceneContext(componentName: string): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) {
    throw new Error(`<${componentName}> must be rendered inside a <Scene>.`);
  }
  return value;
}
