export const securityHeaders = {
  // API-only: no need for CSP here (frontend has its own CSP if needed)
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "no-referrer" }
};