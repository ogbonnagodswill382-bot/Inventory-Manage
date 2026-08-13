/**
 * Phone & Web Push Notification Manager for StockFlow
 */

export async function requestPhoneNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { supported: false, granted: false, message: "Web push notifications not supported on this browser device." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return { supported: true, granted: true, message: "Phone Lock-Screen Push Notifications Enabled! 📲" };
    } else {
      return { supported: true, granted: false, message: "Push Notification permission was denied." };
    }
  } catch (error) {
    return { supported: true, granted: false, message: error.message };
  }
}

export function sendPhonePushNotification({ title, message, icon = "/icon.svg", url = "/" }) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    try {
      const options = {
        body: message,
        icon: icon,
        badge: icon,
        vibrate: [200, 100, 200],
        data: { url },
        tag: `stockflow-notif-${Date.now()}`,
      };

      // Native Mobile Browser Push Notification
      const notif = new Notification(title, options);
      notif.onclick = function (e) {
        e.preventDefault();
        if (typeof window !== "undefined") {
          window.focus();
          if (url) window.location.href = url;
        }
      };

      // Mobile PWA ServiceWorker Push Notification fallback
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options);
        });
      }
      return true;
    } catch (e) {
      console.warn("Failed to trigger phone push notification:", e);
      return false;
    }
  }
  return false;
}
