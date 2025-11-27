import toast, { Toaster as HotToaster, Toast, resolveValue, ToastType } from 'react-hot-toast';
import { CustomToast } from './custom-toast';

export function Toaster() {
    return (
        <HotToaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            containerStyle={{
                top: 24,
                right: 24,
                zIndex: 9999, // Ensure it sits above everything
            }}
            toastOptions={{
                duration: 4000,
                // Reset default styles so our component takes full control
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    maxWidth: '100%',
                },
                success: { duration: 4000 },
                error: { duration: 5000 },
                loading: { duration: Infinity },
            }}
        >
            {(t: Toast) => {
                // 1. Resolve the message (handles functions/strings)
                const message = resolveValue(t.message, t);

                // 2. Map standard toast types to our component types
                // 'blank' and 'loading' default to 'info' style
                const typeMap: Record<ToastType, 'success' | 'error' | 'info' | 'warning'> = {
                    success: 'success',
                    error: 'error',
                    loading: 'info',
                    blank: 'info',
                    custom: 'info', // Default fallback
                };

                let type = typeMap[t.type] || 'info';

                // 3. Handle Custom "Warning" override
                // Usage: toast('Message', { icon: 'warning' })
                if (t.icon === 'warning') {
                    type = 'warning';
                }

                return (
                    <CustomToast
                        t={t}
                        message={message}
                        type={type}
                        onDismiss={() => toast.dismiss(t.id)}
                    />
                );
            }}
        </HotToaster>
    );
}
