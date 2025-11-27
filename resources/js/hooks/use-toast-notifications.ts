import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface FlashMessages {
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
}

/**
 * Hook to automatically display toast notifications from Laravel flash messages
 * Supports: success, error, info, warning
 */
export function useToastNotifications() {
  const { props } = usePage<{ flash?: FlashMessages }>();
  const flash = props.flash;

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (flash?.info) {
      toast(flash.info, {
        icon: 'ℹ️',
      });
    }
    if (flash?.warning) {
      toast(flash.warning, {
        icon: '⚠️',
      });
    }
  }, [flash]);
}
