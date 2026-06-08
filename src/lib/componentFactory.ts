import type { CanvasComponent, ComponentType } from '@/types';
import { generateId } from '@/lib/utils';
import { getComponentDefinition } from '@/lib/components';

export function createComponent(
  type: ComponentType,
  overrides: Partial<CanvasComponent> = {}
): CanvasComponent {
  const def = getComponentDefinition(type);
  const now = Date.now();

  const { layout: layoutOverride, content: contentOverride, semantic: semanticOverride, ...restOverrides } = overrides;

  return {
    id: generateId(type.slice(0, 3)),
    type,
    name: def?.label ?? type,
    parentId: null,
    children: [],
    layout: {
      x: 0,
      y: 0,
      width: 'auto',
      height: 'auto',
      ...def?.defaultLayout,
      ...layoutOverride,
    },
    content: { ...def?.defaultContent, ...contentOverride },
    semantic: { ...def?.defaultSemantic, ...semanticOverride },
    locked: false,
    visible: true,
    createdAt: now,
    updatedAt: now,
    ...restOverrides,
  };
}
