import { renderMarket } from "./marketplace.js";

const SERVICE_KEYWORDS = {
  riders: ["motari", "moto", "rider", "shaka motari"],
  driverMode: ["map", "gps", "aho ndi", "inzira", "meter", "dereva"],
  payment: ["kwishyura", "amafaranga", "payment", "money"],
  trips: ["ingendo", "trip", "urugendo"],
  delivery: ["delivery", "kohereza ibintu"],
  market: ["marketplace", "gura", "gurisha", "igicuruzwa", "ubucuruzi", "business"],
  motorcycles: ["amamoto", "moto igurishwa", "motorcycle"],
  notifications: ["notification", "ubutumwa"],
  settings: ["settings", "igenamiterere"]
};

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setupGlobalSearch() {
  const input = document.getElementById("globalSearch");
  if (!input) return;

  input.addEventListener("input", debounce(() => {
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    const match = Object.entries(SERVICE_KEYWORDS).find(([, keywords]) =>
      keywords.some(k => k.includes(q) || q.includes(k))
    );

    if (match) {
      window.openPage(match[0]);
    }
  }));
}

function setupMarketSearch() {
  const input = document.getElementById("marketSearch");
  if (!input) return;
  input.addEventListener("input", debounce(() => renderMarket(input.value.trim())));
}

export function setupInputs() {
  setupGlobalSearch();
  setupMarketSearch();
}
