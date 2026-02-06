import { useEffect } from 'react';
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
  success: 'bg-success-light border-success text-success',
  error: 'bg-danger-light border-danger text-danger',
  warning: 'bg-warning-light border-warning text-warning',
  info: 'bg-accent-light border-accent text-accent',
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
              className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${colors[notification.type]}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{notification.title}</p>
                {notification.message && (
                  <p className="mt-0.5 text-sm opacity-80">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="rounded p-0.5 hover:bg-black/10"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
