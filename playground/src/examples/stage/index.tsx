import type { ReactNode, Ref } from 'react';

import styles from './styles.module.css';

type StageProps = {
  /** The element the Scene fills; useful for measuring its size. */
  ref?: Ref<HTMLDivElement>;
  /** Draw a 20px grid behind the Scene. Only lines up when pan/zoom is off. */
  grid?: boolean;
  children: ReactNode;
};

/** A sized box for a Scene to fill. Shared by every example. */
export function Stage({ ref, grid = false, children }: StageProps) {
  return (
    <div
      ref={ref}
      className={grid ? `${styles.stage} ${styles.grid}` : styles.stage}
    >
      {children}
    </div>
  );
}
