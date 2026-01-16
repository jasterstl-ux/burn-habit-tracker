const habits = JSON.parse(localStorage.getItem("habits")) || [];
const today = new Date().toDateString();

habits.forEach((habit) => {
  // Ensure defaults
  habit.checksPerPeriod = habit.checksPerPeriod || 1;
  habit.periodDays = habit.periodDays || 1;
});

function lightenColor(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(
    255,
    b + 80
  )})`;
}

function getScheduleName(checksPerPeriod, periodDays) {
  if (periodDays === 1)
    return checksPerPeriod === 1 ? "Daily" : `${checksPerPeriod}x/day`; // Rare, but handles multiples per day
  if (periodDays === 7) return `${checksPerPeriod}x/week`;
  if (periodDays === 30) return `${checksPerPeriod}x/month`;
  return `${checksPerPeriod}x every ${periodDays} days`;
}

// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
if (
  localStorage.getItem("theme") === "dark" ||
  (!localStorage.getItem("theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Tab Switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab + "-tab").classList.add("active");
    if (btn.dataset.tab === "stats") renderStats();
  });
});

// Epic Victory Celebration
function triggerVictory(streak) {
  const quotes = [
    "You are unstoppable.",
    "This is pure fire.",
    "Your consistency is legendary.",
    "The world bows to your discipline.",
    "Keep burning — you're a force of nature.",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const overlay = document.createElement("div");
  overlay.id = "victory-overlay";
  overlay.className = "show";
  overlay.innerHTML = `
    <div id="victory-badge">🏆</div>
    <div id="victory-message">${streak}-DAY LEGEND!</div>
    <div id="victory-quote">"${randomQuote}"</div>
    <button class="close-victory">Keep Burning 🔥</button>
  `;
  document.body.appendChild(overlay);

  let burst = 0;
  const maxBursts = 8;
  const interval = setInterval(() => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: [
        "#ff6b35",
        "#f7931e",
        "#ffd700",
        "#ff4500",
        "#ff1493",
        "#00ff00",
      ],
      scalar: 1.3,
      gravity: 0.8,
    });
    confetti({
      particleCount: 150,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.6 },
    });
    confetti({
      particleCount: 150,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.6 },
    });
    confetti({
      particleCount: 100,
      spread: 180,
      origin: { y: 0.1 },
    });

    burst++;
    if (burst >= maxBursts) clearInterval(interval);
  }, 400);

  if ("vibrate" in navigator) navigator.vibrate([400, 200, 400, 200, 600]);

  overlay.querySelector(".close-victory").onclick = () => overlay.remove();
}

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function getBadge(streak) {
  if (streak >= 100) return "💎 Century";
  if (streak >= 50) return "🔥 Inferno";
  if (streak >= 30) return "🏆 Champion";
  if (streak >= 14) return "🥇 Winner";
  if (streak >= 7) return "🎉 7-Day Star";
  return "";
}

function getCurrentPeriodStart(habit) {
  const periodDays = habit.periodDays || 1;
  const start = new Date();
  const daysSinceEpoch = Math.floor(start.getTime() / 86400000);
  const periodStartEpoch = daysSinceEpoch - (daysSinceEpoch % periodDays);
  const periodStart = new Date(periodStartEpoch * 86400000);
  return periodStart.toDateString();
}

function updateProgress(habit) {
  if (!habit.checksPerPeriod) habit.checksPerPeriod = 1;
  if (!habit.periodDays) habit.periodDays = 1;
  if (!habit.checksThisPeriod) habit.checksThisPeriod = 0;
  if (!habit.currentPeriodStart)
    habit.currentPeriodStart = getCurrentPeriodStart(habit);

  const currentPeriod = getCurrentPeriodStart(habit);
  if (habit.currentPeriodStart !== currentPeriod) {
    habit.checksThisPeriod = 0;
    habit.currentPeriodStart = currentPeriod;
  }

  // Strength (forgiving but punishes uncheck on same day)
  if (!habit.strength) habit.strength = 0;

  if (habit.doneToday) {
    // Only increase once per day
    if (!habit.strengthIncreasedToday) {
      habit.strength = Math.min(
        100,
        habit.strength + (100 - habit.strength) * 0.1
      );
      habit.strengthIncreasedToday = true;
    }
  } else {
    // Decay if unchecked today (after having been checked earlier)
    if (habit.lastDoneDate === today && habit.strengthIncreasedToday) {
      // Punish the uncheck: small immediate drop
      habit.strength = Math.max(0, habit.strength * 0.95); // 5% drop on uncheck
      habit.strengthIncreasedToday = false; // Reset so no double penalty
    } else if (
      habit.lastDoneDate &&
      new Date(habit.lastDoneDate).toDateString() !== today
    ) {
      // Normal daily decay if missed completely
      habit.strength = Math.max(0, habit.strength * 0.99);
    }
  }

  // Classic streak
  updateStreak(habit);
}

function updateStreak(habit) {
  if (!habit.lastDoneDate) return;
  const last = new Date(habit.lastDoneDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    last.toDateString() !== yesterday.toDateString() &&
    last.toDateString() !== today
  ) {
    habit.streak = 0;
  }
}

function celebrate(streak) {
  if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
  if ([7, 14, 21, 30, 50, 100].includes(streak)) {
    setTimeout(() => triggerVictory(streak), 600);
  }
}

// renderStats
function renderStats() {
  const onFire = habits.filter((h) => h.streak > 0).length;
  const best = Math.max(0, ...habits.map((h) => h.streak));
  const todayDone = habits.filter((h) => h.doneToday).length;
  const avgStrength = habits.length
    ? Math.round(
        habits.reduce((sum, h) => sum + (h.strength || 0), 0) / habits.length
      )
    : 0;

  document.getElementById("stats-grid").innerHTML = `
    <div class="stat-card"><div class="stat-value">${habits.length}</div><div class="stat-label">Total Habits</div></div>
    <div class="stat-card"><div class="stat-value">${onFire}</div><div class="stat-label">On Fire</div></div>
    <div class="stat-card"><div class="stat-value">${best}</div><div class="stat-label">Best Streak</div></div>
    <div class="stat-card"><div class="stat-value">${avgStrength}%</div><div class="stat-label">Avg Strength</div></div>
    <div class="stat-card"><div class="stat-value">${todayDone}</div><div class="stat-label">Done Today</div></div>
  `;

  let html = "<div style='margin-bottom:8px'>Last 90 days:</div>";
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const count = habits.filter((h) => h.lastDoneDate === dateStr).length;
    const intensity = count === 0 ? 0 : Math.min(Math.ceil(count / 2), 4);
    html += `<span class="day day-${intensity}" title="${date.toLocaleDateString()}: ${count}"></span>`;
    if (i % 15 === 0) html += "<br>";
  }
  document.getElementById("calendar-heatmap").innerHTML = html;
}

// renderHabits
function renderHabits() {
  const list = document.getElementById("habit-list");
  list.innerHTML = "";

  habits.forEach((habit, index) => {
    if (habit.lastDoneDate !== today) habit.doneToday = false;
    updateProgress(habit);

    const li = document.createElement("li");
    li.className = `habit-item ${habit.doneToday ? "completed" : ""}`;
    li.draggable = true;
    const streakProgress = Math.min((habit.streak / 7) * 100, 100);
    const strengthProgress = habit.strength || 0;

    const habitColor = habit.color || "#4c4cff";
    const gradient = `linear-gradient(90deg, ${habitColor}, ${lightenColor(
      habitColor
    )})`;
    li.style.setProperty("--habit-color", habitColor);
    li.style.setProperty("--habit-color-gradient", gradient);

    li.innerHTML = `
      <div class="habit-main">
        <input type="checkbox" class="habit-check" ${
          habit.doneToday ? "checked" : ""
        }>
        <span class="habit-icon">${habit.icon || "🔥"}</span>
        <span class="habit-name ${habit.doneToday ? "done" : ""}">${
      habit.name
    }</span>
        <button class="delete-btn" title="Delete">×</button>
      </div>
      <div class="habit-footer">
        <div class="streak-group">
          <span class="flame">🔥</span>
          <span class="streak-label">Streak:</span>
          <span class="streak-value">${habit.streak}</span>
        </div>
        <div class="streak-bar-container">
          <div class="streak-bar" style="width: ${streakProgress}%"></div>
        </div>
        <div class="strength-group">
          <span>💪</span>
          <span class="strength-value">${Math.round(strengthProgress)}%</span>
        </div>
        <div class="strength-bar-container">
          <div class="strength-bar" style="width: ${strengthProgress}%"></div>
        </div>
        <div class="schedule-group">
         <span>📅</span>
         <span>${getScheduleName(
           habit.checksPerPeriod,
           habit.periodDays
         )}</span>
          <span>(${habit.checksThisPeriod || 0}/${habit.checksPerPeriod})</span>
        </div>
      <span class="badge">${getBadge(habit.streak)}</span>
    `;

    li.querySelector(".habit-check").addEventListener("change", (e) => {
      habit.doneToday = e.target.checked;
      if (habit.doneToday) {
        habit.lastDoneDate = today;
        habit.streak = (habit.streak || 0) + 1;
        celebrate(habit.streak);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        habit.streak = Math.max(0, (habit.streak || 0) - 1);
      }
      updateProgress(habit);
      saveHabits();
      renderHabits();
      renderStats();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      habits.splice(index, 1);
      saveHabits();
      renderHabits();
      renderStats();
    });

    list.appendChild(li);
  });
}

// Add Habit with Schedule
let selectedEmoji = "🔥";
let selectedColor = "#4c4cff";

document.addEventListener("DOMContentLoaded", () => {
  const emojiGrid = document.getElementById("emoji-grid");
  const colorGrid = document.getElementById("color-grid");

  const emojis = [
    "🔥",
    "💪",
    "🏃",
    "📚",
    "🧘",
    "🥗",
    "💧",
    "😴",
    "📖",
    "✍️",
    "🎯",
    "🧹",
    "🛁",
    "🦷",
    "📱",
    "🎨",
    "🎵",
    "🌿",
    "🚴",
    "🏊",
    "🧠",
    "❤️",
    "🛌",
    "☕",
    "🍳",
    "🛍️",
    "🚶",
    "🧺",
    "📞",
    "💻",
    "🌅",
    "🌙",
    "⭐",
    "🏆",
    "🚀",
    "🌱",
    "📈",
    "💰",
    "🙏",
    "😊",
  ];
  emojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      selectedEmoji = emoji;
      emojiGrid
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    emojiGrid.appendChild(btn);
  });
  emojiGrid.firstChild.classList.add("selected");

  const colors = [
    "#4c4cff",
    "#ff6b35",
    "#39a845",
    "#f7931e",
    "#e53935",
    "#00bcd4",
    "#9c27b0",
    "#ff9800",
    "#795548",
    "#607d8b",
    "#e91e63",
    "#009688",
    "#ffc107",
    "#673ab7",
    "#03a9f4",
    "#8bc34a",
    "#f44336",
    "#cddc39",
    "#ffeb3b",
    "#2196f3",
  ];
  colors.forEach((color) => {
    const btn = document.createElement("button");
    btn.style.background = color;
    btn.addEventListener("click", () => {
      selectedColor = color;
      colorGrid
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    colorGrid.appendChild(btn);
  });
  colorGrid.firstChild.classList.add("selected");

  const addBtn = document.getElementById("add-btn");
  const habitInput = document.getElementById("habit-input");
  const checksPerPeriodInput = document.getElementById("checks-per-period");
  const periodDaysInput = document.getElementById("period-days");

  addBtn.addEventListener("click", () => {
    const name = habitInput.value.trim();
    if (!name) return;
    const reminderTime =
      document.getElementById("habit-reminder-time")?.value || null;
    const checksPerPeriod = parseInt(checksPerPeriodInput.value, 10) || 1;
    const periodDays = parseInt(periodDaysInput.value, 10) || 1;
    habits.push({
      name,
      icon: selectedEmoji,
      color: selectedColor,
      checksPerPeriod,
      periodDays,
      reminderTime, // New: saved per habit
      streak: 0,
      strength: 0,
      checksThisPeriod: 0,
      currentPeriodStart: getCurrentPeriodStart({ periodDays }),
      doneToday: false,
      lastDoneDate: null,
      strengthIncreasedToday: false, // NEW: Flag for daily strength cap
    });
    habitInput.value = "";
    document.getElementById("add-input").classList.remove("show");
    saveHabits();
    renderHabits();
    renderStats();
    // Send updated habits to SW for reminders
    navigator.serviceWorker.ready.then((reg) =>
      reg.active.postMessage({ type: "habits-for-reminders", habits })
    );
  });

  habitInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
  });
  // Close add popup: outside click or X button
  const addPopup = document.getElementById("add-input");
  const addFab = document.getElementById("add-fab");
  const closeBtn = document.getElementById("close-add");

  function closeAddPopup() {
    addPopup.classList.remove("show");
  }

  // Click X button
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAddPopup);
  }

  // Click outside popup (but not on FAB)
  document.addEventListener("click", (e) => {
    if (
      addPopup.classList.contains("show") &&
      !addPopup.contains(e.target) &&
      !addFab.contains(e.target)
    ) {
      closeAddPopup();
    }
  });
});

// PWA Install
let deferredPrompt;
const installBtn = document.getElementById("install-btn");
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") installBtn.style.display = "none";
  deferredPrompt = null;
});

// Export / Import
document.getElementById("export-btn").addEventListener("click", () => {
  const data = JSON.stringify(habits, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `burn-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document
  .getElementById("import-btn")
  .addEventListener("click", () =>
    document.getElementById("import-file").click()
  );
document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        habits.length = 0;
        habits.push(...imported);
        saveHabits();
        renderHabits();
        renderStats();
        alert("Backup restored! 🔥");
      }
    } catch (err) {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
});

// Initial render
renderHabits();
renderStats();

// SW message listener (for quick.html sync if needed)
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "habit-checked") {
    renderHabits();
    renderStats();
  }
});
