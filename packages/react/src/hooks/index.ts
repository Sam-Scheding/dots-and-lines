import {
  createSceneState,
  type CreateSceneStateOptions,
  type SceneState,
} from '@dots-and-lines/core';
import { useState, useSyncExternalStore } from 'react';

/**
 * Create a Scene's state handle. The returned object never changes identity,
 * so calling this hook does not re-render on pan, zoom or mode changes.
 * Options are read once, on the first render.
 */
export function useSceneState(options?: CreateSceneStateOptions): SceneState {
  const [state] = useState(() => createSceneState(options));
  return state;
}

/**
 * Read one value from a Scene's state, and re-render only when that value
 * changes.
 *
 *     const zoom = useScene(sceneState, (s) => s.getView().zoom);
 *     const mode = useScene(sceneState, (s) => s.getMode());
 *
 * The selector must return something stable between changes: a primitive, or
 * an object the state already holds (`getView()`). Building a new object
 * inside the selector re-renders forever.
 */
export function useScene<T>(
  state: SceneState,
  selector: (state: SceneState) => T,
): T {
  const read = () => selector(state);
  return useSyncExternalStore(state.subscribe, read, read);
}
