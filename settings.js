import { DataStore } from "./firebase.js";
import { escapeHtml } from "./render.js";

/* =========================================================
   SETTINGS — igenamiterere ry'umukoresha (izina, telefone),
   kandi niba uri Owner, "Owner Settings" igaragara HEJURU
   ya byose kuri iyi paji (nk'uko byasabwe).
   ========================================================= */

export async function renderSettings() {
  const el = document.getElementById("settingsContent");
  if (!el) return;

  const user = window.App.currentUser;
  if (!user) {
    el.innerHTML = `<div class="notice error">Banza winjire muri konti.</div>`;
    return;
  }

  el.innerHTML = `
    ${user.isAdmin ? `
      <div class="card" style="border:2px solid #ffd54f">
        <h3>👑 Owner Settings</h3>
        <p><small>Gucunga ibiciro, kwemeza abamotari/ubucuruzi, kureba amateka (audit log), n'ubwishyu.</small></p>
        <button class="primary" onclick="window.openPage('admin')">Fungura Owner Dashboard</button>
      </div>
    ` : ""}

    <div class="card">
      <h3>👤 Umwirondoro</h3>
      <label>Amazina yuzuye</label>
      <input id="setFullName" value="${escapeHtml(user.fullName || user.displayName || "")}">
      <label>Telefone</label>
      <input id="setPhone" value="${escapeHtml(user.phone || "")}" placeholder="07XXXXXXXX">
      <button class="primary" onclick="window.saveAccountSettings()">💾 Bika</button>
      <div id="settingsStatus"></div>
    </div>

    <div class="card">
      <h3>🔔 Ubutumwa</h3>
      <p><small>Ubutumwa (notifications) buhita bugaragara buri gihe winjiye muri konti — nta konfigure indi ikenewe kuri ubu.</small></p>
    </div>

    <div class="card">
      <h3>📺 Dukurikire</h3>
      <p><small>Reba amavidewo n'amakuru mashya kuri Moto Progress Rwanda.</small></p>
      <a class="secondary" style="display:block;text-align:center;text-decoration:none;padding:13px;border-radius:11px" href="https://www.youtube.com/@Mkheroshow" target="_blank" rel="noopener">▶️ Dukurikire kuri YouTube</a>
    </div>

    <div class="card">
      <button class="danger" style="width:100%;border-radius:11px" onclick="window.logout()">Sohoka muri konti</button>
    </div>
  `;
}

window.saveAccountSettings = async function () {
  const statusEl = document.getElementById("settingsStatus");
  const fullName = document.getElementById("setFullName").value.trim();
  const phone = document.getElementById("setPhone").value.trim();

  if (!fullName) {
    statusEl.innerHTML = `<div class="notice error">Andika amazina yawe.</div>`;
    return;
  }

  await DataStore.setDoc("users", window.App.currentUser.uid, { fullName, phone });
  window.App.currentUser.fullName = fullName;
  window.App.currentUser.phone = phone;
  window.refreshHeader?.();

  statusEl.innerHTML = `<div class="notice success">✅ Byabitswe.</div>`;
};

window.renderSettings = renderSettings;
