# Poll Creation UX Enhancement – Implementation Plan

## Overview

This document outlines the complete implementation plan for introducing **Profile Polls** alongside the existing **Standard Polls**, including UX flow changes, component architecture, and database modifications.

---

## 🎯 Summary of Requirements

| Aspect                    | Decision                                                |
| ------------------------- | ------------------------------------------------------- |
| **New Poll Type Name**    | Profile Poll                                            |
| **Image Upload Behavior** | Include in final form submission (not immediate upload) |
| **Database Strategy**     | Extend existing `polls` and `poll_options` tables       |
| **Edit Flow**             | Uses slide-over pattern (same as create)                |

---

## 📊 Database Changes

### 1. Migration: Add `poll_type` to `polls` Table

```php
// database/migrations/xxxx_add_poll_type_to_polls_table.php
Schema::table('polls', function (Blueprint $table) {
    $table->string('poll_type')->default('standard')->after('type');
    // poll_type: 'standard' | 'profile'
    // Note: 'type' column is for ballot type (open/closed), 'poll_type' is for poll style
});
```

### 2. Migration: Add Profile Fields to `poll_options` Table

```php
// database/migrations/xxxx_add_profile_fields_to_poll_options_table.php
Schema::table('poll_options', function (Blueprint $table) {
    $table->string('image_url')->nullable()->after('text');
    $table->string('name')->nullable()->after('image_url');
    $table->string('position')->nullable()->after('name');
});
```

### Updated `poll_options` Schema

| Column       | Type      | Description                                                      |
| ------------ | --------- | ---------------------------------------------------------------- |
| `id`         | bigint    | Primary key                                                      |
| `poll_id`    | foreignId | FK to polls                                                      |
| `text`       | string    | Option text (used for standard polls, display label for profile) |
| `image_url`  | string?   | Profile image URL (nullable, profile polls only)                 |
| `name`       | string?   | Candidate/person name (nullable, profile polls only)             |
| `position`   | string?   | Position being contested (nullable, profile polls only)          |
| `order`      | integer   | Display order                                                    |
| `created_at` | timestamp |                                                                  |
| `updated_at` | timestamp |                                                                  |

---

## 🏗️ Component Architecture

### Directory Structure

```
resources/js/components/
├── ui/
│   └── slide-drawer.tsx              ← NEW: Reusable slide-over panel
│
└── polls/
    ├── create-poll-modal.tsx         ← REFACTOR: Poll type selector modal
    ├── poll-creation-drawer.tsx      ← NEW: Orchestrates the drawer + forms
    ├── poll-type-selector.tsx        ← NEW: Poll type selection cards
    ├── poll-form-shared.tsx          ← NEW: Shared form sections
    ├── standard-poll-form.tsx        ← NEW: Standard poll options form
    ├── profile-poll-form.tsx         ← NEW: Profile poll options form
    ├── profile-option-card.tsx       ← NEW: Single profile option component
    ├── poll-status-badge.tsx         (existing)
    ├── poll-timing.tsx               (existing)
    ├── poll-type-badge.tsx           (existing)
    └── poll-visibility-badge.tsx     (existing)
```

---

## 📦 Component Specifications

### 1. `SlideDrawer` (UI Component)

**File:** `resources/js/components/ui/slide-drawer.tsx`

**Purpose:** Reusable slide-over panel wrapper around the existing Sheet component.

```tsx
interface SlideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    side?: 'left' | 'right';
    children: React.ReactNode;
    footer?: React.ReactNode;
    isLoading?: boolean;
}
```

**Features:**

- Configurable width via `size` prop
- Built-in header with title, description, close button
- Footer slot for action buttons
- Scrollable content area
- Optional loading overlay

**Size Mapping:**
| Size | Max Width |
|------|-----------|
| `sm` | `max-w-md` (448px) |
| `md` | `max-w-lg` (512px) |
| `lg` | `max-w-xl` (576px) |
| `xl` | `max-w-2xl` (672px) |
| `full` | `max-w-3xl` (768px) |

---

### 2. `PollTypeSelector` (Component)

**File:** `resources/js/components/polls/poll-type-selector.tsx`

**Purpose:** Displays poll type selection cards in the initial modal.

```tsx
interface PollTypeSelectorProps {
    selectedType: 'standard' | 'profile' | null;
    onSelect: (type: 'standard' | 'profile') => void;
}
```

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                   Choose Poll Type                          │
├────────────────────────┬────────────────────────────────────┤
│  ┌──────────────────┐  │  ┌──────────────────────────────┐  │
│  │      📝          │  │  │            👤                │  │
│  │  Standard Poll   │  │  │       Profile Poll           │  │
│  │                  │  │  │                              │  │
│  │  Traditional     │  │  │  Visual voting with          │  │
│  │  text-based      │  │  │  photos, names, and          │  │
│  │  options         │  │  │  positions                   │  │
│  └──────────────────┘  │  └──────────────────────────────┘  │
└────────────────────────┴────────────────────────────────────┘
```

---

### 3. `PollFormShared` (Component)

**File:** `resources/js/components/polls/poll-form-shared.tsx`

**Purpose:** Contains all shared poll metadata fields.

```tsx
interface PollFormSharedProps {
    form: InertiaFormProps<PollFormData>;
    departments: Department[];
    users: User[];
    selectedDepartments: number[];
    selectedUsers: number[];
    onDepartmentsChange: (ids: number[]) => void;
    onUsersChange: (ids: number[]) => void;
}
```

**Sections Included:**

1. Poll Question (input)
2. Description (textarea, optional)
3. Ballot Type & Visibility (2-column grid)
4. Invitation Section (conditional, for invite-only)
5. Schedule Section (start/end dates)

---

### 4. `StandardPollForm` (Component)

**File:** `resources/js/components/polls/standard-poll-form.tsx`

**Purpose:** Text-based poll options management.

```tsx
interface StandardPollOption {
    id?: number;
    text: string;
    votes_count?: number;
}

interface StandardPollFormProps {
    options: StandardPollOption[];
    onOptionsChange: (options: StandardPollOption[]) => void;
    errors?: Record<string, string>;
}
```

**Features:**

- Dynamic list of text inputs
- Add option button
- Remove option button (disabled when <= 2 options)
- Drag-to-reorder (optional, future enhancement)

---

### 5. `ProfilePollForm` (Component)

**File:** `resources/js/components/polls/profile-poll-form.tsx`

**Purpose:** Profile poll options management with image upload.

```tsx
interface ProfilePollOption {
    id?: number;
    text: string; // Display label
    image: File | null; // New upload (File) or null
    image_url?: string; // Existing image URL (for edit mode)
    name: string; // Candidate name
    position: string; // Position being contested
    votes_count?: number;
}

interface ProfilePollFormProps {
    options: ProfilePollOption[];
    onOptionsChange: (options: ProfilePollOption[]) => void;
    errors?: Record<string, string>;
}
```

**Features:**

- Grid of profile option cards
- Add option card button
- Minimum 2 options validation

---

### 6. `ProfileOptionCard` (Component)

**File:** `resources/js/components/polls/profile-option-card.tsx`

**Purpose:** Individual profile option editing card.

```tsx
interface ProfileOptionCardProps {
    option: ProfilePollOption;
    index: number;
    onChange: (index: number, option: ProfilePollOption) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
    error?: string;
}
```

**Visual Layout:**

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────┐  [✕ Remove]    │
│  │                     │                │
│  │   [Image Upload]    │                │
│  │   Click to upload   │                │
│  │   or drag & drop    │                │
│  │                     │                │
│  └─────────────────────┘                │
│                                         │
│  Name: [________________]               │
│                                         │
│  Position: [________________]           │
│                                         │
└─────────────────────────────────────────┘
```

**Image Upload Behavior:**

- Click to open file picker
- Drag & drop support
- Preview uploaded image
- Accept: jpg, png, webp
- Max size: 2MB (validated client-side)

---

### 7. `PollCreationDrawer` (Component)

**File:** `resources/js/components/polls/poll-creation-drawer.tsx`

**Purpose:** Orchestrates the slide drawer with the appropriate form based on poll type.

```tsx
interface PollCreationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pollType: 'standard' | 'profile';
    poll?: Poll; // For edit mode
    context?: 'super-admin' | 'organization';
    organizationSlug?: string;
    departments?: Department[];
    users?: User[];
}
```

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ [←]  Create Standard Poll              [✕ Close]         │
│      Configure your poll details                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <PollFormShared />                                │  │
│  │  - Question                                        │  │
│  │  - Description                                     │  │
│  │  - Type & Visibility                               │  │
│  │  - Invitations (if invite-only)                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Poll Options                                      │  │
│  │  <StandardPollForm /> OR <ProfilePollForm />       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Schedule (from PollFormShared)                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│           [Cancel]              [Create Poll]            │
└──────────────────────────────────────────────────────────┘
```

---

### 8. Refactored `create-poll-modal.tsx`

**File:** `resources/js/components/polls/create-poll-modal.tsx`

**Purpose:** Entry point for poll creation – now serves as poll type selector.

**Changes:**

- Renders as a centered modal (smaller than current)
- Shows `PollTypeSelector` component
- On type selection + Continue → opens `PollCreationDrawer`
- Manages the state transition between modal and drawer

**Flow State:**

```typescript
type ModalState =
    | { stage: 'select-type'; selectedType: 'standard' | 'profile' | null }
    | { stage: 'form'; pollType: 'standard' | 'profile' };
```

---

## 🔄 User Flow

### Create Poll Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Create Poll Flow                               │
└────────────────────────────────────────────────────────────────────────┘

User clicks "Create Poll" button
         │
         ▼
┌─────────────────────────────────────────┐
│     Poll Type Selection Modal           │
│  ┌───────────────┐ ┌─────────────────┐  │
│  │   Standard    │ │     Profile     │  │
│  │     Poll      │ │      Poll       │  │
│  │      📝       │ │       👤        │  │
│  └───────────────┘ └─────────────────┘  │
│                                         │
│      [Cancel]        [Continue →]       │
└─────────────────────────────────────────┘
         │
         │ (on Continue with type selected)
         ▼
┌─────────────────────────────────────────┐
│         Slide Drawer Opens              │
│                                         │
│  • Shared fields render                 │
│  • Type-specific options render         │
│  • User fills out form                  │
│                                         │
│      [Cancel]       [Create Poll]       │
└─────────────────────────────────────────┘
         │
         │ (on submit)
         ▼
┌─────────────────────────────────────────┐
│  Form validates → API call              │
│  - Standard: POST with text options     │
│  - Profile: POST with multipart/form    │
│             (includes image files)      │
└─────────────────────────────────────────┘
         │
         ▼
     Success → Close drawer → Refresh poll list
```

### Edit Poll Flow

```
User clicks "Edit" on existing poll
         │
         ▼
┌─────────────────────────────────────────┐
│    Slide Drawer Opens Directly          │
│    (No type selection needed)           │
│                                         │
│  • Poll type determined from data       │
│  • Form pre-populated with poll data    │
│  • Edit form renders                    │
│                                         │
│      [Cancel]       [Save Changes]      │
└─────────────────────────────────────────┘
```

---

## 🖥️ Backend Changes

### 1. Update `Poll` Model

```php
// app/Models/Poll.php

// Add poll type constants
public const POLL_TYPE_STANDARD = 'standard';
public const POLL_TYPE_PROFILE = 'profile';

// Add to $fillable
protected $fillable = [
    // ... existing
    'poll_type',
];

// Add helper methods
public function isProfilePoll(): bool
{
    return $this->poll_type === self::POLL_TYPE_PROFILE;
}

public function isStandardPoll(): bool
{
    return $this->poll_type === self::POLL_TYPE_STANDARD;
}
```

### 2. Update `PollOption` Model

```php
// app/Models/PollOption.php

protected $fillable = [
    'poll_id',
    'text',
    'image_url',
    'name',
    'position',
    'order',
];

// Add accessor for full image URL
public function getImageFullUrlAttribute(): ?string
{
    if (!$this->image_url) {
        return null;
    }
    return Storage::disk('public')->url($this->image_url);
}

// Add to $appends if needed
protected $appends = ['image_full_url'];
```

### 3. Update Form Request Validation

```php
// app/Http/Requests/StorePollRequest.php (or similar)

public function rules(): array
{
    return [
        // ... existing rules
        'poll_type' => ['required', 'in:standard,profile'],

        // Standard poll options
        'options' => ['required', 'array', 'min:2'],
        'options.*.text' => ['required', 'string', 'max:255'],

        // Profile poll options (conditional)
        'options.*.image' => ['sometimes', 'nullable', 'image', 'max:2048'],
        'options.*.name' => ['required_if:poll_type,profile', 'nullable', 'string', 'max:255'],
        'options.*.position' => ['required_if:poll_type,profile', 'nullable', 'string', 'max:255'],
    ];
}
```

### 4. Update Controller Logic

```php
// In PollController or similar

public function store(StorePollRequest $request)
{
    // ... existing poll creation logic

    $poll = Poll::create([
        // ... existing fields
        'poll_type' => $request->poll_type,
    ]);

    foreach ($request->options as $index => $optionData) {
        $imageUrl = null;

        // Handle image upload for profile polls
        if ($request->poll_type === 'profile' && isset($optionData['image'])) {
            $imageUrl = $optionData['image']->store('poll-options', 'public');
        }

        $poll->options()->create([
            'text' => $optionData['text'] ?? $optionData['name'],
            'image_url' => $imageUrl,
            'name' => $optionData['name'] ?? null,
            'position' => $optionData['position'] ?? null,
            'order' => $index,
        ]);
    }

    // ... rest of logic
}
```

---

## 📋 Implementation Phases

### Phase 1: Database & Backend Foundation

**Estimated Time:** 1-2 hours

1. ✅ Create migration for `poll_type` on `polls` table
2. ✅ Create migration for profile fields on `poll_options` table
3. ✅ Run migrations
4. ✅ Update `Poll` model with new constants and helpers
5. ✅ Update `PollOption` model with new fillable and accessors
6. ✅ Update factories and seeders

### Phase 2: UI Foundation Components

**Estimated Time:** 1-2 hours

1. ✅ Create `SlideDrawer` component
2. ✅ Create `PollTypeSelector` component

### Phase 3: Form Components

**Estimated Time:** 2-3 hours

1. ✅ Create `PollFormShared` component (extract from existing)
2. ✅ Create `StandardPollForm` component (extract from existing)
3. ✅ Create `ProfileOptionCard` component
4. ✅ Create `ProfilePollForm` component

### Phase 4: Integration

**Estimated Time:** 2-3 hours

1. ✅ Create `PollCreationDrawer` component
2. ✅ Refactor `create-poll-modal.tsx` to new pattern
3. ✅ Update poll index pages to use new flow
4. ✅ Implement edit mode

### Phase 5: Backend API Updates

**Estimated Time:** 1-2 hours

1. ✅ Update form request validation
2. ✅ Update controller store method for profile polls
3. ✅ Update controller update method for profile polls
4. ✅ Handle image upload and storage

### Phase 6: Testing

**Estimated Time:** 2-3 hours

1. ✅ Write feature tests for standard poll creation
2. ✅ Write feature tests for profile poll creation
3. ✅ Write feature tests for poll editing
4. ✅ Write browser tests for the UI flow

---

## 📁 Files Summary

### New Files

| #   | File Path                                                               | Description           |
| --- | ----------------------------------------------------------------------- | --------------------- |
| 1   | `database/migrations/xxxx_add_poll_type_to_polls_table.php`             | Add poll_type column  |
| 2   | `database/migrations/xxxx_add_profile_fields_to_poll_options_table.php` | Add profile fields    |
| 3   | `resources/js/components/ui/slide-drawer.tsx`                           | Reusable slide drawer |
| 4   | `resources/js/components/polls/poll-type-selector.tsx`                  | Type selection cards  |
| 5   | `resources/js/components/polls/poll-form-shared.tsx`                    | Shared form fields    |
| 6   | `resources/js/components/polls/standard-poll-form.tsx`                  | Standard options form |
| 7   | `resources/js/components/polls/profile-option-card.tsx`                 | Profile option card   |
| 8   | `resources/js/components/polls/profile-poll-form.tsx`                   | Profile options form  |
| 9   | `resources/js/components/polls/poll-creation-drawer.tsx`                | Form orchestrator     |

### Modified Files

| #   | File Path                                             | Changes                          |
| --- | ----------------------------------------------------- | -------------------------------- |
| 1   | `app/Models/Poll.php`                                 | Add poll_type field and helpers  |
| 2   | `app/Models/PollOption.php`                           | Add profile fields and accessors |
| 3   | `database/factories/PollFactory.php`                  | Add poll_type                    |
| 4   | `database/factories/PollOptionFactory.php`            | Add profile fields               |
| 5   | `resources/js/components/polls/create-poll-modal.tsx` | Refactor to type selector        |
| 6   | `app/Http/Controllers/*/PollController.php`           | Update store/update methods      |
| 7   | `app/Http/Requests/*PollRequest.php`                  | Update validation rules          |

---

## ⚠️ Notes & Considerations

### Image Storage

- Images stored in `storage/app/public/poll-options/`
- Ensure `php artisan storage:link` is run
- Consider image optimization/resizing

### Form Submission

- Profile polls require `multipart/form-data` encoding
- Inertia handles this automatically with file uploads

### Backward Compatibility

- Existing polls will have `poll_type = 'standard'` by default
- Existing `poll_options` will have null profile fields

### Future Enhancements

- Drag-to-reorder options
- Image cropping/editing
- Pre-defined position templates
- Candidate import from CSV

---

## ✅ Ready to Begin

This plan is complete. Implementation can begin with **Phase 1: Database & Backend Foundation**.

Proceed with step-by-step implementation when ready.
