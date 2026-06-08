import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export function Notification() {
  const notification = useUIStore((s) => s.notification);
  const dismissNotification = useUIStore((s) => s.dismissNotification);

  const icons = {
    success: Check,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-xl pointer-events-auto',
              'backdrop-blur-md',
              colors[notification.type]
            )}
          >
            {(() => {
              const Icon = icons[notification.type];
              return <Icon size={14} className="flex-shrink-0" />;
            })()}
            <span>{notification.message}</span>
            <button
              onClick={dismissNotification}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
