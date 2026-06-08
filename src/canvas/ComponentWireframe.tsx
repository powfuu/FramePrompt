import type { ReactNode } from 'react';
import type { CanvasComponent } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  component: CanvasComponent;
  isSelected: boolean;
  depth: number;
  children?: ReactNode;
  isResizing?: boolean;
}

const WIREFRAME_BASE = '';

function SkeletonBar({ width = 100, height = 8 }: { width?: number; height?: number }) {
  return <div className="rounded-full bg-muted-foreground/20" style={{ width: `${width}%`, height }} />;
}

function TextBars({ lines = 3, widths }: { lines?: number; widths?: number[] }) {
  const defaultWidths = [100, 85, 70];
  const ws = widths ?? defaultWidths.slice(0, lines);
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar key={i} width={ws[i] ?? 60} />
      ))}
    </div>
  );
}

function InputField({ label, placeholder }: { label?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <div className="text-[10px] font-medium text-muted-foreground/70">{label}</div>}
      <div className="h-9 w-full rounded-md border border-border bg-surface flex items-center px-3">
        <span className="text-[10px] text-muted-foreground/40">{placeholder ?? ''}</span>
      </div>
    </div>
  );
}

function ImagePlaceholder({ height, width }: { height?: number | string, width?: number | string }) {
  return (
    <div
      className="bg-muted flex items-center justify-center relative w-full h-full min-h-[48px] min-w-[48px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/10" />
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/30 relative z-10">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

function AvatarPlaceholder({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </div>
  );
}

export function ComponentWireframe({ component, children, isResizing = false }: Props) {
  const { type, content, layout } = component;

  const containerStyle: React.CSSProperties = {};
  if (isResizing) containerStyle.transition = 'none';
  if (layout.padding) containerStyle.padding = layout.padding;
  if (layout.gap) containerStyle.gap = layout.gap;
  if (typeof layout.borderRadius === 'number') containerStyle.borderRadius = layout.borderRadius;
  if (layout.alignSelf) containerStyle.alignSelf = layout.alignSelf;
  if (layout.justifySelf) containerStyle.justifySelf = layout.justifySelf;
  
  // Apply width; 'auto' → fit-content so flex-stretch doesn't expand to 100%
  if (layout.width !== undefined && layout.width !== 'fit') {
    containerStyle.width = layout.width === 'auto'
      ? 'fit-content'
      : typeof layout.width === 'number' ? `${layout.width}px` : layout.width;
  }
  if (layout.height !== undefined) {
    containerStyle.height = typeof layout.height === 'number' ? `${layout.height}px` : layout.height;
  }

  if (layout.margin !== undefined) containerStyle.margin = layout.margin;
  if (layout.marginTop !== undefined) containerStyle.marginTop = layout.marginTop;
  if (layout.marginRight !== undefined) containerStyle.marginRight = layout.marginRight;
  if (layout.marginBottom !== undefined) containerStyle.marginBottom = layout.marginBottom;
  if (layout.marginLeft !== undefined) containerStyle.marginLeft = layout.marginLeft;

  switch (type) {
    case 'heading':
      return (
        <div className={cn(WIREFRAME_BASE, 'py-1 w-fit')} style={containerStyle}>
          {content.title
            ? <div className="text-sm font-semibold text-foreground/80">{content.title}</div>
            : <div className="h-5 rounded-full bg-foreground/25" style={{ width: '120px' }} />}
        </div>
      );

    case 'text':
      return (
        <div className={cn(WIREFRAME_BASE, 'py-1 w-fit max-w-full')} style={containerStyle}>
          {content.text
            ? <div className="text-xs text-muted-foreground leading-relaxed">{content.text}</div>
            : <TextBars lines={3} />}
        </div>
      );

    case 'button':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-fit h-fit')} style={containerStyle}>
          <div className={cn(
            'inline-flex items-center px-4 py-2 text-xs font-medium justify-center',
            component.semantic.role === 'primary-action'
              ? 'bg-primary/20 border border-primary/30 text-primary/80'
              : 'bg-transparent border border-muted-foreground/30 text-muted-foreground',
          )} style={{ borderRadius: 'inherit' }}>
            {content.label ?? 'Button'}
          </div>
        </div>
      );

    case 'link':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-fit')} style={containerStyle}>
          <span className="text-xs text-primary/70 underline underline-offset-2">
            {content.label ?? 'Link'}
          </span>
        </div>
      );

    case 'badge':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-fit h-fit')} style={containerStyle}>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary/80 border border-primary/20" style={{ borderRadius: 'inherit' }}>
            {content.label ?? 'Badge'}
          </span>
        </div>
      );

    case 'tag':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-fit h-fit')} style={containerStyle}>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium bg-muted border border-border text-muted-foreground" style={{ borderRadius: 'inherit' }}>
            {content.label ?? 'tag'}
          </span>
        </div>
      );

    case 'divider':
      return (
        <div className={cn(WIREFRAME_BASE, 'py-1 flex items-center justify-center w-full')} style={containerStyle}>
          <div className="w-full h-px bg-border" />
        </div>
      );

    case 'icon':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-fit h-fit')} style={containerStyle}>
          <div className="rounded bg-muted-foreground/20 flex items-center justify-center min-w-[24px] min-h-[24px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground/50">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2" />
            </svg>
          </div>
        </div>
      );

    case 'input':
      return (
        <div className={cn(WIREFRAME_BASE, 'w-full')} style={containerStyle}>
          <InputField label={content.label} placeholder={content.placeholder} />
        </div>
      );

    case 'textarea':
      return (
        <div className="flex flex-col gap-1.5 w-full" style={containerStyle}>
          {content.label && <div className="text-[10px] font-medium text-muted-foreground/70">{content.label}</div>}
          <div
            className="rounded-md border border-border bg-surface p-3 flex flex-col gap-1.5 min-h-[80px]"
          >
            <SkeletonBar width={90} />
            <SkeletonBar width={70} />
            {content.placeholder && <span className="text-[9px] text-muted-foreground/40">{content.placeholder}</span>}
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="flex flex-col gap-1.5 w-full" style={containerStyle}>
          {content.label && <div className="text-[10px] font-medium text-muted-foreground/70">{content.label}</div>}
          <div className="rounded-md border border-border bg-surface flex items-center justify-between px-3 min-h-[36px]">
            <span className="text-[10px] text-muted-foreground/40">{content.placeholder}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2 w-fit" style={containerStyle}>
          <div className="w-4 h-4 rounded border-2 border-border bg-surface flex-shrink-0" />
          <span className="text-xs text-muted-foreground/70">{content.label ?? 'Checkbox'}</span>
        </div>
      );

    case 'radio':
      return (
        <div className="flex flex-col gap-2 w-fit" style={containerStyle}>
          {['Option A', 'Option B', 'Option C'].map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0', i === 0 ? 'border-primary bg-primary/20' : 'border-border bg-surface')} />
              <span className="text-[10px] text-muted-foreground/70">{i === 0 ? (content.label ?? opt) : opt}</span>
            </div>
          ))}
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center gap-2 w-fit" style={containerStyle}>
          <div className="w-9 h-5 rounded-full bg-primary/30 border border-primary/40 flex items-center px-0.5">
            <div className="w-4 h-4 rounded-full bg-primary/70 ml-auto" />
          </div>
          <span className="text-xs text-muted-foreground/70">{content.label ?? 'Toggle'}</span>
        </div>
      );

    case 'slider':
      return (
        <div className="flex flex-col gap-1.5 w-full" style={containerStyle}>
          {content.label && <div className="text-[10px] font-medium text-muted-foreground/70">{content.label}</div>}
          <div className="relative w-full h-4 flex items-center">
            <div className="w-full h-1.5 rounded-full bg-border">
              <div className="h-full w-2/3 rounded-full bg-primary/50" />
            </div>
            <div className="absolute left-[66%] w-4 h-4 rounded-full bg-primary/80 border-2 border-background shadow-sm" />
          </div>
        </div>
      );

    case 'progress':
      return (
        <div className="flex flex-col gap-1.5 w-fit" style={containerStyle}>
          {content.label && <div className="text-[10px] font-medium text-muted-foreground/70">{content.label}%</div>}
          <div className="w-48 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, Number(content.label) || 60)}%` }} />
          </div>
        </div>
      );

    case 'spinner':
      return (
        <div className="flex items-center justify-center p-2 w-fit" style={containerStyle}>
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary/60 animate-spin" />
        </div>
      );

    case 'alert':
      return (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex gap-2 w-fit max-w-full" style={containerStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/70 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex flex-col gap-0.5">
            {content.title && <div className="text-xs font-semibold text-foreground/80">{content.title}</div>}
            {content.text && <div className="text-[10px] text-muted-foreground/70">{content.text}</div>}
          </div>
        </div>
      );

    case 'tooltip':
      return (
        <div className="inline-flex items-center justify-center w-fit" style={containerStyle}>
          <div className="px-2 py-1 rounded bg-foreground/80 text-[10px] text-background/90 font-medium">
            {content.text ?? 'Tooltip'}
          </div>
        </div>
      );

    case 'tabs':
      return (
        <div className="w-fit border-b border-border flex flex-col justify-end" style={containerStyle}>
          <div className="flex gap-0">
            {['Tab 1', 'Tab 2', 'Tab 3'].map((tab, i) => (
              <div
                key={i}
                className={cn('px-4 py-2 text-xs font-medium border-b-2',
                  i === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground/60',
                )}
              >
                {i === 0 ? (content.label ?? tab) : tab}
              </div>
            ))}
          </div>
        </div>
      );

    case 'breadcrumb':
      return (
        <div className="flex items-center gap-1 w-fit" style={containerStyle}>
          {(content.label ?? 'Home / Page / Item').split(' / ').map((crumb, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <span className={cn('text-[10px]', i === arr.length - 1 ? 'text-foreground/80 font-medium' : 'text-primary/60')}>{crumb}</span>
              {i < arr.length - 1 && <span className="text-muted-foreground/30 text-[10px]">/</span>}
            </span>
          ))}
        </div>
      );

    case 'pagination':
      return (
        <div className="flex items-center gap-1 justify-center w-fit" style={containerStyle}>
          <div className="w-7 h-7 rounded border border-border flex items-center justify-center text-[10px] text-muted-foreground/60">‹</div>
          {Array.from({ length: Math.min(content.count ?? 5, 5) }).map((_, i) => (
            <div
              key={i}
              className={cn('w-7 h-7 rounded border flex items-center justify-center text-[10px] font-medium',
                i === 1 ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground/60',
              )}
            >
              {i + 1}
            </div>
          ))}
          <div className="w-7 h-7 rounded border border-border flex items-center justify-center text-[10px] text-muted-foreground/60">›</div>
        </div>
      );

    case 'stepper':
      return (
        <div className="flex items-center w-fit" style={containerStyle}>
          {Array.from({ length: content.count ?? 3 }).map((_, i, arr) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                i === 0 ? 'bg-primary text-primary-foreground' : i === 1 ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-muted text-muted-foreground border border-border',
              )}>
                {i + 1}
              </div>
              {i < arr.length - 1 && <div className={cn('w-16 h-0.5', i === 0 ? 'bg-primary/50' : 'bg-border')} />}
            </div>
          ))}
        </div>
      );

    case 'spacer':
      return (
        <div
          className="w-full border border-dashed border-border/30 rounded flex items-center justify-center"
          style={containerStyle}
        >
          <span className="text-[9px] text-muted-foreground/30">spacer</span>
        </div>
      );

    case 'image':
      return (
        <div 
          className={cn(
            WIREFRAME_BASE,
            'overflow-hidden flex flex-col justify-center' 
          )}
          style={containerStyle}
        >
          <ImagePlaceholder 
            height="100%"
            width="100%"
          />
        </div>
      );

    case 'avatar':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex items-center w-fit')} style={containerStyle}>
          <AvatarPlaceholder size={typeof layout.width === 'number' ? layout.width : 40} />
        </div>
      );

    case 'row':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex flex-row items-center flex-wrap min-h-[80px] min-w-[120px] w-fit')} style={containerStyle}>
          {children}
        </div>
      );

    case 'column':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex flex-col min-h-[80px] min-w-[120px] w-fit')} style={containerStyle}>
          {children}
        </div>
      );

    case 'grid':
      return (
        <div className={cn(WIREFRAME_BASE, 'min-h-[64px] border border-dashed border-border/60 rounded-sm w-fit')} style={containerStyle}>
          {children ?? (
            <div className="grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${content.count ?? 3}, 1fr)` }}>
              {Array.from({ length: content.count ?? 3 }).map((_, i) => (
                <div key={i} className="h-12 w-12 rounded bg-muted-foreground/10 border border-border/40" />
              ))}
            </div>
          )}
        </div>
      );

    case 'section':
      return (
        <div className={cn(WIREFRAME_BASE, 'min-h-[48px] border border-dashed border-border/60 rounded-sm w-full')} style={containerStyle}>
          {children ?? (
            <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Section
            </div>
          )}
        </div>
      );

    case 'container':
      return (
        <div className={cn(WIREFRAME_BASE, 'min-h-[80px] min-w-[120px] border border-dashed border-border/40 rounded-sm w-fit')} style={containerStyle}>
          {children ?? (
            <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground/40">
              Container
            </div>
          )}
        </div>
      );

    case 'card':
      return (
        <div className={cn(WIREFRAME_BASE, 'bg-surface-raised border border-border min-h-[64px] w-fit')} style={containerStyle}>
          {children ?? (
            <div className="flex flex-col gap-2 p-4">
              {content.title
                ? <div className="text-xs font-semibold text-foreground/80">{content.title}</div>
                : <div className="h-3 w-32 rounded-full bg-foreground/20" />}
              <TextBars lines={2} widths={[85, 65]} />
            </div>
          )}
        </div>
      );

    case 'navbar':
      return (
        <div className={cn(WIREFRAME_BASE, 'h-14 bg-surface-overlay border-b border-border flex items-center justify-between px-4 w-full')} style={containerStyle}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-7 rounded-md bg-primary/20" />
            {content.title
              ? <span className="text-xs font-semibold text-foreground/70">{content.title}</span>
              : <div className="h-2.5 w-20 rounded-full bg-foreground/25" />}
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBar width={8} height={8} />
            <SkeletonBar width={8} height={8} />
            <SkeletonBar width={8} height={8} />
          </div>
          {children}
        </div>
      );

    case 'footer':
      return (
        <div className={cn(WIREFRAME_BASE, 'bg-surface border-t border-border min-h-[80px] w-full')} style={containerStyle}>
          {children ?? (
            <div className="flex flex-col gap-3 p-8">
              <TextBars lines={2} widths={[40, 30]} />
              <div className="flex gap-3">
                <SkeletonBar width={15} />
                <SkeletonBar width={15} />
                <SkeletonBar width={15} />
              </div>
            </div>
          )}
        </div>
      );

    case 'hero':
      return (
        <div className={cn(WIREFRAME_BASE, 'min-h-[200px] flex flex-col items-center justify-center border border-dashed border-border/60 rounded-sm w-full')} style={containerStyle}>
          {children ?? (
            <div className="flex flex-col items-center gap-3 py-8 px-8">
              {content.title
                ? <div className="text-base font-bold text-foreground/80 text-center">{content.title}</div>
                : <div className="h-6 w-48 rounded-full bg-foreground/25" />}
              {content.subtitle
                ? <div className="text-xs text-muted-foreground/70 text-center">{content.subtitle}</div>
                : <div className="h-3 w-64 rounded-full bg-muted-foreground/20" />}
              <div className="flex gap-3 mt-2">
                <div className="inline-flex items-center px-4 py-2 rounded-md text-xs font-medium bg-primary/20 border border-primary/30 text-primary/80">Get started</div>
                <div className="inline-flex items-center px-4 py-2 rounded-md text-xs font-medium border border-muted-foreground/30 text-muted-foreground">Learn more</div>
              </div>
            </div>
          )}
        </div>
      );

    case 'modal':
      return (
        <div className={cn(WIREFRAME_BASE, 'bg-surface-overlay border border-border shadow-lg min-h-[120px] w-fit')} style={containerStyle}>
          {children ?? (
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                {content.title
                  ? <span className="text-xs font-semibold text-foreground/80">{content.title}</span>
                  : <div className="h-3 w-32 rounded-full bg-foreground/25" />}
                <div className="w-4 h-4 rounded-sm bg-muted-foreground/20" />
              </div>
              <TextBars lines={2} />
              <div className="flex gap-2 justify-end mt-2">
                <div className="inline-flex items-center px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground">Cancel</div>
                <div className="inline-flex items-center px-3 py-1.5 rounded text-[10px] bg-primary/20 border border-primary/30 text-primary/80">Confirm</div>
              </div>
            </div>
          )}
        </div>
      );

    case 'sidebar':
      return (
        <div
          className={cn(WIREFRAME_BASE, 'bg-surface border-r border-border min-h-[200px] flex flex-col w-fit')}
          style={containerStyle}
        >
          {children ?? (
            <div className="flex flex-col gap-1 p-3">
              {content.title && <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">{content.title}</div>}
              {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map((item, i) => (
                <div key={i} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-md', i === 0 ? 'bg-primary/10' : '')}>
                  <div className="w-3.5 h-3.5 rounded bg-muted-foreground/20 flex-shrink-0" />
                  <span className={cn('text-[10px]', i === 0 ? 'text-primary font-medium' : 'text-muted-foreground/70')}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'table':
      return (
        <div className="border border-border rounded-lg overflow-hidden w-fit" style={containerStyle}>
          <div className="flex bg-muted/40 border-b border-border">
            {['Name', 'Status', 'Date', 'Action'].slice(0, content.count ?? 4).map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-wider min-w-[100px]">{h}</div>
            ))}
          </div>
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex border-b border-border/50 last:border-0">
              {Array.from({ length: content.count ?? 4 }).map((_, ci) => (
                <div key={ci} className="px-3 py-2.5 min-w-[100px]">
                  {ci === 1
                    ? <span className="inline-flex px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] text-primary/70">Active</span>
                    : <SkeletonBar width={70} height={7} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className="flex flex-col divide-y divide-border/50 w-fit" style={containerStyle}>
          {Array.from({ length: content.count ?? 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-muted-foreground/10 border border-border flex-shrink-0" />
              <div className="flex flex-col gap-1 min-w-0">
                <SkeletonBar width={60} height={7} />
                <SkeletonBar width={40} height={6} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'form':
      return (
        <div className={cn(WIREFRAME_BASE, 'bg-surface-raised border border-border min-h-[120px] w-fit')} style={containerStyle}>
          {children ?? (
            <div className="flex flex-col gap-3 p-4">
              {content.title && <div className="text-sm font-semibold text-foreground/80 mb-1">{content.title}</div>}
              <InputField label="Name" placeholder="Enter name..." />
              <InputField label="Email" placeholder="Enter email..." />
              <div className="inline-flex items-center px-4 py-2 rounded-md text-xs font-medium bg-primary/20 border border-primary/30 text-primary/80 self-start mt-1">
                {content.label ?? 'Submit'}
              </div>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div
          className="rounded-lg bg-black/60 border border-border flex flex-col items-center justify-center overflow-hidden"
          style={containerStyle}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/60 ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-[10px] text-white/40 mt-2">{content.alt ?? 'Video'}</span>
        </div>
      );

    case 'chart':
      return (
        <div
          className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3 w-fit"
          style={containerStyle}
        >
          {content.title && <div className="text-xs font-medium text-foreground/70">{content.title}</div>}
          <div className="flex items-end gap-1.5 px-2">
            {[65, 80, 45, 90, 70, 55, 85].map((h, i) => (
              <div key={i} className="w-12 rounded-t-sm bg-primary/40 border border-primary/20" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
      );

    case 'stat':
      return (
        <div className={cn(WIREFRAME_BASE, 'border border-border rounded-xl p-4 flex flex-col gap-2 w-fit')} style={containerStyle}>
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{content.text ?? 'Metric Label'}</div>
          <div className="text-2xl font-black text-foreground">{content.title ?? '24,521'}</div>
          <div className="text-[10px] text-emerald-500 font-medium">{content.label ?? '+12% vs last month'}</div>
        </div>
      );

    case 'timeline': {
      const items = typeof content.count === 'number' ? content.count : 3;
      return (
        <div className={cn(WIREFRAME_BASE, 'flex flex-col gap-0 w-fit')} style={containerStyle}>
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary/60 border-2 border-background flex-shrink-0 mt-1" />
                {i < items - 1 && <div className="w-px flex-1 bg-border/60 mt-1" style={{ minHeight: '40px' }} />}
              </div>
              <div className="pb-5">
                <div className="h-2 w-24 rounded-full bg-foreground/20 mb-1.5" />
                <div className="h-1.5 w-32 rounded-full bg-muted-foreground/20" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'accordion': {
      const items = typeof content.count === 'number' ? content.count : 3;
      return (
        <div className={cn(WIREFRAME_BASE, 'flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden w-fit')} style={containerStyle}>
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="h-2 rounded-full bg-foreground/20" style={{ width: i === 0 ? 140 : i === 1 ? 120 : 160 }} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50 flex-shrink-0 ml-3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          ))}
        </div>
      );
    }

    case 'map':
      return (
        <div
          className="rounded-xl overflow-hidden border border-border bg-surface-raised flex items-center justify-center relative"
          style={containerStyle}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 30px,var(--border) 30px,var(--border) 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,var(--border) 30px,var(--border) 31px)' }} />
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground/50">Map</span>
          </div>
        </div>
      );

    case 'banner':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg w-fit')} style={containerStyle}>
          <div className="text-xs text-primary/80 font-medium">{content.text ?? '🎉 Big sale — 30% off everything today!'}</div>
          {content.label && <div className="text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-0.5 flex-shrink-0 ml-3">{content.label}</div>}
        </div>
      );

    case 'bottom-nav': {
      const navCount = typeof content.count === 'number' ? content.count : 4;
      const icons = ['Home', 'Search', 'Heart', 'User'];
      return (
        <div className={cn(WIREFRAME_BASE, 'border-t border-border bg-surface/95 flex items-center justify-around px-2 w-full')} style={containerStyle}>
          {Array.from({ length: Math.min(navCount, 5) }).map((_, i) => (
            <div key={i} className={cn('flex flex-col items-center gap-1', i === 0 ? 'text-primary' : 'text-muted-foreground/50')}>
              <div className={cn('w-5 h-5 rounded-sm', i === 0 ? 'bg-primary/30' : 'bg-muted-foreground/20')} />
              <div className="h-1 w-6 rounded-full bg-current opacity-40" />
            </div>
          ))}
        </div>
      );
    }

    case 'rating':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex items-center gap-1.5 w-fit')} style={containerStyle}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= 4 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={i <= 4 ? 'text-amber-400' : 'text-muted-foreground/30'}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
          {content.label && <span className="text-xs font-semibold text-foreground ml-1">{content.label}</span>}
          {content.text && <span className="text-xs text-muted-foreground/60">{content.text}</span>}
        </div>
      );

    case 'skeleton':
      return (
        <div
          className="rounded-lg bg-muted-foreground/10 animate-pulse"
          style={containerStyle}
        />
      );

    case 'toast':
      return (
        <div
          className={cn(WIREFRAME_BASE, 'flex items-start gap-3 border border-border bg-surface shadow-lg rounded-xl p-4 w-fit')}
          style={containerStyle}
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            {content.title && <div className="text-xs font-semibold text-foreground">{content.title}</div>}
            {content.text && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{content.text}</div>}
          </div>
        </div>
      );

    case 'search':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex items-center gap-2 px-3 py-2 border border-border bg-surface-raised rounded-full w-full')} style={containerStyle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <div className="text-xs text-muted-foreground/40">{content.placeholder ?? 'Search...'}</div>
        </div>
      );

    case 'date-picker':
      return (
        <div className={cn(WIREFRAME_BASE, 'flex items-center justify-between px-3 py-2 border border-border bg-surface-raised rounded-md w-full')} style={containerStyle}>
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="text-xs text-muted-foreground/40">{content.placeholder ?? 'Pick a date'}</div>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      );

    case 'file-upload':
      return (
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-surface-raised/50 w-full"
          style={containerStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-[10px] text-muted-foreground/50">{content.text ?? 'Drop files or click to upload'}</div>
          {content.label && <div className="text-[9px] text-primary/60 border border-primary/20 rounded-full px-2.5 py-0.5">{content.label}</div>}
        </div>
      );

    default:
      return (
        <div className={cn(WIREFRAME_BASE, 'bg-muted border border-dashed border-border rounded-sm p-3 w-fit')} style={containerStyle}>
          <div className="h-2 w-16 rounded-full bg-muted-foreground/30" />
        </div>
      );
  }
}