## 2024-11-20 - Accessible File Inputs
**Learning:** Using `hidden` on file inputs removes them from the accessibility tree, preventing keyboard navigation and screen reader support. File inputs should be accessible.
**Action:** Always use `sr-only` instead of `hidden` for file inputs wrapped in labels, and add `focus-within` outline styles to the parent `<label>` to give keyboard users a visible focus indicator.
