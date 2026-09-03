import { DataStore, db, firebaseReady, getFirebaseModules } from "./firebase.js";
import { escapeHtml, formatRWF, emptyState } from "./render.js";
import { getFareTiers } from "./rides.js";

/* =========================================================
   DELIVERY SERVICE
   =========================================================
   Statuses: REQUESTED -> ACCEPTED -> DRIVER_ARRIVING ->
   PICKED_UP -> IN_TRANSIT -> DELIVERED (cyangwa CANCELLED)
   ========================================================= */

const STATUS_LABEL = {
  REQUESTED: "Birategerejwe",
  ACCEPTED: "Byemejwe",
  DRIVER_ARRIVING: "Umumotari araje",
  PICKED_UP: "Byafashwe",
  IN_TRANSIT: "Biri mu nzira",
  DELIVERED: "Byageze",
  CANCELLED: "Byahagaritswe"
};

const NEXT_STATUS = {
  ACCEPTED: "DRIVER_ARRIVING",
  DRIVER_ARRIVING: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED"
};

const NEXT_LABEL = {
  ACCEPTED: "📍 Nageze aho mfata ibintu",
  DRIVER_ARRIVING: "📦 Nafashe ibintu",
  PICKED_UP: "🛣️ Ntangiye urugendo",
  IN_TRANSIT: "✅ Nageze — Byarangiye"
};

async function estimateDeliveryFare(km) {
  const tiers = await getFareTiers();
  const tier = tiers.moto; // delivery ikoresha igiciro cya moto na default
  return Math.max(tier.minFare, Math.round((tier.baseFare + tier.perKm * km) / tier.roundTo) * tier.roundTo);
}

/* =========================================================
   PASSENGER — Gusaba delivery
   ========================================================= */

window.openRequestDelivery = function () {
  window.requireLogin(() => {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modalContent");
    content.innerHTML = `
      <h2>📦 Saba Delivery</h2>
      <label>Aho ufata ibintu (pickup)</label>
      <input id="delPickup" placeholder="Urugero: Kimironko">
      <label>Aho ujyana ibintu (destination)</label>
      <input id="delDestination" placeholder="Urugero: Remera">
      <label>Ibisobanuro ku bintu</label>
      <input id="delItem" placeholder="Urugero: Agasanduku k'imyenda">
      <label>Amazina y'ubona ibintu</label>
      <input id="delReceiverName" placeholder="Amazina">
      <label>Telefone y'ubona ibintu</label>
      <input id="delReceiverPhone" placeholder="07XXXXXXXX">
      <label>Amabwiriza y'inyongera (si ngombwa)</label>
      <input id="delNotes" placeholder="Urugero: Hamagara umbere yo kugera">
      <button class="primary" id="delSubmitBtn">📦 SABA DELIVERY</button>
      <div id="delStatus"></div>
    `;
    modal.classList.remove("hidden");

    document.getElementById("delSubmitBtn").onclick = async () => {
      const statusEl = document.getElementById("delStatus");
      const pickup = document.getElementById("delPickup").value.trim();
      const destination = document.getElementById("delDestination").value.trim();
      const item = document.getElementById("delItem").value.trim();
      const receiverName = document.getElementById("delReceiverName").value.trim();
      const receiverPhone = document.getElementById("delReceiverPhone").value.trim();
      const notes = document.getElementById("delNotes").value.trim();

      if (!pickup || !destination || !item || !receiverName || !receiverPhone) {
        statusEl.innerHTML = `<div class="notice error">Uzuza pickup, destination, ibisobanuro, n'amakuru y'ubona ibintu.</div>`;
        return;
      }

      statusEl.innerHTML = `<div class="notice">⏳ Turimo kohereza icyifuzo...</div>`;

      // Igiciro cy'agateganyo (nta GPS nyayo ihari hano kuko pickup/destination
      // yanditswe mu magambo) — igiciro nyacyo gishobora kongera kunononsorwa
      // n'umudereva amaze kubona intera nyayo hifashishijwe Moto Meter.
      const estFare = await estimateDeliveryFare(3); // 3km default estimate

      const deliveryId = await DataStore.add("deliveries", {
        senderUid: window.App.currentUser.uid,
        pickup, destination, item, receiverName, receiverPhone, notes,
        estimatedFare: estFare,
        status: "REQUESTED"
      });

      await DataStore.add("notifications", {
        uid: window.App.currentUser.uid,
        title: "Delivery yasabwe",
        body: `Icyifuzo cyawe cya delivery cyoherejwe (${pickup} → ${destination}). Kitegereje umumotari.`,
        read: false
      });

      statusEl.innerHTML = `<div class="notice success">✅ Icyifuzo cyoherejwe! Reba "Delivery" kugira ngo ukurikirane.</div>`;
      setTimeout(() => { window.closeModal(); window.openPage("delivery"); }, 900);
    };
  });
};

export async function renderMyDeliveries() {
  const el = document.getElementById("deliveryList");
  if (!el) return;
  if (!window.App.currentUser) { el.innerHTML = emptyState("Banza winjire muri konti."); return; }

  const deliveries = await DataStore.list("deliveries", { where: ["senderUid", "==", window.App.currentUser.uid] });
  if (deliveries.length === 0) { el.innerHTML = emptyState("Nta delivery ufite kugeza ubu."); return; }

  el.innerHTML = deliveries.map(d => `
    <div class="list">
      <div class="list-row">
        <div>
          <b>📦 ${escapeHtml(d.pickup)} → ${escapeHtml(d.destination)}</b>
          <div><small>${escapeHtml(d.item)}</small></div>
        </div>
        <div style="text-align:right">
          <span class="badge">${STATUS_LABEL[d.status] || d.status}</span>
          <div class="price" style="font-size:14px;margin-top:4px">${formatRWF(d.estimatedFare || d.fare || 0)}</div>
        </div>
      </div>
    </div>
  `).join("");
}
window.renderMyDeliveries = renderMyDeliveries;

/* =========================================================
   DRIVER — Kwakira/kuyobora delivery
   ========================================================= */

window.acceptDeliveryJob = async function (deliveryId) {
  if (!firebaseReady) {
    const d = await DataStore.getDoc("deliveries", deliveryId);
    if (!d || d.status !== "REQUESTED") { alert("Iyi delivery yamaze gufatwa n'undi."); return; }
    await DataStore.setDoc("deliveries", deliveryId, { status: "ACCEPTED", driverId: window.App.currentUser.uid });
    window.openPage("driverMode");
    return;
  }

  const mods = getFirebaseModules();
  try {
    await mods.runTransaction(db, async tx => {
      const ref = mods.doc(db, "deliveries", deliveryId);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().status !== "REQUESTED") throw new Error("already-taken");
      tx.update(ref, { status: "ACCEPTED", driverId: window.App.currentUser.uid });
    });
    window.openPage("driverMode");
  } catch (error) {
    if (error.message === "already-taken") alert("Iyi delivery yamaze gufatwa n'undi mumotari.");
    else { console.error(error); alert("Habaye ikibazo."); }
    window.renderDriverMode?.();
  }
};

window.advanceDeliveryStatus = async function (deliveryId, currentStatus) {
  const next = NEXT_STATUS[currentStatus];
  if (!next) return;
  await DataStore.setDoc("deliveries", deliveryId, { status: next });

  const delivery = await DataStore.getDoc("deliveries", deliveryId);
  if (delivery) {
    await DataStore.add("notifications", {
      uid: delivery.senderUid,
      title: "Delivery yahinduye status",
      body: `Delivery yawe (${delivery.pickup} → ${delivery.destination}) ubu iri: ${STATUS_LABEL[next]}.`,
      read: false
    });
  }
  window.renderDriverMode?.();
};

export async function renderDriverDeliveries() {
  if (!window.App.currentUser) return "";
  const myDeliveries = (await DataStore.list("deliveries", { where: ["driverId", "==", window.App.currentUser.uid] }))
    .filter(d => d.status !== "DELIVERED" && d.status !== "CANCELLED");

  const openDeliveries = await DataStore.list("deliveries");
  const requested = openDeliveries.filter(d => d.status === "REQUESTED");

  return `
    <div class="card">
      <h3>📦 Delivery Jobs (${requested.length})</h3>
      ${requested.length === 0 ? emptyState("Nta delivery ihari kuri ubu.") : requested.map(d => `
        <div class="list">
          <div class="list-row">
            <div>
              <b>${escapeHtml(d.pickup)} → ${escapeHtml(d.destination)}</b>
              <div><small>${escapeHtml(d.item)} · ${formatRWF(d.estimatedFare || 0)}</small></div>
            </div>
            <button class="primary" style="width:auto" onclick="window.acceptDeliveryJob('${d.id}')">✅ ACCEPT</button>
          </div>
        </div>
      `).join("")}
    </div>

    ${myDeliveries.length > 0 ? `
      <div class="card">
        <h3>🚚 Delivery Nkora ubu</h3>
        ${myDeliveries.map(d => `
          <div class="list">
            <div class="list-row">
              <div>
                <b>${escapeHtml(d.pickup)} → ${escapeHtml(d.destination)}</b>
                <div><small>${escapeHtml(d.receiverName)} · ${escapeHtml(d.receiverPhone)}</small></div>
                <span class="badge">${STATUS_LABEL[d.status]}</span>
              </div>
              ${NEXT_STATUS[d.status] ? `<button class="secondary" style="width:auto" onclick="window.advanceDeliveryStatus('${d.id}','${d.status}')">${NEXT_LABEL[d.status]}</button>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    ` : ""}
  `;
}
