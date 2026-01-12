self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => self.clients.claim());

function showNotification(title, body) {
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "habit-reminder",
    renotify: true,
    actions: [{ action: "open", title: "Open Burn" }],
  });
}

let habitsCache = [];

// Receive habits from client
self.addEventListener("message", (event) => {
  if (event.data.type === "habits-for-reminders") {
    habitsCache = event.data.habits;
  }
  if (event.data.type === "start-reminders") {
    checkReminders();
  }
});

// Check reminders every minute
function checkReminders() {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  habitsCache.forEach((habit) => {
    if (habit.reminderTime && habit.reminderTime === currentTime) {
      showNotification("Burn Reminder", `Time to check "${habit.name}"! 🔥`);
    }
  });

  setTimeout(checkReminders, 60000); // Every minute
}

// Open app when notification clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"));
  }
});
