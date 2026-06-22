## 2024-03-20 - File Upload Keyboard Accessibility
**Learning:** Using `hidden` on `<input type="file">` breaks keyboard navigation entirely. When hidden, the element is removed from the accessibility tree and cannot receive focus.
**Action:** Use `sr-only` to visually hide the input while keeping it in the accessibility tree. Combine this with `focus-within:ring-2` on the parent `<label>` to provide a visible focus indicator when the visually hidden input receives keyboard focus.
