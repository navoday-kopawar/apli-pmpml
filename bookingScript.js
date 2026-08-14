/* ---------------- DATE & TIME ONLY ---------------- */

function updateDateTime() {
  const d = new Date();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12 || 12;

  document.getElementById("ticketDate").innerText =
    `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} | ${h}:${m} ${ampm}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

const AppState = {
  mode: "FARE",
  startIndex: null,
  endIndex: null,
  baseFare: 10,
  full: 1,
  half: 0,
};

/* ---------------- DOM REFERENCES ---------------- */

const routeInput = document.getElementById("routeInput");
const routeDisplay = document.getElementById("routeDisplay");
const routeNumber = document.getElementById("routeNumber");
const routeDirection = document.getElementById("routeDirection");
const editRoute = document.getElementById("editRoute");

const startInput = document.getElementById("startInput");
const endInput = document.getElementById("endInput");

const startDisplay = document.getElementById("startDisplay");
const endDisplay = document.getElementById("endDisplay");

const startText = document.getElementById("startText");
const endText = document.getElementById("endText");

const editStart = document.getElementById("editStart");
const editEnd = document.getElementById("editEnd");

const startDropdown = document.getElementById("startDropdown");
const endDropdown = document.getElementById("endDropdown");

const payBtn = document.getElementById("payBtn");
const toggleButtons = document.querySelectorAll("#toggleSection button");
const priceChips = document.querySelectorAll(".price-chip");
const chipsContainer = document.getElementById("priceChips");

const fullFareText = document.getElementById("fullFare");
const halfFareText = document.getElementById("halfFare");

/* ---------------- COUNTDOWN TIMER ---------------- */

const timerElement = document.getElementById("timer");

// 5 minutes in seconds
let totalSeconds = 5 * 60;

const countdown = setInterval(() => {
  if (totalSeconds <= 0) {
    clearInterval(countdown);
    timerElement.innerText = "00:00";

    showToast("Session Expired", true);

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

    return; // <-- IMPORTANT
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  timerElement.innerText =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

  totalSeconds--;
}, 1000);

/* ---------------- STOPS ---------------- */

const STOPS = [
  { code: "S1", name: "Kothrud Depot" },
  { code: "S2", name: "Bharati Nagar" },
  { code: "S3", name: "Kachara Depot Kothrud" },
  { code: "S4", name: "Vanaj Company" },
  { code: "S5", name: "Vanaj Corner" },
  { code: "S6", name: "Pratik Nagar" },
  { code: "S7", name: "Jai Bhavani Nagar" },
  { code: "S8", name: "Anand Nagar Kothrud" },
  { code: "S9", name: "Ideal Colony" },
  { code: "S10", name: "More Vidyalay" },
  { code: "S11", name: "Paud Phata Paud Road" },
  { code: "S12", name: "Sndt College" },
  { code: "S13", name: "Nal Stop" },
  { code: "S14", name: "Sonal Hall" },
  { code: "S15", name: "Garware College" },
  { code: "S16", name: "Deccan Corner" },
  { code: "S17", name: "Goodluck Chowk" },
];

/* ---------------- STATE CONTROLLER ---------------- */

function setState(state) {
  // Hide everything first
  routeInput.style.display = "none";
  routeDisplay.style.display = "none";

  startInput.style.display = "none";
  startDisplay.style.display = "none";

  endInput.style.display = "none";
  endDisplay.style.display = "none";

  // Disable fare by default
  disableToggleButtons();
  chipsContainer.style.display = "none";
  fullFareText.style.display = "none";
  halfFareText.style.display = "none";
  payBtn.disabled = true;

  if (state === "ROUTE") {
    routeInput.style.display = "block";
  }

  if (state === "START") {
    routeDisplay.style.display = "flex";
    startInput.style.display = "block";
  }

  if (state === "END") {
    routeDisplay.style.display = "flex";
    startDisplay.style.display = "flex";
    endInput.style.display = "block";
  }

  if (state === "COMPLETE") {
    routeDisplay.style.display = "flex";
    startDisplay.style.display = "flex";
    endDisplay.style.display = "flex";

    enableToggleButtons();
    chipsContainer.style.display = "flex";
    fullFareText.style.display = "inline";
    halfFareText.style.display = "inline";
    payBtn.disabled = false;
  }
}

/* ---------------- INITIAL ---------------- */

setState("ROUTE");
updateFareDisplay();
updatePayButton();

/* ---------------- ROUTE (LIVE DETECTION) ---------------- */

/* ---------------- ROUTE COMPLETE ---------------- */

routeInput.addEventListener("blur", () => {
  if (!routeInput.value.trim()) return;

  routeNumber.innerText = routeInput.value;
  routeDirection.innerText = "towards Destination";

  setState("START");
});

/* Allow Enter key to move forward */
routeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    routeInput.blur();
  }
});

/* ---------------- START STOP ---------------- */

startInput.addEventListener("input", renderStartStops);
startInput.addEventListener("focus", renderStartStops);

function renderStartStops() {
  const value = startInput.value.toLowerCase();
  startDropdown.innerHTML = "";

  STOPS.filter((s) => s.name.toLowerCase().includes(value)).forEach(
    (stop, index) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.innerHTML = `<div>${stop.code}</div><div>${stop.name}</div>`;

      item.onclick = () => {
        AppState.startIndex = index;
        startText.innerText = stop.name;

        startDropdown.style.display = "none";
        setState("END");
      };

      startDropdown.appendChild(item);
    },
  );

  startDropdown.style.display = "block";
}

/* ---------------- END STOP ---------------- */

endInput.addEventListener("input", renderEndStops);
endInput.addEventListener("focus", renderEndStops);

function renderEndStops() {
  if (AppState.startIndex === null) return;

  const value = endInput.value.toLowerCase();
  endDropdown.innerHTML = "";

  STOPS.slice(AppState.startIndex + 1)
    .filter((s) => s.name.toLowerCase().includes(value))
    .forEach((stop) => {
      const index = STOPS.findIndex((x) => x.code === stop.code);

      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.innerHTML = `<div>${stop.code}</div><div>${stop.name}</div>`;

      item.onclick = () => {
        AppState.endIndex = index;
        endText.innerText = stop.name;

        selectDefaultChip();
        updateFareDisplay();
        updatePayButton();

        endDropdown.style.display = "none";
        setState("COMPLETE");
      };

      endDropdown.appendChild(item);
    });

  endDropdown.style.display = "block";
}

/* ---------------- EDIT LOGIC ---------------- */

editRoute.onclick = () => {
  AppState.startIndex = null;
  AppState.endIndex = null;

  startInput.value = "";
  endInput.value = "";

  setState("ROUTE");
};

editStart.onclick = () => {
  AppState.startIndex = null;
  AppState.endIndex = null;
  endInput.value = "";

  setState("START");
};

editEnd.onclick = () => {
  AppState.endIndex = null;
  setState("END");
};

/* ---------------- FARE LOGIC (UNCHANGED) ---------------- */

function disableToggleButtons() {
  toggleButtons.forEach((btn) => (btn.style.pointerEvents = "none"));
}

function enableToggleButtons() {
  toggleButtons.forEach((btn) => (btn.style.pointerEvents = "auto"));
}

toggleButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    toggleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    if (index === 0) {
      AppState.mode = "FARE";
      chipsContainer.style.display = "flex";
    } else {
      AppState.mode = "STOP";
      chipsContainer.style.display = "none";
      clearChipSelection();
      AppState.baseFare = 10;
      updateFareDisplay();
    }

    updatePayButton();
  });
});

priceChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    if (AppState.mode !== "FARE") return;

    clearChipSelection();
    chip.classList.add("selected");

    AppState.baseFare = parseInt(chip.dataset.price);
    updateFareDisplay();
    updatePayButton();
  });
});

function clearChipSelection() {
  priceChips.forEach((c) => c.classList.remove("selected"));
}

function selectDefaultChip() {
  clearChipSelection();
  priceChips.forEach((chip) => {
    if (chip.dataset.price == "10") {
      chip.classList.add("selected");
    }
  });
}

function change(type, delta) {
  let val = AppState[type];

  if (delta === 1 && val >= 5) {
    return showToast(
      type === "half"
        ? "Maximum Child ticket reached"
        : "Maximum Adult ticket reached",
    );
  }

  if (delta === -1 && val <= 0) {
    return showToast(type === "half" ? "Child count is 0" : "Adult count is 0");
  }

  AppState[type] += delta;
  document.getElementById(type).innerText = AppState[type];

  updatePayButton();
}

function updateFareDisplay() {
  const fullFare = AppState.baseFare;
  const halfFare = AppState.baseFare / 2;

  fullFareText.innerText = `₹${fullFare}.0`;
  halfFareText.innerText = `₹${halfFare}.0`;
}

function updatePayButton() {
  if (AppState.startIndex === null || AppState.endIndex === null) {
    payBtn.innerText = "Pay";
    payBtn.disabled = true;
    return;
  }

  const total =
    AppState.full * AppState.baseFare + AppState.half * (AppState.baseFare / 2);

  payBtn.innerText = `Pay ₹${total}.0`;
  payBtn.disabled = false;
}

payBtn.addEventListener("click", () => {
  if (AppState.startIndex === null || AppState.endIndex === null) {
    showToast("Select both stops");
    return;
  }

  showToast("Payment processing...");
});

/* ---------------- TOAST ---------------- */

function showToast(msg, isSession = false) {
  const t = document.getElementById("toast");

  t.innerHTML = `
    <div class="toast-content">
      <img src="./assets/PMPML-LOGO.png" class="toast-logo">
      <span>
        ${msg}
      </span>
    </div>
  `;

  t.classList.add("show");

  clearTimeout(t.timeout);

  t.timeout = setTimeout(
    () => {
      t.classList.remove("show");
    },
    isSession ? 2000 : 2200,
  );
}
/* ---------------- CLOSE DROPDOWN ---------------- */

document.addEventListener("click", (e) => {
  if (!startInput.parentElement.contains(e.target))
    startDropdown.style.display = "none";

  if (!endInput.parentElement.contains(e.target))
    endDropdown.style.display = "none";
});
