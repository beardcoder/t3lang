import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-success/20 text-success',
  error: 'border-danger/20 text-danger',
  warning: 'border-warning/20 text-warning',
  info: 'border-accent/20 text-accent',
};

export function ToastContainer() {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`surface-glass flex max-w-xs items-center gap-2.5 rounded-xl px-3.5 py-2 shadow-lg ${colors[notification.type]}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{notification.title}</p>
                {notification.message && (
                  <p className="text-xs opacity-80 truncate">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
