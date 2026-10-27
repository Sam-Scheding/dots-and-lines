import type { ElbowSegment } from '@dots-and-lines/core';
import type { CSSProperties } from 'react';

/** Line thickness: the consumer sets `--dl-line-size`, e.g. on the Stage. */
export const LINE_SIZE = 'var(--dl-line-size, 2px)';

/** `base` plus half a line thickness for each joint the segment extends past. */
function extended(base: number, joints: 0 | 1 | 2): string {
  if (joints === 0) return `${base}px`;
  return `calc(${base}px + ${joints === 1 ? `${LINE_SIZE} / 2` : LINE_SIZE})`;
}

export function segmentStyle(
  segment: ElbowSegment,
  segmentCount: number,
): CSSProperties {
  // Extend into interior corners by half the thickness so they join cleanly.
  // Line ends are left flush with the point.
  const startIsMin =
    segment.orientation === 'h'
      ? segment.start.x <= segment.end.x
      : segment.start.y <= segment.end.y;
  const startJoint = segment.index > 0;
  const endJoint = segment.index < segmentCount - 1;
  const minJoint = startIsMin ? startJoint : endJoint;
  const maxJoint = startIsMin ? endJoint : startJoint;
  const joints = ((minJoint ? 1 : 0) + (maxJoint ? 1 : 0)) as 0 | 1 | 2;

  const base: CSSProperties = { position: 'absolute', pointerEvents: 'none' };
  if (segment.orientation === 'h') {
    return {
      ...base,
      left: minJoint
        ? `calc(${segment.x}px - ${LINE_SIZE} / 2)`
        : `${segment.x}px`,
      top: `calc(${segment.y}px - ${LINE_SIZE} / 2)`,
      width: extended(segment.length, joints),
      height: LINE_SIZE,
    };
  }
  return {
    ...base,
    left: `calc(${segment.x}px - ${LINE_SIZE} / 2)`,
    top: minJoint
      ? `calc(${segment.y}px - ${LINE_SIZE} / 2)`
      : `${segment.y}px`,
    width: LINE_SIZE,
    height: extended(segment.length, joints),
  };
}
