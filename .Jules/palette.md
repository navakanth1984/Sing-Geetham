
## 2025-03-09 - File Input Keyboard Accessibility
**Learning:** Using `className="hidden"` (or `display: none`) on `<input type="file">` elements removes them from the accessibility tree and document flow, making it impossible for keyboard users to focus them. Since standard file inputs are hard to style, wrapping them in a `<label>` is a common pattern for custom styles.
**Action:** Always use `className="sr-only"` instead of `hidden` on file inputs to keep them focusable by screen readers and keyboards. Combine this with `focus-within:ring-2` (and similar focus classes) on the parent `<label>` to display a visual focus indicator when the invisible input receives focus via keyboard navigation.
