const AUTH_STORAGE_KEY = "stockflow_auth_user";

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
 * Check if active user session exists in localStorage.
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return !!data;
  } catch (e) {
    return false;
  }
}

/**
 * Get current logged in user from localStorage. Returns null if not authenticated.
 */
export function getAuthUser() {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      name: parsed.name || parsed.username || "User",
      email: parsed.email || "",
      role: parsed.role || "Warehouse Staff",
      avatar: (parsed.name ? parsed.name.slice(0, 2).toUpperCase() : (parsed.username ? parsed.username.slice(0, 2).toUpperCase() : "US")),
      username: parsed.username || parsed.name || "user",
    };
  } catch (e) {
    return null;
  }
}

/**
 * Save logged in user details to localStorage.
 */
export function setAuthUser(user) {
  if (typeof window === "undefined") return;
  try {
    const formatted = {
      name: user.name || user.username || "User",
      email: user.email || "",
      role: user.role || "Warehouse Staff",
      username: user.username || user.name || "user",
      avatar: (user.name ? user.name.slice(0, 2).toUpperCase() : (user.username ? user.username.slice(0, 2).toUpperCase() : "US")),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(formatted));
  } catch (e) {
    console.error("Failed to save auth session:", e);
  }
}

/**
 * Clear session and log out.
 */
export function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/login";
  } catch (e) {
    window.location.href = "/login";
  }
}
