import { elbowSegmentOrientation } from '../elbow-segment-orientation';
import type { Point } from '../types';
import { normalizeElbowPoints } from '../normalize-elbow-points';

const EPSILON = 1e-9;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

/**
 * Move an orthogonal elbow segment by a delta.
 * Interior segments move only on the perpendicular axis.
 * End segments (touching the start or end of the line) insert a new stub when dragged perpendicular to their axis.
 */
export function moveElbowSegment(
  points: readonly Point[],
  segmentIndex: number,
  dx: number,
  dy: number,
): Point[] {
  if (points.length < 2) {
    return points.map((point) => ({ ...point }));
  }

  const lastSegmentIndex = points.length - 2;
  if (segmentIndex < 0 || segmentIndex > lastSegmentIndex) {
    return points.map((point) => ({ ...point }));
  }

  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  const orientation = elbowSegmentOrientation(start, end);
  const isStartAdjacent = segmentIndex === 0;
  const isEndAdjacent = segmentIndex === lastSegmentIndex;

  if (orientation === 'h') {
    if (!nearlyEqual(dy, 0)) {
      if (isStartAdjacent) {
        return normalizeElbowPoints(moveStartAdjacentHorizontal(points, dy));
      }
      if (isEndAdjacent) {
        return normalizeElbowPoints(moveEndAdjacentHorizontal(points, dy));
      }
      return normalizeElbowPoints(
        moveInteriorHorizontal(points, segmentIndex, dy),
      );
    }

    if (!nearlyEqual(dx, 0) && !isStartAdjacent && !isEndAdjacent) {
      return points.map((point) => ({ ...point }));
    }

    // Parallel resize: move the non-end endpoint along the segment axis.
    if (!nearlyEqual(dx, 0)) {
      return normalizeElbowPoints(resizeHorizontal(points, segmentIndex, dx));
    }

    return points.map((point) => ({ ...point }));
  }

  if (!nearlyEqual(dx, 0)) {
    if (isStartAdjacent) {
      return normalizeElbowPoints(moveStartAdjacentVertical(points, dx));
    }
    if (isEndAdjacent) {
      return normalizeElbowPoints(moveEndAdjacentVertical(points, dx));
    }
    return normalizeElbowPoints(moveInteriorVertical(points, segmentIndex, dx));
  }

  if (!nearlyEqual(dy, 0) && !isStartAdjacent && !isEndAdjacent) {
    return points.map((point) => ({ ...point }));
  }

  if (!nearlyEqual(dy, 0)) {
    return normalizeElbowPoints(resizeVertical(points, segmentIndex, dy));
  }

  return points.map((point) => ({ ...point }));
}

function moveInteriorHorizontal(
  points: readonly Point[],
  segmentIndex: number,
  dy: number,
): Point[] {
  return points.map((point, index) => {
    if (index === segmentIndex || index === segmentIndex + 1) {
      return { x: point.x, y: point.y + dy };
    }
    return { ...point };
  });
}

function moveInteriorVertical(
  points: readonly Point[],
  segmentIndex: number,
  dx: number,
): Point[] {
  return points.map((point, index) => {
    if (index === segmentIndex || index === segmentIndex + 1) {
      return { x: point.x + dx, y: point.y };
    }
    return { ...point };
  });
}

function moveStartAdjacentHorizontal(
  points: readonly Point[],
  dy: number,
): Point[] {
  const first = points[0];
  const next = points[1];
  const movedY = first.y + dy;
  return [
    { ...first },
    { x: first.x, y: movedY },
    { x: next.x, y: movedY },
    ...points.slice(2).map((point) => ({ ...point })),
  ];
}

function moveStartAdjacentVertical(
  points: readonly Point[],
  dx: number,
): Point[] {
  const first = points[0];
  const next = points[1];
  const movedX = first.x + dx;
  return [
    { ...first },
    { x: movedX, y: first.y },
    { x: movedX, y: next.y },
    ...points.slice(2).map((point) => ({ ...point })),
  ];
}

function moveEndAdjacentHorizontal(
  points: readonly Point[],
  dy: number,
): Point[] {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const movedY = last.y + dy;
  return [
    ...points.slice(0, -2).map((point) => ({ ...point })),
    { x: prev.x, y: movedY },
    { x: last.x, y: movedY },
    { ...last },
  ];
}

function moveEndAdjacentVertical(
  points: readonly Point[],
  dx: number,
): Point[] {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const movedX = last.x + dx;
  return [
    ...points.slice(0, -2).map((point) => ({ ...point })),
    { x: movedX, y: prev.y },
    { x: movedX, y: last.y },
    { ...last },
  ];
}

function resizeHorizontal(
  points: readonly Point[],
  segmentIndex: number,
  dx: number,
): Point[] {
  const lastSegmentIndex = points.length - 2;
  return points.map((point, index) => {
    if (segmentIndex === 0 && index === 1) {
      return { x: point.x + dx, y: point.y };
    }
    if (segmentIndex === lastSegmentIndex && index === points.length - 2) {
      return { x: point.x + dx, y: point.y };
    }
    if (
      segmentIndex !== 0 &&
      segmentIndex !== lastSegmentIndex &&
      (index === segmentIndex || index === segmentIndex + 1)
    ) {
      return { x: point.x + dx, y: point.y };
    }
    return { ...point };
  });
}

function resizeVertical(
  points: readonly Point[],
  segmentIndex: number,
  dy: number,
): Point[] {
  const lastSegmentIndex = points.length - 2;
  return points.map((point, index) => {
    if (segmentIndex === 0 && index === 1) {
      return { x: point.x, y: point.y + dy };
    }
    if (segmentIndex === lastSegmentIndex && index === points.length - 2) {
      return { x: point.x, y: point.y + dy };
    }
    if (
      segmentIndex !== 0 &&
      segmentIndex !== lastSegmentIndex &&
      (index === segmentIndex || index === segmentIndex + 1)
    ) {
      return { x: point.x, y: point.y + dy };
    }
    return { ...point };
  });
}
