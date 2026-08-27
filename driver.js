import { DataStore, db, firebaseReady, getFirebaseModules } from "./firebase.js";
import { escapeHtml, formatRWF, emptyState } from "./render.js";
import { getFareTiers } from "./rides.js";
import { renderDriverDeliveries } from "./delivery.js";

/* =========================================================
   DRIVER MODE — Online/Offline, Moto Meter (GPS nyayo),
   Available Jobs (dispatch irinda amakimbirane hifashishijwe
   Firestore transaction: uwabanje kwemeza niwe uhabwa job).
   ========================================================= */

let watchId = null;
let tripPoints = [];
let tripStartTime = null;
let tripTimerInterval = null;
let activeTripId = null;

function toRad(v) { return (v * Math.PI) / 180; }
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isDriver() {
  return window.App.currentUser && window.App.currentUser.role === "driver";
}

/* =========================================================
   KWIYANDIKISHA NK'UMUMOTARI/DEREVA
   ========================================================= */

window.registerAsDriver = async function () {
  window.requireLogin(() => {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modalContent");
    content.innerHTML = `
      <h2>🏍️ Iyandikishe nk'Umumotari/Dereva</h2>
      <label>Amazina yawe (nk'uko agaragara ku bakoresha)</label>
      <input id="drvName" value="${escapeHtml(window.App.currentUser.fullName || "")}">
      <label>Telefone</label>
      <input id="drvPhone" placeholder="07XXXXXXXX">
      <label>Numero ya pulaki (plate)</label>
      <input id="drvPlate" placeholder="RAD 123 A">
      <label>Ubwoko</label>
      <select id="drvType"><option value="moto">🏍️ Moto</option><option value="car">🚗 Imodoka</option></select>
      <button class="primary" id="drvSubmitBtn">✅ Iyandikishe</button>
      <div id="drvStatus"></div>
    `;
    modal.classList.remove("hidden");

    document.getElementById("drvSubmitBtn").onclick = async () => {
      const statusEl = document.getElementById("drvStatus");
      const name = document.getElementById("drvName").value.trim();
      const phone = document.getElementById("drvPhone").value.trim();
      const plate = document.getElementById("drvPlate").value.trim();
      const vehicleType = document.getElementById("drvType").value;

      if (!name || !phone || !plate) {
        statusEl.innerHTML = `<div class="notice error">Uzuza amazina, telefone, na plate.</div>`;
        return;
      }

      await DataStore.setDoc("riders", window.App.currentUser.uid, {
        fullName: name, phone, plate, vehicleType,
        isVerified: false, isAdmin: false, online: false
      });
      await DataStore.setDoc("users", window.App.currentUser.uid, { role: "driver" });
      window.App.currentUser.role = "driver";

      statusEl.innerHTML = `<div class="notice success">✅ Wiyandikishije nk'umumotari/dereva. Owner agomba kukwemeza (✅) mbere yuko abakiriya benshi bakwizera.</div>`;
      setTimeout(() => { window.closeModal(); window.openPage("driverMode"); }, 900);
    };
  });
};

/* =========================================================
   ONLINE / OFFLINE
   ========================================================= */

window.toggleDriverOnline = async function () {
  if (!isDriver()) return;
  const rider = await DataStore.getDoc("riders", window.App.currentUser.uid);
  const nextOnline = !(rider?.online);

  if (nextOnline && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      await DataStore.setDoc("riders", window.App.currentUser.uid, {
        online: true, lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: Date.now()
      });
      renderDriverMode();
    }, async () => {
      await DataStore.setDoc("riders", window.App.currentUser.uid, { online: true });
      renderDriverMode();
    });
  } else {
    await DataStore.setDoc("riders", window.App.currentUser.uid, { online: nextOnline });
    renderDriverMode();
  }
};

/* =========================================================
   MOTO METER — GPS nyayo, ntabwo dushushanya intera
   ========================================================= */

function startMeter() {
  if (!navigator.geolocation) {
    alert("Iyi terefone ntishoboye gukurikirana GPS.");
    return;
  }
  tripPoints = [];
  tripStartTime = Date.now();

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() };
      tripPoints.push(p);
      updateMeterDisplay();
    },
    err => {
      const statusEl = document.getElementById("meterStatus");
      if (statusEl) {
        const map = { 1: "Uruhushya rwa GPS rwanzwe.", 2: "GPS ntiboneka kuri ubu.", 3: "Byatinze gushaka aho uri (timeout)." };
        statusEl.innerHTML = `<div class="notice error">${map[err.code] || "Ikibazo cya GPS."}</div>`;
      }
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
  );

  tripTimerInterval = setInterval(updateMeterDisplay, 1000);
  updateMeterDisplay();
}

function computeTripDistanceKm() {
  let total = 0;
  for (let i = 1; i < tripPoints.length; i++) {
    total += haversineKm(tripPoints[i - 1].lat, tripPoints[i - 1].lng, tripPoints[i].lat, tripPoints[i].lng);
  }
  return total;
}

async function updateMeterDisplay() {
  const distEl = document.getElementById("meterDistance");
  const timeEl = document.getElementById("meterTime");
  const fareEl = document.getElementById("meterFare");
  if (!distEl) return;

  const km = computeTripDistanceKm();
  const elapsed = Math.floor((Date.now() - tripStartTime) / 1000);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  const tiers = await getFareTiers();
  const rider = await DataStore.getDoc("riders", window.App.currentUser.uid);
  const tier = tiers[rider?.vehicleType === "car" ? "car" : "moto"];
  const fare = Math.max(tier.minFare, Math.round((tier.baseFare + tier.perKm * km) / tier.roundTo) * tier.roundTo);

  distEl.textContent = km.toFixed(2) + " KM";
  timeEl.textContent = `${h}:${m}:${s}`;
  fareEl.textContent = formatRWF(fare);
}

window.startTrip = async function (tripId) {
  activeTripId = tripId || null;
  startMeter();
  document.getElementById("meterStartBtn").classList.add("hidden");
  document.getElementById("meterStopBtn").classList.remove("hidden");
  document.getElementById("meterStatus").innerHTML = `<div class="notice success">🟢 Urugendo rwatangiye — GPS irimo gukurikirana.</div>`;
};

window.stopTrip = async function () {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  clearInterval(tripTimerInterval);

  const km = computeTripDistanceKm();
  const tiers = await getFareTiers();
  const rider = await DataStore.getDoc("riders", window.App.currentUser.uid);
  const tier = tiers[rider?.vehicleType === "car" ? "car" : "moto"];
  const fare = Math.max(tier.minFare, Math.round((tier.baseFare + tier.perKm * km) / tier.roundTo) * tier.roundTo);

  if (activeTripId) {
    await DataStore.setDoc("trips", activeTripId, {
      status: "completed", distanceKm: Number(km.toFixed(2)), fare, completedAt: Date.now()
    });
  }

  document.getElementById("meterStartBtn").classList.remove("hidden");
  document.getElementById("meterStopBtn").classList.add("hidden");
  document.getElementById("meterStatus").innerHTML = `<div class="notice success">✅ Urugendo rurangiye — ${km.toFixed(2)} km, ${formatRWF(fare)}.</div>`;

  activeTripId = null;
  tripPoints = [];
  renderDriverMode();
};

/* =========================================================
   AVAILABLE JOBS — dispatch irinda amakimbirane
   =========================================================
   Firestore transaction: umumotari abasha kwifatira job
   ("pending" -> "accepted") gusa niba atarafatwa n'undi.
   Iyo babiri bahize kwemeza icyarimwe, uwabanje (transaction
   itsinda) niwe uyibona; undi ahabwa ubutumwa "yamaze gufatwa".
   ========================================================= */

window.acceptTripJob = async function (tripId) {
  if (!firebaseReady) {
    // Demo/local mode: nta transaction ya Firestore ihari, dukoresha
    // uburyo bworoshye (last-write-wins), buhagije kuri demo.
    const trip = await DataStore.getDoc("trips", tripId);
    if (!trip || trip.status !== "pending") {
      alert("Iyi job yamaze gufatwa n'undi mumotari.");
      return;
    }
    await DataStore.setDoc("trips", tripId, { status: "accepted", driverId: window.App.currentUser.uid });
    activeTripId = tripId;
    window.openPage("driverMode");
    await renderDriverMode(); // tegereza urupapuro rurangize kwiyubaka mbere yo gukoraho meter
    window.startTrip(tripId); // Kanda ACCEPT rimwe -> urugendo rutangira kubarwa ako kanya
    return;
  }

  const mods = getFirebaseModules();
  try {
    await mods.runTransaction(db, async tx => {
      const ref = mods.doc(db, "trips", tripId);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().status !== "pending") {
        throw new Error("already-taken");
      }
      tx.update(ref, { status: "accepted", driverId: window.App.currentUser.uid });
    });
    activeTripId = tripId;
    window.openPage("driverMode");
    await renderDriverMode(); // tegereza urupapuro rurangize kwiyubaka mbere yo gukoraho meter
    window.startTrip(tripId); // Kanda ACCEPT rimwe -> urugendo rutangira kubarwa ako kanya
  } catch (error) {
    if (error.message === "already-taken") {
      alert("Iyi job yamaze gufatwa n'undi mumotari.");
    } else {
      console.error(error);
      alert("Habaye ikibazo. Ongera ugerageze.");
    }
    renderDriverMode();
  }
};

/* =========================================================
   RENDER — Driver Mode page
   ========================================================= */

export async function renderDriverMode() {
  const el = document.getElementById("driverModeContent");
  if (!el) return;

  if (!window.App.currentUser) {
    el.innerHTML = `<div class="notice error">Banza winjire muri konti.</div>`;
    return;
  }

  if (!isDriver()) {
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div class="auth-logo">🏍️</div>
        <p>Ntabwo warigeze wiyandikisha nk'umumotari/dereva.</p>
        <button class="primary" onclick="window.registerAsDriver()">+ Iyandikishe nk'Umumotari/Dereva</button>
      </div>`;
    return;
  }

  const rider = await DataStore.getDoc("riders", window.App.currentUser.uid);
  const online = !!rider?.online;

  const myAcceptedTrip = (await DataStore.list("trips", { where: ["driverId", "==", window.App.currentUser.uid] }))
    .find(t => t.status === "accepted");

  const availableJobs = online
    ? (await DataStore.list("trips")).filter(t => t.status === "pending" && (t.vehicleType || "moto") === (rider?.vehicleType || "moto"))
    : [];

  el.innerHTML = `
    <div class="card">
      <div class="list-row">
        <div><b>Status:</b> ${online ? "🟢 ONLINE" : "⚪ OFFLINE"}</div>
        <button class="${online ? "danger" : "primary"}" style="width:auto;border-radius:11px" onclick="window.toggleDriverOnline()">
          ${online ? "Fungura OFFLINE" : "Fungura ONLINE"}
        </button>
      </div>
    </div>

    ${myAcceptedTrip ? `
      <div class="card">
        <h3>🏍️ MOTO METER</h3>
        <p>${escapeHtml(myAcceptedTrip.from || "—")} → ${escapeHtml(myAcceptedTrip.to || "—")}</p>
        <div class="grid">
          <div class="service" style="min-height:auto"><small>Distance</small><b id="meterDistance" style="font-size:20px">0.00 KM</b></div>
          <div class="service" style="min-height:auto"><small>Trip time</small><b id="meterTime" style="font-size:20px">00:00:00</b></div>
        </div>
        <div class="service" style="min-height:auto;margin-top:8px"><small>Fare</small><b id="meterFare" style="font-size:22px">0 RWF</b></div>
        <button class="primary" id="meterStartBtn" onclick="window.startTrip('${myAcceptedTrip.id}')">▶️ START TRIP</button>
        <button class="danger" id="meterStopBtn" style="width:100%;border-radius:11px;padding:14px;margin:7px 0" onclick="window.stopTrip()" class="hidden">⏹️ STOP TRIP</button>
        <div id="meterStatus"></div>
      </div>
    ` : ""}

    <div class="card">
      <h3>📋 Available Jobs (${availableJobs.length})</h3>
      ${!online ? emptyState("Fungura ONLINE kugira ngo ubone jobs zihari.") :
        availableJobs.length === 0 ? emptyState("Nta jobs zihari kuri ubu.") :
        availableJobs.map(t => `
          <div class="list">
            <div class="list-row">
              <div>
                <b>${escapeHtml(t.from || "—")} → ${escapeHtml(t.to || "—")}</b>
                <div><small>${typeof t.distanceKm === "number" ? t.distanceKm + " km · " : ""}${formatRWF(t.fare || 0)}</small></div>
              </div>
              <button class="primary" style="width:auto" onclick="window.acceptTripJob('${t.id}')">✅ ACCEPT</button>
            </div>
          </div>
        `).join("")}
    </div>

    ${await renderDriverDeliveries()}
  `;

  if (myAcceptedTrip) {
    document.getElementById("meterStopBtn").classList.add("hidden");
  }
}

window.renderDriverMode = renderDriverMode;
