## 2026-06-26 - Accessible Icon-Only Buttons
**Learning:** Icon-only action and media buttons (like 'Play/Stop' or 'Sign Out') are invisible to screen readers, leaving users with no context of their function.
**Action:** Always provide descriptive `aria-label` attributes to icon-only buttons, and use dynamic labels (e.g., 'Stop track' instead of 'Play track') when their functionality toggles based on state. Ensure they have clear `focus-visible` states for keyboard navigation.
