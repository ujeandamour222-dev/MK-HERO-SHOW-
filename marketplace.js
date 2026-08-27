import { DataStore, uploadPhoto } from "./firebase.js";
import {
  renderMarketCards,
  renderMotorcycleCards,
  renderBusinessCards,
  escapeHtml
} from "./render.js";

let currentMarketTab = "listings"; // "listings" cyangwa "businesses"

export async function renderMarket(filterText = "") {
  if (currentMarketTab === "businesses") {
    await renderBusinesses(filterText);
    return;
  }
  let listings = await DataStore.list("listings");
  window.App.data.listings = listings;
  if (filterText) {
    const q = filterText.toLowerCase();
    listings = listings.filter(l => (l.title || "").toLowerCase().includes(q));
  }
  renderMarketCards(listings);
}

window.setMarketTab = function (tab) {
  currentMarketTab = tab;
  const listBtn = document.getElementById("marketTabListings");
  const bizBtn = document.getElementById("marketTabBusiness");
  const listSection = document.getElementById("marketList");
  const addBtn = document.getElementById("marketAddBtn");

  if (tab === "listings") {
    listBtn.classList.replace("secondary", "primary");
    bizBtn.classList.replace("primary", "secondary");
    addBtn.textContent = "+ Shyiraho igicuruzwa";
    addBtn.onclick = () => window.requireLogin(openAddListing);
  } else {
    bizBtn.classList.replace("secondary", "primary");
    listBtn.classList.replace("primary", "secondary");
    addBtn.textContent = "+ Shyiraho Ubucuruzi";
    addBtn.onclick = () => window.requireLogin(openAddBusiness);
  }
  renderMarket(document.getElementById("marketSearch")?.value.trim() || "");
};

export async function renderMotorcycles() {
  const motorcycles = await DataStore.list("motorcycles");
  window.App.data.motorcycles = motorcycles;
  renderMotorcycleCards(motorcycles);
}

export async function renderBusinesses(filterText = "") {
  let businesses = await DataStore.list("businesses");
  window.App.data.businesses = businesses;
  if (filterText) {
    const q = filterText.toLowerCase();
    businesses = businesses.filter(
      b => (b.name || "").toLowerCase().includes(q) || (b.category || "").toLowerCase().includes(q)
    );
  }
  renderBusinessCards(businesses);
}

/* =========================================================
   ADD LISTING / MOTORCYCLE / BUSINESS (via generic modal,
   harimo n'uburyo bwo gushyiraho ifoto)
   ========================================================= */

function openAddListing() {
  showFormModal({
    title: "+ Shyiraho igicuruzwa",
    fields: [
      { id: "title", label: "Izina ry'igicuruzwa", type: "text" },
      { id: "category", label: "Ubwoko", type: "text" },
      { id: "price", label: "Igiciro (RWF)", type: "number" }
    ],
    withPhoto: true,
    onSubmit: async (values, photoUrl) => {
      await DataStore.add("listings", {
        title: values.title,
        category: values.category,
        price: Number(values.price) || 0,
        photoUrl: photoUrl || null,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderMarket();
      window.openPage("market");
    }
  });
}
window.openAddListing = () => window.requireLogin(openAddListing);

window.openAddMotorcycle = function () {
  window.requireLogin(() => showFormModal({
    title: "+ Shyiraho Moto",
    fields: [
      { id: "title", label: "Ubwoko bwa moto (urugero: TVS HLX)", type: "text" },
      { id: "year", label: "Umwaka", type: "number" },
      { id: "price", label: "Igiciro (RWF)", type: "number" },
      { id: "description", label: "Ibisobanuro", type: "text" }
    ],
    withPhoto: true,
    onSubmit: async (values, photoUrl) => {
      await DataStore.add("motorcycles", {
        title: values.title,
        year: Number(values.year) || null,
        price: Number(values.price) || 0,
        description: values.description,
        photoUrl: photoUrl || null,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderMotorcycles();
      window.openPage("motorcycles");
    }
  }));
};

function openAddBusiness() {
  showFormModal({
    title: "+ Shyiraho Ubucuruzi",
    fields: [
      { id: "name", label: "Izina ry'ubucuruzi", type: "text" },
      { id: "category", label: "Ubwoko bw'ubucuruzi", type: "text" },
      { id: "phone", label: "Telefone", type: "text" },
      { id: "location", label: "Aho buherereye", type: "text" }
    ],
    withPhoto: true,
    onSubmit: async (values, photoUrl) => {
      await DataStore.add("businesses", {
        name: values.name,
        category: values.category,
        phone: values.phone,
        location: values.location,
        photoUrl: photoUrl || null,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderBusinesses();
      window.openPage("market");
    }
  });
}
window.openAddBusiness = () => window.requireLogin(openAddBusiness);

function showFormModal({ title, fields, withPhoto, onSubmit }) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    ${fields.map(f => `
      <label>${escapeHtml(f.label)}</label>
      <input id="field_${f.id}" type="${f.type}">
    `).join("")}
    ${withPhoto ? `
      <label>Ifoto (si ngombwa)</label>
      <input id="fieldPhoto" type="file" accept="image/*">
      <div id="photoPreview"></div>
    ` : ""}
    <button class="primary" id="submitFormBtn">Bika</button>
    <div id="formStatus"></div>
  `;

  modal.classList.remove("hidden");

  if (withPhoto) {
    document.getElementById("fieldPhoto").addEventListener("change", e => {
      const file = e.target.files[0];
      const preview = document.getElementById("photoPreview");
      if (!file) { preview.innerHTML = ""; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;border-radius:11px;margin:6px 0">`;
      };
      reader.readAsDataURL(file);
    });
  }

  document.getElementById("submitFormBtn").onclick = async () => {
    const statusEl = document.getElementById("formStatus");
    const values = {};
    for (const f of fields) {
      values[f.id] = document.getElementById(`field_${f.id}`).value.trim();
    }

    let photoUrl = null;
    const photoInput = withPhoto ? document.getElementById("fieldPhoto") : null;
    if (photoInput && photoInput.files[0]) {
      statusEl.innerHTML = `<div class="notice">⏳ Turimo kohereza ifoto...</div>`;
      try {
        photoUrl = await uploadPhoto(photoInput.files[0], "listings");
      } catch (error) {
        console.error(error);
        statusEl.innerHTML = `<div class="notice error">Habaye ikibazo mu kohereza ifoto. Turakomeza nta foto.</div>`;
      }
    }

    await onSubmit(values, photoUrl);
  };
}

window.closeModal = function () {
  document.getElementById("modal").classList.add("hidden");
};

window.renderMarket = renderMarket;
window.renderMotorcycles = renderMotorcycles;
window.renderBusinesses = renderBusinesses;
