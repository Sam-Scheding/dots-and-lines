import { elbowSegmentOrientation } from '../elbow-segment-orientation';
import type { Point } from '../types';

export type ElbowSegment = {
  /** Index of the segment's first point in `points`. */
  index: number;
  orientation: 'h' | 'v';
  start: Point;
  end: Point;
  midpoint: Point;
  /** Top-left of the segment's bounding box. */
  x: number;
  y: number;
  /** Extent along the segment's axis. */
  length: number;
};

/** Describe each segment of an elbow path (one per consecutive point pair). */
export function lineSegments(points: readonly Point[]): ElbowSegment[] {
  const segments: ElbowSegment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const orientation = elbowSegmentOrientation(start, end);
    segments.push({
      index,
      orientation,
      start: { ...start },
      end: { ...end },
      midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      length:
        orientation === 'h'
          ? Math.abs(end.x - start.x)
          : Math.abs(end.y - start.y),
    });
  }
  return segments;
}
