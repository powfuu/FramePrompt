import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function CustomCursor() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // In the editor we skip hover detection entirely (it was the lag source)
  const [isHovering, setIsHovering] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsHovering(false);
  }, [isLandingPage]);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 20, stiffness: 450, mass: 0.3 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 1500);

      // Hover detection only on landing page — the closest() call on every mousemove was lagging the editor
      if (isLandingPage) {
        const target = e.target as HTMLElement;
        const isClickable = target.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]');
        setIsHovering(!!isClickable);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseEnter);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [mouseX, mouseY, isVisible, isLandingPage]);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    if (!isTouch) {
      document.body.classList.add('has-custom-cursor');
    } else {
      document.body.classList.remove('has-custom-cursor');
    }
    return () => {
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Main trailing ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: isHovering ? (isLandingPage ? 48 : 32) : isIdle ? (isLandingPage ? 36 : 24) : (isLandingPage ? 32 : 20),
            height: isHovering ? (isLandingPage ? 48 : 32) : isIdle ? (isLandingPage ? 36 : 24) : (isLandingPage ? 32 : 20),
            backgroundColor: isHovering ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
            borderWidth: isHovering ? '0px' : '1.5px',
            borderColor: 'rgba(255, 255, 255, 0.8)',
            scale: isVisible ? 1 : 0,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            width: { type: 'spring', stiffness: 300, damping: 20 },
            height: { type: 'spring', stiffness: 300, damping: 20 },
            backgroundColor: { duration: 0.2 },
          }}
          className="rounded-full flex items-center justify-center relative shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {/* Idle animation rings — landing page only */}
          <AnimatePresence>
            {isIdle && !isHovering && isLandingPage && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.5, 1.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-white/50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.8, 2.2] }}
                  transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-white/30"
                />
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Center dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000] mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 0 : isVisible ? 1 : 0,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
      </motion.div>
    </>
  );
}
