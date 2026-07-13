## 2026-07-13 - Keyboard Accessibility for File Inputs
**Learning:** Using `hidden` on an `<input type="file">` removes it entirely from the accessibility tree, preventing keyboard users from accessing or focusing it.
**Action:** Use Tailwind's `sr-only` class to hide the input visually while keeping it accessible, and apply `focus-within:ring-2` styling on its parent `<label>` to visually indicate when the input receives keyboard focus.
