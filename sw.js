// sw.js — Daily 8 PM reminder
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => self.clients.claim());

function showNotification() {
  self.registration.showNotification("Your streak is waiting 🔥", {
    body: "Don’t let the fire die. Open Burn and check in!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "daily-reminder",
    renotify: true,
    actions: [{ action: "open", title: "Open Burn" }],
  });
}

// Schedule daily at 8 PM local time
function scheduleDaily() {
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8:00 PM

  if (now > target) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    showNotification();
    scheduleDaily(); // re-schedule for tomorrow
  }, delay);
}

// Start scheduling when SW activates
self.addEventListener("message", (event) => {
  if (event.data === "start-reminders") scheduleDaily();
});

// Open app when notification clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"));
  }
});
