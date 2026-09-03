import { DataStore } from "./firebase.js";
import { renderNotificationCards } from "./render.js";

export async function renderNotifications() {
  if (!window.App.currentUser) {
    renderNotificationCards([]);
    return;
  }
  const notifications = await DataStore.list("notifications", {
    where: ["uid", "==", window.App.currentUser.uid]
  });
  window.App.data.notifications = notifications;
  renderNotificationCards(notifications);
  await markAllRead(notifications);
  await refreshNotifBadge();
}

async function markAllRead(notifications) {
  for (const n of notifications) {
    if (!n.read) {
      await DataStore.setDoc("notifications", n.id, { read: true });
    }
  }
}

/* =========================================================
   AKAMENYETSO K'UBUTUMWA BUDASOMWE (badge muri header)
   ========================================================= */

export async function refreshNotifBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;

  if (!window.App.currentUser) {
    badge.classList.add("hidden");
    return;
  }

  const notifications = await DataStore.list("notifications", {
    where: ["uid", "==", window.App.currentUser.uid]
  });
  const unread = notifications.filter(n => !n.read).length;

  if (unread > 0) {
    badge.textContent = unread > 9 ? "9+" : String(unread);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

window.renderNotifications = renderNotifications;
window.refreshNotifBadge = refreshNotifBadge;
