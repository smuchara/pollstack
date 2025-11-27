import toast from 'react-hot-toast';

/**
 * Clean and professional toast notification helpers
 * 
 * Usage:
 * import { showSuccess, showError, showInfo, showWarning } from '@/lib/toast';
 * 
 * showSuccess('User created successfully');
 * showError('Failed to save changes');
 * showInfo('Processing your request...');
 * showWarning('This action cannot be undone');
 */

export const showSuccess = (message: string) => {
  return toast.success(message);
};

export const showError = (message: string) => {
  return toast.error(message);
};

export const showInfo = (message: string) => {
  return toast(message, {
    icon: 'ℹ️',
  });
};

export const showWarning = (message: string) => {
  return toast(message, {
    icon: '⚠️',
  });
};

export const showLoading = (message: string = 'Loading...') => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
};

// Promise-based toast for async operations
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};
