import { useEffect, useRef, type RefObject } from 'react';

/** Keep the latest value in a ref so long-lived event listeners never go stale. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
