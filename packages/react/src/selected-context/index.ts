import { createContext, useContext } from 'react';

/** Provided by each `Dot` and `ElbowLine` to everything it renders. */
export const SelectedContext = createContext<boolean | null>(null);

/**
 * Whether the nearest `Dot` or `ElbowLine` is selected, meaning focus is
 * somewhere inside it. Call it from a component rendered inside one, such as
 * the children of a Dot.
 */
export function useSelected(): boolean {
  const selected = useContext(SelectedContext);
  if (selected === null) {
    throw new Error(
      'useSelected() must be called inside a <Dot> or an <ElbowLine>.',
    );
  }
  return selected;
}
