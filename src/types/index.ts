// ─── Component Types ──────────────────────────────────────────────────────────

export type ComponentType =
  // Basic
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'image'
  | 'avatar'
  | 'badge'
  | 'divider'
  | 'icon'
  | 'link'
  // Form
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'slider'
  // Feedback
  | 'progress'
  | 'spinner'
  | 'tooltip'
  | 'alert'
  | 'tag'
  // Navigation
  | 'tabs'
  | 'breadcrumb'
  | 'pagination'
  | 'stepper'
  // Layout
  | 'container'
  | 'row'
  | 'column'
  | 'section'
  | 'grid'
  | 'spacer'
  // Blocks
  | 'card'
  | 'navbar'
  | 'footer'
  | 'hero'
  | 'modal'
  | 'sidebar'
  | 'table'
  | 'list'
  | 'form'
  | 'video'
  | 'chart'
  | 'stat'
  | 'timeline'
  | 'accordion'
  | 'map'
  | 'banner'
  | 'bottom-nav'
  | 'rating'
  | 'skeleton'
  | 'toast'
  | 'search'
  | 'date-picker'
  | 'file-upload';

export type ComponentCategory = 'basic' | 'form' | 'feedback' | 'navigation' | 'layout' | 'blocks';

export type DeviceMode = 'mobile' | 'desktop' | 'split';

export type ComponentRole =
  | 'primary-action'
  | 'secondary-action'
  | 'destructive-action'
  | 'navigation'
  | 'form-field'
  | 'display'
  | 'container'
  | 'header'
  | 'footer'
  | 'hero'
  | 'modal';

// ─── Canvas Component ─────────────────────────────────────────────────────────

export interface ComponentLayout {
  x: number;
  y: number;
  width: number | string | 'auto';
  height: number | string | 'auto';
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  gap?: number | string;
  borderRadius?: number | string;
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifySelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
}

export interface ComponentContent {
  label?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  placeholder?: string;
  src?: string;
  href?: string;
  alt?: string;
  count?: number;
  variant?: string;
}

export interface ComponentSemantic {
  role?: ComponentRole;
  description?: string;
  ariaLabel?: string;
}

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  name: string;
  parentId: string | null;
  children: string[];
  layout: ComponentLayout;
  content: ComponentContent;
  semantic: ComponentSemantic;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export interface Screen {
  id: string;
  name: string;
  rootIds: { mobile: string[]; desktop: string[] };
}

// ─── Canvas State ─────────────────────────────────────────────────────────────

export interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface CanvasState {
  projectId: string;
  components: Record<string, CanvasComponent>;
  /** @deprecated legacy field — use screens[currentScreenId].rootIds */
  rootIds?: { mobile: string[]; desktop: string[] };
  screens: Screen[];
  currentScreenId: string;
  selectedIds: string[];
  viewport: CanvasViewport;
  deviceMode: DeviceMode;
  projectName: string;
  isDirty: boolean;
  frameWidths: { mobile: number; desktop: number };
  frameSizes: { mobile: { w: number; h: number }; desktop: { w: number; h: number } };
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  state: Omit<CanvasState, 'selectedIds' | 'isDirty'>;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistorySnapshot {
  id: string;
  projectId: string;
  projectName: string;
  version: string;
  timestamp: number;
  yaml: string;
  canvasState: Omit<CanvasState, 'selectedIds' | 'isDirty'>;
  description?: string;
}

// ─── YAML Schema ─────────────────────────────────────────────────────────────

export interface YamlComponentNode {
  type: ComponentType;
  name?: string;
  role?: ComponentRole;
  description?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  placeholder?: string;
  src?: string;
  href?: string;
  alt?: string;
  layout?: Partial<{
    width: number | string;
    height: number | string;
    padding: number;
    margin: number;
    gap: number;
    borderRadius: number;
    direction: 'row' | 'column';
  }>;
  children?: YamlComponentNode[];
}

export interface YamlScreen {
  version: 1;
  project: string;
  screen: {
    type: DeviceMode;
    name: string;
  };
  layout: YamlComponentNode[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface UIState {
  sidebarCollapsed: boolean;
  inspectorCollapsed: boolean;
  historyOpen: boolean;
  searchQuery: string;
  hoveredId: string | null;
  dragOverId: string | null;
  isPanning: boolean;
  isResizing: boolean;
  notification: Notification | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

// ─── Undo / Redo ─────────────────────────────────────────────────────────────

export interface UndoEntry {
  id: string;
  description: string;
  timestamp: number;
  before: Pick<CanvasState, 'components' | 'screens' | 'currentScreenId'>;
  after: Pick<CanvasState, 'components' | 'screens' | 'currentScreenId'>;
}

// ─── Component Definition (sidebar catalog) ──────────────────────────────────

export interface ComponentDefinition {
  type: ComponentType;
  category: ComponentCategory;
  label: string;
  icon: string;
  description: string;
  defaultLayout: Partial<ComponentLayout>;
  defaultContent: Partial<ComponentContent>;
  defaultSemantic: Partial<ComponentSemantic>;
  canHaveChildren: boolean;
  allowedChildren?: ComponentType[];
}
