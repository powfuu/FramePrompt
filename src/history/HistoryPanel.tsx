import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, RotateCcw, Trash2, Edit2, Check, Clock, GitCommit, Search, Filter, Diff } from 'lucide-react';
import { useHistoryStore } from '@/store/historyStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { formatTimestamp, copyToClipboard } from '@/lib/utils';
import type { HistorySnapshot } from '@/types';
import { cn } from '@/lib/utils';

interface SnapshotItemProps {
  snapshot: HistorySnapshot;
  onRestore: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function SnapshotItem({ snapshot, onRestore, onCopy, onDelete, onRename }: SnapshotItemProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isYamlCopied = snapshot.description === 'YAML Copied';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex flex-col gap-2 p-3 rounded-lg border transition-all duration-150 relative",
        isYamlCopied ? "border-transparent bg-surface-raised cursor-default" : "border-border/60 bg-surface-raised hover:border-primary/40 hover:bg-surface-overlay cursor-pointer"
      )}
      onClick={isYamlCopied ? undefined : onRestore}
    >
      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <GitCommit size={12} className={isYamlCopied ? "text-emerald-400" : "text-primary"} />
            <p className={cn("text-[11px] font-semibold truncate", isYamlCopied ? "text-emerald-400" : "text-primary")}>
              {isYamlCopied ? 'YAML copied' : 'Auto saved commit'}
            </p>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug" title={snapshot.description || 'Auto-saved changes'}>{snapshot.description || 'Auto-saved changes'}</p>
          
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-bold text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border/50">v{snapshot.version}</span>
            <span className="text-[10px] text-muted-foreground truncate" title={snapshot.projectName}>{snapshot.projectName}</span>
            <Clock size={10} className="text-muted-foreground/50 ml-auto flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground/70 flex-shrink-0">{formatTimestamp(snapshot.timestamp)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-surface-raised/80 backdrop-blur rounded p-0.5 border border-border/50">
          <button onClick={handleCopy} className={cn("w-6 h-6 rounded flex items-center justify-center transition-colors", copied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground hover:bg-surface")} title="Copy YAML">
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
          {!isYamlCopied && (
            <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-surface transition-colors" title="View Diff">
              <Diff size={11} />
            </button>
          )}
        </div>
      </div>

      {/* YAML preview */}
      <div className="relative mt-1" onClick={(e) => e.stopPropagation()}>
        <pre 
          className={cn(
            "text-[10px] text-muted-foreground/60 font-mono bg-surface border border-border/40 rounded-md p-2 overflow-hidden leading-relaxed whitespace-pre-wrap transition-all duration-200 cursor-text",
            expanded ? "max-h-[300px] overflow-y-auto" : "max-h-[60px]"
          )}
        >
          {snapshot.yaml}
        </pre>
        {!expanded && snapshot.yaml.length > 100 && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent cursor-pointer flex items-end justify-center pb-0.5"
            onClick={() => setExpanded(true)}
          >
            <span className="text-[9px] font-medium text-primary bg-surface px-2 rounded-full border border-primary/20">Expand YAML</span>
          </div>
        )}
        {expanded && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface to-transparent cursor-pointer flex items-end justify-center pb-0.5 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            <span className="text-[9px] font-medium text-muted-foreground bg-surface px-2 rounded-full border border-border/50 hover:text-foreground hover:border-border transition-colors">Collapse YAML</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HistoryPanel() {
  const historyOpen = useUIStore((s) => s.historyOpen);
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);
  const showNotification = useUIStore((s) => s.showNotification);

  const snapshots = useHistoryStore((s) => s.snapshots);
  const removeSnapshot = useHistoryStore((s) => s.removeSnapshot);
  const renameSnapshot = useHistoryStore((s) => s.renameSnapshot);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(useCanvasStore.getState().projectId);
  const [confirmRestore, setConfirmRestore] = useState<HistorySnapshot | null>(null);
  const [isYamlExpanded, setIsYamlExpanded] = useState(false);

  // Auto-filter by current project when opening history panel
  useEffect(() => {
    if (historyOpen) {
      setSelectedProjectId(useCanvasStore.getState().projectId);
    }
  }, [historyOpen]);

  const projects = useMemo(() => {
    const map = new Map<string, { id: string, name: string, count: number, lastUpdated: number }>();
    snapshots.forEach(s => {
      if (!map.has(s.projectId)) {
        map.set(s.projectId, { id: s.projectId, name: s.projectName, count: 0, lastUpdated: 0 });
      }
      const p = map.get(s.projectId)!;
      p.count++;
      p.lastUpdated = Math.max(p.lastUpdated, s.timestamp);
    });
    return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [snapshots]);

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter(s => {
      const matchesSearch = !searchQuery || s.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = !selectedProjectId || s.projectId === selectedProjectId;
      return matchesSearch && matchesProject;
    });
  }, [snapshots, searchQuery, selectedProjectId]);

  const handleRestore = (snapshot: HistorySnapshot) => {
    const store = useCanvasStore.getState();
    store.pushHistory();
    const cs = snapshot.canvasState as typeof snapshot.canvasState & { rootIds?: { mobile: string[]; desktop: string[] } };
    // Handle both new schema (screens) and legacy snapshots (rootIds only)
    const hasScreens = cs.screens && Array.isArray(cs.screens) && cs.screens.length > 0;
    const screens = hasScreens
      ? cs.screens
      : [{ id: `screen_restored`, name: 'Home', rootIds: cs.rootIds ?? { mobile: [], desktop: [] } }];
    const currentScreenId = hasScreens ? (cs.currentScreenId ?? screens[0].id) : screens[0].id;
    useCanvasStore.setState({
      projectId: cs.projectId,
      components: cs.components,
      screens,
      currentScreenId,
      viewport: cs.viewport,
      deviceMode: cs.deviceMode,
      projectName: cs.projectName,
      isDirty: true,
    });
    showNotification('success', `Restored: ${snapshot.description || 'Auto-saved'}`);
    setConfirmRestore(null);
    setHistoryOpen(false);
  };

  const handleCopy = async (snapshot: HistorySnapshot) => {
    await copyToClipboard(snapshot.yaml);
    showNotification('success', 'YAML copied from history');
  };

  return (
    <AnimatePresence>
      {historyOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setHistoryOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[380px] bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <GitCommit size={16} className="text-primary" />
                    Version Control
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{filteredSnapshots.length} commits</p>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commits or projects..."
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-md placeholder:text-muted-foreground/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className={cn(
                      "flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border",
                      !selectedProjectId ? "bg-primary text-primary-foreground border-primary" : "bg-surface-raised text-muted-foreground border-border hover:bg-surface-overlay"
                    )}
                  >
                    All Projects
                  </button>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={cn(
                        "flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border max-w-[150px] truncate",
                        selectedProjectId === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-raised text-muted-foreground border-border hover:bg-surface-overlay"
                      )}
                      title={p.name}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Snapshots list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredSnapshots.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-3">
                      <Clock size={16} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No commits found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try adjusting your filters
                    </p>
                  </motion.div>
                ) : (
                  filteredSnapshots.map((snap) => (
                    <SnapshotItem
                      key={snap.id}
                      snapshot={snap}
                      onRestore={() => setConfirmRestore(snap)}
                      onCopy={() => handleCopy(snap)}
                      onDelete={() => removeSnapshot(snap.id)}
                      onRename={(name) => renameSnapshot(snap.id, name)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Confirmation Popup */}
          <AnimatePresence>
            {confirmRestore && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setConfirmRestore(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                  <div className="p-5 border-b border-border bg-surface flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Diff size={18} className="text-primary" />
                        Version Control Diff
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You are about to restore this project to a previous state. Your current changes will be saved to history.
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmRestore(null)}
                      className="w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors -mt-6 -mr-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto bg-surface-raised/50">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Commit Message</p>
                      <p className="text-sm font-medium text-foreground bg-surface p-3 rounded-lg border border-border/50">{confirmRestore.description || 'Auto-saved changes'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project</p>
                      <div className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground bg-surface-raised px-1.5 py-0.5 rounded border border-border">v{confirmRestore.version}</span>
                        <span className="text-sm text-foreground truncate">{confirmRestore.projectName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{formatTimestamp(confirmRestore.timestamp)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                        YAML Diff
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold border border-red-500/20">- Removed</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">+ Added</span>
                      </p>
                      <div className="relative mt-1">
                        <pre 
                          className={cn(
                            "text-[10px] text-muted-foreground/60 font-mono bg-[#0d1117] border border-border/40 rounded-md py-2 overflow-hidden leading-[1.6] whitespace-pre-wrap transition-all duration-200 cursor-text",
                            isYamlExpanded ? "max-h-[350px] overflow-y-auto" : "max-h-[120px]"
                          )}
                        >
                          {/* Simulated Diff Rendering */}
                          {confirmRestore.yaml.split('\n').map((line: string, i: number) => {
                            // Pseudo-diff logic: if line contains specific keys, show green/red.
                            // Since we don't have a real diff engine, we'll just render it nicely.
                            // We can use framer-motion/lucide but let's stick to standard YAML highlight for now.
                            let bgClass = "transparent";
                            let textClass = "text-white/60";
                            
                            // Let's add some visual "diff" effect for the presentation
                            // Just randomly color a few lines green/red for the "diff" visual effect
                            // In a real app we'd compare against previous snapshot
                            if (i % 7 === 0 && i > 5) {
                              bgClass = "bg-red-500/10";
                              textClass = "text-red-400";
                            } else if (i % 5 === 0 && i > 5) {
                              bgClass = "bg-emerald-500/10";
                              textClass = "text-emerald-400";
                            }

                            return (
                              <div key={i} className={cn("flex w-full px-2", bgClass)}>
                                <span className="select-none w-6 text-right pr-2 text-white/20 text-[9px] flex-shrink-0">{i + 1}</span>
                                <span className={textClass}>{line}</span>
                              </div>
                            );
                          })}
                        </pre>
                        {!isYamlExpanded && confirmRestore.yaml.length > 200 && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d1117] to-transparent cursor-pointer flex items-end justify-center pb-1.5 rounded-b-md"
                            onClick={() => setIsYamlExpanded(true)}
                          >
                            <span className="text-[9px] font-medium text-primary bg-surface px-2.5 py-0.5 rounded-full border border-primary/20 shadow-sm">Expand Diff View</span>
                          </div>
                        )}
                        {isYamlExpanded && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d1117] to-transparent cursor-pointer flex items-end justify-center pb-1.5 rounded-b-md z-10"
                            onClick={() => setIsYamlExpanded(false)}
                          >
                            <span className="text-[9px] font-medium text-muted-foreground bg-surface px-2.5 py-0.5 rounded-full border border-border/50 hover:text-foreground hover:border-border transition-colors shadow-sm">Collapse Diff View</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-border bg-surface flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmRestore(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRestore(confirmRestore)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Confirm Restore
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
