const STORAGE_KEY = "reminders";

// Load the array from Local Storage
function loadReminders() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

// Save the array back to Local Storage
function saveReminders(reminders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

const form = document.getElementById("reminderForm");
const activityInput = document.getElementById("activity");
const prayerSelect = document.getElementById("prayer");
const formMessage = document.getElementById("formMessage");
const saveBtn = form.querySelector("button[type=submit]");
const list = document.getElementById("reminderList");

// null = adding a new reminder, a number = editing the reminder with that id
let editingId = null;

// CREATE + UPDATE: runs when the form is submitted
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const activity = activityInput.value.trim();
  if (activity === "") {
    formMessage.textContent = "Please type an activity.";
    return;
  }

  const reminders = loadReminders();

  if (editingId === null) {
    // CREATE
    reminders.push({ id: Date.now(), activity: activity, prayer: prayerSelect.value });
    formMessage.textContent = "Reminder saved!";
  } else {
    // UPDATE
    const r = reminders.find(r => r.id === editingId);
    if (r) {
      r.activity = activity;
      r.prayer = prayerSelect.value;
    }
    formMessage.textContent = "Reminder updated!";
    editingId = null;
    saveBtn.textContent = "Save";
  }

  saveReminders(reminders);
  form.reset();
  showReminders();
});

// READ: show all saved reminders on the page
function showReminders() {
  const reminders = loadReminders();
  list.innerHTML = "";

  if (reminders.length === 0) {
    list.innerHTML = "<li>No reminders yet</li>";
    return;
  }

  for (const r of reminders) {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = r.activity + " (after " + r.prayer + ")";
    li.appendChild(text);

    const buttons = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      startEdit(r);
    });
    buttons.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      deleteReminder(r.id);
    });
    buttons.appendChild(delBtn);

    li.appendChild(buttons);
    list.appendChild(li);
  }
}

// UPDATE (step 1): put the reminder's values back in the form
function startEdit(r) {
  activityInput.value = r.activity;
  prayerSelect.value = r.prayer;
  editingId = r.id;
  saveBtn.textContent = "Update";
  formMessage.textContent = "Editing reminder - change it and click Update.";
  activityInput.focus();
}

// DELETE: remove one reminder by its id
function deleteReminder(id) {
  if (!confirm("Delete this reminder?")) {
    return;
  }
  const reminders = loadReminders();
  const kept = reminders.filter(r => r.id !== id);
  saveReminders(kept);
  showReminders();
  formMessage.textContent = "Reminder deleted.";
}

// show the list when the page opens
showReminders();