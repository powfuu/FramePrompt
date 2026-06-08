import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2,
  Redo2,
  Copy,
  GitCommit,
  ZoomIn,
  ZoomOut,
  PanelLeft,
  PanelRight,
  Check,
  Smartphone,
  Monitor,
  Columns2,
  FileCode,
  X,
  Trash2,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { AppIcon } from '@/lib/AppIcon';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useHistoryStore } from '@/store/historyStore';
import { generateYamlForScreen, generateYamlForProject, generateYaml } from '@/yaml/generator';
import { copyToClipboard } from '@/lib/utils';
import type { DeviceMode } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

function DeviceButton({ mode, current, onClick }: { mode: DeviceMode; current: DeviceMode; onClick: () => void }) {
  const icons = { mobile: Smartphone, desktop: Monitor, split: Columns2 };
  const labels = { mobile: 'Mobile', desktop: 'Desktop', split: 'Split' };
  const Icon = icons[mode];

  return (
    <button
      onClick={onClick}
      title={labels[mode]}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
        mode === current
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
      )}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{labels[mode]}</span>
    </button>
  );
}

function IconButton({
  onClick,
  title,
  disabled,
  children,
  active,
  className,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150',
        'text-muted-foreground hover:text-foreground hover:bg-surface-raised',
        disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
        active && 'bg-surface-raised text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

import { Link } from 'react-router-dom';

export function TopBar() {
  const navigate = useNavigate();
  const projectName = useCanvasStore((s) => s.projectName);
  const setProjectName = useCanvasStore((s) => s.setProjectName);
  const componentCount = useCanvasStore((s) => {
    const screen = s.screens.find((sc) => sc.id === s.currentScreenId);
    if (!screen) return 0;
    const allIds = [...new Set([...screen.rootIds.mobile, ...screen.rootIds.desktop])];
    return allIds.filter(id => s.components[id]).length;
  });
  const viewport = useCanvasStore((s) => s.viewport);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const resetViewport = useCanvasStore((s) => s.resetViewport);
  const deviceMode = useCanvasStore((s) => s.deviceMode);
  const setDeviceMode = useCanvasStore((s) => s.setDeviceMode);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const deleteScreen = useCanvasStore((s) => s.deleteScreen);
  const screens = useCanvasStore((s) => s.screens);

  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const inspectorCollapsed = useUIStore((s) => s.inspectorCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);
  const showNotification = useUIStore((s) => s.showNotification);
  const historyOpen = useUIStore((s) => s.historyOpen);

  const addSnapshot = useHistoryStore((s) => s.addSnapshot);

  const currentScreenId = useCanvasStore((s) => s.currentScreenId);
  const currentScreenName = useCanvasStore((s) => {
    const screen = s.screens.find((sc) => sc.id === s.currentScreenId);
    return screen?.name ?? '';
  });

  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [yamlOpen, setYamlOpen] = useState(false);
  const [copyYamlOpen, setCopyYamlOpen] = useState(false);
  const [deleteScreenOpen, setDeleteScreenOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleCopyYaml = useCallback(async () => {
    const state = useCanvasStore.getState();
    const yaml = generateYaml(state);
    try {
      await copyToClipboard(yaml);
      addSnapshot(yaml, state, 'YAML Copied');
      setCopied(true);
      showNotification('success', 'YAML copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotification('error', 'Failed to copy YAML');
    }
  }, [addSnapshot, showNotification]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      nameRef.current?.blur();
    }
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (!projectName.trim()) {
      setProjectName('Untitled Project');
    }
  };

  return (
    <>
    <header className="h-12 flex-shrink-0 flex items-center gap-2 px-3 border-b border-border bg-surface/90 backdrop-blur-sm z-50 overflow-hidden">
      {/* Logo */}
      <button onClick={() => useUIStore.getState().setStartupModalOpen(true)} className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity" title="Open Menu">
        <AppIcon size={24} />
      </button>

      {/* Panel toggles — desktop only */}
      <div className="hidden md:flex items-center gap-0.5">
        <div className="w-px h-5 bg-border flex-shrink-0 mr-1" />
        <IconButton onClick={toggleSidebar} title="Toggle sidebar" active={!sidebarCollapsed}>
          <PanelLeft size={14} />
        </IconButton>
        <IconButton onClick={toggleInspector} title="Toggle inspector" active={!inspectorCollapsed}>
          <PanelRight size={14} />
        </IconButton>
      </div>

      <div className="hidden md:block w-px h-5 bg-border flex-shrink-0" />

      {/* Project / screen name */}
      <div className="flex items-center gap-1 min-w-0 flex-shrink">
        {editingName ? (
          <input
            ref={nameRef}
            autoFocus
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="text-sm font-medium bg-surface-raised border border-primary/50 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring min-w-0 max-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-[90px] sm:max-w-[130px] min-w-[32px] text-left"
            title="Click to rename project"
          >
            {projectName || 'Untitled Project'}
          </button>
        )}
        {currentScreenName && (
          <>
            <ChevronRight size={12} className="text-border flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate max-w-[70px] sm:max-w-[120px]">
              {currentScreenName}
            </span>
          </>
        )}
      </div>

      {/* Component count badge — hidden on small screens */}
      {componentCount > 0 && (
        <motion.div
          key={componentCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="hidden sm:flex px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary select-none"
        >
          {componentCount}
        </motion.div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Device selector */}
      <div className="flex items-center gap-0.5 p-0.5 bg-surface-raised rounded-lg border border-border flex-shrink-0">
        {(['mobile', 'desktop', 'split'] as DeviceMode[]).map((mode) => (
          <DeviceButton
            key={mode}
            mode={mode}
            current={deviceMode}
            onClick={() => setDeviceMode(mode)}
          />
        ))}
      </div>

      {/* Zoom controls — desktop only */}
      <div className="hidden md:flex items-center gap-0.5">
        <div className="w-px h-5 bg-border flex-shrink-0 mx-1" />
        <IconButton onClick={() => setZoom(viewport.zoom - 0.1)} title="Zoom out">
          <ZoomOut size={13} />
        </IconButton>
        <button
          onClick={resetViewport}
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors w-10 text-center"
          title="Reset zoom"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <IconButton onClick={() => setZoom(viewport.zoom + 0.1)} title="Zoom in">
          <ZoomIn size={13} />
        </IconButton>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <div className="hidden md:block w-px h-5 bg-border flex-shrink-0 mx-1" />
        <IconButton onClick={undo} title="Undo (⌘Z)" disabled={past.length === 0}>
          <Undo2 size={13} />
        </IconButton>
        <IconButton onClick={redo} title="Redo (⌘⇧Z)" disabled={future.length === 0}>
          <Redo2 size={13} />
        </IconButton>
      </div>

      {/* Secondary actions — desktop only */}
      <div className="hidden md:flex items-center gap-0.5">
        <div className="w-px h-5 bg-border flex-shrink-0 mx-1" />
        <IconButton
          onClick={() => setDeleteScreenOpen(true)}
          title="Delete current screen"
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        >
          <Trash2 size={13} />
        </IconButton>
        <IconButton onClick={() => setHistoryOpen(!historyOpen)} title="Version Control" active={historyOpen}>
          <GitCommit size={14} />
        </IconButton>
        <IconButton onClick={() => setYamlOpen(true)} title="View YAML" active={yamlOpen}>
          <FileCode size={14} />
        </IconButton>
      </div>

      {/* Copy YAML */}
      <motion.button
        onClick={() => setCopyYamlOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 shadow-sm transition-all duration-200 flex-shrink-0"
      >
        <Copy size={12} />
        <span className="hidden sm:inline">Copy YAML</span>
      </motion.button>
    </header>

    {/* YAML Viewer Modal */}
    <YamlModal open={yamlOpen} onClose={() => setYamlOpen(false)} onCopy={handleCopyYaml} copied={copied} />

    {/* Copy YAML Modal */}
    <CopyYamlModal
      open={copyYamlOpen}
      onClose={() => setCopyYamlOpen(false)}
      currentScreenId={currentScreenId}
      currentScreenName={currentScreenName}
    />

    {/* Delete screen modal */}
    <DeleteScreenModal
      open={deleteScreenOpen}
      screenName={currentScreenName}
      componentCount={componentCount}
      isOnlyScreen={screens.length <= 1}
      onClose={() => setDeleteScreenOpen(false)}
      onConfirm={() => {
        deleteScreen(currentScreenId);
        setDeleteScreenOpen(false);
        showNotification('success', `"${currentScreenName}" deleted`);
      }}
    />
  </>
  );
}

// ─── YAML syntax highlighter ──────────────────────────────────────────────────

function highlightYaml(yaml: string): React.ReactNode[] {
  return yaml.split('\n').map((line, i) => {
    const indent = line.match(/^(\s*)/)?.[1] ?? '';
    const trimmed = line.trimStart();

    let content: React.ReactNode;

    if (trimmed.startsWith('#')) {
      content = <span className="text-white/30 italic">{line}</span>;
    } else if (trimmed.startsWith('- ')) {
      const rest = trimmed.slice(2);
      const colonIdx = rest.indexOf(':');
      if (colonIdx > -1) {
        const key = rest.slice(0, colonIdx);
        const val = rest.slice(colonIdx + 1);
        content = (
          <>{indent}<span className="text-muted-foreground/50">- </span><span className="text-sky-300">{key}</span><span className="text-white/40">:</span><span className="text-emerald-300/90">{val}</span></>
        );
      } else {
        content = <>{indent}<span className="text-muted-foreground/50">- </span><span className="text-white/70">{rest}</span></>;
      }
    } else {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > -1) {
        const key = trimmed.slice(0, colonIdx);
        const val = trimmed.slice(colonIdx + 1);
        const isTopLevel = indent.length === 0;
        content = (
          <>
            {indent}
            <span className={isTopLevel ? 'text-white/90 font-semibold' : 'text-sky-300/90'}>{key}</span>
            <span className="text-white/30">:</span>
            {val && <span className="text-emerald-300/80">{val}</span>}
          </>
        );
      } else {
        content = <span className="text-white/60">{line}</span>;
      }
    }

    return (
      <div key={i} className="flex">
        <span className="select-none w-8 text-right pr-3 text-white/20 text-[10px] flex-shrink-0">{i + 1}</span>
        <span className="flex-1 font-mono text-[11px]">{content}</span>
      </div>
    );
  });
}

// ─── YAML Modal ───────────────────────────────────────────────────────────────

function YamlModal({ open, onClose, onCopy, copied }: {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const yaml = open ? generateYaml(useCanvasStore.getState()) : '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#0d1117] border border-border/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02] flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="flex-1 text-center text-xs font-medium text-white/40">layout.yaml</span>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={onCopy}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200',
                    copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30',
                  )}
                >
                  {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                </motion.button>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* YAML content */}
            <div className="flex-1 overflow-y-auto p-4 leading-[1.75]">
              {highlightYaml(yaml)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Copy YAML Modal ─────────────────────────────────────────────────────────

// multi-screen-AC-6
function CopyYamlModal({
  open,
  onClose,
  currentScreenId,
  currentScreenName,
}: {
  open: boolean;
  onClose: () => void;
  currentScreenId: string;
  currentScreenName: string;
}) {
  const [copiedScreen, setCopiedScreen] = useState(false);
  const [copiedProject, setCopiedProject] = useState(false);
  const addSnapshot = useHistoryStore((s) => s.addSnapshot);
  const showNotification = useUIStore((s) => s.showNotification);

  const handleCopyScreen = useCallback(async () => {
    const state = useCanvasStore.getState();
    try {
      const yaml = generateYamlForScreen(state, currentScreenId);
      await copyToClipboard(yaml);
      addSnapshot(yaml, state, `YAML: ${currentScreenName}`);
      setCopiedScreen(true);
      showNotification('success', `"${currentScreenName}" YAML copied`);
      setTimeout(() => { setCopiedScreen(false); onClose(); }, 1500);
    } catch {
      showNotification('error', 'Failed to copy YAML');
    }
  }, [currentScreenId, currentScreenName, addSnapshot, showNotification, onClose]);

  const handleCopyProject = useCallback(async () => {
    const state = useCanvasStore.getState();
    try {
      const yaml = generateYamlForProject(state);
      await copyToClipboard(yaml);
      addSnapshot(yaml, state, 'YAML: Full Project');
      setCopiedProject(true);
      showNotification('success', 'Full project YAML copied');
      setTimeout(() => { setCopiedProject(false); onClose(); }, 1500);
    } catch {
      showNotification('error', 'Failed to copy YAML');
    }
  }, [addSnapshot, showNotification, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-md bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-foreground">Copy YAML</p>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Copy this screen */}
                <motion.button
                  onClick={handleCopyScreen}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all text-left',
                    copiedScreen
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    copiedScreen ? 'bg-emerald-500/20' : 'bg-primary/15',
                  )}>
                    {copiedScreen ? <Check size={16} className="text-emerald-400" /> : <FileText size={16} className="text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {copiedScreen ? 'Copied!' : 'Copy This Screen'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      YAML spec for <span className="text-foreground font-medium">{currentScreenName}</span> only — mobile & desktop views
                    </p>
                  </div>
                </motion.button>

                {/* Copy full project */}
                <motion.button
                  onClick={handleCopyProject}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all text-left',
                    copiedProject
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    copiedProject ? 'bg-emerald-500/20' : 'bg-primary/15',
                  )}>
                    {copiedProject ? <Check size={16} className="text-emerald-400" /> : <Layers size={16} className="text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {copiedProject ? 'Copied!' : 'Copy Full Project'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete YAML with all screens — ideal for handing off to an AI agent
                    </p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Screen Modal ──────────────────────────────────────────────────────

export function DeleteScreenModal({
  open,
  screenName,
  componentCount,
  isOnlyScreen,
  onClose,
  onConfirm,
}: {
  open: boolean;
  screenName: string;
  componentCount: number;
  isOnlyScreen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Full-screen backdrop — heavy blur + dark tint */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.90, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[400px] rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-destructive/40 via-destructive/10 to-transparent pointer-events-none" />

            {/* Card body */}
            <div className="relative bg-[#0c0e14] border border-white/[0.07] rounded-3xl overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-[3px] bg-gradient-to-r from-transparent via-destructive to-transparent" />

              {/* Red ambient blob */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-destructive/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative px-8 pt-8 pb-7">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-destructive/30 rounded-2xl blur-xl scale-110" />
                    <div className="relative w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center">
                      <Trash2 size={26} className="text-destructive" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {isOnlyScreen ? 'Cannot delete' : 'Delete screen?'}
                  </h2>

                  {/* Screen name chip */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] mb-3">
                    <Monitor size={11} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{screenName}</span>
                  </div>

                  {isOnlyScreen ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You must have at least one screen. Create another screen before deleting this one.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {componentCount > 0
                        ? <>This will permanently remove <span className="text-foreground font-semibold">{componentCount} {componentCount === 1 ? 'component' : 'components'}</span> along with the screen.</>
                        : 'This screen has no components and will be removed.'
                      }
                      <br />
                      <span className="text-muted-foreground/60 text-xs mt-1 inline-block">You can undo this with ⌘Z</span>
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mb-5" />

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all duration-150"
                  >
                    Cancel
                  </button>
                  {!isOnlyScreen && (
                    <motion.button
                      onClick={onConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-destructive text-white hover:bg-destructive/90 transition-all duration-150 shadow-lg shadow-destructive/30"
                    >
                      Delete screen
                    </motion.button>
                  )}
                </div>

                {/* Escape hint */}
                <p className="text-center text-[10px] text-muted-foreground/30 mt-4">
                  Press Esc to cancel
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
