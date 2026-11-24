import { formatClock, formatDate, formatDuration, formatClassTime } from "./modules/time.js";
import { createDefaultSchedule, loadSchedule, saveSchedule, getNextClass, renderSchedule, scheduleReminders } from "./modules/schedule.js";

const scheduleList = document.getElementById("scheduleList");
const toast = document.getElementById("toast");
let classes = loadSchedule();
if (classes.length === 0) classes = createDefaultSchedule();

function showToast(message) {
    toast.textContent = message;
    window.setTimeout(() => {
        if (toast.textContent === message) toast.textContent = "";
    }, 6000);
}

function updateClockAndCountdown() {
    const now = new Date();
    document.getElementById("clock").textContent = formatClock(now);
    document.getElementById("today").textContent = formatDate(now);
    const next = getNextClass(classes, now.getTime());

    if (!next) {
        document.getElementById("nextName").textContent = "No Upcoming Classes";
        document.getElementById("nextTime").textContent = "All classes are completed.";
        document.getElementById("dayStatus").textContent = "ALL DONE";
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";
        document.getElementById("countdownNote").textContent = "Add a class to start a new countdown.";
        return;
    }

    const remaining = Math.max(0, Math.floor((new Date(next.startsAt).getTime() - now.getTime()) / 1000));
    const duration = formatDuration(remaining);
    document.getElementById("nextName").textContent = next.subject;
    document.getElementById("nextTime").textContent = `Starts ${formatClassTime(new Date(next.startsAt))}`;
    document.getElementById("dayStatus").textContent = "UP NEXT";
    document.getElementById("hours").textContent = duration.hours;
    document.getElementById("minutes").textContent = duration.minutes;
    document.getElementById("seconds").textContent = duration.seconds;
    document.getElementById("countdownNote").textContent = "Scheduled reminder will appear one minute before class.";
}

function updateScheduleView() {
    saveSchedule(classes);
    renderSchedule(classes, scheduleList, Date.now());
    const complete = classes.filter((item) => new Date(item.startsAt).getTime() <= Date.now()).length;
    document.getElementById("scheduleCounts").textContent = `${classes.length} total · ${classes.length - complete} remaining · ${complete} completed`;
}

function updateView() {
    updateScheduleView();
    updateClockAndCountdown();
}

function resetReminders() {
    scheduleReminders(classes, (item) => showToast(`Class starts in one minute: ${item.subject}`));
}

document.getElementById("classForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const subject = document.getElementById("subject").value.trim();
    const startsAt = new Date(document.getElementById("classTime").value);
    if (!subject || Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
        showToast("Choose a class name and a future date and time.");
        return;
    }
    classes.push({ id: crypto.randomUUID(), subject, startsAt: startsAt.toISOString() });
    event.currentTarget.reset();
    updateView();
    resetReminders();
    showToast(`${subject} added to your schedule.`);
});

document.getElementById("quickDemo").addEventListener("click", () => {
    const start = new Date(Date.now() + 60_000);
    classes.push({ id: crypto.randomUUID(), subject: "Quick Demo Class", startsAt: start.toISOString() });
    updateView();
    resetReminders();
    showToast("Quick demo class added for one minute from now.");
});

document.getElementById("resetSchedule").addEventListener("click", () => {
    classes = createDefaultSchedule();
    updateView();
    resetReminders();
    showToast("Timetable reset with upcoming sample classes.");
});

scheduleList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove]");
    if (!button) return;
    classes = classes.filter((item) => item.id !== button.dataset.remove);
    updateView();
    resetReminders();
    showToast("Class removed from your schedule.");
});

updateView();
resetReminders();
window.setInterval(updateClockAndCountdown, 1000);
window.setInterval(updateScheduleView, 15_000);
