import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { AppIcon } from '@/lib/AppIcon';
import {
  MousePointerClick,
  Copy,
  Layers,
  Smartphone,
  History,
  Zap,
  ArrowRight,
  Code2,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Plus,
  Check,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Particles } from './Particles';

// ─── Smooth scroll for all anchor links ───────────────────────────────────────
function useSmoothAnchorScroll() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}

// ─── Scroll progress bar (top) ────────────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 to-primary z-[100] origin-left"
      style={{ scaleX }}
    />
  );
}

// ─── Custom scroll indicator (right side) ────────────────────────────────────
const RAIL_HEIGHT = 180;
const KNOB_SIZE = 14; // circle diameter
const KNOB_TRAVEL = RAIL_HEIGHT - KNOB_SIZE;

function ScrollTrack() {
  const { scrollYProgress } = useScroll();
  const knobY = useTransform(scrollYProgress, [0, 1], [0, KNOB_TRAVEL]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0.4, 0.7, 0.7, 0.4]);
  const fillH = useTransform(scrollYProgress, [0, 1], [0, RAIL_HEIGHT]);
  const [isDragging, setIsDragging] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const scrollToFraction = useCallback((frac: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, Math.min(1, frac)) * maxScroll });
  }, []);

  const handleRailClick = useCallback((e: React.MouseEvent) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    scrollToFraction((e.clientY - rect.top) / rect.height);
  }, [scrollToFraction]);

  const handleKnobPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const onMove = (me: PointerEvent) => {
      if (!railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      scrollToFraction((me.clientY - rect.top) / rect.height);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [scrollToFraction]);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
      {/* Rail */}
      <div
        ref={railRef}
        onClick={handleRailClick}
        className="relative rounded-full bg-border/20 cursor-pointer hover:bg-border/35 transition-colors"
        style={{ width: 6, height: RAIL_HEIGHT }}
      >
        {/* Fill */}
        <motion.div
          className="absolute top-0 left-0 right-0 rounded-full pointer-events-none overflow-hidden"
          style={{ height: fillH }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-sky-400 to-primary"
            animate={{ backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '100% 200%' }}
          />
          {/* shimmer sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
          />
        </motion.div>
        {/* Knob — perfect circle */}
        <motion.div
          onPointerDown={handleKnobPointerDown}
          style={{ y: knobY }}
          className="absolute touch-none"
          animate={{ left: isDragging ? -7 : -4 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            style={{ opacity: glowOpacity, width: KNOB_SIZE, height: KNOB_SIZE }}
            animate={isDragging ? { scale: 1.25 } : { scale: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'rounded-full border-2 border-background cursor-grab',
              'bg-gradient-to-b from-primary via-primary/70 to-primary/40',
              'shadow-[0_0_8px_2px] shadow-primary/30',
              isDragging && 'cursor-grabbing shadow-[0_0_20px_6px] shadow-primary/80',
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Back to top button ───────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 16 }}
          transition={{ duration: 0.25 }}
          onClick={scrollTop}
          className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-full bg-surface-overlay border border-border shadow-xl shadow-black/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:shadow-primary/20 transition-all duration-200"
          title="Back to top"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronUp size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8%' });

  const variants = {
    up: { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants[direction]}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated drag demo ───────────────────────────────────────────────────────
const DEMO_SEQUENCE = [
  { label: 'Navbar', color: 'border-border/60 bg-surface-raised', textW: 'w-20', height: 'h-7', center: false },
  { label: 'Heading', color: 'border-sky-400/30 bg-sky-400/[0.05]', textW: 'w-24', height: 'h-6', center: false },
  { label: 'Text', color: 'border-border/60 bg-surface-raised', textW: 'w-full', height: 'h-8', center: false },
  { label: 'Button', color: 'border-primary/50 bg-primary/[0.12]', textW: 'w-12', height: 'h-8', center: true },
  { label: 'Input', color: 'border-border/70 bg-surface-raised', textW: 'w-16', height: 'h-8', center: false },
  { label: 'Card', color: 'border-blue-500/30 bg-blue-500/[0.06]', textW: 'w-20', height: 'h-10', center: false },
];

// Heights in px (must match the Tailwind class values above for ghost positioning)
const ITEM_HEIGHTS: Record<string, number> = {
  'h-7': 28, 'h-6': 24, 'h-8': 32, 'h-10': 40,
};
const ITEM_GAP = 8; // gap-2

const SIDEBAR_ITEMS = [
  'Heading', 'Text', 'Button', 'Image',
  'Navbar', 'Input', 'Card', 'Section',
];

// Phase timing (ms)
const PAUSE_BEFORE = 700;
const DRAG_TRAVEL = 1400;
const DROP_SETTLE = 400;
const BETWEEN_ITEMS = 700;
const COPY_PAUSE = 1200;     // pause after all placed before copy click
const COPY_FLASH = 500;      // copy button flash duration
const TERMINAL_DELAY = 600;  // after copy flash, terminal slides in
const TERMINAL_TYPE = 80;    // ms per YAML line typed
const TERMINAL_LINES = 8;    // how many YAML lines to type
const RESET_PAUSE = 2800;

const YAML_LINES = [
  '$ frameprompt paste layout.yaml',
  '',
  'version: 1',
  'screens:',
  '  - name: Home',
  '    layout:',
  '      - navbar',
  '      - heading',
  '      - text',
  '      - button',
  '      - input',
  '      - card',
];

// Layout constants for ghost positioning (must match rendered DOM)
const SIDEBAR_W = 90;
const TOPBAR_H = 36; // h-9

function DragDemo() {
  const [phase, setPhase] = useState<'idle' | 'dragging' | 'dropping' | 'copying' | 'terminal'>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [placed, setPlaced] = useState<typeof DEMO_SEQUENCE>([]);
  const [terminalLines, setTerminalLines] = useState(0);
  const [dropTarget, setDropTarget] = useState({ x: 150, y: 80 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  const getDropTarget = useCallback((placedItems: typeof DEMO_SEQUENCE) => {
    if (!containerRef.current || !cardRef.current) return { x: 150, y: 80 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    const x = cardRect.left - containerRect.left + 10;
    let y = cardRect.top - containerRect.top + 12;
    for (const item of placedItems) {
      y += (ITEM_HEIGHTS[item.height] ?? 32) + ITEM_GAP;
    }
    return { x, y };
  }, []);

  const runStep = useCallback((idx: number) => {
    const item = DEMO_SEQUENCE[idx];
    if (!item) {
      // All placed — copy YAML phase
      after(COPY_PAUSE, () => {
        setPhase('copying');
        after(COPY_FLASH, () => {
          setPhase('terminal');
          setTerminalLines(0);
          // Type each YAML line
          YAML_LINES.forEach((_, li) => {
            after(TERMINAL_DELAY + li * TERMINAL_TYPE, () => {
              setTerminalLines(li + 1);
            });
          });
          // After all lines typed, reset
          after(TERMINAL_DELAY + YAML_LINES.length * TERMINAL_TYPE + RESET_PAUSE, () => {
            setPhase('idle');
            setPlaced([]);
            setTerminalLines(0);
            after(PAUSE_BEFORE, () => setStepIdx(0));
          });
        });
      });
      return;
    }
    setPhase('idle');
    after(PAUSE_BEFORE, () => {
      setPlaced((current) => {
        setDropTarget(getDropTarget(current));
        return current;
      });
      setPhase('dragging');
      after(DRAG_TRAVEL, () => {
        setPhase('dropping');
        after(DROP_SETTLE, () => {
          setPlaced((p) => [...p, item]);
          setPhase('idle');
          after(BETWEEN_ITEMS, () => {
            setStepIdx(idx + 1);
          });
        });
      });
    });
  }, [after, getDropTarget]);

  // Trigger runStep whenever stepIdx changes
  useEffect(() => {
    runStep(stepIdx);
    return clearAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const currentItem = DEMO_SEQUENCE[stepIdx] ?? DEMO_SEQUENCE[0];
  const isDragging = phase === 'dragging' || phase === 'dropping';
  const showTerminal = phase === 'terminal';
  const isCopying = phase === 'copying';

  // Compute ghost start position from sidebar
  const sidebarItemIndex = SIDEBAR_ITEMS.indexOf(currentItem.label);
  const ghostStartY = TOPBAR_H + 12 + sidebarItemIndex * 26;
  const ghostStartX = 10;

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden rounded-2xl bg-background">
      {/* Dotted grid bg — matches real editor exactly */}
      <div className="absolute inset-0 canvas-grid-dark" />

      {/* Top bar mock */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-surface/95 border-b border-border/60 backdrop-blur-sm flex items-center px-3 gap-2 z-10">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 mx-3 h-4 rounded-full bg-surface-raised/80 border border-border/40" />
        {/* Copy YAML button — flashes on copy phase */}
        <motion.div
          animate={isCopying
            ? { scale: [1, 0.92, 1.08, 1], backgroundColor: ['rgba(0,112,243,0.1)', '#22c55e', '#22c55e', 'rgba(0,112,243,0.1)'] }
            : { scale: 1, backgroundColor: 'rgba(0,112,243,0.1)' }
          }
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="w-[70px] h-5 rounded-md flex items-center justify-center gap-1 overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCopying ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1"
              >
                <Check size={8} className="text-white" />
                <span className="text-[8px] text-white font-bold">Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 text-primary"
              >
                <Copy size={8} />
                <span className="text-[8px] font-semibold">Copy YAML</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Sidebar */}
      <div className="absolute left-0 top-9 bottom-0 w-[90px] border-r border-border/60 bg-surface/90 backdrop-blur-sm flex flex-col gap-1 p-2 pt-3">
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25 mb-1.5" />
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = isDragging && currentItem.label === item;
          return (
            <motion.div
              key={item}
              animate={isActive ? { x: 6, opacity: 0.35, scale: 0.97 } : { x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9.5px] text-muted-foreground bg-surface-raised border border-border/50 cursor-grab"
            >
              <div className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', isActive ? 'bg-primary/40' : 'bg-muted-foreground/20')} />
              <span className="truncate leading-none">{item}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="absolute left-[90px] right-0 top-9 bottom-0 flex items-start justify-center pt-6 px-5">
        <div ref={cardRef} className="w-full max-w-[340px] bg-surface-overlay/80 border border-border/50 rounded-xl shadow-2xl p-3 flex flex-col gap-2 min-h-[180px]">

          {/* Placed components */}
          <AnimatePresence initial={false}>
            {placed.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.36, ease: [0.34, 1.15, 0.64, 1] }}
                className={cn(
                  'rounded-lg border flex items-center px-2.5 flex-shrink-0',
                  item.height,
                  item.color,
                  item.center && 'justify-center',
                )}
              >
                <div className={cn('h-1.5 rounded-full bg-foreground/20', item.textW, item.center && 'bg-primary/50')} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Insert line */}
          <AnimatePresence>
            {phase === 'dragging' && (
              <motion.div
                key="insert"
                initial={{ opacity: 0, scaleX: 0.4 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.4 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center gap-1 pointer-events-none flex-shrink-0"
              >
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_3px] shadow-primary/60 flex-shrink-0" />
                <div className="flex-1 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-primary/10 rounded-full" />
                <div className="w-2 h-2 rounded-full bg-primary/30 flex-shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>

          {placed.length === 0 && !isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center py-4"
            >
              <div className="text-[9px] text-muted-foreground/40 text-center">Drop components here</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Drag ghost — travels from sidebar item to exact drop position */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key={`ghost-${stepIdx}`}
            initial={{ x: ghostStartX, y: ghostStartY, opacity: 0, scale: 0.88, rotate: -2 }}
            animate={phase === 'dragging'
              ? { x: dropTarget.x, y: dropTarget.y, opacity: 1, scale: 1, rotate: 1 }
              : { x: dropTarget.x, y: dropTarget.y, opacity: 0, scale: 0.92, rotate: 0 }
            }
            transition={phase === 'dragging'
              ? { duration: DRAG_TRAVEL / 1000, ease: [0.25, 0.46, 0.15, 1] }
              : { duration: DROP_SETTLE / 1000, ease: [0.4, 0, 0.2, 1] }
            }
            className="absolute pointer-events-none z-30 flex items-center gap-2 px-3 py-2 bg-surface-overlay border-2 border-primary/80 rounded-xl shadow-2xl shadow-primary/30"
          >
            <GripVertical size={11} className="text-primary/70 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-foreground leading-none">{currentItem.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YAML panel — hidden during terminal phase */}
      <AnimatePresence>
        {!showTerminal && (
          <motion.div
            key="yaml-panel"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-3 right-3 w-[108px] bg-surface-overlay/95 border border-border/60 rounded-xl p-2.5 shadow-xl backdrop-blur-sm overflow-hidden"
          >
            <div className="text-[7.5px] font-bold text-muted-foreground/50 mb-2 uppercase tracking-widest">YAML</div>
            <div className="space-y-[3px]">
              {[
                { txt: 'version: 1', indent: false },
                { txt: 'screens:', indent: false },
                { txt: '  - layout:', indent: false },
                ...placed.map((item) => ({ txt: `      - ${item.label.toLowerCase()}`, indent: true })),
              ].map((line, i) => (
                <motion.div
                  key={`${i}-${line.txt}`}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.25 }}
                  className={cn(
                    'text-[7px] font-mono leading-relaxed truncate',
                    line.indent ? 'text-primary/60' : 'text-muted-foreground/60',
                  )}
                >
                  {line.txt}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal — floating window, centered over canvas */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.38, ease: [0.34, 1.1, 0.64, 1] }}
            className="absolute z-30 shadow-2xl shadow-black/70 flex items-center justify-center"
            style={{
              left: SIDEBAR_W + 16,
              right: 16,
              top: TOPBAR_H + 20,
              bottom: 16,
            }}
          >
            <div className="w-[85%] h-[85%] max-w-[500px] max-h-[400px] bg-[#0d1117] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-[#161b22] flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="flex-1 text-center text-[11px] font-medium text-white/40 tracking-wide">claude-code — bash</span>
              </div>

              {/* Content */}
              <div className="flex-1 px-5 py-4 font-mono text-[11px] leading-[1.8] overflow-hidden">
                {YAML_LINES.slice(0, terminalLines).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className={cn(
                      'whitespace-pre',
                      i === 0 ? 'text-emerald-400 font-semibold' :
                      line === '' ? 'h-2 block' :
                      line.startsWith('version') || line.startsWith('screens') ? 'text-white/80 font-semibold' :
                      line.startsWith('  - name') || line.startsWith('    layout') ? 'text-sky-300/90' :
                      line.startsWith('      -') ? 'text-foreground/70' :
                      line.startsWith('  -') ? 'text-sky-300/90' :
                      'text-white/60'
                    )}
                  >
                    {line || ''}
                  </motion.div>
                ))}
                {terminalLines > 0 && terminalLines <= YAML_LINES.length && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-[13px] bg-emerald-400/80 align-middle ml-0.5"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle glow on canvas while dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute left-[90px] top-9 right-0 bottom-0 bg-primary/[0.025] pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── How It Works animated step cards ────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    title: 'Design Your Screen',
    desc: 'Drag components from the sidebar onto the canvas. Build complete page structures in minutes — headers, cards, forms, navigation — all visually.',
    icon: MousePointerClick,
    color: 'from-foreground/10 to-foreground/5',
    iconColor: 'text-foreground',
    iconBg: 'bg-foreground/10',
  },
  {
    step: '02',
    title: 'Copy YAML Spec',
    desc: 'Hit "Copy YAML". Your entire layout is instantly serialized into a clean, semantic specification — optimized for AI understanding, not pixel coordinates.',
    icon: Copy,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    step: '03',
    title: 'Paste into Any AI Agent',
    desc: 'Drop the YAML into Claude Code, ChatGPT, Cursor, Gemini, or Windsurf. Tell it your stack. The AI has a complete blueprint to work from.',
    icon: Code2,
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
  {
    step: '04',
    title: 'Ship Your Application',
    desc: "Your AI agent builds the full implementation — UI, logic, routing. You get production-ready code without writing a single line from scratch.",
    icon: Zap,
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
];

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Drag & Drop Builder',
    desc: 'Intuitive canvas with snap-to-grid, insert indicators, and alignment guides. Structure any layout visually — no config, no code.',
  },
  {
    icon: Code2,
    title: 'AI-Optimized YAML',
    desc: 'Output engineered for AI comprehension. Semantic roles, component hierarchy, and intent — not visual coordinates or style rules.',
  },
  {
    icon: Smartphone,
    title: 'Mobile & Desktop Views',
    desc: 'Switch between 390px mobile and 1440px desktop in one click. Side-by-side split view lets you compare both simultaneously.',
  },
  {
    icon: History,
    title: 'Full Session History',
    desc: 'Every YAML export is automatically saved as a snapshot. Restore, rename, diff, or re-copy any previous version at any time.',
  },
  {
    icon: Zap,
    title: 'Semantic Architecture',
    desc: 'Components carry roles, descriptions, and intent. AI agents understand what elements do, not just where they appear.',
  },
  {
    icon: Layers,
    title: 'Infinitely Nestable',
    desc: 'Full support for nested layouts — containers, rows, columns, cards, modals. Model complex multi-level page structures accurately.',
  },
];

const FAQS = [
  {
    q: 'Can I manage multiple projects?',
    a: 'Yes! FramePrompt includes a built-in project manager. You can create new projects, switch between projects, and keep all your wireframes organized locally without needing an account.',
  },
  {
    q: 'Are my designs saved in the cloud?',
    a: 'No, everything runs 100% locally in your browser. Your projects, components, and history are stored securely in your local storage, ensuring maximum privacy and zero latency.',
  },
  {
    q: 'What exactly is FramePrompt?',
    a: 'FramePrompt is a visual wireframe builder that generates AI-ready YAML specifications instead of code. You design your application layout visually, then copy the structured YAML and paste it into any AI coding agent — which builds the actual implementation for you.',
  },
  {
    q: 'Which AI coding tools does it work with?',
    a: 'Any AI that accepts text input — Claude Code, ChatGPT, Cursor, Gemini, Windsurf, GitHub Copilot Workspace, and more. The YAML is plain text, so it works everywhere.',
  },
  {
    q: 'Why YAML instead of exporting code directly?',
    a: 'Code export locks you into one framework and one interpretation. YAML is a neutral specification that your AI agent can translate into any stack — React, Vue, SwiftUI, Flutter — using your preferred patterns, conventions, and libraries.',
  },
  {
    q: 'Is this only useful for frontend developers?',
    a: 'Not at all. Product managers, designers, and entrepreneurs use FramePrompt to communicate application requirements to AI agents without writing any code or markup themselves.',
  },
  {
    q: 'Does it require a subscription or account?',
    a: 'Version 1 is entirely local. No account, no subscription, no cloud sync. Your canvas and history persist in your browser\'s local storage.',
  },
  {
    q: 'What happens if I need the same layout in multiple frameworks?',
    a: 'Copy the YAML once. Paste it into Claude and say "build this in React." Then paste the same YAML into ChatGPT and say "build this in SwiftUI." One spec, any implementation.',
  },
];

const AI_AGENTS: { name: string; color: string; icon: React.ReactNode }[] = [
  {
    name: 'Claude',
    color: '#D97706',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-1.278-.072L1 12.517l.022-.375.286-.186 1.093.083 2.365.097 2.669.072.742.048h.431l-.048-.166-.864-2.263-.962-2.475-.644-1.841-.384-1.278-.134-.724.195-.44.398-.148.54.095.376.416.479 1.39.845 2.133 1.004 2.408.583 1.49.203.49h.108l.072-.12-.048-.217-.362-1.927-.518-2.52-.324-2.076-.12-1.156.109-.59.498-.395.504.124.394.427.252 1.054.384 2.123.479 2.566.325 1.802.12.578.058.397h.12l.106-.085.144-.649.359-2.106.506-2.37.459-1.928.396-1.306.522-.786.536-.378.498.19.289.48-.134.937-.422 1.786-.581 2.559-.377 1.927-.162.844.06.072h.072l.09-.162.637-1.418 1.183-2.282.956-1.66.773-1.176.87-1.027.742-.516.528.09.277.341-.09.67-.384.891-1.028 1.846-.96 1.812-.868 1.842-.42 1.065.047.061h.048l.07-.048.578-.987.844-1.31 1.098-1.55 1.17-1.394.902-.977.782-.573.566.077.347.36-.06.624-.757 1.352-1.196 1.974-1.014 1.783-.65 1.303.012.097h.048l.048-.073.313-.469.696-.927.806-.965.844-.879.734-.66.722-.42.512.155.252.408-.06.538-.578.965-1.122 1.62-.93 1.49-.724 1.368-.252.796.047.048h.085l.192-.325.518-.832.68-.977.8-.999.736-.784.688-.535.54.18.19.396-.12.563-.482.964-.736 1.2-.61 1.17-.408 1.064-.18.734.036.049.108.012.192-.276.384-.578.518-.72.554-.725.48-.57.446-.394.43-.204.372.096.216.324-.132.6-.346.637-.408.696-.517.82-.554.74-.41.602-.228.396-.084.25.024.18.108.096.13-.084.23-.192.313-.348.578-.553.892-.652 1.016-.59.938-.409.695-.252.445-.156.265-.108.144-.096.036-.036-.024-.024V15.3l.06-.313.072-.35.048-.313.012-.204-.024-.108-.084-.096-.132-.048-.156.024-.24.12-.48.3-.876.578-1.074.734-1.254.88-1.254.855-1.05.698-1.097.697-.892.527-.756.41-.636.3-.372.12-.204.012-.132-.048-.144-.096-.072-.18.024-.228.156-.385.396-.84.686-1.314 1.014-1.9.818-1.614.59-1.254.384-1.158.131-.698-.06-.396-.193-.253-.384-.06-.518.168-.47.468-.757.902-1.195.75-1.002.44-.65.216-.36h-.18l-.47.252-.95.517-1.465.766-1.635.782-1.49.638-1.344.46-.758.192-.445.048-.3-.072-.216-.192-.048-.276.12-.374.47-.6.902-.939 1.038-.999.866-.878.73-.831.41-.59.14-.31h-.155l-.289.216-.638.459-1.338.894-1.702.986-1.73.87-1.585.633-1.11.336-.59.084-.36-.048-.24-.18-.048-.264.12-.373.637-.745 1.074-1.09 1.14-1.096 1.099-1.027.891-.831.614-.59.3-.361h-.18l-.24.193-.59.421-1.254.808-1.694.954-1.754.87-1.525.617-1.002.288-.458.048-.3-.072-.18-.18-.036-.252.12-.349.72-.71 1.25-.989 1.314-1.02 1.087-.83.854-.63.506-.397.168-.288h-.204l-.192.156-.494.36-1.146.735-1.658.91-1.81.84-1.56.554-.806.18-.41.024-.252-.072-.156-.18v-.264l.18-.3.766-.614 1.254-.882 1.278-.846 1.15-.745.89-.578.54-.408.241-.276v-.12l-.072-.084-.132-.012-.216.048-.529.156-1.254.3-1.778.336-1.897.24-1.478.108-.81.024-.408-.06-.24-.144-.06-.228.108-.276.47-.408 1.002-.614 1.386-.73 1.43-.674 1.11-.445.77-.253.49-.12.227-.084.06-.12-.06-.108-.132-.036-.228.024-.53.108-1.338.18-1.79.12-1.885.024h-.808l-.47-.048-.264-.144L0 16.327l.132-.313.601-.49 1.11-.61 1.19-.566 1.13-.422.818-.24.456-.096.228-.084h-.012z"/>
      </svg>
    ),
  },
  {
    name: 'ChatGPT',
    color: '#10A37F',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
      </svg>
    ),
  },
  {
    name: 'Cursor',
    color: '#6C63FF',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 0L23.143 6.857v13.715L11.571 24 0 17.572V6.857L11.571 0zm0 2.286L2.286 7.648v8.705l9.285 5.361 9.286-5.361V7.648L11.571 2.286zM7.5 8.143h8.143v7.714H7.5V8.143z"/>
      </svg>
    ),
  },
  {
    name: 'Gemini',
    color: '#4285F4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"/>
      </svg>
    ),
  },
  {
    name: 'Copilot',
    color: '#F05033',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.84 0 4.31-2.57 5.23-5.04 5.5.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"/>
      </svg>
    ),
  },
  {
    name: 'Windsurf',
    color: '#06B6D4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    name: 'Kimi',
    color: '#FF6B35',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a7 7 0 110 14A7 7 0 0112 5zm-1 3v8l6-4-6-4z"/>
      </svg>
    ),
  },
  {
    name: 'DeepSeek',
    color: '#4F46E5',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    ),
  },
  {
    name: 'Mistral',
    color: '#FF7000',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h4v4H3zm0 7h4v4H3zm0 7h4v4H3zm7-14h4v4h-4zm0 7h4v4h-4zm0 7h4v4h-4zm7-14h4v4h-4zm0 7h4v4h-4zm0 7h4v4h-4z"/>
      </svg>
    ),
  },
  {
    name: 'Perplexity',
    color: '#20B2AA',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.5L19 8v8l-7 3.9L5 16V8l7-3.5z"/>
      </svg>
    ),
  },
  {
    name: 'Grok',
    color: '#1DA1F2',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'Lovable',
    color: '#E11D48',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.593c-.425-.33-4.443-3.48-6.712-6.05C3.259 13.244 2 11.374 2 9.5 2 6.462 4.462 4 7.5 4c1.922 0 3.627.985 4.5 2.438C12.873 4.985 14.578 4 16.5 4 19.538 4 22 6.462 22 9.5c0 1.874-1.259 3.744-3.288 6.043-2.269 2.57-6.287 5.72-6.712 6.05z"/>
      </svg>
    ),
  },
  {
    name: 'Antigravity',
    color: '#7C3AED',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 9l1.5 1.5L12 5l7.5 5.5L21 9 12 2zM12 8l-7 5 1.5 1.5L12 10l5.5 4.5L19 13l-7-5zM12 14l-5 3.5L8.5 19 12 16.5 15.5 19 17 17.5 12 14z"/>
      </svg>
    ),
  },
];

const DOC_TOPICS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Terminal,
    content: (
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
          <Terminal size={24} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-foreground">Getting Started</h3>
        <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
          <p>
            FramePrompt is a visual wireframe builder designed for AI-native development workflows. Instead of writing code, you design your application visually and generate a semantic YAML specification.
          </p>
          <p>
            To begin, simply open the editor, and drag components from the left sidebar onto your canvas. The grid helps you align items perfectly, and drop indicators show exactly where your component will be placed.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'components',
    title: 'Components & Layouts',
    icon: Layers,
    content: (
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 mb-2">
          <Layers size={24} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-foreground">Components & Layouts</h3>
        <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground max-w-none">
          <p>
            FramePrompt provides a variety of built-in components: Headers, Text, Buttons, Cards, Inputs, and more.
          </p>
          <ul className="space-y-3 mt-4 list-disc pl-5">
            <li><strong className="text-foreground">Drag & Drop:</strong> Easily drag components from the sidebar to the canvas.</li>
            <li><strong className="text-foreground">Nesting:</strong> Drop components inside other containers like Cards or Sections to build complex hierarchies.</li>
            <li><strong className="text-foreground">Side-by-Side:</strong> Drag a component to the left or right edge of an existing one to automatically create a row layout.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'editing',
    title: 'Editing & Styling',
    icon: MousePointerClick,
    content: (
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mb-2">
          <MousePointerClick size={24} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-foreground">Editing & Styling</h3>
        <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
          <p>
            Once a component is on the canvas, click on it to open the Inspector panel on the right.
          </p>
          <p>
            In the Inspector, you can change text content, adjust alignment, set colors, and toggle different states. Everything is instantly reflected on the canvas and in the generated YAML structure.
          </p>
          <div className="bg-surface-raised p-4 rounded-xl border border-border/50 mt-6">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Pro Tip
            </h4>
            <p className="text-sm text-muted-foreground mb-0">
              Use keyboard shortcuts like <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">Cmd/Ctrl + C</kbd> to copy, and <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">Backspace</kbd> to delete components quickly.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'version-control',
    title: 'Version Control',
    icon: History,
    content: (
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
          <History size={24} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-foreground">Version Control</h3>
        <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground max-w-none">
          <p>
            FramePrompt features a powerful built-in version control system that runs entirely in your browser, keeping your work safe.
          </p>
          <ul className="space-y-3 mt-4 list-disc pl-5">
            <li><strong className="text-foreground">Auto-saves:</strong> Your work is automatically versioned every few changes.</li>
            <li><strong className="text-foreground">Manual Commits:</strong> Exporting YAML or manually saving creates a new version snapshot.</li>
            <li><strong className="text-foreground">Time Travel:</strong> Open the History panel to view, diff, or restore any previous version of your wireframe instantly.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'ai-integration',
    title: 'AI Integration',
    icon: Code2,
    content: (
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-2">
          <Code2 size={24} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-foreground">AI Integration</h3>
        <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
          <p>
            The core philosophy of FramePrompt is to output AI-optimized YAML instead of messy code.
          </p>
          <p>
            When your design is ready, click <strong>Copy YAML</strong>. Paste this semantic specification into Claude, Cursor, Windsurf, or ChatGPT, and tell it to build your layout in any framework you prefer (React, Vue, SwiftUI, etc.).
          </p>
          <div className="mt-6 p-5 bg-[#0d1117] rounded-xl border border-white/10 font-mono text-xs text-sky-300">
            <span className="text-emerald-400"># Example Prompt</span><br/><br/>
            <span className="text-white/70">Please build this UI in Next.js using Tailwind CSS. Here is the layout specification:</span><br/><br/>
            [Paste YAML Here]
          </div>
        </div>
      </div>
    ),
  },
];

function DocumentationSection() {
  const [activeTopic, setActiveTopic] = useState(DOC_TOPICS[0].id);
  const activeContent = DOC_TOPICS.find((t) => t.id === activeTopic);

  return (
    <section id="docs" className="py-24 max-w-6xl mx-auto px-8 border-t border-border/50">
      <Reveal direction="up">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 uppercase tracking-wider">
            <BookOpen size={14} /> Documentation
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Everything you need to know</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Master FramePrompt with our comprehensive guide. Learn how to build layouts, manage versions, and export for AI agents.
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col gap-2">
          {DOC_TOPICS.map((topic) => {
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={cn(
                  'relative flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-semibold transition-all duration-300 text-left overflow-hidden group',
                  isActive
                    ? 'text-primary shadow-sm bg-surface-raised border border-border/50'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground border border-transparent'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDocBg"
                    className="absolute inset-0 bg-primary/[0.08]"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeDocIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <topic.icon
                  size={20}
                  className={cn('relative z-10 transition-colors duration-300', isActive ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground')}
                />
                <span className="relative z-10">{topic.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface-overlay border border-border/60 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 flex-1"
            >
              {activeContent?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Landing() {
  useSmoothAnchorScroll();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  // Scroll spy to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'how-it-works', 'docs', 'faq'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      let currentSection = '';
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = section;
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide native scrollbar on landing page only
  useEffect(() => {
    document.documentElement.classList.add('landing-scroll');
    return () => document.documentElement.classList.remove('landing-scroll');
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update URL to remove hash without reloading
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden landing-scroll">
      <Particles />
      <ScrollProgressBar />
      <ScrollTrack />
      <BackToTop />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl pt-[2px]">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Back to top"
          >
            <div className="transition-transform duration-300 group-hover:scale-105">
              <AppIcon size={28} />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Frame<span className="text-primary">Prompt</span>
            </span>
          </button>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={cn("text-sm font-medium transition-colors", activeSection === 'features' ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>Features</a>
            <a href="#how-it-works" className={cn("text-sm font-medium transition-colors", activeSection === 'how-it-works' ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>How it works</a>
            <a href="#docs" className={cn("text-sm font-medium transition-colors", activeSection === 'docs' ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>Docs</a>
            <a href="#faq" className={cn("text-sm font-medium transition-colors", activeSection === 'faq' ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>FAQ</a>
          </div>

          <Link
            to="/editor"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Launch editor <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/15 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/5 w-[400px] h-[400px] bg-foreground/[0.03] rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/5 w-[300px] h-[300px] bg-foreground/[0.02] rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badges row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-8"
            >
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 backdrop-blur text-sm text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px] shadow-emerald-400/60" />
                Free to use — no account needed
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 backdrop-blur text-sm text-sky-300 font-bold tracking-wide">
                <Layers size={13} className="text-sky-400" />
                WIREFRAME TOOL — no code generated
              </div>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-[72px] font-black tracking-[-0.02em] leading-[1.05] mb-5">
              Design visually.
              <br />
              <span className="bg-gradient-to-r from-primary via-sky-400 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
                Copy YAML.
              </span>
              <br />
              Build with AI.
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-6 leading-relaxed font-light">
              The professional wireframing tool built for AI-native development workflows.
              Design your application layout visually, then hand the specification to any AI coding agent.
            </p>

            {/* Wireframe callout */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="max-w-xl mx-auto mb-8 flex items-start gap-3 px-4 py-3 rounded-xl border border-sky-500/30 bg-sky-500/[0.07] text-left"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-400/20 border border-sky-400/40 flex items-center justify-center mt-0.5">
                <span className="text-sky-400 text-[10px] font-black">i</span>
              </div>
              <p className="text-sm text-sky-200/80 leading-relaxed">
                <span className="text-sky-300 font-bold">This is a wireframe tool.</span>{' '}
                It produces a <span className="text-sky-300 font-semibold">semantic YAML spec</span> — not finished UI code.
                Paste that spec into Claude Code, Cursor, or any AI agent to generate the actual implementation.
              </p>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <Link
                to="/editor"
                className="group flex items-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/35 text-sm"
              >
                Start building for free
                <ChevronRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2.5 px-6 py-3 border border-border text-foreground/80 font-semibold rounded-2xl hover:border-primary/40 hover:text-foreground transition-all text-sm"
              >
                See how it works
              </a>
            </div>

            <p className="text-xs text-muted-foreground/50">No account required · Runs locally · History auto-saved</p>
          </motion.div>

          {/* ── Animated preview ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mt-14 relative"
          >
            {/* Glow */}
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Live demo area */}
              <div className="h-[420px]">
                <DragDemo />
              </div>
            </div>
          </motion.div>

          {/* AI tools logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-medium">Works with every AI agent</p>
            <div className="flex flex-wrap justify-center gap-2">
              {AI_AGENTS.map((agent) => (
                <div key={agent.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-surface/60 text-xs font-medium text-muted-foreground/70 hover:border-border hover:text-muted-foreground transition-colors">
                  <span style={{ color: agent.color }}>{agent.icon}</span>
                  {agent.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-8">
        <Reveal direction="up">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.15em] mb-4">Features</p>
            <h2 className="text-4xl font-black tracking-tight mb-5">Built for professional teams</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
              Every capability designed around a single mission: get your application spec into an AI agent as accurately as possible.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} direction="scale">
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}
                transition={{ duration: 0.2 }}
                className="group p-5 rounded-xl border border-border bg-surface hover:border-primary/30 hover:bg-surface-raised transition-colors duration-200 h-full"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Social proof / metrics ───────────────────────────────────────────── */}
      <section className="py-14 border-y border-border bg-surface/50">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { num: '40+', label: 'Component types', sub: 'Buttons to charts & more' },
              { num: '30+', label: 'AI agent targets', sub: 'Claude, Cursor, Kimi, DeepSeek & more' },
              { num: '< 30s', label: 'From canvas to spec', sub: 'Average export time' },
            ].map((m) => (
              <Reveal key={m.num} direction="up">
                <div>
                  <div className="text-4xl font-black text-gradient mb-1.5">{m.num}</div>
                  <div className="text-sm font-bold text-foreground mb-1">{m.label}</div>
                  <div className="text-xs text-muted-foreground/60">{m.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 relative overflow-hidden bg-surface/30 border-y border-border/50">

        <div className="relative max-w-6xl mx-auto px-8">
          <Reveal direction="up">
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-primary uppercase tracking-[0.15em] mb-4">Workflow</p>
              <h2 className="text-4xl font-black tracking-tight mb-4">Four steps to any application</h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto font-light leading-relaxed">
                From blank canvas to working code — without writing a line of markup.
              </p>
            </div>
          </Reveal>

          {/* Steps — alternating layout */}
          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className={cn(
                  'workflow-card flex flex-col lg:flex-row items-center gap-8 p-6 rounded-2xl border border-border/40 bg-gradient-to-br relative overflow-hidden group transition-all duration-300 hover:border-border/60',
                  s.color,
                  i % 2 === 1 && 'lg:flex-row-reverse',
                )}>
                  {/* Icon */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-3 lg:w-32">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', s.iconBg)}>
                      <s.icon size={22} className={s.iconColor} />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{s.desc}</p>
                  </div>

                  {/* Connector arrow (not last) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center w-8 flex-shrink-0">
                      <div className="w-full h-px bg-gradient-to-r from-border to-transparent" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-4xl mx-auto px-8 text-center">
        <Reveal direction="scale">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-14">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-foreground/[0.04] rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-foreground/[0.02] rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8 uppercase tracking-wider">
                <Check size={12} /> Free for everyone, no signup required
              </div>
              <h2 className="text-4xl font-black tracking-tight mb-4">Start shipping faster today</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto font-light leading-relaxed">
                Design your first screen, copy the YAML, and watch your AI agent build the implementation.
              </p>
              <Link
                to="/editor"
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/40 text-base"
              >
                Open Editor <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Documentation ──────────────────────────────────────────────────────── */}
      <DocumentationSection />

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 border-t border-border max-w-3xl mx-auto px-8">
        <Reveal direction="up">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.15em] mb-4">FAQ</p>
            <h2 className="text-3xl font-black tracking-tight">Common questions</h2>
          </div>
        </Reveal>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className="border border-border rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground"
                  >
                    <ChevronRight size={12} className="rotate-90" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-7">
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title="Back to top"
            >
              <div className="transition-transform duration-300 group-hover:scale-105">
                <AppIcon size={24} />
              </div>
              <span className="text-sm font-bold tracking-tight">FramePrompt</span>
            </button>

            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">How it works</a>
              <a href="#docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Docs</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</a>
              <Link to="/editor" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">Open Editor →</Link>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/50">
              Design visually. Copy YAML. Build with AI.
            </p>
            <p className="text-xs text-muted-foreground/40">
              Built for teams who ship with AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
