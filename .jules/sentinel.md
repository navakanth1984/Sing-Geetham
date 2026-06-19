## YYYY-MM-DD - Remove hardcoded API key from firebase config
**Vulnerability:** Firebase config contains hardcoded `apiKey`, `appId`, `messagingSenderId` and `projectId`.
**Learning:** Hardcoded secrets in client-side code pose a significant security risk, as anyone can inspect the source and extract them.
**Prevention:** Use environment variables (like `import.meta.env.VITE_FIREBASE_API_KEY`) to inject these securely at build/run time without exposing them in the repository.
