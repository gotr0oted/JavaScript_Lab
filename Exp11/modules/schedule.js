const STORAGE_KEY = "jslab-exp11-schedule";
let reminderTimers = [];

export function createDefaultSchedule() {
    const now = Date.now();
    const examples = [
        ["JavaScript & Web Tech", 15],
        ["Computer Networks", 55],
        ["Machine Learning", 125],
        ["Compiler Construction", 185]
    ];
    return examples.map(([subject, minutes]) => ({
        id: crypto.randomUUID(),
        subject,
        startsAt: new Date(now + minutes * 60_000).toISOString()
    }));
}

export function loadSchedule() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter((item) => item && item.id && item.subject && item.startsAt) : [];
    } catch {
        return [];
    }
}

export function saveSchedule(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getNextClass(items, now = Date.now()) {
    return items
        .filter((item) => new Date(item.startsAt).getTime() > now)
        .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
}

export function renderSchedule(items, list, now = Date.now()) {
    list.replaceChildren();
    if (items.length === 0) {
        const empty = document.createElement("li");
        empty.className = "class-item";
        empty.textContent = "No classes scheduled. Add a class above to get started.";
        list.append(empty);
        return;
    }

    [...items].sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt)).forEach((item) => {
        const completed = new Date(item.startsAt).getTime() <= now;
        const row = document.createElement("li");
        row.className = "class-item";
        const info = document.createElement("div");
        const name = document.createElement("span");
        name.className = "class-name";
        name.textContent = item.subject;
        const time = document.createElement("span");
        time.className = "class-time";
        time.textContent = new Date(item.startsAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
        info.append(name, time);
        const actions = document.createElement("div");
        actions.className = "actions";
        const badge = document.createElement("span");
        badge.className = `badge${completed ? "" : " upcoming"}`;
        badge.textContent = completed ? "✓ Completed" : "Upcoming";
        const remove = document.createElement("button");
        remove.className = "danger";
        remove.type = "button";
        remove.dataset.remove = item.id;
        remove.setAttribute("aria-label", `Remove ${item.subject}`);
        remove.textContent = "×";
        actions.append(badge, remove);
        row.append(info, actions);
        list.append(row);
    });
}

export function scheduleReminders(items, onReminder) {
    reminderTimers.forEach(window.clearTimeout);
    reminderTimers = [];
    const now = Date.now();
    items.forEach((item) => {
        const delay = new Date(item.startsAt).getTime() - now - 60_000;
        if (delay >= 0 && delay <= 2_147_000_000) {
            reminderTimers.push(window.setTimeout(() => onReminder(item), delay));
        }
    });
}
