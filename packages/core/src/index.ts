// @dots-and-lines/core: framework-agnostic, DOM-free.

export type { Point, View, Mode, ZoomLimits } from './types';

export { createSceneState } from './create-scene-state';
export type { SceneState, CreateSceneStateOptions } from './create-scene-state';

// Camera/input maths. Used by framework adapters (e.g. @dots-and-lines/react).
export { resolveInput } from './resolve-input';
export type { InputEvent } from './resolve-input';
export type { ViewAction } from './apply-view-action';

// Elbow-line geometry. Used by framework adapters (ElbowLine owns its route).
export { seedElbowPoints } from './seed-elbow-points';
export { moveElbowSegment } from './move-elbow-segment';
export { moveElbowEnd } from './move-elbow-end';
export { lineSegments } from './line-segments';
export type { ElbowSegment } from './line-segments';
