import type { ComponentType } from 'react';

import { DotExample } from './dot';
import { DotClickableContentExample } from './dot-clickable-content';
import { DotOverlayExample } from './dot-overlay';
import { DotSelectableCardExample } from './dot-selectable-card';
import { DotSizingExample } from './dot-sizing';
import { DotSnapToGridExample } from './dot-snap-to-grid';
import { ElbowLineExample } from './elbow-line';
import { ElbowLineJsxExample } from './elbow-line-jsx';
import { ElbowLineOverlayExample } from './elbow-line-overlay';
import { ElbowLineRoundedExample } from './elbow-line-rounded';
import { MagneticDotsExample } from './magnetic-dots';
import { MagneticOffExample } from './magnetic-off';
import { PanZoomDisabledExample } from './pan-zoom-disabled';
import { PersistViewExample } from './persist-view';
import { ToolbarExample } from './toolbar';
import { UseSelectedExample } from './use-selected';
import { ZoomControlsExample } from './zoom-controls';

export type Example = {
  /** Used as the URL hash: `#/dot`. */
  id: string;
  title: string;
  /** One sentence: what you can do here. */
  description: string;
  Component: ComponentType;
};

export const examples: Example[] = [
  {
    id: 'dot',
    title: 'Dot',
    description: 'A Dot on a Scene that you can drag around.',
    Component: DotExample,
  },
  {
    id: 'dot-sizing',
    title: 'Dot sizing',
    description:
      'A Dot is as large as its children: short text, wrapping text and a fixed box.',
    Component: DotSizingExample,
  },
  {
    id: 'dot-overlay',
    title: 'Dot overlay',
    description: 'A chip that appears beside a Dot while it is selected.',
    Component: DotOverlayExample,
  },
  {
    id: 'dot-clickable-content',
    title: 'Dot with clickable content',
    description: 'A button inside a Dot still clicks; dragging it still drags.',
    Component: DotClickableContentExample,
  },
  {
    id: 'dot-selectable-card',
    title: 'Dot with a selectable Card',
    description:
      'Leave off the Dot’s id and let a focusable Card show its own selected style.',
    Component: DotSelectableCardExample,
  },
  {
    id: 'dot-snap-to-grid',
    title: 'Dot snap to grid',
    description: 'Follow the pointer while dragging, then snap on release.',
    Component: DotSnapToGridExample,
  },
  {
    id: 'elbow-line-jsx',
    title: 'Elbow line in JSX',
    description:
      'Declare a line with two initial points. It starts as an L, and you reshape it from there.',
    Component: ElbowLineJsxExample,
  },
  {
    id: 'elbow-line',
    title: 'Elbow line',
    description:
      'Add a line by clicking twice, then reshape it by dragging its handles.',
    Component: ElbowLineExample,
  },
  {
    id: 'magnetic-dots',
    title: 'Magnetic Dots',
    description:
      'A line attached to two Dots follows them; drag an end next to a Dot to snap, away to let go.',
    Component: MagneticDotsExample,
  },
  {
    id: 'magnetic-off',
    title: 'Magnetic off',
    description:
      'isMagnetic={false} on the Dots: a line ignores them. Toggle it to compare.',
    Component: MagneticOffExample,
  },
  {
    id: 'elbow-line-overlay',
    title: 'Elbow line overlay',
    description: 'A toolbar that appears on the selected line.',
    Component: ElbowLineOverlayExample,
  },
  {
    id: 'elbow-line-rounded',
    title: 'Elbow line, rounded',
    description:
      'A border-radius in the line’s className rounds its corners, up to half its thickness.',
    Component: ElbowLineRoundedExample,
  },
  {
    id: 'use-selected',
    title: 'useSelected',
    description:
      'Content inside a Dot learns whether the Dot is selected, with no callbacks.',
    Component: UseSelectedExample,
  },
  {
    id: 'zoom-controls',
    title: 'Zoom controls',
    description: 'Zoom buttons and a percentage label, with zoom limits.',
    Component: ZoomControlsExample,
  },
  {
    id: 'toolbar',
    title: 'Toolbar',
    description:
      'Pan and zoom from buttons or from the mouse / trackpad, in the same camera.',
    Component: ToolbarExample,
  },
  {
    id: 'pan-zoom-disabled',
    title: 'Pan and zoom off',
    description:
      'Turn off wheel and drag navigation; only your own UI moves the camera.',
    Component: PanZoomDisabledExample,
  },
  {
    id: 'persist-view',
    title: 'Remember the camera',
    description: 'Save pan and zoom, and restore them after a reload.',
    Component: PersistViewExample,
  },
];
