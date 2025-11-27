# 🎨 Toast Notification System

## Overview

Our application uses a custom-designed toast notification system built on top of `react-hot-toast` with beautiful, clean designs that adapt to light/dark themes.

## Features

✨ **4 Toast Types**: Success, Error, Info, Warning  
🎨 **Theme Aware**: Automatically adapts to light/dark mode  
🎭 **Smooth Animations**: Slide-in and slide-out effects  
🎯 **Custom Icons**: Lucide icons for each type  
⚡ **Easy to Use**: Simple helper functions  
🔄 **Auto-dismiss**: Configurable durations  

---

## Quick Start

### Method 1: Using Helper Functions (Recommended)

```tsx
import { showSuccess, showError, showInfo, showWarning } from '@/lib/toast';

// Success toast (green)
showSuccess('User created successfully!');

// Error toast (red)
showError('Failed to save changes. Please try again.');

// Info toast (blue)
showInfo('Your session will expire in 5 minutes.');

// Warning toast (amber/orange)
showWarning('This action cannot be undone.');
```

### Method 2: Direct toast API

```tsx
import toast from 'react-hot-toast';

// Success
toast.success('Operation completed!');

// Error
toast.error('Something went wrong!');

// Info
toast('New message received', { icon: 'ℹ️' });

// Warning
toast('Careful! This is permanent', { icon: '⚠️' });
```

---

## Toast Types & Design

### 🟢 Success Toast
- **Color**: Emerald green
- **Icon**: CheckCircle
- **Use for**: Successful operations, confirmations
- **Duration**: 4 seconds

```tsx
showSuccess('Profile updated successfully');
showSuccess('File uploaded!');
showSuccess('Changes saved');
```

### 🔴 Error Toast
- **Color**: Red
- **Icon**: XCircle
- **Use for**: Errors, failed operations
- **Duration**: 5 seconds (longer for errors)

```tsx
showError('Failed to connect to server');
showError('Invalid email address');
showError('Permission denied');
```

### 🔵 Info Toast
- **Color**: Blue
- **Icon**: Info
- **Use for**: Informational messages, updates
- **Duration**: 4 seconds

```tsx
showInfo('New features available!');
showInfo('Your download will start shortly');
showInfo('2 new notifications');
```

### 🟠 Warning Toast
- **Color**: Amber/Orange
- **Icon**: AlertTriangle
- **Use for**: Warnings, cautions, important notices
- **Duration**: 4 seconds

```tsx
showWarning('This action cannot be undone');
showWarning('You have unsaved changes');
showWarning('Low disk space');
```

---

## Advanced Usage

### Loading States

```tsx
import { showLoading, dismissToast } from '@/lib/toast';

// Show loading toast
const toastId = showLoading('Uploading file...');

// Later, dismiss it
dismissToast(toastId);
```

### Promise-based Toasts

```tsx
import { showPromise } from '@/lib/toast';

const uploadFile = async () => {
  // Your async operation
  return fetch('/api/upload', { method: 'POST' });
};

showPromise(uploadFile(), {
  loading: 'Uploading file...',
  success: 'File uploaded successfully!',
  error: 'Failed to upload file',
});
```

### Custom Duration

```tsx
import toast from 'react-hot-toast';

// Show for 10 seconds
toast.success('Important message', {
  duration: 10000,
});

// Show indefinitely (manual dismiss)
toast.success('Click to dismiss', {
  duration: Infinity,
});
```

### Manual Dismiss

```tsx
import { dismissAll } from '@/lib/toast';

// Dismiss all toasts
dismissAll();
```

---

## Backend Integration (Laravel)

The system automatically displays Laravel flash messages as toasts.

### In Controllers

```php
// Success
return redirect()->back()->with('success', 'User created successfully');

// Error
return redirect()->back()->with('error', 'Failed to create user');

// Info
return redirect()->back()->with('info', 'Processing your request');

// Warning
return redirect()->back()->with('warning', 'This will delete all data');
```

These are automatically converted to toasts by the `useToastNotifications` hook.

---

## Design Specifications

### Colors (Light Mode)
- **Success**: Emerald (50, 100, 200, 600, 900)
- **Error**: Red (50, 100, 200, 600, 900)
- **Info**: Blue (50, 100, 200, 600, 900)
- **Warning**: Amber (50, 100, 200, 600, 900)

### Colors (Dark Mode)
- Uses darker variants with higher opacity
- Maintains accessibility and readability
- Subtle backdrop blur effect

### Animation
- **Enter**: Slide from right (300ms ease-out)
- **Leave**: Slide to right (200ms ease-in)
- **Position**: Top-right corner
- **Spacing**: 12px between toasts

---

## Best Practices

### ✅ DO
- Use success toasts for completed actions
- Use error toasts for failed operations
- Keep messages concise (1-2 lines max)
- Use action verbs ("saved", "deleted", "created")
- Provide clear error messages

### ❌ DON'T
- Don't use toasts for critical errors (use modals)
- Don't stack too many toasts at once
- Don't use long paragraphs
- Don't disable auto-dismiss for info messages
- Don't use toasts for form validation errors

---

## Examples in Code

### Form Submission

```tsx
const handleSubmit = async (data) => {
  try {
    await api.createUser(data);
    showSuccess('User created successfully');
    navigate('/users');
  } catch (error) {
    showError('Failed to create user. Please try again.');
  }
};
```

### Delete Confirmation

```tsx
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    await api.deleteItem(id);
    showSuccess('Item deleted successfully');
  } catch (error) {
    showError('Failed to delete item');
  }
};
```

### Multiple Toasts

```tsx
// Assigning permission groups
const assignedGroups.forEach((group) => {
  showSuccess(`${group.label} granted to ${user.name}`);
});
```

---

## Component Structure

```
resources/js/
├── components/ui/
│   ├── toaster.tsx          # Main Toaster component
│   └── custom-toast.tsx     # Custom toast design
├── hooks/
│   └── use-toast-notifications.ts  # Flash message handler
└── lib/
    └── toast.ts             # Helper functions
```

---

## Troubleshooting

### Toast not showing?
1. Ensure `<Toaster />` is included in your layout
2. Check that the component is wrapped in Inertia context
3. Verify imports are correct

### Styling issues?
1. Ensure CSS animations are compiled
2. Check Tailwind config includes custom colors
3. Verify dark mode is properly configured

### Flash messages not working?
1. Check `HandleInertiaRequests` middleware shares flash data
2. Verify `useToastNotifications` hook is called in layout
3. Check session driver is configured properly

---

## Support

For questions or issues with the toast system, check:
- This documentation
- `resources/js/components/ui/toaster.tsx` for implementation
- `resources/js/lib/toast.ts` for helper functions
