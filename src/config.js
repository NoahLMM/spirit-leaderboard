// Branding/config values, all overridable via env vars — see .env.example.
// No code changes needed to rebrand this app for a new organization.

export const config = {
  siteTitle: import.meta.env.VITE_SITE_TITLE || "Spirit Challenge",
  groupLabel: import.meta.env.VITE_GROUP_LABEL || "Team",
  emailDomain: import.meta.env.VITE_EMAIL_DOMAIN || "",
  footerText: import.meta.env.VITE_FOOTER_TEXT || "",
};
