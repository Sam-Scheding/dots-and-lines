import { useCallback, useState, type FocusEvent } from 'react';

/**
 * Whether focus is inside an element, the way `:focus-within` sees it. This is
 * what "selected" means: the browser's own focus, so there is no second
 * source of truth to keep in step.
 *
 * Attach `onFocus` and `onBlur` to the element. React's focus events bubble,
 * so focus anywhere inside it (a handle, a button in an overlay) counts.
 */
export function useFocusWithin() {
  const [focused, setFocused] = useState(false);

  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    // Focus moving to something else inside the element isn't leaving it.
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setFocused(false);
  }, []);

  return { focused, onFocus, onBlur };
}
