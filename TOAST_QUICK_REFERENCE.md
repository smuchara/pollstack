# 🚀 Toast Quick Reference

## Import

```tsx
import { showSuccess, showError, showInfo, showWarning } from '@/lib/toast';
```

## Basic Usage

```tsx
// ✅ Success (Green)
showSuccess('User created successfully');

// ❌ Error (Red)  
showError('Failed to save changes');

// ℹ️ Info (Blue)
showInfo('New message received');

// ⚠️ Warning (Amber)
showWarning('This action cannot be undone');
```

## Laravel Backend

```php
return redirect()->back()->with('success', 'Operation completed');
return redirect()->back()->with('error', 'Something went wrong');
return redirect()->back()->with('info', 'Processing request');
return redirect()->back()->with('warning', 'Proceed with caution');
```

## Advanced

```tsx
import toast from 'react-hot-toast';

// Custom duration
toast.success('Message', { duration: 10000 });

// Loading state
const id = toast.loading('Loading...');
toast.dismiss(id);

// Promise
toast.promise(promise, {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed!',
});
```

## Design

| Type    | Color   | Icon           | Duration |
|---------|---------|----------------|----------|
| Success | Green   | CheckCircle2   | 4s       |
| Error   | Red     | XCircle        | 5s       |
| Info    | Blue    | Info           | 4s       |
| Warning | Amber   | AlertTriangle  | 4s       |

## Features

✨ Auto light/dark theme  
🎭 Smooth animations  
📱 Responsive design  
♿ Accessible  
🎯 Click to dismiss  
