import { useDraggable } from '@dnd-kit/core';
import type { ComponentDefinition } from '@/types';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';

interface Props {
  definition: ComponentDefinition;
}

export function SidebarItem({ definition }: Props) {
  const addComponent = useCanvasStore((s) => s.addComponent);
  const deviceMode = useCanvasStore((s) => s.deviceMode);
  const splitActiveCanvas = useUIStore((s) => s.splitActiveCanvas);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${definition.type}`,
    data: { type: 'sidebar-component', componentType: definition.type },
  });

  const IconComponent = ((Icons as unknown) as Record<string, Icons.LucideIcon>)[definition.icon] ?? Icons.Box;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md',
        'border border-transparent hover:border-border hover:bg-surface-raised',
        'transition-all duration-300 select-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95 shadow-inner',
      )}
      title={definition.description}
      onClick={() => addComponent(definition.type, undefined, undefined, undefined, deviceMode === 'split' ? splitActiveCanvas : undefined)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-6 h-6 rounded bg-muted flex items-center justify-center pointer-events-none">
        <IconComponent size={12} className="text-muted-foreground" />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-foreground leading-tight min-w-0 flex-1 pointer-events-none">{definition.label}</p>
    </div>
  );
}
