const AUTH_STORAGE_KEY = "stockflow_auth_user";
const SYSTEM_MAINTENANCE_KEY = "stockflow_system_session_version";
export const CURRENT_APP_VERSION = "v2.4.0";

const ROLE_PERMISSIONS = {
  Administrator: [
    "/", "/products", "/categories", "/suppliers",
    "/stock-in", "/stock-out", "/transfers", "/stock-history",
    "/reports", "/alerts", "/users", "/settings", "/profile"
  ],
  "Inventory Manager": [
    "/", "/products", "/categories", "/suppliers",
    "/stock-in", "/stock-out", "/transfers", "/stock-history",
    "/reports", "/alerts", "/profile"
  ],
  "Warehouse Staff": [
    "/", "/products", "/stock-in", "/stock-out", "/transfers",
    "/stock-history", "/alerts", "/profile"
  ],
  Viewer: [
    "/", "/products", "/stock-history", "/alerts", "/profile"
  ],
};

/**
 * Check if a route is authorized for a specific role.
 */
export function isRouteAllowed(role, pathname) {
  const allowed = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Warehouse Staff"];
  return allowed.includes(pathname);
}

/**
 * Check if user has permission to approve returns (Administrator or Inventory Manager).
 */
export function canApproveReturns(role) {
  return role === "Administrator" || role === "Inventory Manager";
}

/**
 * Get active system session version stored locally.
 */
export function getSystemSessionVersion() {
  if (typeof window === "undefined") return CURRENT_APP_VERSION;
  return localStorage.getItem(SYSTEM_MAINTENANCE_KEY) || CURRENT_APP_VERSION;
}

/**
 * Check if active user session exists in localStorage and matches current system version.
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    const requiredVer = getSystemSessionVersion();
    if (parsed.session_version && parsed.session_version !== requiredVer) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get current logged in user from localStorage. Returns null if not authenticated or session reset.
 */
export function getAuthUser() {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    const requiredVer = getSystemSessionVersion();

    // If maintenance reset was triggered or session version is stale, invalidate and require re-login
    if (parsed.session_version && parsed.session_version !== requiredVer) {
      logoutUser({ reason: "maintenance" });
      return null;
    }

    return {
      name: parsed.name || parsed.username || "User",
      email: parsed.email || "",
      role: parsed.role || "Warehouse Staff",
      avatar: (parsed.name ? parsed.name.slice(0, 2).toUpperCase() : (parsed.username ? parsed.username.slice(0, 2).toUpperCase() : "US")),
      username: parsed.username || parsed.name || "user",
      company_slug: parsed.company_slug || "default",
      company_name: parsed.company_name || "",
      company_email: parsed.company_email || "",
      session_version: parsed.session_version || requiredVer,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Get current company_slug for active session.
 */
export function getCompanySlug() {
  const user = getAuthUser();
  return user?.company_slug || "default";
}

/**
 * Generate full company staff login URL link.
 */
export function getCompanyStaffLink(slug) {
  if (typeof window === "undefined") return `/login?company=${slug || "default"}`;
  const origin = window.location.origin;
  return `${origin}/login?company=${slug || "default"}`;
}

/**
 * Save logged in user details to localStorage with current system session version.
 */
export function setAuthUser(user) {
  if (typeof window === "undefined") return;
  try {
    const currentVersion = getSystemSessionVersion();
    const formatted = {
      name: user.name || user.username || "User",
      email: user.email || "",
      role: user.role || "Warehouse Staff",
      username: user.username || user.name || "user",
      avatar: (user.name ? user.name.slice(0, 2).toUpperCase() : (user.username ? user.username.slice(0, 2).toUpperCase() : "US")),
      company_slug: user.company_slug || "default",
      company_name: user.company_name || "",
      company_email: user.company_email || user.contact_email || "",
      session_version: user.session_version || currentVersion,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(formatted));
    try {
      const { applyTheme, getStoredTheme } = require("@/lib/theme");
      applyTheme(getStoredTheme());
    } catch (e) {}
  } catch (e) {
    console.error("Failed to save auth session:", e);
  }
}

/**
 * Clear session and log out. Redirects user to login/signup page.
 */
export function logoutUser(options = {}) {
  if (typeof window === "undefined") return;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    let slug = "default";
    if (data) {
      const parsed = JSON.parse(data);
      slug = parsed.company_slug || "default";
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    const reasonStr = options.reason ? `&reason=${options.reason}` : "";
    if (slug && slug !== "default") {
      window.location.href = `/login?company=${slug}${reasonStr}`;
    } else {
      window.location.href = `/login${options.reason ? `?reason=${options.reason}` : ""}`;
    }
  } catch (e) {
    window.location.href = "/login";
  }
}

/**
 * Trigger system-wide maintenance reset across all active company staff.
 */
export function triggerSystemMaintenanceReset(newVersion) {
  if (typeof window === "undefined") return;
  const ver = newVersion || `v${Date.now()}`;
  localStorage.setItem(SYSTEM_MAINTENANCE_KEY, ver);
  logoutUser({ reason: "maintenance" });
}
