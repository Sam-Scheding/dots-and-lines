import type { ReactNode, Ref } from 'react';

import styles from './styles.module.css';

type StageProps = {
  /** The element the Scene fills; useful for measuring its size. */
  ref?: Ref<HTMLDivElement>;
  /** Draw a 20px grid behind the Scene. Only lines up when pan/zoom is off. */
  grid?: boolean;
  /**
   * Pass the Scene's view so the grid pans and zooms with it. Without it the
   * grid stays put on the screen.
   */
  gridView?: { panX: number; panY: number; zoom: number };
  children: ReactNode;
};

/** Grid cell size, in Scene px (matches the CSS default of 20px). */
const GRID_SIZE = 20;

/** A sized box for a Scene to fill. Shared by every example. */
export function Stage({ ref, grid = false, gridView, children }: StageProps) {
  return (
    <div
      ref={ref}
      className={grid ? `${styles.stage} ${styles.grid}` : styles.stage}
      style={
        grid && gridView
          ? {
              backgroundSize: `${GRID_SIZE * gridView.zoom}px ${GRID_SIZE * gridView.zoom}px`,
              backgroundPosition: `${gridView.panX}px ${gridView.panY}px`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
