## 2026-06-23 - [File Input Keyboard Accessibility]
**Learning:** Hidden file inputs (`className="hidden"`) cannot be focused via keyboard navigation, breaking accessibility for users relying on tab navigation.
**Action:** Always use `sr-only` (screen-reader only) for file inputs to keep them visually hidden but accessible to screen readers and keyboard focus. Apply `focus-within` styles to the parent wrapper (like a `<label>`) to provide a clear visual focus indicator when the invisible input receives focus.
