## 2024-05-18 - Missing ARIA Labels on Key Icon-Only Buttons
**Learning:** Found a recurring pattern where icon-only buttons lacked proper `aria-label` and sometimes `title` attributes. This includes major interactive elements like "Sign Out", "End/Start Call", and sending chat messages.
**Action:** Always verify that every interactive button that relies solely on an icon has an explicit `aria-label` providing context to screen readers, especially dynamically changing states (e.g. End Call / Start Call).
