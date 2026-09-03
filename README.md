# 🏍️ Moto Progress Rwanda

Igikoresho (web app) gifasha abanyarwanda:
- **Gushaka motari** bakwegereye (GPS)
- **Kureba map n'inzira** (Map & GPS)
- **Kwishyura** (Mobile Money reference)
- **Kureba ingendo zawe** (Trips)
- **Marketplace** — kugura/kugurisha ibintu
- **Amamoto** ari kugurishwa
- **Ubucuruzi** bukwegereye
- **Notifications**
- **Profile** n'**Admin panel** (kwemeza abakoresho ✅)

---

## 📁 Uko umushinga ugizwe

```
moto-progress/
├── index.html          → Igishushanyo cy'ibanze (HTML shell)
├── style.css            → Imisusire (CSS) yose
├── manifest.json         → PWA manifest (kugira ngo app ishobore kwinjizwa nk'iyindi app)
├── icon-192.png, icon-512.png  → Amashusho ya PWA
│
├── firebase.js           → Firebase config + payment config + uburyo bwo kubika amakuru
│                            (Firestore niba Firebase yashyizweho, cyangwa localStorage
│                            niba nta Firebase iracyashyizweho — "demo mode")
├── auth.js               → Kwinjira / Kwiyandikisha / Gusohoka muri konti
├── render.js              → Uburyo bwo kwerekana urutonde (riders, market, n'ibindi)
│                            harimo n'akamenyetso ✅ Yemejwe
├── rides.js               → Gushaka abamotari bakwegereye + gusaba urugendo
├── payment.js             → Kohereza ubwishyu
├── map.js                 → Leaflet map + GPS + gushaka inzira (OSRM)
├── marketplace.js          → Kongeraho/kureba ibicuruzwa, amamoto, ubucuruzi
├── notifications.js        → Kwerekana ubutumwa bw'umukoresha
├── admin.js                → Admin panel (kwemeza abantu/ibintu — badge ✅)
├── input.js                → Guhuza search bars (global search, market, business)
└── app.js                  → Aho byose bihurira: navigation (openPage/goHome) + bootstrap
```

---

## 💰 Kwishyura kuri MTN MoMo

App ikoresha uburyo bworoshye ariko bwizewe (nta backend ikenewe ubu):

1. Umukoresha yandika amafaranga, akanda **"📲 Ishyura kuri MoMo"** — terefone ye ihita ifungura **dial ya MoMo yuzuye** (`*182*8*1*<momoCode>*<amount>#`), nta kwandika kode ubwe bikenewe
2. Yemeza akoresheje **PIN ye bwite kuri terefone** (iki gice kiba hanze ya app — ni intego ya MTN, nta buryo bwo kubunyuraho, kandi ntibikwiye kubunyuraho)
3. Agaruka muri app, akinjiza **reference/SMS** yabonye nyuma yo kwishyura, akohereza
4. Owner/Admin abibona muri **👑 Owner Dashboard → "💰 Ubwishyu bwategereje kwemezwa"**, agenzura reference, akemeza

**MoMo code** (Merchant/Till Code) iri muri `firebase.js` → `PAYMENT_CONFIG.momoCode`. Iyi si "secret" — ni nka numero ijyanye n'igaragara, ikoreshwa mu gutumiza dial gusa.

**Niba mu gihe kizaza wifuza automation nyayo** (Request-to-Pay API, aho terefone y'umukiriya iboneka bwoherejweho ubutumwa bwo kwemeza ntagomba kubanza kwandika dial ubwe), ibi bisaba:
- Konti ya **MTN MoMo Developer Portal** (API user, API key, subscription key)
- **Backend** (urugero Firebase Cloud Functions) aho izo secret keys zibikwa — ntizigomba kujya muri frontend na rimwe
- Uzuza `PAYMENT_CONFIG.endpoint` muri `firebase.js` ku URL ya iyo backend

---



1. Fungura [Firebase Console](https://console.firebase.google.com) → hitamo project yawe.
2. **Authentication** → *Sign-in method* → fungura **Email/Password**.
3. **Firestore Database** → *Create database* (production mode).
4. Muri **Firestore Rules**, shyiramo urugero rw'itangira (uzabihindura nyuma kugira ngo birusheho kuba byizewe):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

5. Config ya Firebase (apiKey, projectId, n'ibindi) isanzwe muri `firebase.js` — niba uhindura project, yisimbuze aho biri hejuru muri iyo file (`FIREBASE_CONFIG`).

> ⚠️ Nta ho ushyira payment secret keys, service account keys cyangwa GitHub tokens muri iyi file cyangwa ahandi muri frontend. `PAYMENT_CONFIG` muri `firebase.js` igenewe gusa endpoint ya backend/payment provider yawe (izakora ubwishyu nyabwo hakoreshejwe backend, atari frontend).

---

## 🌐 Kuyishyira kuri interineti (deploy)

### Uburyo A — GitHub Pages (bworoshye, ntibisaba terminal)
1. Kora repository kuri GitHub, ushyiremo amafile yose y'uyu mushinga.
2. Muri repository → **Settings** → **Pages** → *Deploy from a branch* → `main` / `root` → **Save**.
3. Uzahabwa link nka `https://izina-ryawe.github.io/izina-rya-repo/`.
4. Muri Firebase Console → **Authentication** → **Settings** → **Authorized domains**, ongeraho iyo domain (`izina-ryawe.github.io`) kugira ngo login ikore.

### Uburyo B — Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🧪 Demo mode (nta Firebase ikenewe)

Niba `FIREBASE_CONFIG` muri `firebase.js` itarahinduka (iracyanditse `=== SHYIRAMO ... ===`), app ikoresha **localStorage** aho gukoresha Firebase, kugira ngo ushobore kwipimisha ako kanya nta interineti cyangwa konti ya Firebase bisabwa. Amakuru y'icyo gihe abikwa gusa kuri terefone/mudasobwa wakoresheje.

---

## ✅ Akamenyetso k'uwemejwe (Verified badge)

Umuntu (umumotari, ubucuruzi, cyangwa igicuruzwa) agira akamenyetso **✅ Yemejwe** iyo umukoresha ufite uburenganzira bwa **Admin** amwemeje muri **Admin Panel** (Profile → 👑 Admin, igaragara gusa ku bafite `isAdmin: true`).

Kugira ngo umuntu abe Admin bwa mbere, muri Firestore (cyangwa localStorage niba uri muri demo mode), shakisha inyandiko (document) ye muri `users` cyangwa `mpr_user`, uhindure:
```json
"isAdmin": true
```

---

## 👑 OWNER DASHBOARD

Umuntu ufite `isAdmin: true` abona akamenyetso 👑 hejuru y'urubuga (icyo kanya gihita kigaragara/kigapfa hakurikijwe konti yinjiye), agakanda hejuru agafungura **Owner Dashboard** ifite:
- Incamake y'imibare (abakoresha, abamotari, ingendo, ubwishyu bwose bwakozwe, ibicuruzwa, amamoto, ubucuruzi, n'ibitaremezwa)
- Urutonde rwo kwemeza (✅) buri wese/buri kintu (abamotari, ubucuruzi, ibicuruzwa, amamoto)

Owner/Admin **ntabwo asabwa kwemeza email** mbere yo gukoresha app — abona serivisi zose ako kanya. Abandi bakoresha (`isAdmin: false`, ni byo default ku bose bishyiriraho konti) **bagomba kubanza bemeze email yabo** mbere yo kubona izindi serivisi (Riders, Map, Payment, Marketplace,...); nta kindi babona uretse Profile na paji yo kwemeza email, kugeza igihe bakanze link muri email yabo.

### 🏍️🚗 Ibiciro by'ingendo (Moto vs Imodoka)

Serivisi "Shaka Motari" ubu ifite ubwoko bubiri: **🏍️ Moto** na **🚗 Imodoka (Dereva)**, buri bumwe bufite igiciro cyabwo. Owner ahindura ibiciro (igiciro cy'ibanze, igiciro kuri km, n'igiciro gito kurusha byose) muri **Owner Dashboard → "⚙️ Ibiciro by'ingendo"** — nta code ikenewe. Igihe byabitswe, bihita bikoreshwa n'abakoresha bose ku ngendo zishya.

---

## 📧 Kwemeza Email (Email Verification)

Iyo umuntu yiyandikishije, Firebase yohereza ubwo bwoherejwe email ako kanya (`sendEmailVerification`). App irinda (block) serivisi zose kugeza aho umukoresha akanze link iri muri iyo email, hanyuma agakanda "✅ Nyemeje — Komeza" muri app.

**Guhindura uko email igaragara (izina ryohereza, "from" address):**
1. Firebase Console → **Authentication** → **Templates**
2. Hitamo **Email address verification**
3. Uhindure:
   - **Sender name** (izina rigaragara nk'uwohereje, urugero "Moto Progress Rwanda")
   - **Reply-to** (email uzasubizwaho)
   - Ubutumwa/subject nk'uko ubishaka
4. Kugira ngo email igaragare iva kuri domain yawe bwite (urugero `noreply@motoprogress.rw`) aho kuva kuri `@moto-progress-rwanda-3fe64.firebaseapp.com`, ugomba:
   - Muri Authentication → Settings → **Authorized domains**, kongeramo/kwemeza domain yawe
   - Kongera custom domain muri Firebase Hosting, cyangwa gukoresha SendGrid/Trigger Email extension niba ushaka gucunga email ukoresheje seriveri yawe bwite (izi ni serivisi zinyuranye zisaba Firebase Blaze plan)

> Firebase isanzwe ikoresha "Google email service" yayo bwite yo kohereza email (nta configuration ndende isabwa kugira ngo email zigere — ziba zigeze kandi zizewe), gusa ushobora guhindura izina n'ubutumwa nkuko byavuzwe hejuru.

---

## 🔐 Kwinjira ukoresheje Google / Apple

App ifite buto "Injira ukoresheje Google" na "Injira ukoresheje Apple" ariko bigomba kubanza gushyirwaho muri Firebase Console:

**Google (byoroshye):**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Kanda **Google** → **Enable** → hitamo "Project support email" → **Save**
3. Nta kindi gikenewe — bihita bikora.

**Apple (birambuye gato):**
1. Ukeneye **Apple Developer Program** (konti yishyurwa ya Apple, $99/umwaka) hamwe na **Services ID** na **Sign in with Apple key** biva kuri [developer.apple.com](https://developer.apple.com)
2. Firebase Console → **Authentication** → **Sign-in method** → **Apple** → **Enable**, wuzuze Services ID, Team ID, Key ID, n'iyo private key
3. Niba udafite Apple Developer account, ushobora kubanza gukoresha Google gusa, ukongeraho Apple nyuma.

**⚠️ Icy'ingenzi:** Google na Apple sign-in **ntibikora muri "embedded webview"** (nka Spck Editor Preview, cyangwa in-app browser ya Facebook/Instagram/WhatsApp) — Google na Apple barabuza ubwo buryo ku mpamvu z'umutekano (uzabona error nka "disallowed_useragent"). Bizakora neza gusa iyo urubuga rufunguwe muri **Chrome, Safari, cyangwa Firefox nyayo** — nk'iyo ukoresheje link ya GitHub Pages cyangwa Firebase Hosting.

Kandi ntugomba kwibagirwa kongeramo domain yawe muri **Authentication → Settings → Authorized domains** (nka `izina-ryawe.github.io`) — utabikoze, Google/Apple sign-in ntibizakora.

---

## 🏍️ Driver Mode (Umumotari/Dereva)

Umukoresha ushobora kwiyandikisha nk'umumotari/dereva (Profile → "+ Iyandikishe nk'Umumotari/Dereva"). Amaze kwiyandikisha:

- **ONLINE/OFFLINE**: agenzura ubwe igihe ashaka kubona jobs
- **Available Jobs**: abona ingendo zitegereje (dispatch — buri wese uri ONLINE abona icyifuzo, uwabanje kwemeza (ACCEPT) niwe uhabwa job — hakoreshejwe **Firestore transaction** irinda ko babiri bahabwa job imwe icyarimwe)
- **🏍️ MOTO METER**: nyuma yo kwemeza job, START TRIP itangira gukurikirana GPS nyayo (ntabwo ari ishushanyo), ikabara intera (km), igihe, n'igiciro mu buryo bugenda buhinduka (live) buri segonda, hakurikijwe ibiciro biri muri Owner Dashboard. STOP TRIP irangiza urugendo, ikabika muri Firestore.

Iyi ni **isubiramo (dispatch) nyayo, atari kwerekana amazina y'abamotari gusa** — jobs ziboneka ku bamotari bose bahuje ubwoko (moto/imodoka) uri ONLINE.

## 📦 Delivery

Umukiriya ashobora gusaba delivery (Profile → Delivery → "Saba Delivery Nshya"): aha pickup, destination, ibisobanuro ku bintu, amazina n'itelefone y'ubona ibintu. Delivery ikurikirana status: `REQUESTED → ACCEPTED → DRIVER_ARRIVING → PICKED_UP → IN_TRANSIT → DELIVERED`. Umudereva abona delivery zitegereje muri Driver Mode, akazemeza (transaction-safe nk'ingendo), akazikurikirana intambwe ku ntambwe.

## ⭐ Ratings

Nyuma y'urugendo rurangiye, umukiriya ashobora gutanga amanota (1-5 inyenyeri) n'ubutumwa ku mumotari, muri "Ingendo zanjye".

## 📜 Audit Log

Buri gihindurwa ry'ibiciro cyangwa ukwemeza/kuraho umuntu/ikintu (✅) byanditswe muri **Owner Dashboard → "📜 Audit Log"** — bigaragaza actorId, action, targetId, agaciro ka mbere n'agashya, n'igihe byabereye. Aya mateka **ntashobora gusibwa cyangwa guhindurwa** (reba `firestore.rules`).

## 🔐 firestore.rules — Security Rules nyazo

Iyi file (`firestore.rules`) igomba gushyirwa muri **Firebase Console → Firestore Database → Règles**, isimbuze izasanzweho (`allow read: if true; allow write: if request.auth != null;`). Irinda:
- Umukoresha ntashobora kwihindurira `isAdmin` cyangwa role="owner" ubwe
- Umumotari abona/afata gusa jobs "pending" (dispatch), atabasha guhindura iz'abandi
- `fareSettings` (settings/fareConfig) yandikwa na Owner gusa
- Audit logs (`adminLogs`) zisomwa na Owner gusa, ntizisibwa/zihindurwa na rimwe
- Buri collection ifite authorization ihuye n'uruhare (role) rw'umukoresha

**Kugira ngo ubishyireho:** fungura Firestore Database → Règles muri Firebase Console, koporora ibiri muri `firestore.rules`, ushyireho aho iby'ubu biri, ukande Publier.

## 📲 PWA — sw.js (Service Worker)

App ubu ifite `sw.js` yishyira muri app ubwayo ikoresheje "cache" ku mafile y'ibanze (index.html, style.css, icons) — bituma app ishobora gukingurwa (nubwo bidatunganye 100%) mu gihe nta internet ihari, kandi ikaba PWA yuzuye ishobora kwinjizwa ku ecran y'itangira (Add to Home Screen).

## 🚧 Ibitarakorwa (biracyifuza akazi kenshi kurushaho)

Kubera ubunini bw'iyi spec (application ya production nyayo, isaba ibyumweru byinshi by'akazi niba yakorwa 100%), ibi bice ntibiraboneka kugeza ubu:
- **Cloud Functions**: gucunga fare change validation cyangwa job matching ku ruhande rwa server (currently ikorwa muri frontend + Firestore Rules, bihagije ku itangira, ariko ntibifite "server-side business logic" nyayo)
- **Translations layer** (i18n): app iracyakoresha Ikinyarwanda gishyizwe mu magambo ku buryo butaziguye (hardcoded), atari sisitemu yo guhindura ururimi mu buryo bwikora
- **Payment provider nyayo (Request-to-Pay API)**: dukoresha uburyo bwa MoMo dial-to-pay + confirmation ya Owner (reba hejuru), atari automatique API integration
- Delivery igiciro (estimated) ntikoresha GPS nyayo hagati ya pickup/destination (yanditswe mu magambo), gusa Moto Meter ikoresha GPS nyayo ku ngendo z'abagenzi

---



Uyu mushinga ni **static site** isanzwe (HTML/CSS/JS ya module), nta build step (Webpack/Vite/Node) ikenewe. Ushobora kuyifungura ako kanya muri browser cyangwa Spck Editor preview.
