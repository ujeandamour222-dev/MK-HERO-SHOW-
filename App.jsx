import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bike, Timer, Package, ClipboardList, User, Crown, Home as HomeIcon,
  Plus, Trash2, Lock, ArrowLeft, GripVertical, MapPin, Truck,
  Wallet, Star, Bell, Wrench, Fuel, LayoutDashboard, CheckCircle2, XCircle, ListChecks,
} from "lucide-react";

// ---- Icon library owner can pick from when adding a new service ----
const ICONS = {
  Bike, Timer, Package, ClipboardList, User, Crown, MapPin, Truck,
  Wallet, Star, Bell, Wrench, Fuel,
};

const DEFAULT_SERVICES = [
  { id: "shaka", name: "Shaka Motari", icon: "Bike", enabled: true },
  { id: "meter", name: "Moto Meter", icon: "Timer", enabled: true },
  { id: "delivery", name: "Delivery", icon: "Package", enabled: true },
  { id: "amateka", name: "Amateka", icon: "ClipboardList", enabled: true },
  { id: "konti", name: "Konti", icon: "User", enabled: true },
  { id: "owner", name: "Owner", icon: "Crown", enabled: true, locked: true },
];

const SERVICES_KEY = "mpr_services_v1";
const PIN_KEY = "mpr_owner_pin_v1";
const LOG_KEY = "mpr_activity_log_v1";
const DEFAULT_PIN = "1234";

// ---------------- storage helpers (localStorage, single device) ----------------
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Ntibyabashije kubikwa:", e);
  }
}

function useServices() {
  const [services, setServices] = useState(() => readJSON(SERVICES_KEY, DEFAULT_SERVICES));
  const [log, setLog] = useState(() => readJSON(LOG_KEY, []));

  const persist = useCallback((next, logEntry) => {
    setServices(next);
    writeJSON(SERVICES_KEY, next);
    if (logEntry) {
      setLog((prev) => {
        const updated = [{ ts: Date.now(), text: logEntry }, ...prev].slice(0, 20);
        writeJSON(LOG_KEY, updated);
        return updated;
      });
    }
  }, []);

  return { services, log, persist };
}

// ---------------- shared UI bits ----------------
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={checked ? "Bimurikira - kanda kugira ngo uzimye" : "Byazimye - kanda kugira ngo bimurikire"}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 ${
        checked ? "bg-emerald-600" : "bg-stone-300"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ServiceIcon({ name, className }) {
  const Cmp = ICONS[name] || Bike;
  return <Cmp className={className} strokeWidth={2} />;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "vuba aha";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min. ishize`;
  const h = Math.floor(m / 60);
  if (h < 24) return `amasaha ${h} ashize`;
  const d = Math.floor(h / 24);
  return `iminsi ${d} ishize`;
}

// ---------------- USER-FACING HOME SCREEN ----------------
function HomeScreen({ services, onOpenOwner }) {
  const visible = services.filter((s) => s.enabled);

  return (
    <div className="flex flex-col h-full bg-[#F4F2EC]">
      <header className="bg-emerald-800 px-5 pt-6 pb-5 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-[11px] font-medium tracking-widest uppercase">Serivisi</p>
            <h1 className="text-white text-2xl font-bold leading-tight font-display">
              Moto Progress<br />Rwanda
            </h1>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-700/60 flex items-center justify-center text-2xl">
            🏍️
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-100 text-xs font-medium px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Offline Demo
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <p className="text-stone-500 text-sm mb-3">Hitamo serivisi ukeneye</p>

        {visible.length === 0 ? (
          <div className="mt-10 text-center text-stone-400 text-sm">
            Nta serivisi iri kumurongo ubu. Owner agomba kuyimurikira mu Owner Panel.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((s) =>
              s.id === "owner" ? (
                <button
                  key={s.id}
                  onClick={onOpenOwner}
                  className="group flex flex-col items-start gap-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all p-4 text-left shadow-sm"
                >
                  <ServiceIcon name={s.icon} className="h-6 w-6 text-white" />
                  <span className="text-white font-semibold text-sm">{s.name}</span>
                </button>
              ) : (
                <div
                  key={s.id}
                  className="group flex flex-col items-start gap-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] transition-all p-4 text-left shadow-sm cursor-default"
                >
                  <ServiceIcon name={s.icon} className="h-6 w-6 text-emerald-100" />
                  <span className="text-white font-semibold text-sm">{s.name}</span>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 py-2 flex items-center justify-around">
        {[
          { icon: HomeIcon, label: "Home" },
          { icon: Bike, label: "Ride" },
          { icon: Timer, label: "Meter" },
          { icon: Package, label: "Delivery" },
          { icon: User, label: "Konti" },
        ].map(({ icon: Icon, label }, i) => (
          <button key={label} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${i === 0 ? "text-emerald-700" : "text-stone-400"}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ---------------- OWNER PIN GATE ----------------
function OwnerGate({ onUnlock, onBack }) {
  const [pin, setPin] = useState("");
  const [storedPin] = useState(() => readJSON(PIN_KEY, DEFAULT_PIN));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem(PIN_KEY)) writeJSON(PIN_KEY, DEFAULT_PIN);
  }, []);

  const submit = () => {
    const current = readJSON(PIN_KEY, DEFAULT_PIN);
    if (pin === current) {
      setError("");
      onUnlock();
    } else {
      setError("PIN ntabwo ari yo. Gerageza indi.");
      setPin("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F2EC]">
      <header className="bg-emerald-800 px-5 pt-6 pb-6 rounded-b-3xl">
        <button onClick={onBack} className="text-emerald-100 mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" /> Subira
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold font-display">Owner Panel</h1>
            <p className="text-emerald-200 text-xs">Injiza PIN kugira ngo winjire</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-10">
        <label className="block text-stone-500 text-xs font-medium uppercase tracking-wide mb-2">PIN y'Owner</label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••"
          autoFocus
          className="w-full text-2xl tracking-[0.5em] text-center bg-white border-2 border-stone-200 focus:border-emerald-600 rounded-xl py-4 outline-none transition-colors"
        />
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        <p className="text-stone-400 text-xs mt-3 text-center">PIN y'itangira: {DEFAULT_PIN} (uzayihindura mu Owner Panel)</p>

        <button
          onClick={submit}
          className="w-full mt-8 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          Injira
        </button>
      </main>
    </div>
  );
}

// ---------------- OWNER DASHBOARD + PANEL ----------------
function OwnerPanel({ services, log, persist, onBack }) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Star");
  const [showAdd, setShowAdd] = useState(false);
  const [pinFields, setPinFields] = useState({ current: "", next: "", confirm: "" });
  const [pinMsg, setPinMsg] = useState("");

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.enabled).length;
    return { total, active, inactive: total - active };
  }, [services]);

  const toggleService = (id, val) => {
    const target = services.find((s) => s.id === id);
    const next = services.map((s) => (s.id === id ? { ...s, enabled: val } : s));
    persist(next, `${target?.name || id}: ${val ? "yamuritswe (online)" : "yazimijwe (offline)"}`);
  };

  const removeService = (id) => {
    const target = services.find((s) => s.id === id);
    const next = services.filter((s) => s.id !== id);
    persist(next, `${target?.name || id}: yasibwe burundu`);
  };

  const addService = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36).slice(-4);
    const next = [...services, { id, name: newName.trim(), icon: newIcon, enabled: true }];
    persist(next, `${newName.trim()}: yongeweho nk'serivisi nshya`);
    setNewName("");
    setNewIcon("Star");
    setShowAdd(false);
  };

  const changePin = () => {
    setPinMsg("");
    const current = readJSON(PIN_KEY, DEFAULT_PIN);
    if (pinFields.current !== current) {
      setPinMsg("PIN ya none ntabwo ari yo.");
      return;
    }
    if (pinFields.next.length < 4) {
      setPinMsg("PIN nshya igomba kugira imibare 4 nibura.");
      return;
    }
    if (pinFields.next !== pinFields.confirm) {
      setPinMsg("PIN nshya ntizihuye.");
      return;
    }
    writeJSON(PIN_KEY, pinFields.next);
    setPinFields({ current: "", next: "", confirm: "" });
    setPinMsg("✓ PIN yahinduwe neza.");
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F2EC]">
      <header className="bg-emerald-800 px-5 pt-6 pb-5 rounded-b-3xl">
        <button onClick={onBack} className="text-emerald-100 mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" /> Subira ku rugo
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500 flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold font-display">Owner Dashboard</h1>
            <p className="text-emerald-200 text-xs">Genzura serivisi zose ku murongo</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-6">
        {/* --- Dashboard stat cards --- */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-xl p-3 border border-stone-200 text-center">
            <ListChecks className="h-4 w-4 text-stone-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-stone-800 font-display">{stats.total}</p>
            <p className="text-[10px] text-stone-400">Serivisi zose</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-700 font-display">{stats.active}</p>
            <p className="text-[10px] text-stone-400">Ziri kumurongo</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200 text-center">
            <XCircle className="h-4 w-4 text-red-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-500 font-display">{stats.inactive}</p>
            <p className="text-[10px] text-stone-400">Zazimye</p>
          </div>
        </section>

        {/* --- Services management --- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-stone-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Serivisi
            </h2>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1 text-emerald-700 text-sm font-semibold bg-emerald-100 px-3 py-1.5 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Ongeramo
            </button>
          </div>

          {showAdd && (
            <div className="bg-white rounded-2xl p-4 mb-3 border border-stone-200 space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Izina rya serivisi (urugero: Kwishyura)"
                className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <div>
                <p className="text-xs text-stone-500 mb-2">Hitamo ikimenyetso (icon)</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICONS).map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => setNewIcon(iconName)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
                        newIcon === iconName ? "bg-emerald-700 border-emerald-700 text-white" : "bg-stone-50 border-stone-200 text-stone-500"
                      }`}
                    >
                      <ServiceIcon name={iconName} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addService}
                disabled={!newName.trim()}
                className="w-full bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm"
              >
                Emeza no kongeramo
              </button>
            </div>
          )}

          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 border border-stone-200">
                <GripVertical className="h-4 w-4 text-stone-300 shrink-0" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.enabled ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>
                  <ServiceIcon name={s.icon} className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${s.enabled ? "text-stone-800" : "text-stone-400"}`}>{s.name}</p>
                  <p className="text-[11px] text-stone-400">{s.enabled ? "Iri kumurongo" : "Yazimye"}</p>
                </div>
                <Toggle checked={s.enabled} onChange={(val) => toggleService(s.id, val)} disabled={s.locked} />
                {!s.locked && (
                  <button onClick={() => removeService(s.id)} className="text-stone-300 hover:text-red-500 p-1.5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* --- Activity log --- */}
        <section>
          <h2 className="text-stone-700 font-semibold text-sm uppercase tracking-wide mb-3">Ibyakozwe vuba</h2>
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 max-h-40 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-stone-400 text-xs px-4 py-3">Nta gikorwa kirabaho.</p>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <p className="text-stone-600 text-xs truncate">{entry.text}</p>
                  <span className="text-stone-300 text-[10px] shrink-0">{timeAgo(entry.ts)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* --- PIN change --- */}
        <section>
          <h2 className="text-stone-700 font-semibold text-sm uppercase tracking-wide mb-3">Hindura PIN y'Owner</h2>
          <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-2.5">
            <input
              type="password"
              value={pinFields.current}
              onChange={(e) => setPinFields((f) => ({ ...f, current: e.target.value }))}
              placeholder="PIN ya none"
              className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="password"
              value={pinFields.next}
              onChange={(e) => setPinFields((f) => ({ ...f, next: e.target.value }))}
              placeholder="PIN nshya"
              className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="password"
              value={pinFields.confirm}
              onChange={(e) => setPinFields((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Emeza PIN nshya"
              className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {pinMsg && <p className={`text-xs ${pinMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>{pinMsg}</p>}
            <button onClick={changePin} className="w-full bg-stone-800 text-white font-semibold py-2.5 rounded-lg text-sm">
              Hindura PIN
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

// ---------------- ROOT APP ----------------
export default function App() {
  const { services, log, persist } = useServices();
  const [screen, setScreen] = useState("home"); // home | gate | owner

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="relative h-[700px] max-h-[90vh] w-full max-w-sm bg-[#F4F2EC] rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
        {screen === "home" && (
          <HomeScreen services={services} onOpenOwner={() => setScreen("gate")} />
        )}
        {screen === "gate" && (
          <OwnerGate onUnlock={() => setScreen("owner")} onBack={() => setScreen("home")} />
        )}
        {screen === "owner" && (
          <OwnerPanel services={services} log={log} persist={persist} onBack={() => setScreen("home")} />
        )}
      </div>
    </div>
  );
}
