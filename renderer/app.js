//   Open-Meteo Geocoding (https://open-meteo.com/en/docs/geocoding-api) - turns a place name into latitude/longitude
//   Waktu Solat API (https://api.waktusolat.app) - finds the JAKIM zone (e.g. WLY01) from latitude/longitude
//   JAKIM e-Solat (https://www.e-solat.gov.my) - the official Malaysian prayer times for that zone

// Malay name, Arabic name and card colour for each prayer
const prayers = [
  { key: "Fajr", malay: "Subuh", arabic: "الصبح", color: "subuh" },
  { key: "Sunrise", malay: "Syuruk", arabic: "الشروق", color: "syuruk" },
  { key: "Dhuhr", malay: "Zohor", arabic: "الظهر", color: "zohor" },
  { key: "Asr", malay: "Asar", arabic: "العصر", color: "asar" },
  { key: "Maghrib", malay: "Maghrib", arabic: "المغرب", color: "maghrib" },
  { key: "Isha", malay: "Isyak", arabic: "العشاء", color: "isyak" }
];

const hijriMonths = ["Muharram", "Safar", "Rabiulawal", "Rabiulakhir", "Jamadilawal", "Jamadilakhir",
  "Rejab", "Syaaban", "Ramadan", "Syawal", "Zulkaedah", "Zulhijjah"];



const activities = {
  // after midnight, before Subuh
  beforeSubuh: [
    "Wake up for Qiyamullail (Tahajjud prayer)",
    "Make istighfar and du'a before Subuh",
    "Eat sahur if you are fasting"
  ],
  // Subuh until Syuruk
  subuh: [
    "Pray Subuh in congregation if you can",
    "Read Al-Ma'thurat (morning zikir)",
    "Read Surah Yasin"
  ],
  // after Syuruk, before Zohor
  dhuha: [
    "Pray Solat Dhuha (from about 15 minutes after Syuruk)",
    "Read a page of the Quran before starting work",
    "Give some sadaqah (charity) today"
  ],
  // Zohor until Asar
  zohor: [
    "Pray Zohor and the sunnah prayers before and after",
    "Take a short qailulah (midday nap)",
    "Read a short tafsir or hadith"
  ],
  // Asar until Maghrib
  asar: [
    "Pray Asar on time",
    "Read Al-Ma'thurat (evening zikir)",
    "Prepare to break your fast if you are fasting"
  ],
  // Maghrib until Isyak
  maghrib: [
    "Read the Quran between Maghrib and Isyak",
    "Pray the 2 rakaat sunnah after Maghrib",
    "Learn a new du'a with your family"
  ],
  // after Isyak, before midnight
  isyak: [
    "Pray Witir before sleeping",
    "Read Surah Al-Mulk before sleeping",
    "Make wudhu and recite the du'a before sleep"
  ],
  // extra ones for special days
  thursdayNight: [
    "It is Malam Jumaat: read Surah Yasin",
    "Send selawat to the Prophet (peace be upon him)"
  ],
  friday: [
    "Read Surah Al-Kahf today",
    "Go early to the mosque for Solat Jumaat (men)"
  ],
  // within 15 minutes before a prayer
  getReady: [
    "Prayer time is near: take your wudhu",
    "Stop what you are doing and get ready to pray"
  ]
};

// Fallback when no rule matches
const defaultActivity = "Keep remembering Allah with zikir: SubhanAllah, Alhamdulillah, Allahu Akbar";

const picker = document.getElementById("picker");
const searchForm = document.getElementById("searchForm");
const searchBox = document.getElementById("searchBox");
const searchStatus = document.getElementById("searchStatus");
const closePicker = document.getElementById("closePicker");
const locationBtn = document.getElementById("locationBtn");
const locationName = document.getElementById("locationName");
const message = document.getElementById("message");
const cards = document.getElementById("cards");


const cityTimezone = "Asia/Kuala_Lumpur";

// Session Storage key for the chosen place.
// Session Storage is kept while the app is open (so going to Reminders and back
// keeps the place), but is cleared when the app closes, so every new
// "npm start" asks for the location again.
const LOCATION_KEY = "lastLocation";

// Today's prayer times, saved so the clock can update the countdown (Task 4)
let todayTimings = null;

// ---------- Location search ----------


const savedPlace = sessionStorage.getItem(LOCATION_KEY);
if (savedPlace) {
  showPlace(JSON.parse(savedPlace));
} else {
  searchBox.focus();
}

function showPlace(place) {
  picker.classList.add("hidden");
  locationName.textContent = place.name;
  getPrayerTimes(place);
}

// Search when the user presses Enter or clicks Search
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = searchBox.value.trim();
  if (text.length < 2) {
    setStatus("Please type at least 2 letters.", true);
    return;
  }

  setStatus("Searching...", false);
  const url = "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&countryCode=MY&name=" +
    encodeURIComponent(text);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Server replied with status " + response.status);
    }
    const json = await response.json();

    if (!json.results || json.results.length === 0) {
      setStatus("No place called \"" + text + "\" found in Malaysia. Check the spelling.", true);
      return;
    }

    const place = json.results[0]; // best match
    setStatus("", false);

    // remember this place until the app is closed
    sessionStorage.setItem(LOCATION_KEY, JSON.stringify({
      name: place.name, latitude: place.latitude, longitude: place.longitude
    }));
    showPlace(place);
  } catch (err) {
    setStatus("Search failed. Check your internet and try again.", true);
    console.log(err);
  }
});

function setStatus(text, isError) {
  searchStatus.textContent = text;
  searchStatus.classList.toggle("error", isError);
}

// Open the picker again to change location
locationBtn.addEventListener("click", () => {
  closePicker.hidden = false;
  picker.classList.remove("hidden");
  searchBox.select();
  searchBox.focus();
});

closePicker.addEventListener("click", () => {
  picker.classList.add("hidden");
});

// ---------- Get prayer times from the APIs ----------

async function getPrayerTimes(place) {
  message.textContent = "Loading prayer times for " + place.name + "...";
  message.hidden = false;
  cards.innerHTML = "";

  try {
    // 1. find the JAKIM zone for this place
    const zoneResponse = await fetch("https://api.waktusolat.app/zones/" + place.latitude + "/" + place.longitude);
    if (!zoneResponse.ok) {
      throw new Error("Zone lookup replied with status " + zoneResponse.status);
    }
    const zoneInfo = await zoneResponse.json(); // e.g. { zone: "WLY01", district: "W.P. Kuala Lumpur" }

    // 2. get today's official times for that zone
    const response = await fetch("https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=" + zoneInfo.zone);
    if (!response.ok) {
      throw new Error("e-Solat replied with status " + response.status);
    }
    const json = await response.json();
    const day = json.prayerTime[0]; // e.g. { fajr: "05:48:00", syuruk: "06:56:00", hijri: "1448-05-25", ... }

    // keep only "HH:MM"
    const timings = {
      Fajr: day.fajr.slice(0, 5),
      Sunrise: day.syuruk.slice(0, 5),
      Dhuhr: day.dhuhr.slice(0, 5),
      Asr: day.asr.slice(0, 5),
      Maghrib: day.maghrib.slice(0, 5),
      Isha: day.isha.slice(0, 5)
    };

    showTimes(timings);

    // "1448-05-25" -> "25 Jamadilawal 1448H"
    const hijri = day.hijri.split("-");
    document.getElementById("hijriDate").textContent =
      "☾ " + Number(hijri[2]) + " " + hijriMonths[Number(hijri[1]) - 1] + " " + hijri[0] + "H";
    document.getElementById("gregDate").textContent = day.day + ", " + day.date.replaceAll("-", " ");
    document.getElementById("methodName").textContent = "zone " + zoneInfo.zone + " (" + zoneInfo.district + ")";
    message.hidden = true;

    showSuggestion(timings);
    todayTimings = timings;   // Task 4
    showCountdown(timings);
  } catch (err) {
    message.textContent = "Could not get prayer times. Check your internet and try again.";
    console.log(err);
  }
}

function showTimes(timings) {
  for (const p of prayers) {
    const time = to12Hour(timings[p.key]);
    const card = document.createElement("div");
    card.className = "card " + p.color;
    card.innerHTML =
      "<div><span class='card-name'>" + p.malay + "</span> <span class='arabic'>" + p.arabic + "</span></div>" +
      "<div><span class='card-time'>" + time.clock + "</span> <span class='card-period'>" + time.period + "</span></div>";
    cards.appendChild(card);
  }
}

// "13:05" -> { clock: "1:05", period: "tgh" }
function to12Hour(hhmm) {
  const parts = hhmm.split(":");
  const h = Number(parts[0]);
  let period = "pagi";
  if (h >= 12 && h < 14) period = "tgh";
  else if (h >= 14 && h < 19) period = "ptg";
  else if (h >= 19) period = "mlm";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { clock: h12 + ":" + parts[1], period: period };
}

// ---------- Live clock ----------

// Current time in the chosen place, e.g. { hours: 14, minutes: 5, seconds: 9 }
function cityNow() {
  const text = new Date().toLocaleTimeString("en-GB", { timeZone: cityTimezone, hour12: false });
  const parts = text.split(":");
  return { hours: Number(parts[0]) % 24, minutes: Number(parts[1]), seconds: Number(parts[2]) };
}

function updateClock() {
  const now = cityNow();
  const t = to12Hour(now.hours + ":" + String(now.minutes).padStart(2, "0"));
  document.getElementById("clockMain").textContent = t.clock;
  document.getElementById("clockSec").textContent = ":" + String(now.seconds).padStart(2, "0");
  document.getElementById("clockPeriod").textContent = t.period;

  // Task 4: refresh the countdown every second
  if (todayTimings) {
    showCountdown(todayTimings);
  }
}
updateClock();
setInterval(updateClock, 1000);

// "13:05" -> 785 (minutes since midnight)
function toMinutes(hhmm) {
  const parts = hhmm.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

// Task 3
function showSuggestion(timings) {
  const now = cityNow();
  const nowMins = now.hours * 60 + now.minutes;

  const subuhMins = toMinutes(timings.Fajr);
  const syurukMins = toMinutes(timings.Sunrise);
  const zohorMins = toMinutes(timings.Dhuhr);
  const asarMins = toMinutes(timings.Asr);
  const maghribMins = toMinutes(timings.Maghrib);
  const isyakMins = toMinutes(timings.Isha);

  let group = null;

  if (nowMins < subuhMins) {
    group = activities.beforeSubuh;
  } else if (nowMins < syurukMins) {
    group = activities.subuh;
  } else if (nowMins < zohorMins) {
    group = activities.dhuha;
  } else if (nowMins < asarMins) {
    group = activities.zohor;
  } else if (nowMins < maghribMins) {
    group = activities.asar;
  } else if (nowMins < isyakMins) {
    group = activities.maghrib;
  } else {
    group = activities.isyak;
  }

  // show every activity in the group, one per line, or the fallback
  const suggestion = document.getElementById("suggestion");
  if (group) {
    suggestion.textContent = "• " + group.join("\n• ");
  } else {
    suggestion.textContent = defaultActivity;
  }

  // save the suggestion in Local Storage (Task 5)
  localStorage.setItem("lastSuggestion", suggestion.textContent);
}


//Task 4:

function showCountdown(timings) {
  const now = cityNow();
  const nowMins = now.hours * 60 + now.minutes;

  const list = [
    { name: "Subuh", mins: toMinutes(timings.Fajr) },
    { name: "Zohor", mins: toMinutes(timings.Dhuhr) },
    { name: "Asar", mins: toMinutes(timings.Asr) },
    { name: "Maghrib", mins: toMinutes(timings.Maghrib) },
    { name: "Isyak", mins: toMinutes(timings.Isha) }
  ];

  // find the first prayer that has not started yet
  let next = null;
  for (const p of list) {
    if (p.mins > nowMins) {
      next = p;
      break;
    }
  }

  // after Isyak: the next prayer is Subuh tomorrow (add 24 hours = 1440 minutes)
  if (next === null) {
    next = { name: "Subuh", mins: list[0].mins + 24 * 60 };
  }

  const diff = next.mins - nowMins;     // minutes left
  const hours = Math.floor(diff / 60);  // whole hours
  const minutes = diff % 60;            // minutes left over

  document.getElementById("countdown").textContent =
    next.name + " in " + hours + " hour(s) " + minutes + " minute(s)";
}