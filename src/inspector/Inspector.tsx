import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ChevronDown } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useIsMobile } from '@/lib/hooks';
import { MobileSheet } from '@/sidebar/Sidebar';
import type { CanvasComponent, ComponentRole } from '@/types';
import { cn } from '@/lib/utils';

// ─── Field components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const originalRef = useRef<string>(value);

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => { originalRef.current = e.target.value; }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          e.stopPropagation();
          onChange(originalRef.current);
        }
      }}
      placeholder={placeholder}
      className="w-full min-w-0 px-2.5 py-1.5 text-xs bg-surface-raised border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

const UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const;

function parseValueAndUnit(
  value: number | string | undefined
): { numericValue: number | ''; unit: string } {
  if (value === undefined || value === 'auto') {
    return { numericValue: '', unit: 'px' };
  }
  if (typeof value === 'number') {
    return { numericValue: value, unit: 'px' };
  }
  const match = value.match(/^(\d*\.?\d*)(.*)$/);
  if (match) {
    return {
      numericValue: match[1] ? Number(match[1]) : '',
      unit: match[2] || 'px',
    };
  }
  return { numericValue: '', unit: 'px' };
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | string | undefined;
  onChange: (v: number | string) => void;
  placeholder?: string;
}) {
  const { numericValue, unit: currentUnit } = parseValueAndUnit(value);
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUnitChange = (newUnit: string) => {
    if (numericValue !== '') {
      onChange(`${numericValue}${newUnit}`);
    }
    setIsUnitSelectorOpen(false);
  };

  const handleNumericChange = (newVal: string) => {
    const num = newVal === '' ? '' : Number(newVal);
    if (newVal === '') {
      onChange('auto');
    } else {
      onChange(`${num}${currentUnit}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsUnitSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="flex min-w-0">
        <input
          type="number"
          value={numericValue}
          onChange={(e) => handleNumericChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 px-2.5 py-1.5 pr-9 text-xs bg-surface-raised border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={() => setIsUnitSelectorOpen(!isUnitSelectorOpen)}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-1 text-[9px] text-primary font-medium rounded hover:bg-primary/10 transition-colors"
        >
          {currentUnit}
        </button>
      </div>
      <AnimatePresence>
        {isUnitSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 bg-surface-raised border border-border rounded-md shadow-lg z-50 overflow-hidden"
          >
            {UNITS.map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={cn(
                  "w-full px-3 py-1.5 text-[10px] text-left transition-colors",
                  u === currentUnit
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-overlay"
                )}
              >
                {u}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextareaField({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const originalRef = useRef<string>(value);

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => { originalRef.current = e.target.value; }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          e.stopPropagation();
          onChange(originalRef.current);
        }
      }}
      rows={rows ?? 3}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 text-xs bg-surface-raised border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
    />
  );
}

// ─── Side input (compact, no unit selector) ──────────────────────────────────

function SideInput({
  value,
  onChange,
  sideLabel,
}: {
  value: number | string | undefined;
  onChange: (v: number | undefined) => void;
  sideLabel: string;
}) {
  const num = value === undefined || value === 'auto' ? '' : typeof value === 'number' ? value : parseFloat(value as string) || '';
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/40 pointer-events-none select-none z-10">
        {sideLabel}
      </span>
      <input
        type="number"
        value={num}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="—"
        className="w-full pl-5 pr-2 py-1.5 text-xs bg-surface-raised border border-border rounded-md text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

// ─── Spacing control (global + per-side toggle) ───────────────────────────────

function SpacingControl({
  label,
  allValue,
  topValue,
  rightValue,
  bottomValue,
  leftValue,
  onAll,
  onTop,
  onRight,
  onBottom,
  onLeft,
}: {
  label: string;
  allValue: number | string | undefined;
  topValue: number | string | undefined;
  rightValue: number | string | undefined;
  bottomValue: number | string | undefined;
  leftValue: number | string | undefined;
  onAll: (v: number | string) => void;
  onTop: (v: number | undefined) => void;
  onRight: (v: number | undefined) => void;
  onBottom: (v: number | undefined) => void;
  onLeft: (v: number | undefined) => void;
}) {
  const hasIndividual = topValue !== undefined || rightValue !== undefined || bottomValue !== undefined || leftValue !== undefined;
  const [expanded, setExpanded] = useState(hasIndividual);

  useEffect(() => {
    if (hasIndividual) setExpanded(true);
  }, [hasIndividual]);

  const toggle = () => {
    if (expanded) {
      onTop(undefined);
      onRight(undefined);
      onBottom(undefined);
      onLeft(undefined);
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          onClick={toggle}
          title={expanded ? 'Single value' : 'Per side'}
          className={cn(
            'w-5 h-5 rounded flex items-center justify-center transition-colors',
            expanded ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-surface-raised',
          )}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="0.75" y="0.75" width="3.5" height="3.5" rx="0.75" />
            <rect x="6.75" y="0.75" width="3.5" height="3.5" rx="0.75" />
            <rect x="0.75" y="6.75" width="3.5" height="3.5" rx="0.75" />
            <rect x="6.75" y="6.75" width="3.5" height="3.5" rx="0.75" />
          </svg>
        </button>
      </div>
      {expanded ? (
        <div className="grid grid-cols-2 gap-2">
          <SideInput sideLabel="T" value={topValue} onChange={onTop} />
          <SideInput sideLabel="R" value={rightValue} onChange={onRight} />
          <SideInput sideLabel="B" value={bottomValue} onChange={onBottom} />
          <SideInput sideLabel="L" value={leftValue} onChange={onLeft} />
        </div>
      ) : (
        <NumberInput value={allValue} onChange={onAll} placeholder="0" />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-5 border-b border-border/50 last:border-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3 px-4">
        {title}
      </p>
      <div className="px-4 space-y-3 min-w-0">{children}</div>
    </div>
  );
}

// ─── Multi Selection Panel ──────────────────────────────────────────────────────

function MultiSelectionPanel({ selectedIds, components }: { selectedIds: string[], components: Record<string, CanvasComponent> }) {
  const removeComponents = useCanvasStore((s) => s.removeComponents);
  const removeComponent = useCanvasStore((s) => s.removeComponent);
  const selectComponent = useCanvasStore((s) => s.selectComponent);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeComponent(id);
  };

  const handleRemoveAll = () => {
    removeComponents(selectedIds);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto py-4 space-y-2 px-2"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-medium text-muted-foreground truncate pr-2">{selectedIds.length} items selected</span>
        <button
          onClick={handleRemoveAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap flex-shrink-0"
          title="Remove all selected"
        >
          <Trash2 size={14} />
          <span>Remove All</span>
        </button>
      </div>

      {selectedIds.map(id => {
        const comp = components[id];
        if (!comp) return null;
        
        const isExpanded = expandedId === id;
        const displayName = comp.name || comp.content?.text || comp.type;

        return (
          <div key={id} className="bg-surface-raised border border-border rounded-lg overflow-hidden flex flex-col">
            {/* Accordion Header */}
            <div 
              className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-surface-overlay transition-colors select-none group"
              onClick={() => toggleExpand(id)}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider truncate">
                  {comp.type}
                </p>
                {displayName !== comp.type && (
                  <p className="text-[10px] text-muted-foreground/70 truncate">
                    {displayName}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => handleRemove(e, id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from canvas"
                >
                  <Trash2 size={12} />
                </button>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground"
                >
                  <ChevronDown size={14} />
                </motion.div>
              </div>
            </div>
            
            {/* Accordion Content */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border/50"
                >
                  <div className="bg-surface/50 pb-2">
                    {/* Render standard InspectorPanel but without the outer scroll wrapper */}
                    <InspectorPanel component={comp} isEmbedded />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Main inspector ───────────────────────────────────────────────────────────

interface InspectorPanelProps {
  component: CanvasComponent;
  isEmbedded?: boolean;
}

const ROLES: ComponentRole[] = [
  'primary-action',
  'secondary-action',
  'destructive-action',
  'navigation',
  'form-field',
  'display',
  'container',
  'header',
  'footer',
  'hero',
  'modal',
];

function InspectorPanel({ component, isEmbedded }: InspectorPanelProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);

  const update = useCallback(
    (path: 'layout' | 'content' | 'semantic', key: string, value: unknown) => {
      updateComponent(component.id, {
        [path]: { ...component[path], [key]: value },
      });
    },
    [component, updateComponent]
  );

  const Wrapper = isEmbedded ? 'div' : motion.div;
  const wrapperProps = isEmbedded ? { className: "py-2 space-y-4" } : {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 8 },
    transition: { duration: 0.2 },
    className: "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4"
  };

  return (
    <Wrapper {...wrapperProps}>
      {/* General */}
      <Section title="General">
        <div className="space-y-1">
          <Label>Name</Label>
          <TextInput
            value={component.name}
            onChange={(v) => updateComponent(component.id, { name: v })}
          />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <div className="px-2.5 py-1.5 text-xs bg-muted border border-border rounded-md text-muted-foreground font-mono">
            {component.type}
          </div>
        </div>
      </Section>

      {/* Layout */}
      <Section title="Layout">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Width</Label>
            <NumberInput
              value={component.layout.width}
              onChange={(v) => update('layout', 'width', v)}
              placeholder="auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Height</Label>
            <NumberInput
              value={component.layout.height}
              onChange={(v) => update('layout', 'height', v)}
              placeholder="auto"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Gap</Label>
            <NumberInput
              value={component.layout.gap}
              onChange={(v) => update('layout', 'gap', v)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Radius</Label>
            <NumberInput
              value={component.layout.borderRadius}
              onChange={(v) => update('layout', 'borderRadius', v)}
              placeholder="0"
            />
          </div>
        </div>
        <SpacingControl
          label="Padding"
          allValue={component.layout.padding}
          topValue={component.layout.paddingTop}
          rightValue={component.layout.paddingRight}
          bottomValue={component.layout.paddingBottom}
          leftValue={component.layout.paddingLeft}
          onAll={(v) => update('layout', 'padding', v)}
          onTop={(v) => update('layout', 'paddingTop', v)}
          onRight={(v) => update('layout', 'paddingRight', v)}
          onBottom={(v) => update('layout', 'paddingBottom', v)}
          onLeft={(v) => update('layout', 'paddingLeft', v)}
        />
        <SpacingControl
          label="Margin"
          allValue={component.layout.margin}
          topValue={component.layout.marginTop}
          rightValue={component.layout.marginRight}
          bottomValue={component.layout.marginBottom}
          leftValue={component.layout.marginLeft}
          onAll={(v) => update('layout', 'margin', v)}
          onTop={(v) => update('layout', 'marginTop', v)}
          onRight={(v) => update('layout', 'marginRight', v)}
          onBottom={(v) => update('layout', 'marginBottom', v)}
          onLeft={(v) => update('layout', 'marginLeft', v)}
        />
      </Section>

      {/* Content */}
      {Object.keys(component.content).filter(k => {
        const val = component.content[k as keyof typeof component.content];
        return val !== undefined && val !== null;
      }).length > 0 && (
        <Section title="Content">
          {component.content.title !== undefined && (
            <div className="space-y-1">
              <Label>Title</Label>
              <TextInput
                value={component.content.title ?? ''}
                onChange={(v) => update('content', 'title', v)}
                placeholder="Title text"
              />
            </div>
          )}
          {component.content.subtitle !== undefined && (
            <div className="space-y-1">
              <Label>Subtitle</Label>
              <TextInput
                value={component.content.subtitle ?? ''}
                onChange={(v) => update('content', 'subtitle', v)}
                placeholder="Subtitle text"
              />
            </div>
          )}
          {component.content.label !== undefined && (
            <div className="space-y-1">
              <Label>Label</Label>
              <TextInput
                value={component.content.label ?? ''}
                onChange={(v) => update('content', 'label', v)}
                placeholder="Label"
              />
            </div>
          )}
          {component.content.text !== undefined && (
            <div className="space-y-1">
              <Label>Text</Label>
              <TextareaField
                value={component.content.text ?? ''}
                onChange={(v) => update('content', 'text', v)}
                placeholder="Body text"
                rows={3}
              />
            </div>
          )}
          {component.content.placeholder !== undefined && (
            <div className="space-y-1">
              <Label>Placeholder</Label>
              <TextInput
                value={component.content.placeholder ?? ''}
                onChange={(v) => update('content', 'placeholder', v)}
                placeholder="Placeholder text"
              />
            </div>
          )}
          {component.content.href !== undefined && (
            <div className="space-y-1">
              <Label>Link</Label>
              <TextInput
                value={component.content.href ?? ''}
                onChange={(v) => update('content', 'href', v)}
                placeholder="https://..."
              />
            </div>
          )}
          {component.content.src !== undefined && (
            <div className="space-y-1">
              <Label>Source URL</Label>
              <TextInput
                value={component.content.src ?? ''}
                onChange={(v) => update('content', 'src', v)}
                placeholder="https://..."
              />
            </div>
          )}
          {component.content.alt !== undefined && (
            <div className="space-y-1">
              <Label>Alt text</Label>
              <TextInput
                value={component.content.alt ?? ''}
                onChange={(v) => update('content', 'alt', v)}
                placeholder="Image description"
              />
            </div>
          )}
        </Section>
      )}

      {/* Semantic — only show when there's actual non-empty content */}
      {(!!component.semantic?.role || !!component.semantic?.description) && (
        <Section title="Semantic">
          {component.semantic.role !== undefined && (
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                value={component.semantic.role ?? ''}
                onChange={(e) => update('semantic', 'role', e.target.value as ComponentRole)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-raised border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          {component.semantic.description !== undefined && (
            <div className="space-y-1">
              <Label>Description</Label>
              <TextareaField
                value={component.semantic.description ?? ''}
                onChange={(v) => update('semantic', 'description', v)}
                placeholder="Describe this component's purpose for AI context"
                rows={2}
              />
            </div>
          )}
        </Section>
      )}
    </Wrapper>
  );
}

// ─── Inspector wrapper ─────────────────────────────────────────────────────────

function buildBreadcrumb(
  id: string,
  components: Record<string, import('@/types').CanvasComponent>
): string[] {
  const crumbs: string[] = [];
  let cur: import('@/types').CanvasComponent | undefined = components[id];
  while (cur) {
    if (cur.name?.trim()) crumbs.unshift(cur.name.trim());
    cur = cur.parentId ? components[cur.parentId] : undefined;
  }
  return crumbs;
}

function InspectorBody({
  selectedIds,
  selectedComponent,
  components,
  breadcrumb,
  removeComponent,
  selectComponent,
}: {
  selectedIds: string[];
  selectedComponent: import('@/types').CanvasComponent | null;
  components: Record<string, import('@/types').CanvasComponent>;
  breadcrumb: string[];
  removeComponent: (id: string) => void;
  selectComponent: (id: string) => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {selectedIds.length > 1
                ? 'Multiple Selection'
                : selectedComponent
                ? selectedComponent.type
                : 'Inspector'}
            </p>
            {selectedIds.length > 1 ? (
              <p className="text-[10px] text-muted-foreground/70 truncate">{selectedIds.length} items selected</p>
            ) : selectedComponent && (selectedComponent.name || selectedComponent.content?.text) ? (
              <p className="text-[10px] text-muted-foreground/70 truncate">
                {Array.from(new Set([selectedComponent.name, selectedComponent.content?.text]
                  .filter((v) => v && v.trim().length > 0))).join(' - ')}
              </p>
            ) : null}
          </div>
          {selectedIds.length === 1 && selectedComponent && (
            <button
              onClick={() => removeComponent(selectedComponent.id)}
              className="w-5 h-5 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0 ml-2"
              title="Delete component"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        {breadcrumb.length > 1 && (
          <div className="flex items-center gap-1 mt-1.5 overflow-x-auto">
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1;
              let cur: import('@/types').CanvasComponent | undefined = selectedComponent!;
              for (let j = breadcrumb.length - 1 - i; j > 0; j--) {
                cur = cur?.parentId ? components[cur.parentId] : undefined;
              }
              const crumbId = cur?.id;
              return (
                <div key={i} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <span className="text-muted-foreground/30 text-[9px]">›</span>}
                  <button
                    onClick={() => crumbId && !isLast && selectComponent(crumbId)}
                    className={cn('text-[10px] font-medium truncate max-w-[60px]',
                      isLast ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground cursor-pointer')}
                    title={crumb}
                  >
                    {crumb}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedIds.length > 1 ? (
          <MultiSelectionPanel key="multi" selectedIds={selectedIds} components={components} />
        ) : selectedComponent ? (
          <InspectorPanel key={selectedComponent.id} component={selectedComponent} />
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/60">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-muted-foreground">No selection</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Click a component to inspect</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const Inspector = memo(function Inspector() {
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const components = useCanvasStore((s) => s.components);
  const inspectorCollapsed = useUIStore((s) => s.inspectorCollapsed);
  const mobilePanelOpen = useUIStore((s) => s.mobilePanelOpen);
  const setMobilePanelOpen = useUIStore((s) => s.setMobilePanelOpen);
  const removeComponent = useCanvasStore((s) => s.removeComponent);
  const selectComponent = useCanvasStore((s) => s.selectComponent);
  const isMobile = useIsMobile();

  const selectedComponent =
    selectedIds.length === 1 ? components[selectedIds[0]] : null;

  const breadcrumb = selectedComponent
    ? buildBreadcrumb(selectedComponent.id, components)
    : [];

  const bodyProps = { selectedIds, selectedComponent, components, breadcrumb, removeComponent, selectComponent };

  // ── Mobile: bottom sheet ─────────────────────────────────────────────────
  if (isMobile) {
    const isOpen = mobilePanelOpen === 'inspector';
    return (
      <AnimatePresence>
        {isOpen && (
          <MobileSheet key="inspector-sheet" onClose={() => setMobilePanelOpen(null)} title="Inspector" maxHeight="85vh">
            <InspectorBody {...bodyProps} />
          </MobileSheet>
        )}
      </AnimatePresence>
    );
  }

  // ── Desktop: side panel ──────────────────────────────────────────────────
  return (
    <AnimatePresence initial={false}>
      {!inspectorCollapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 border-l border-border bg-surface overflow-hidden flex flex-col"
        >
          <InspectorBody {...bodyProps} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
});
