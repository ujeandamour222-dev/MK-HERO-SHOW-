# Moto Progress Rwanda

Application yerekana serivisi za moto (Shaka Motari, Moto Meter, Delivery, Amateka, Konti) hamwe na **Owner Dashboard** ihindura izo serivisi ku murongo nta kode zikenewe.

## Uko wayitangiza kuri mudasobwa yawe

```bash
npm install
npm run dev
```

Hanyuma fungura link izagaragara (nka `http://localhost:5173`).

## Kuyikora "build" yo kuyishyira kuri seriveri (hosting)

```bash
npm run build
```

Izakubarira dosiye muri `dist/` — uzishyire kuri hosting nka Netlify, Vercel, cyangwa GitHub Pages.

## Uko bikora

- **Abakoresha basanzwe** babona gusa serivisi Owner yamurikiye (enabled) ku ipaji y'ibanze.
- **Owner** akanda "Owner" → yinjiza PIN (y'itangira: `1234`) → yinjira muri **Owner Dashboard** aho ashobora:
  - Kubona umubare w'amaserivisi yose, ayo kumurongo, n'ayazimye.
  - Gukumira/gufungura (toggle) serivisi imwe imwe — igihinduka kigaragara ako kanya ku ipaji y'ibanze.
  - Kongeramo serivisi nshya (izina + ikimenyetso).
  - Gusiba serivisi.
  - Kureba "Ibyakozwe vuba" (activity log) y'ibyahinduwe.
  - Guhindura PIN ye.

## ICYITONDERWA KY'INGENZI — kubika amakuru (storage)

Iyi verisiyo ikoresha **localStorage** y'ibrowser (biba gusa kuri telefone/mudasobwa umwe). Ibi bivuze:

- Impinduka Owner akora **kuri terefone ye** ntizigaragara ako kanya kuri terefone z'abandi bakoresha, kuko nta seriveri (backend) rusange ihari.
- Niba ushaka ko Owner ahindura ikintu kimwe hanyuma abakoresha BOSE (kuri terefone zitandukanye) babibona ako kanya — nk'uko byakoze muri verisiyo ya mbere yakozwe muri Claude Artifact (ikoresha "shared storage" rusange) — ugomba kongeramo **backend rusange**, urugero:
  - **Firebase Realtime Database / Firestore** (byoroshye cyane, ku buntu ku ntangiriro),
  - **Supabase** (PostgreSQL + real-time sync, ku buntu ku ntangiriro).

Niba ubishaka, nshobora kongera kuyihindura ikoresha imwe muri izo (Firebase cyangwa Supabase) kugira ngo ibe "online" by'ukuri hagati y'abakoresha benshi kuri telefone zitandukanye.
