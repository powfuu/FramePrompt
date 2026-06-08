import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History as HistoryIcon, Layers, FileCode2, Home, ArrowLeft, Trash2, GitCommit, Diff, RotateCcw, X } from 'lucide-react';
import { useHistoryStore } from '@/store/historyStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/lib/AppIcon';
import { TEMPLATES } from '@/lib/templates';
import { formatTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function StartupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const snapshotsRaw = useHistoryStore((s) => s.snapshots);
  const projectsRaw = useProjectStore((s) => s.projects);
  // Memoize data lists so they don't trigger re-renders
  const snapshots = useMemo(() => snapshotsRaw, [snapshotsRaw]);
  const projects = useMemo(() => projectsRaw, [projectsRaw]);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const newProject = useCanvasStore((s) => s.newProject);
  const loadProject = useCanvasStore((s) => s.loadProject);
  const navigate = useNavigate();

  const [view, setView] = useState<'menu' | 'projects' | 'versions' | 'templates'>('menu');
  const [confirmRestore, setConfirmRestore] = useState<any | null>(null);
  const [expandedYaml, setExpandedYaml] = useState(false);
  const hasCurrentProject = Object.keys(useCanvasStore((s) => s.components)).length > 0;

  useEffect(() => {
    if (open) {
      setView('menu');
      useProjectStore.getState().load();
    }
  }, [open]);

  const handleNewProject = () => {
    setView('templates');
  };

  const handleStartBlank = () => {
    newProject();
    onClose();
  };

  const handleStartTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    newProject();
    const { components, rootIds } = template.build();
    const { screens, currentScreenId } = useCanvasStore.getState();
    const updatedScreens = screens.map((s) =>
      s.id === currentScreenId ? { ...s, rootIds } : s
    );
    useCanvasStore.setState({
      components,
      screens: updatedScreens,
      projectName: template.name,
      deviceMode: 'split',
      isDirty: true,
      changeCounter: 1,
    });
    useProjectStore.getState().saveProject(useCanvasStore.getState());
    onClose();
  };

  const handleRecentProjects = () => {
    setView('projects');
  };

  const handleLoadProject = (p: any) => {
    loadProject(p);
    onClose();
  };

  const handleRestoreSnapshot = (snapshot: any) => {
    useCanvasStore.getState().pushHistory();
    useCanvasStore.setState({
      projectId: snapshot.canvasState.projectId,
      projectName: snapshot.projectName,
      components: snapshot.canvasState.components,
      rootIds: snapshot.canvasState.rootIds,
      viewport: snapshot.canvasState.viewport,
      deviceMode: snapshot.canvasState.deviceMode,
      frameWidths: snapshot.canvasState.frameWidths,
      frameSizes: snapshot.canvasState.frameSizes,
      selectedIds: [],
      isDirty: false,
      changeCounter: 0,
    });
    setConfirmRestore(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 backdrop-blur-md"
            onClick={() => {
              if (hasCurrentProject) {
                onClose();
              }
            }}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[480px] bg-surface-raised border border-border/60 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-8 pb-5 flex flex-col items-center text-center relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {view === 'menu' ? (
                  <motion.div key="menu-header" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="flex flex-col items-center relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mb-5 shadow-sm">
                      <AppIcon size={28} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Frame<span className="text-primary">Prompt</span></h2>
                    <p className="text-sm text-muted-foreground mt-1.5">Choose an option to start building your layout.</p>
                  </motion.div>
                ) : view === 'templates' ? (
                  <motion.div key="templates-header" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="flex flex-col items-center relative z-10 w-full">
                    <div className="w-full flex items-center justify-between mb-4">
                      <button onClick={() => setView('menu')} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shadow-sm">
                        <FileCode2 size={18} className="text-primary" />
                      </div>
                      <div className="w-[60px]" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Choose a Template</h2>
                    <p className="text-sm text-muted-foreground mt-1.5">Start with a pre-built layout or a blank canvas.</p>
                  </motion.div>
                ) : view === 'projects' ? (
                  <motion.div key="projects-header" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="flex flex-col items-center relative z-10 w-full">
                    <div className="w-full flex items-center justify-between mb-4">
                      <button onClick={() => setView('menu')} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shadow-sm">
                        <HistoryIcon size={18} className="text-primary" />
                      </div>
                      <div className="w-[60px]" /> {/* Spacer for balance */}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Projects</h2>
                    <p className="text-sm text-muted-foreground mt-1.5">Pick up where you left off.</p>
                  </motion.div>
                ) : view === 'versions' ? (
                  <motion.div key="versions-header" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="flex flex-col items-center relative z-10 w-full">
                    <div className="w-full flex items-center justify-between mb-4">
                      <button onClick={() => setView('menu')} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shadow-sm">
                        <GitCommit size={18} className="text-primary" />
                      </div>
                      <div className="w-[60px]" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Version Control</h2>
                    <p className="text-sm text-muted-foreground mt-1.5">Restore any previous version.</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="p-3 bg-surface/30 relative min-h-[160px] overflow-hidden flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {view === 'menu' ? (
                  <motion.div key="menu-content" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                    {hasCurrentProject && (
                      <OptionButton
                        icon={Layers}
                        title="Resume Current Project"
                        description="Continue working on your current layout"
                        onClick={onClose}
                      />
                    )}
                    <OptionButton
                      icon={FileCode2}
                      title="New Project"
                      description="Start from scratch with a blank canvas"
                      onClick={handleNewProject}
                    />
                    <OptionButton
                      icon={HistoryIcon}
                      title="Projects"
                      description={projects.length > 0 ? `Open one of your ${projects.length} saved projects` : 'No saved projects available'}
                      onClick={handleRecentProjects}
                    />
                    <OptionButton
                      icon={GitCommit}
                      title="Version Control"
                      description="View and restore previous versions of your projects"
                      onClick={() => setView('versions')}
                    />
                  </motion.div>
                ) : view === 'templates' ? (
                  <motion.div key="templates-content" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
                    <OptionButton
                      icon={Search}
                      title="Blank Project"
                      description="Start from scratch with an empty canvas"
                      onClick={handleStartBlank}
                    />
                    <div className="h-px bg-border/50 my-2" />
                    {TEMPLATES.map((t) => (
                      <OptionButton
                        key={t.id}
                        icon={t.icon}
                        title={t.name}
                        description={t.description}
                        onClick={() => handleStartTemplate(t.id)}
                      />
                    ))}
                  </motion.div>
                ) : view === 'projects' ? (
                  <motion.div key="projects-content" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                    {projects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-3">
                          <HistoryIcon size={16} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No projects found</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Your saved projects will appear here</p>
                      </div>
                    ) : (
                      projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleLoadProject(p)}
                          className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-surface hover:border-border cursor-pointer transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-muted-foreground">{formatTimestamp(p.updatedAt)}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[11px] text-muted-foreground">{Object.keys(p.state.components).length} components</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : view === 'versions' ? (
                  <motion.div key="versions-content" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                    {snapshots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-3">
                          <GitCommit size={16} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No versions yet</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Versions are saved automatically</p>
                      </div>
                    ) : (
                      snapshots.map((snap) => (
                        <div
                          key={snap.id}
                          onClick={snap.description === 'YAML Copied' ? undefined : () => setConfirmRestore(snap)}
                          className={cn(
                            "group flex flex-col p-3 rounded-xl border transition-all relative",
                            snap.description === 'YAML Copied' 
                              ? "border-transparent hover:bg-surface cursor-default" 
                              : "border-transparent hover:bg-surface hover:border-border cursor-pointer"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <GitCommit size={12} className={snap.description === 'YAML Copied' ? "text-emerald-400" : "text-primary"} />
                              <p className={cn("text-[11px] font-semibold truncate", snap.description === 'YAML Copied' ? "text-emerald-400" : "text-primary")}>
                                {snap.description === 'YAML Copied' ? 'YAML copied' : 'Auto saved commit'}
                              </p>
                            </div>
                            
                            {/* Diff Action Icon */}
                            {snap.description !== 'YAML Copied' && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-surface-raised border border-border/50 rounded p-1 shadow-sm" title="View Diff">
                                <Diff size={11} className="text-muted-foreground hover:text-primary transition-colors" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">{snap.description || snap.projectName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border/50">v{snap.version}</span>
                            <span className="text-[10px] text-muted-foreground truncate" title={snap.projectName}>{snap.projectName}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[11px] text-muted-foreground">{formatTimestamp(snap.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-surface border-t border-border/50 flex justify-between items-center flex-shrink-0">
              <span className="text-[11px] font-mono text-muted-foreground/60">v1.0.0-beta</span>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-xs font-medium text-red-500/80 hover:text-red-500 transition-colors"
              >
                <Home size={13} />
                Close FramePrompt
              </button>
            </div>
          </motion.div>

          {/* Confirmation Popup */}
          <AnimatePresence>
            {confirmRestore && (
              <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
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
                            expandedYaml ? "max-h-[350px] overflow-y-auto" : "max-h-[120px]"
                          )}
                        >
                          {/* Simulated Diff Rendering */}
                          {confirmRestore.yaml.split('\n').map((line: string, i: number) => {
                            let bgClass = "transparent";
                            let textClass = "text-white/60";
                            
                            // Visual "diff" effect for presentation
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
                        {!expandedYaml && confirmRestore.yaml.length > 200 && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d1117] to-transparent cursor-pointer flex items-end justify-center pb-1.5 rounded-b-md"
                            onClick={() => setExpandedYaml(true)}
                          >
                            <span className="text-[9px] font-medium text-primary bg-surface px-2.5 py-0.5 rounded-full border border-primary/20 shadow-sm">Expand Diff View</span>
                          </div>
                        )}
                        {expandedYaml && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d1117] to-transparent cursor-pointer flex items-end justify-center pb-1.5 rounded-b-md z-10"
                            onClick={() => setExpandedYaml(false)}
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
                      onClick={() => handleRestoreSnapshot(confirmRestore)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Confirm Restore
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

const OptionButton = memo(function OptionButton({ icon: Icon, title, description, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left group",
        disabled
          ? "opacity-50 cursor-not-allowed border-transparent bg-transparent"
          : "border-transparent hover:bg-primary/5 hover:border-primary/20 bg-transparent"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
        disabled 
          ? "bg-surface-raised border border-border/50 text-muted-foreground/50" 
          : "bg-surface-raised border border-border text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20"
      )}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-semibold transition-colors", disabled ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">{description}</div>
      </div>
    </button>
  );
});