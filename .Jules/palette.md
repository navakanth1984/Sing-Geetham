## 2026-06-21 - Chat Input Form Accessibility
**Learning:** Icon-only submit buttons in chat input forms frequently lack `aria-label` attributes and disabled states. This makes them hard to use for screen readers and confusing when users try to submit empty content.
**Action:** Always add `aria-label` explaining the action (e.g., "Send message") and a `disabled` attribute checking for empty input, accompanied by visual feedback (e.g., dimming the button and setting `cursor-not-allowed`) to icon-only submit buttons.
