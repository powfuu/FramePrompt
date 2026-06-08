import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Layers, Palette, Layout, Monitor, FileCode2, MousePointerClick, Smartphone, Columns2, Copy, Check, GripVertical, Zap, Plus, Pencil } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { AppIcon } from '@/lib/AppIcon';
import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- Animation Components for Each Step ---

// Step 1: Welcome Animation
const WelcomeAnimation = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, type: 'spring' }}
    className="flex flex-col items-center"
  >
    <motion.div
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
    >
      <AppIcon size={64} />
    </motion.div>
  </motion.div>
);

// Step 2: Sidebar Components Animation
const SidebarAnimation = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const runAnimation = () => {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 600);
      const t2 = setTimeout(() => setPhase(0), 2800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    };
    const { clearTimeout: ct, timeout: t } = (() => {
      const t = setTimeout(runAnimation, 100);
      const interval = setInterval(runAnimation, 3600);
      return { timeout: t, clearTimeout: () => { clearTimeout(t); clearInterval(interval); } };
    })();
    return ct;
  }, []);

  return (
    <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden">
      {/* Mock Sidebar */}
      <motion.div
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute left-0 top-0 bottom-0 w-[80px] border-r border-border bg-surface/90 flex flex-col gap-1 p-2 pt-3"
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25 mb-1.5" />
        {['Button', 'Card', 'Text', 'Input'].map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9.5px] text-muted-foreground bg-surface-raised border border-border/50",
              item === 'Button' && phase === 1 && "bg-primary/10 border-primary/40"
            )}
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/20" />
            <span className="truncate">{item}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Mock Canvas */}
      <div className="absolute left-[80px] right-0 top-0 bottom-0 flex items-start justify-center pt-4 canvas-grid-dark">
        <div className="w-full max-w-[200px] bg-surface-overlay/80 border border-border/50 rounded-xl p-3">
          {phase === 1 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-primary/50 bg-primary/10 h-8 flex items-center justify-center"
              >
                <span className="text-[10px] text-primary font-semibold">Button</span>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Dragging Ghost */}
      {phase === 1 && (
        <motion.div
          initial={{ x: 10, y: 30, opacity: 1 }}
          animate={{ x: 120, y: 55, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute z-20 flex items-center gap-2 px-3 py-2 bg-surface-overlay border-2 border-primary/80 rounded-xl shadow-2xl shadow-primary/30"
        >
          <GripVertical size={11} className="text-primary/70" />
          <span className="text-[11px] font-semibold text-foreground">Button</span>
        </motion.div>
      )}
    </div>
  );
};

// Step 3: Canvas Animation - Improved smoother, repetitive panning
const CanvasAnimation = () => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const animate = () => {
      setScale(1);
      setPan({ x: 0, y: 0 });
      
      const t1 = setTimeout(() => setScale(1.25), 500);
      const t2 = setTimeout(() => setPan({ x: -30, y: 15 }), 1500);
      const t3 = setTimeout(() => setPan({ x: 30, y: -10 }), 2500);
      const t4 = setTimeout(() => {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }, 3500);

      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      };
    };
    
    const cleanup = animate();
    const interval = setInterval(animate, 4500);
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden">
      <div className="absolute inset-0 canvas-grid-dark" />
      
      {/* Content to zoom/pan */}
      <motion.div
        style={{
          scale,
          x: pan.x,
          y: pan.y,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[220px] bg-surface-overlay/80 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
          <div className="rounded-lg border border-border/60 bg-surface-raised h-7 flex items-center px-2">
            <div className="w-16 h-1.5 rounded-full bg-foreground/20" />
          </div>
          <div className="rounded-lg border border-border/60 bg-surface-raised h-10" />
        </div>
      </motion.div>

      {/* Zoom indicators */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-surface/80 rounded-md text-[9px] font-mono text-muted-foreground border border-border/50">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

// Step 4: Inspector Animation
const InspectorAnimation = () => {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const toggle = () => {
      setSelected(true);
      const t = setTimeout(() => setSelected(false), 2000);
      return () => clearTimeout(t);
    };
    const init = setTimeout(toggle, 500);
    const interval = setInterval(toggle, 3500);
    return () => { clearTimeout(init); clearInterval(interval); };
  }, []);

  return (
    <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden flex">
      {/* Mock Canvas */}
      <div className="flex-1 flex items-center justify-center canvas-grid-dark p-4">
        <motion.div
          animate={selected ? { boxShadow: '0 0 0 2px var(--primary)' } : {}}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[160px] bg-surface-overlay/80 border border-border/50 rounded-xl p-3"
        >
          <div className="rounded-lg border border-border/60 bg-primary/10 h-8 flex items-center justify-center">
            <span className="text-[10px] text-primary font-semibold">Click Me</span>
          </div>
        </motion.div>
      </div>

      {/* Mock Inspector */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 100, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l border-border bg-surface/90 flex flex-col p-2 gap-2 overflow-hidden"
          >
            <div className="text-[8px] font-bold text-primary/70 uppercase tracking-widest">General</div>
            <div className="space-y-1">
              <div className="h-4 bg-surface-raised rounded border border-border/50" />
              <div className="h-4 bg-surface-raised rounded border border-border/50" />
            </div>
            <div className="text-[8px] font-bold text-primary/70 uppercase tracking-widest mt-1">Content</div>
            <div className="h-6 bg-surface-raised rounded border border-border/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Step 5: Multiple Screens Animation
const ScreensAnimation = () => {
  const [currentView, setCurrentView] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    const toggle = setInterval(() => {
      setCurrentView(v => v === 'mobile' ? 'desktop' : 'mobile');
    }, 1800);
    return () => clearInterval(toggle);
  }, []);

  return (
    <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden flex flex-col">
      {/* Mock Top Bar */}
      <div className="h-8 bg-surface/90 border-b border-border/60 flex items-center gap-1 px-2">
        <motion.button
          animate={currentView === 'mobile' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
          className="px-2 py-0.5 rounded text-[9px] flex items-center gap-1"
        >
          <Smartphone size={10} />
          <span>Mobile</span>
        </motion.button>
        <motion.button
          animate={currentView === 'desktop' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
          className="px-2 py-0.5 rounded text-[9px] flex items-center gap-1"
        >
          <Monitor size={10} />
          <span>Desktop</span>
        </motion.button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 canvas-grid-dark flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {currentView === 'mobile' ? (
            <motion.div
              key="mobile"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-[120px] bg-surface-overlay/80 border border-border/50 rounded-xl p-3"
            >
              <div className="rounded-lg border border-border/60 bg-surface-raised h-6 mb-2" />
              <div className="rounded-lg border border-border/60 bg-surface-raised h-8" />
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-[200px] bg-surface-overlay/80 border border-border/50 rounded-xl p-3"
            >
              <div className="flex gap-2">
                <div className="rounded-lg border border-border/60 bg-surface-raised h-16 flex-1" />
                <div className="rounded-lg border border-border/60 bg-surface-raised h-16 flex-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Step 6: Split View Animation
const SplitViewAnimation = () => (
  <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden">
    <div className="absolute inset-0 canvas-grid-dark flex items-center justify-center p-4 gap-4">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-[100px] bg-surface-overlay/80 border border-border/50 rounded-xl p-2 flex flex-col gap-1"
      >
        <div className="text-center text-[8px] text-primary/70 font-semibold mb-1">Mobile</div>
        <div className="rounded-lg border border-border/60 bg-surface-raised h-5" />
        <div className="rounded-lg border border-border/60 bg-surface-raised h-6" />
      </motion.div>
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-[130px] bg-surface-overlay/80 border border-border/50 rounded-xl p-2 flex flex-col gap-1"
      >
        <div className="text-center text-[8px] text-primary/70 font-semibold mb-1">Desktop</div>
        <div className="rounded-lg border border-border/60 bg-surface-raised h-5" />
        <div className="flex gap-1">
          <div className="rounded-lg border border-border/60 bg-surface-raised h-6 flex-1" />
          <div className="rounded-lg border border-border/60 bg-surface-raised h-6 flex-1" />
        </div>
      </motion.div>
    </div>
  </div>
);

// Step 7: YAML Export Animation
const YamlAnimation = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const animate = () => {
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 2200);
      return () => clearTimeout(t);
    };
    const init = setTimeout(animate, 600);
    const interval = setInterval(animate, 3600);
    return () => { clearTimeout(init); clearInterval(interval); };
  }, []);

  return (
    <div className="relative w-full h-[160px] bg-background rounded-2xl border border-border overflow-hidden flex flex-col">
      {/* Mock Canvas */}
      <div className="flex-1 canvas-grid-dark flex items-center justify-center p-4">
        <div className="w-full max-w-[180px] bg-surface-overlay/80 border border-border/50 rounded-xl p-3">
          <div className="rounded-lg border border-border/60 bg-surface-raised h-6 mb-2" />
          <div className="rounded-lg border border-border/60 bg-surface-raised h-8" />
        </div>
      </div>

      {/* Mock Top Bar with Copy Button */}
      <div className="h-10 bg-surface/90 border-t border-border/60 flex items-center justify-end px-3">
        <motion.button
          animate={copied ? { backgroundColor: '#10b981', color: 'white', scale: 1.05 } : {}}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold border border-primary/30"
        >
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <Check size={12} />
              <span>Copied!</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1">
              <Copy size={12} />
              <span>Copy YAML</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* YAML Popup */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#0d1117] border border-white/10 rounded-xl p-3 w-[180px] shadow-2xl"
          >
            <div className="text-[7px] font-mono text-emerald-400 font-semibold mb-1">✓ layout.yaml</div>
            <div className="text-[7px] font-mono text-white/60 space-y-0.5">
              <div>version: 1</div>
              <div>screens:</div>
              <div className="pl-2">- name: Home</div>
              <div className="pl-4">layout:</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Screen Management Animation
const ScreensManagementAnimation = () => {
  const [screens, setScreens] = useState([
    { id: 1, name: 'Home', active: true },
    { id: 2, name: 'About', active: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScreens(prev => prev.map(s => ({ ...s, active: !s.active })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[160px] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {screens.map((screen, idx) => (
          <motion.div
            key={screen.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, x: 0,
              backgroundColor: screen.active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
              borderColor: screen.active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)'
            }}
            transition={{ delay: idx * 0.2 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg border"
          >
            <Monitor size={14} className={screen.active ? 'text-primary' : 'text-muted-foreground/50'} />
            <span className={cn('text-sm truncate', screen.active ? 'text-primary font-medium' : 'text-muted-foreground/70')}>
              {screen.name}
            </span>
            {screen.active && (
              <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50"
        >
          <Plus size={14} className="text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground/50">Add new screen...</span>
        </motion.div>
      </div>
    </div>
  );
};

// Step 8: Ready Animation - New original icon, less spacing
const ReadyAnimation = () => (
  <div className="relative w-full h-[100px] flex flex-col items-center justify-center">
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 12
      }}
      className="flex items-center justify-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-xl shadow-primary/20">
        <Zap size={36} className="text-primary fill-primary/30" />
      </div>
    </motion.div>
  </div>
);

// --- Tutorial Steps Definition ---
const TUTORIAL_STEPS = [
  {
    icon: AppIcon,
    title: 'Welcome to FramePrompt!',
    description: 'Your tool for designing interfaces quickly and easily.',
    details: 'Create, edit, and export your designs in seconds. Let\'s start with a quick tour.',
    animation: WelcomeAnimation,
  },
  {
    icon: Layers,
    title: 'Components Panel',
    description: 'On the left you\'ll find all available components.',
    details: 'Drag and drop buttons, cards, forms, and more directly onto your canvas.',
    animation: SidebarAnimation,
  },
  {
    icon: Monitor,
    title: 'The Canvas',
    description: 'Main area where you build your design.',
    details: 'Organize your components here. Use Zoom or Space+Drag to navigate.',
    animation: CanvasAnimation,
  },
  {
    icon: Palette,
    title: 'Properties Inspector',
    description: 'Customize each component in depth.',
    details: 'Select any element and adjust its content, size, and style from the right panel.',
    animation: InspectorAnimation,
  },
  {
    icon: Monitor,
    title: 'Multiple Screens',
    description: 'Create and manage different project screens.',
    details: 'Add, rename, duplicate, and delete screens from the left sidebar. Switch between screens instantly.',
    animation: ScreensManagementAnimation,
  },
  {
    icon: Layout,
    title: 'Responsive Views',
    description: 'Design for mobile and desktop.',
    details: 'Use the buttons on the top bar to switch between mobile, desktop, or split views.',
    animation: ScreensAnimation,
  },
  {
    icon: Columns2,
    title: 'Split View Mode',
    description: 'See mobile and desktop at the same time.',
    details: 'Perfect for ensuring your design works on all devices.',
    animation: SplitViewAnimation,
  },
  {
    icon: FileCode2,
    title: 'Export to YAML',
    description: 'Export your design in seconds.',
    details: 'Click "Copy YAML" to copy the code and paste it where you need it.',
    animation: YamlAnimation,
  },
  {
    icon: Zap,
    title: 'Ready to Create!',
    description: 'You know the basics.',
    details: 'Start building your designs! Press Cmd+H or Ctrl+H to see this tutorial again.',
    animation: ReadyAnimation,
  },
];

export function TutorialModal() {
  const tutorialOpen = useUIStore((s) => s.tutorialOpen);
  const tutorialStep = useUIStore((s) => s.tutorialStep);
  const setTutorialOpen = useUIStore((s) => s.setTutorialOpen);
  const setTutorialStep = useUIStore((s) => s.setTutorialStep);
  const setHasSeenTutorial = useUIStore((s) => s.setHasSeenTutorial);

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStepData = TUTORIAL_STEPS[tutorialStep];
  const AnimationComponent = currentStepData.animation;

  const nextStep = useCallback(() => {
    if (tutorialStep < totalSteps - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setHasSeenTutorial(true);
      setTutorialOpen(false);
      setTutorialStep(0);
    }
  }, [tutorialStep, totalSteps, setTutorialStep, setTutorialOpen, setHasSeenTutorial]);

  const prevStep = useCallback(() => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  }, [tutorialStep, setTutorialStep]);

  const closeTutorial = useCallback(() => {
    setHasSeenTutorial(true);
    setTutorialOpen(false);
    setTutorialStep(0);
  }, [setTutorialOpen, setTutorialStep, setHasSeenTutorial]);

  return (
    <AnimatePresence>
      {tutorialOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[500px] bg-gradient-to-br from-surface-raised to-surface border border-border/70 rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
          >
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="p-5 pb-3 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AppIcon size={24} />
                  <h2 className="text-lg font-bold text-foreground">
                    Frame<span className="text-primary">Prompt</span> 
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-white font-light">
                    {tutorialStep + 1}/{totalSteps}
                  </span>
                  <button
                    onClick={closeTutorial}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center w-full">
                <div className="flex items-center gap-2">
                  {TUTORIAL_STEPS.map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={false}
                      animate={{
                        width: idx === tutorialStep ? 24 : 8,
                        backgroundColor: idx <= tutorialStep ? 'var(--primary)' : 'var(--border)'
                      }}
                      transition={{ duration: 0.25 }}
                      className="h-2 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Animation Area */}
            <div className="px-5 pb-3 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tutorialStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimationComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="px-5 py-1 relative z-10 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tutorialStep}
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col items-center text-center"
                >
                  <h3 className="text-xl font-bold text-foreground mb-1.5">
                    {currentStepData.title}
                  </h3>
                  
                  <p className="text-sm text-primary font-medium mb-1">
                    {currentStepData.description}
                  </p>
                  
                  <p className="text-xs text-muted-foreground/75 max-w-[420px] leading-relaxed">
                    {currentStepData.details}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-5 pt-4 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <AnimatePresence>
                  {tutorialStep > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={prevStep}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:bg-surface/50"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </motion.button>
                  )}
                  {tutorialStep === 0 && <div className="flex-1" />}
                </AnimatePresence>

                <motion.button
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  {tutorialStep === totalSteps - 1 ? 'Start Creating!' : 'Next'}
                  {tutorialStep !== totalSteps - 1 && <ChevronRight size={16} />}
                </motion.button>
              </div>
            </div>

            {/* Skip hint */}
            <div className="px-5 pb-5 pt-0 relative z-10">
              <p className="text-xs text-muted-foreground/50 text-center">
                Press <kbd className="px-2 py-0.5 rounded bg-surface/50 border border-primary/30 text-primary font-mono text-[10px] font-semibold">Cmd+H</kbd> or <kbd className="px-2 py-0.5 rounded bg-surface/50 border border-primary/30 text-primary font-mono text-[10px] font-semibold">Ctrl+H</kbd> to open/close tutorial
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
