const habits = JSON.parse(localStorage.getItem("habits")) || [];
const today = new Date().toDateString();
const capacitorNotifications =
  window.Capacitor?.Plugins?.LocalNotifications || null;

function ensureHabitId(habit) {
  if (!habit.id) {
    habit.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  return habit.id;
}

function getReminderId(habit) {
  const raw = ensureHabitId(habit);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 2147483647);
}

function parseTimeValue(timeValue, fallback = "08:00") {
  const value = timeValue || fallback;
  const [hour, minute] = value.split(":").map((part) => parseInt(part, 10));
  return {
    hour: Number.isFinite(hour) ? hour : 8,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

async function scheduleHabitReminder(habit) {
  if (!capacitorNotifications) return;
  if (!habit.reminderEnabled) return;

  const { hour, minute } = parseTimeValue(habit.timeOfDay);
  const notificationId = getReminderId(habit);

  try {
    const permission = await capacitorNotifications.requestPermissions();
    if (permission?.display && permission.display !== "granted") {
      return;
    }
    await capacitorNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
    await capacitorNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: "Habit Reminder",
          body: habit.name,
          schedule: {
            on: { hour, minute },
            repeats: true,
          },
        },
      ],
    });
  } catch (error) {
    console.warn("Failed to schedule reminder", error);
  }
}

async function cancelHabitReminder(habit) {
  if (!capacitorNotifications) return;
  const notificationId = getReminderId(habit);
  try {
    await capacitorNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  } catch (error) {
    console.warn("Failed to cancel reminder", error);
  }
}

async function syncReminders() {
  if (!capacitorNotifications) return;
  for (const habit of habits) {
    ensureHabitId(habit);
    if (habit.reminderEnabled) {
      await scheduleHabitReminder(habit);
    } else {
      await cancelHabitReminder(habit);
    }
  }
}

// Schedule definitions
const schedules = {
  daily: { name: "Daily", checksPerPeriod: 1, periodDays: 1 },
  every2days: { name: "Every 2 days", checksPerPeriod: 1, periodDays: 2 },
  weekly3: { name: "3x/week", checksPerPeriod: 3, periodDays: 7 },
  weekly2: { name: "2x/week", checksPerPeriod: 2, periodDays: 7 },
  weekly1: { name: "Weekly", checksPerPeriod: 1, periodDays: 7 },
  monthly: { name: "Monthly", checksPerPeriod: 1, periodDays: 30 },
};

function lightenColor(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(
    255,
    b + 80,
  )})`;
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

// STRENGTH & SCHEDULE LOGIC
function getCurrentPeriodStart(habit) {
  const periodDays = 7; // Always weekly
  const start = new Date();
  const daysSinceEpoch = Math.floor(start.getTime() / 86400000);
  const periodStartEpoch = daysSinceEpoch - (daysSinceEpoch % periodDays);
  const periodStart = new Date(periodStartEpoch * 86400000);
  return periodStart.toDateString();
}

function updateProgress(habit) {
  if (!habit.timesPerWeek) habit.timesPerWeek = 1;
  if (!habit.checksThisPeriod) habit.checksThisPeriod = 0;
  if (!habit.currentPeriodStart)
    habit.currentPeriodStart = getCurrentPeriodStart(habit);

  const currentPeriod = getCurrentPeriodStart(habit);
  if (habit.currentPeriodStart !== currentPeriod) {
    habit.checksThisPeriod = 0;
    habit.currentPeriodStart = currentPeriod;
    habit.completedToday = false;
  }

  // Track if we've already counted today's completion
  if (!habit.completedToday && habit.doneToday) {
    if (habit.checksThisPeriod < habit.timesPerWeek) {
      habit.checksThisPeriod += 1;
      habit.completedToday = true;
    }
  } else if (habit.completedToday && !habit.doneToday) {
    // User unchecked the habit, decrement counter
    if (habit.checksThisPeriod > 0) {
      habit.checksThisPeriod -= 1;
      habit.completedToday = false;
    }
  }

  // Strength (forgiving)
  if (!habit.strength) habit.strength = 0;
  if (habit.doneToday) {
    habit.strength = Math.min(
      100,
      habit.strength + (100 - habit.strength) * 0.1,
    );
  } else if (
    habit.lastDoneDate &&
    new Date(habit.lastDoneDate).toDateString() !== today
  ) {
    habit.strength = Math.max(0, habit.strength * 0.99);
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
        habits.reduce((sum, h) => {
          const timesPerWeek = h.timesPerWeek || 1;
          const checksThisPeriod = h.checksThisPeriod || 0;
          const pct = Math.min(
            100,
            Math.round((checksThisPeriod / timesPerWeek) * 100),
          );
          return sum + pct;
        }, 0) / habits.length,
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
      habitColor,
    )})`;
    li.style.setProperty("--habit-color", habitColor);
    li.style.setProperty("--habit-color-gradient", gradient);

    // Build schedule text with times per week and time of day
    const timesPerWeek = habit.timesPerWeek || 1;
    const timeOfDay = habit.timeOfDay ? ` @ ${habit.timeOfDay}` : "";
    const scheduleText = `${habit.checksThisPeriod || 0}/${timesPerWeek} this week${timeOfDay}`;

    // Calculate completion percentage based on checks this period
    const completionPercentage = Math.round(
      (habit.checksThisPeriod / timesPerWeek) * 100,
    );

    li.innerHTML = `
      <div class="habit-main">
        <input type="checkbox" class="habit-check" ${
          habit.doneToday ? "checked" : ""
        }>
        <span class="habit-icon">${habit.icon || "🔥"}</span>
        <span class="habit-name ${habit.doneToday ? "done" : ""}">${
          habit.name
        }</span>
        <button class="habit-menu-btn" title="More">⋮</button>
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
          <span>📊</span>
          <span class="strength-value" title="This week's completion">${Math.min(completionPercentage, 100)}%</span>
        </div>
        <div class="strength-bar-container">
          <div class="strength-bar" style="width: ${Math.min(completionPercentage, 100)}%"></div>
        </div>
        <div class="schedule-group">
          <span>📅</span>
          <span>${scheduleText}</span>
        </div>
        <span class="badge">${getBadge(habit.streak)}</span>
      </div>
    `;

    // Dropdown menu logic
    li.querySelector(".habit-menu-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      let menu = document.createElement("div");
      menu.className = "habit-dropdown-menu";
      menu.innerHTML = `
        <button class="edit-habit-btn">Edit Habit</button>
        <button class="edit-streak-btn">Edit Streak</button>
      `;
      document.body.appendChild(menu);
      const rect = e.target.getBoundingClientRect();
      menu.style.position = "absolute";
      menu.style.left = rect.left + "px";
      menu.style.top = rect.bottom + "px";
      // Remove menu on click elsewhere
      setTimeout(() => {
        document.addEventListener("click", function handler() {
          menu.remove();
          document.removeEventListener("click", handler);
        });
      }, 10);
      menu.querySelector(".edit-habit-btn").onclick = (ev) => {
        ev.stopPropagation();
        menu.remove();
        showEditHabitModal(habit, index);
      };
      menu.querySelector(".edit-streak-btn").onclick = (ev) => {
        ev.stopPropagation();
        menu.remove();
        showEditStreakModal(habit, index);
      };
    });
    // Modal for editing habit fields
    function showEditHabitModal(habit, index) {
      let modal = document.createElement("div");
      modal.className = "modal-overlay";
      const timesPerWeek = habit.timesPerWeek || 1;
      const timeOfDay = habit.timeOfDay || "";
      const reminderEnabled = !!habit.reminderEnabled;
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Edit Habit</h3>
          <div style="display:grid; gap:12px; text-align:left;">
            <label>
              <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Name</div>
              <input type="text" id="edit-habit-name" value="${habit.name}" />
            </label>
            <label>
              <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Emoji</div>
              <input type="text" id="edit-habit-emoji" value="${habit.icon || "🔥"}" maxlength="4" />
            </label>
            <label>
              <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Color</div>
              <input type="color" id="edit-habit-color" value="${habit.color || "#4c4cff"}" />
            </label>
            <label>
              <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Times per week</div>
              <input type="number" id="edit-habit-times" min="1" max="7" value="${timesPerWeek}" />
            </label>
            <label>
              <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Time of day</div>
              <input type="time" id="edit-habit-time" value="${timeOfDay}" />
            </label>
            <label style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" id="edit-habit-reminder" ${
                reminderEnabled ? "checked" : ""
              } />
              <span>Daily alarm</span>
            </label>
          </div>
          <div style="margin-top:16px;">
            <button id="save-habit-btn">Save</button>
            <button id="cancel-habit-btn">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById("edit-habit-name").focus();
      document.getElementById("save-habit-btn").onclick = async () => {
        const newName = document.getElementById("edit-habit-name").value.trim();
        const newEmoji = document
          .getElementById("edit-habit-emoji")
          .value.trim();
        const newColor = document.getElementById("edit-habit-color").value;
        const newTimes = Math.max(
          1,
          Math.min(
            7,
            parseInt(document.getElementById("edit-habit-times").value) || 1,
          ),
        );
        const newTime = document.getElementById("edit-habit-time").value;
        const reminderOn = document.getElementById(
          "edit-habit-reminder",
        ).checked;

        habit.name = newName || habit.name;
        habit.icon = newEmoji || habit.icon || "🔥";
        habit.color = newColor || habit.color || "#4c4cff";
        habit.timesPerWeek = newTimes;
        habit.timeOfDay = reminderOn
          ? newTime || habit.timeOfDay || "08:00"
          : newTime || "";
        habit.reminderEnabled = reminderOn;
        habit.checksThisPeriod = Math.min(
          habit.checksThisPeriod || 0,
          habit.timesPerWeek,
        );
        habit.currentPeriodStart = getCurrentPeriodStart(habit);
        habit.completedToday = habit.doneToday && habit.checksThisPeriod > 0;

        if (habit.reminderEnabled) {
          await scheduleHabitReminder(habit);
        } else {
          await cancelHabitReminder(habit);
        }

        saveHabits();
        renderHabits();
        checkAchievements();
        renderAchievements();
        if (document.querySelector('[data-tab="stats"].active')) renderStats();
        modal.remove();
      };
      document.getElementById("cancel-habit-btn").onclick = () =>
        modal.remove();
    }
    // Modal for editing streak
    function showEditStreakModal(habit, index) {
      let modal = document.createElement("div");
      modal.className = "modal-overlay";
      const timesPerWeek = habit.timesPerWeek || 1;
      const checksThisPeriod = habit.checksThisPeriod || 0;
      modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Streak for <span style="color:${habit.color}">${habit.name}</span></h3>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <div>
          <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Streak</div>
          <input type="number" id="edit-streak-input" min="0" value="${habit.streak}" style="width:80px;font-size:1.2em;" />
        </div>
        <div>
          <div style="font-size:0.85em; margin-bottom:6px; color:#666;">Checks this week</div>
          <input type="number" id="edit-checks-input" min="0" max="${timesPerWeek}" value="${checksThisPeriod}" style="width:80px;font-size:1.2em;" />
        </div>
      </div>
      <div style="margin-top:16px;">
        <button id="save-streak-btn">Save</button>
        <button id="cancel-streak-btn">Cancel</button>
      </div>
    </div>
  `;
      document.body.appendChild(modal);
      document.getElementById("edit-streak-input").focus();
      document.getElementById("save-streak-btn").onclick = () => {
        const newStreak =
          parseInt(document.getElementById("edit-streak-input").value) || 0;
        const newChecks = Math.max(
          0,
          Math.min(
            timesPerWeek,
            parseInt(document.getElementById("edit-checks-input").value) || 0,
          ),
        );
        habit.streak = newStreak;
        habit.checksThisPeriod = newChecks;
        habit.currentPeriodStart = getCurrentPeriodStart(habit);
        habit.completedToday = habit.doneToday && newChecks > 0;
        saveHabits();
        renderHabits();
        checkAchievements();
        renderAchievements();
        if (document.querySelector('[data-tab="stats"].active')) renderStats();
        modal.remove();
      };
      document.getElementById("cancel-streak-btn").onclick = () =>
        modal.remove();
    }

    li.querySelector(".habit-check").addEventListener("change", (e) => {
      const prev = habit.streak;
      habit.doneToday = e.target.checked;
      if (e.target.checked) {
        if (!habit._preCheckState) {
          habit._preCheckState = {
            streak: habit.streak || 0,
            strength: habit.strength || 0,
            checksThisPeriod: habit.checksThisPeriod || 0,
            completedToday: !!habit.completedToday,
            lastDoneDate: habit.lastDoneDate || null,
          };
        }
        habit.lastDoneDate = today;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (
          !habit.lastDoneDate ||
          new Date(habit.lastDoneDate).toDateString() ===
            yesterday.toDateString() ||
          prev === 0
        ) {
          habit.streak += 1;
        }
        if (habit.streak > prev) celebrate(habit.streak);
      } else {
        if (habit._preCheckState) {
          habit.streak = habit._preCheckState.streak;
          habit.strength = habit._preCheckState.strength;
          habit.checksThisPeriod = habit._preCheckState.checksThisPeriod;
          habit.completedToday = habit._preCheckState.completedToday;
          habit.lastDoneDate = habit._preCheckState.lastDoneDate;
          delete habit._preCheckState;
        } else if (habit.lastDoneDate === today && habit.streak > 0) {
          habit.streak -= 1;
          habit.lastDoneDate = null;
        }
      }
      saveHabits();
      renderHabits();
      checkAchievements();
      renderAchievements();
      if (document.querySelector('[data-tab="stats"].active')) renderStats();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      const confirmed = window.confirm(
        `Delete "${habit.name}"? This action cannot be undone.`,
      );
      if (!confirmed) return;
      habits.splice(index, 1);
      saveHabits();
      renderHabits();
      renderStats();
    });

    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      saveHabits();
    });

    list.appendChild(li);
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = [
      ...list.querySelectorAll(".habit-item:not(.dragging)"),
    ].reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset)
          return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
    if (after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });

  list.addEventListener("drop", () => {
    const newOrder = Array.from(list.children).map((li) => {
      const name = li.querySelector(".habit-name").textContent;
      return habits.find((h) => h.name === name);
    });
    habits.length = 0;
    habits.push(...newOrder);
    saveHabits();
  });
}

// Add Habit with Schedule
let selectedEmoji = "🔥";
let selectedColor = "#4c4cff";
let selectedTimesPerWeek = 1;
let selectedTimeOfDay = "";
let selectedTimeSlots = [];

document.addEventListener("DOMContentLoaded", () => {
  const emojiGrid = document.getElementById("emoji-grid");
  const colorGrid = document.getElementById("color-grid");
  const timesPerWeekInput = document.getElementById("times-per-week");
  const timeOfDayInput = document.getElementById("time-of-day");
  const dailyAlarmInput = document.getElementById("daily-alarm");
  const timeSlotsContainer = document.getElementById("time-slots-container");
  const timeSlotsGrid = document.getElementById("time-slots-grid");

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
      document
        .querySelectorAll("#emoji-grid button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    emojiGrid.appendChild(btn);
  });

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
      document
        .querySelectorAll("#color-grid button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    colorGrid.appendChild(btn);
  });

  emojiGrid.firstChild.classList.add("selected");
  colorGrid.firstChild.classList.add("selected");

  // Handle times per week input change
  timesPerWeekInput.addEventListener("change", () => {
    selectedTimesPerWeek = parseInt(timesPerWeekInput.value) || 1;
  });

  // Handle time of day input change
  timeOfDayInput.addEventListener("change", () => {
    selectedTimeOfDay = timeOfDayInput.value;
  });

  const addBtn = document.getElementById("add-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const habitInput = document.getElementById("habit-input");

  function resetAddHabitModal() {
    habitInput.value = "";
    timesPerWeekInput.value = "1";
    timeOfDayInput.value = "";
    if (dailyAlarmInput) dailyAlarmInput.checked = false;
    selectedEmoji = "🔥";
    selectedColor = "#4c4cff";
    selectedTimesPerWeek = 1;
    selectedTimeOfDay = "";
    selectedTimeSlots = [];
    document
      .querySelectorAll("#emoji-grid button")
      .forEach((b, i) => b.classList.toggle("selected", i === 0));
    document
      .querySelectorAll("#color-grid button")
      .forEach((b, i) => b.classList.toggle("selected", i === 0));
    document.getElementById("add-input").classList.remove("show");
  }

  addBtn.addEventListener("click", () => {
    const name = habitInput.value.trim();
    if (!name) return;

    const reminderEnabled = dailyAlarmInput?.checked || false;
    const reminderTime =
      timeOfDayInput.value || (reminderEnabled ? "08:00" : "");

    const habit = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name,
      icon: selectedEmoji,
      color: selectedColor,
      timesPerWeek: parseInt(timesPerWeekInput.value) || 1,
      timeOfDay: reminderTime,
      timeSlots: [...selectedTimeSlots],
      reminderEnabled,
      streak: 0,
      strength: 0,
      checksThisPeriod: 0,
      currentPeriodStart: new Date().toDateString(),
      doneToday: false,
      lastDoneDate: null,
    };
    habits.push(habit);
    saveHabits();
    renderHabits();
    renderStats();
    syncReminders();
    resetAddHabitModal();
  });

  syncReminders();

  cancelBtn.addEventListener("click", resetAddHabitModal);

  habitInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
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
    document.getElementById("import-file").click(),
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

// Achievements System
const achievements = [
  {
    id: "first-habit",
    icon: "🌱",
    name: "Getting Started",
    desc: "Add your first habit",
    check: () => habits.length >= 1,
  },
  {
    id: "week-warrior",
    icon: "⚡",
    name: "Week Warrior",
    desc: "7-day streak",
    check: () => habits.some((h) => h.streak >= 7),
  },
  {
    id: "legend",
    icon: "👑",
    name: "Legend",
    desc: "30-day streak",
    check: () => habits.some((h) => h.streak >= 30),
  },
  {
    id: "habit-master",
    icon: "🎯",
    name: "Habit Master",
    desc: "5 active habits",
    check: () => habits.length >= 5,
  },
  {
    id: "consistency",
    icon: "📈",
    name: "Consistency Pro",
    desc: "All habits 100% complete",
    check: () =>
      habits.length > 0 &&
      habits.every((h) => {
        const timesPerWeek = h.timesPerWeek || 1;
        return h.checksThisPeriod >= timesPerWeek;
      }),
  },
  {
    id: "century",
    icon: "💎",
    name: "Century Club",
    desc: "100-day streak",
    check: () => habits.some((h) => h.streak >= 100),
  },
  {
    id: "daily-streak",
    icon: "🔥",
    name: "On Fire",
    desc: "All habits completed today",
    check: () => habits.length > 0 && habits.every((h) => h.doneToday),
  },
];

const weeklyAchievementIds = new Set(["consistency", "daily-streak"]);

function getWeekKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function loadAchievementsState() {
  const stored = JSON.parse(localStorage.getItem("achievements")) || null;
  if (Array.isArray(stored)) {
    return {
      lifetime: stored,
      weekly: { weekKey: getWeekKey(), unlocked: [] },
    };
  }

  return (
    stored || {
      lifetime: [],
      weekly: { weekKey: getWeekKey(), unlocked: [] },
    }
  );
}

function saveAchievementsState(state) {
  localStorage.setItem("achievements", JSON.stringify(state));
}

function checkAchievements() {
  const state = loadAchievementsState();
  const currentWeekKey = getWeekKey();
  if (state.weekly.weekKey !== currentWeekKey) {
    state.weekly = { weekKey: currentWeekKey, unlocked: [] };
  }

  const newUnlocks = [];

  achievements.forEach((achievement) => {
    const isWeekly = weeklyAchievementIds.has(achievement.id);
    const unlockedList = isWeekly ? state.weekly.unlocked : state.lifetime;
    if (!unlockedList.includes(achievement.id) && achievement.check()) {
      unlockedList.push(achievement.id);
      newUnlocks.push(achievement);
    }
  });

  if (newUnlocks.length > 0) {
    saveAchievementsState(state);
    showAchievementNotification(newUnlocks);
  }

  return { lifetime: state.lifetime, weekly: state.weekly.unlocked };
}

function showAchievementNotification(newUnlocks) {
  newUnlocks.forEach((achievement, idx) => {
    setTimeout(() => {
      const notif = document.createElement("div");
      notif.className = "achievement-notification";
      notif.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 8px;">${achievement.icon}</div>
        <div style="font-weight: bold; margin-bottom: 4px;">Achievement Unlocked!</div>
        <div style="font-size: 14px;">${achievement.name}</div>
      `;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    }, idx * 400);
  });
}

function renderAchievements() {
  const state = loadAchievementsState();
  const unlockedIds = new Set([...state.lifetime, ...state.weekly.unlocked]);
  const grid = document.getElementById("achievements-grid");
  grid.innerHTML = "";

  achievements.forEach((achievement) => {
    const btn = document.createElement("div");
    btn.className = `achievement ${unlockedIds.has(achievement.id) ? "unlocked" : ""}`;
    btn.title = achievement.desc;
    btn.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.desc}</div>
    `;
    grid.appendChild(btn);
  });
}

// Initial render
renderHabits();
renderStats();
renderAchievements();
checkAchievements();
