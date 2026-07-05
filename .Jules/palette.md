## 2024-03-20 - Custom File Input Accessibility
**Learning:** Using `className="hidden"` or `display: none` on `<input type="file">` elements removes them from the tab order entirely, making them completely inaccessible to keyboard users, even if they have a custom `<label>` wrapper.
**Action:** Always use `sr-only` (visually hidden) on the `<input>` element instead, and add `focus-within:ring-2 focus-within:outline-none` on the wrapping `<label>` to ensure keyboard focus is visually indicated.
