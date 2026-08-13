const THEME_STORAGE_KEY = "stockflow_app_theme";
const SETTINGS_STORAGE_KEY = "stockflow_app_settings";

/**
 * Get active theme from localStorage ("light" | "dark" | "system"). Default "dark".
 */
export function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  } catch (e) {
    return "dark";
  }
}

/**
 * Apply theme to document.documentElement ("light" | "dark" | "system").
 * ONLY called when the user explicitly clicks the theme selector or header theme button.
 */
export function applyTheme(mode) {
  if (typeof window === "undefined") return;
  try {
    const root = document.documentElement;
    localStorage.setItem(THEME_STORAGE_KEY, mode);

    let effectiveDark = false;
    if (mode === "dark") {
      effectiveDark = true;
    } else if (mode === "light") {
      effectiveDark = false;
    } else if (mode === "system") {
      effectiveDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (effectiveDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } catch (e) {
    console.error("Failed to apply theme:", e);
  }
}

const DEFAULT_SETTINGS = {
  theme: "dark",
  companyName: "StockFlow Inc.",
  contactEmail: "ops@stockflow.io",
  currency: "USD ($)",
  customCurrencySymbol: "",
  timezone: "UTC-05:00 Eastern",
  address: "500 Warehouse Rd, Newark NJ",
  lowStockThreshold: 20,
  skuPrefix: "SF-",
  autoGenerateSku: true,
  trackBatchNumbers: false,
  allowNegativeStock: false,
  emailNotifications: true,
  lowStockAlerts: true,
  outOfStockAlerts: true,
  weeklyDigest: false,
  autoDailyBackup: true,
  exportLogsWeekly: false,
};

/**
 * Get saved app settings from localStorage.
 */
export function getAppSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    let authUser = null;
    try {
      const authData = localStorage.getItem("stockflow_auth_user");
      if (authData) authUser = JSON.parse(authData);
    } catch (e) {}

    const companyName = authUser?.company_name || parsed.companyName || DEFAULT_SETTINGS.companyName;
    const contactEmail = authUser?.company_email || parsed.contactEmail || DEFAULT_SETTINGS.contactEmail;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      companyName,
      contactEmail,
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to localStorage.
 */
export function saveAppSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save app settings:", e);
  }
}

/**
 * Extract active currency symbol (e.g. "$", "€", "£", "₦", "₹", "CA$", "A$")
 */
export function getCurrencySymbol() {
  const settings = getAppSettings();
  if (settings.currency === "custom" && settings.customCurrencySymbol) {
    return settings.customCurrencySymbol.trim();
  }

  const str = settings.currency || "USD ($)";
  const match = str.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1];
  }
  return "$";
}

/**
 * Format any numerical price or valuation with active currency symbol
 */
export function formatCurrency(amount) {
  const symbol = getCurrencySymbol();
  const num = Number(amount || 0);
  const formattedNum = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedNum}`;
}
