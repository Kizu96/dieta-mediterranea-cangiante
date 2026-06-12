# PROJECT — Dieta Mediterranea Cangiante (app + PDF)

> **Documento di stato durevole.** Aggiornare a ogni milestone. Serve a non perdere
> contesto tra le compattazioni della chat.

## Obiettivo
PWA installabile (gratis, offline, dati solo locali) + PDF che aiutano l'utente a perdere
peso e **grasso viscerale** con una dieta mediterranea "cangiante" (estate/inverno), facile da
seguire vivendo da soli.

## Profilo utente
Uomo, ~30 anni, **112 kg, 173 cm (BMI 37,4)**. No allergie, no farmaci, non fuma.
Cammina ~20 min × 5 gg/sett (tragitto lavoro), tapis roulant a casa usato di rado.
Routine: lavoro 9–18, impegni 19–20, relax dalle 22, sonno ~24.
**Cucina: NIENTE FORNO** — solo padella, pentola, microonde, friggitrice ad aria. Vive da solo.

## Decisioni confermate
- Dispositivi: **Android + PC Windows** (no iPhone).
- Dati: **solo locali** (IndexedDB/Dexie, no backend, no login).
- Notifiche: **in-app + locali** (no server push).
- **Mankai non disponibile in Italia** → sostituti (tè verde, frullato verde, noci, eventuale spirulina/clorella).
- Fonti scientifiche **reali e verificate**, mai inventate. Disclaimer medico incluso.

## Scienza (backbone)
- **DIRECT-PLUS / green-MED** (BMC Medicine 2022): −14,1% grasso viscerale vs −6% MED classica.
- Olio EVO → acido oleico → **OEA** (sazietà + ossidazione grassi, PPAR-α).
- **Germogli broccoli / sulforafano** → ↓ insulina, ↓ HOMA-IR.
- Cioccolato 85%, mirtilli/lamponi freschi e uva (antociani — Curtis AJCN 2019 PMC6537945; Pan PLoS One 2025 PMID 39928643), fermentati (kimchi/crauti): polifenoli + microbiota. NB: frutti di bosco FRESCHI, mai surgelati (l'utente li tollera solo freschi).

## Stack & hosting
Vite + React 19 + TypeScript + Dexie (IndexedDB) + recharts + date-fns + vite-plugin-pwa.
**Hosting: GitHub Pages** → https://kizu96.github.io/dieta-mediterranea-cangiante/ (repo PUBBLICO,
deploy via `.github/workflows/deploy.yml` con actions/deploy-pages; Vite `base: '/dieta-mediterranea-cangiante/'`).
Ex Netlify abbandonato (giugno 2026): piano a crediti esaurito, deploy bloccati. GitHub Pages sul
piano free richiede repo pubblico → repo reso pubblico (nessun dato sensibile: i dati utente sono
solo locali in IndexedDB, i secret non sono nel codice).
PDF: script Node che renderizza i contenuti guida → `public/Guida-Dieta.pdf`.

## CONTRATTO DATI (non rompere queste firme)
- `src/data/types.ts` — tutti i tipi.
- `src/db/db.ts` — `db`, tabelle: pantry, shopping, weights, essentials, workouts, settings; helper `getSetting`/`setSetting`.
- `src/lib/nutrition.ts` — `bmi`, `bmiClass`, `mifflinBMR`, `tdee`, `weeklyLoss`, `weeksToTarget`, `DEFAULT_PROFILE`.
- `src/lib/season.ts` — `currentSeasonByDate(date)`.
- `src/lib/planning.ts` — `toISODate`, `addDays`, `recipeById`, `getDayTemplate`, `getRecipesForDate`, type `ResolvedMeal`.
- `src/lib/shopping.ts` — `ingredientById`, `ingredientsForRange`, `buildShoppingList`, `makeableRecipes`, `missingForDate`, types `NeededIngredient`/`ShoppingGroup`.
- Contenuti (espandibili, mantenere i nomi export):
  - `src/data/ingredients.ts` → `export const ingredients: Ingredient[]`
  - `src/data/recipes.ts` → `export const recipes: Recipe[]`
  - `src/data/dailyEssentials.ts` → `export const dailyEssentials: DailyEssential[]`
  - `src/data/mealPlan.ts` → `export const seasonPlans: SeasonPlan[]`
  - `src/data/workoutPlan.ts` → `export const workoutWeeks: WorkoutWeek[]`
  - `src/data/guide.ts` → `export const guideSections: GuideSection[]`

**Invarianti:** ogni `ingredientId` nelle ricette esiste in `ingredients`; ogni `recipeId` nel piano esiste in `recipes`; ricette solo con padella/pentola/microonde/friggitrice; dosi per 1 persona.

## Schermate (UI in italiano)
1. **Oggi** — pasti + checklist daily essentials + allenamento + pesata rapida.
2. **Piano** — Giorno / Settimana / Mese (menù stagionale ciclico).
3. **Ricette** — passo-passo, filtri (attrezzatura/stagione/"posso farla ora").
4. **Dispensa** — checkbox di cosa c'è in casa.
5. **Lista spesa** — auto da pasti futuri − dispensa; checkmark "comprato".
6. **Peso** — log, grafico, BMI, proiezione.
7. **Allenamenti** — calendario + istruzioni + log.
8. **Guida/PDF** — guide in-app + download PDF.

## STATO
- [x] F0 Scaffolding (Vite/React/TS, deps, dirs, git)
- [x] Contratto: types, db, lib (nutrition/season/planning/shopping)
- [x] Seed coerente dei contenuti (compila e gira)
- [x] F1 Contenuti completi: 111 ingredienti, 33 ricette (per 1, no forno), piani estate/inverno, 3 blocchi workout, 10 daily essentials con fonti reali, 7 guide complete
- [x] F2-F5 UI: shell+nav a tab, 8 schermate + Settings, stile mobile-first, PWA installabile, notifiche locali
- [x] F6 PDF: `scripts/generate-guide-html.ts` + `scripts/build-pdf.mjs` (esbuild bundle → Edge headless) → `public/Guida-Dieta.pdf` (1.2 MB, 85k char HTML). Script npm `build:pdf`.
- [x] QA: `npm run build` exit 0, `npm run lint` 0 errori, invarianti OK, flusso adattivo verificato; smoke test preview (index/pdf/manifest/sw → 200)
- [~] F7 Deploy: build `dist/` pronta (PDF incluso), `netlify.toml` + `DEPLOY.md` creati. **Manca solo il passo finale di pubblicazione** (Netlify Drop di `dist/`) che richiede il browser/credenziali dell'utente.

### UI responsive (desktop + mobile)
- `< 900px` = layout mobile (tab bar in basso, colonna singola). `≥ 900px` = layout webapp:
  la `.bottom-nav` diventa **sidebar** verticale a sinistra (`--sidebar-w`), header e `.screen`
  spostati a destra e centrati su `--content-max`; modali centrate; `.recipe-grid` multi-colonna.
- Tutto in CSS (`src/index.css`, media query) + brand in `BottomNav.tsx` + wrapper `.recipe-grid` in `Recipes.tsx`.
- Verificato con screenshot Edge headless a 1440px e 412px.

### Rifiniture (giro 2)
- Dashboard multi-colonna su desktop: `.dash-grid` (Oggi: Pasti+Pilastri+Allenamento+Pesata; Peso: Registra+Indicatori), `.week-grid` (Piano settimana). Mobile resta 1 colonna.
- **Grafico Peso lazy** (`src/components/WeightChart.tsx` + `React.lazy`): recharts in chunk separato (~345 KB) → bundle iniziale da ~751 KB a ~407 KB.
- **Icone PNG** generate con `sharp` (`scripts/build-icons.mjs`, `npm run build:icons`): pwa-192/512, maskable 192/512, apple-touch-icon 180 in `public/`; manifest in `vite.config.ts` aggiornato (PNG + SVG fallback).
- Rasterizzazione via Edge headless inaffidabile su questa macchina (singleton/hand-off) → usato sharp. Per screenshot Edge: killare prima i processi headless (`MainWindowHandle -eq 0`).

### Rifiniture (giro 3)
- **Palette pastello** turchese/menta/cioccolato: ridefinite le variabili colore in `src/index.css` (nomi invariati, valori nuovi), banner, `.pill.olive`, colori del grafico (`WeightChart.tsx`), `theme_color` manifest + `index.html`, e icone ricolorate (`public/icon.svg`, `favicon.svg`, `scripts/build-icons.mjs` → PNG rigenerate).
- **Fix "Compra per domani"** (`src/lib/shopping.ts` → `missingForDate`): ora include anche gli staple non in dispensa (prima li saltava) ed esclude gli ingredienti con nota "opzionale". Lista completa reale.
- **Today**: aggiunta card "Pasti di domani"; spiegazione dei "Pilastri quotidiani".
- **Yogurt**: greco mantenuto nelle ricette + alternativa "o yogurt bianco intero" (note) e nuovo ingrediente `yogurt-intero`.
- **+7 ricette** di varietà in `recipes.ts` (porridge cacao, pane+ricotta, cous cous+feta, zuppa lenticchie+farro, salmone+broccoli+quinoa, frittata funghi+spinaci, kefir+frutti). PDF rigenerato.
- Nota: NON modificato `mealPlan.ts` (le nuove ricette sono nel pool/Ricette; integrazione nella rotazione del piano = TODO futuro).

### Deploy automatico
- Repo GitHub **privato** `Kizu96/dieta-mediterranea-cangiante` (gh autenticato).
- **GitHub Action** `.github/workflows/deploy.yml`: a ogni push su main fa `npm ci` + `npm run build` + deploy Netlify via `netlify-cli`. Richiede 2 secrets nel repo: `NETLIFY_AUTH_TOKEN` (PAT Netlify) e `NETLIFY_SITE_ID` (API ID del sito mydieting). PDF/icone versionati → niente Edge in CI.
- 7 ricette nuove ora **integrate nella rotazione** di `mealPlan.ts` (estate+inverno); cous-cous-feta solo estate, zuppa-lenticchie-farro solo inverno.

### Origine ricette + validazione macro
Le ricette sono combinazioni mediterranee standard (non copiate da ricettario). I macro erano stime;
ora sono **ricalcolati da tabella nutrizionale USDA/CREA** (`scripts/nutrition-data.mjs`) via
`npm run validate:macros` → riscrive i valori in `recipes.ts`. La scienza della dieta ha fonti reali citate.
- **Finding** (`npm run check:days`): con i macro reali i totali/giorno sono ~1440–1770 kcal, **SOTTO** i
  kcalTarget del piano (1900/2200). Deficit più aggressivo del previsto vs TDEE ~2700–2900.
  Soluzione adottata: **toggle Intensità** (sotto).

### Toggle Intensità (moderata / intensiva)
- `src/lib/intensity.ts` (fattore porzioni: moderata ×1.3 ≈ target ~1900-2200, intensiva ×1.0 ≈ ~1450-1770) + hook `src/components/useIntensity.ts` (setting `intensity`, default `moderata`).
- Applicato a display di kcal/macro e quantità spesa: `Today`, `Plan`, `Recipes`, `RecipeDetail`, `Shopping`. Toggle in `Settings` e quick-toggle su `Oggi`.
- I macro base salvati in `recipes.ts` restano l'intensiva (×1); la moderata è scalata a runtime. Il PDF mostra le porzioni base.
- Toggle ora **solo in Impostazioni** (rimosso da Oggi su richiesta).

### Dettaglio esercizi + video + fix mobile
- `src/components/ExerciseDetail.tsx`: modale apribile (come le ricette) con istruzioni + **video YouTube incorporato** (youtube-nocookie). ID in `src/lib/exerciseVideo.ts` (mappa keyword→ID da ricerca verificata: squat/piegamenti/plank/affondi/ponte/rematore); per gli altri, bottone ricerca YouTube. Esercizi tappabili in `Workouts` e `Oggi`.
- Fix mobile: `Modal` chiude col tasto/gesto Indietro (history pushState/popstate) + blocca scroll dietro; CSS `overflow-x: hidden` + `overscroll-behavior: none` (stop swipe-back bug); `.modal` `overscroll-behavior: contain`; `.video-embed` 16:9 responsive.
- Video incorporati per TUTTI gli esercizi (mappa keyword→ID in `exerciseVideo.ts`); lista spesa "Solo domani" (banner Compra-per-domani) oltre a 3/7 giorni.

### Misure & composizione corporea
- `WeightEntry` esteso (campi opzionali: `visceralFat`, `bodyFatPct`, `muscleKg`, `waistCm`, `hipsCm`) — nessuna migrazione (campi non indicizzati).
- Schermata Peso: form con misure extra (collassabile), indicatori composizione, grafico con **selettore metrica** (Peso/Viscerale/Grasso %/Vita) via `WeightChart` generico. L'utente ha una bilancia smart che misura grasso viscerale.
- Grafico con metrica **Vita/Fianchi (WHR)** + **alert motivazionale** quando vita/grasso viscerale calano.
- **Riepilogo settimanale** (`src/components/WeeklySummary.tsx`) su Oggi: Δ peso, Δ vita, allenamenti fatti (7 gg).
- **Backup** (`src/lib/backup.ts`): esporta/importa JSON di tutte le tabelle, da Impostazioni → Dati.
- Amazon: identificati quasi tutti (vedi [[shopping-amazon]]); 2 ASIN illeggibili (HTTP 500) lasciati perdere.

### Toggle ricette extra (prodotti speciali + frullatore)
- Obiettivo: decidere prima della spesa se includere le ricette che richiedono prodotti specialistici (acquisto online) e il frullatore.
- `src/lib/extraRecipes.ts`: `EXTRA_RECIPES_SETTING_KEY='includeExtraRecipes'` (default **true**), `EXTRA_GARNISH_IDS` (germogli broccoli/misti, tahin) + hook `src/components/useExtraRecipes.ts`.
- `Recipe` esteso: `extra?`, `extraReason?`, `fallbackId?`. Marcate extra: `colazione-smoothie-verde` (frullatore → fallback `colazione-pane-ricotta-miele`) e `spuntino-matcha-latte` (matcha → fallback `spuntino-yogurt-mandorle`). Nuovo `Equipment` `'frullatore'` (sul frullato verde).
- `planning.ts` → `resolveRecipe(id, includeExtra=true)`: con OFF sostituisce le ricette `extra` col `fallbackId` e rimuove dagli altri piatti gli ingredienti in `EXTRA_GARNISH_IDS`. `getRecipesForDate(date, season, includeExtra=true)`.
- `shopping.ts`: `ingredientsForRange/buildShoppingList/missingForDate` accettano `includeExtra=true` (default = comportamento invariato).
- Consumatori aggiornati: `Today`, `Plan` (Day/Week), `Shopping`, `Settings` (toggle UI), `App` (scheduler legge il setting). `Recipes` mostra badge "⭐ extra".

### Pranzi feriali "da ufficio" (make-ahead)
- Vincolo utente: i pranzi **lun–ven si mangiano in ufficio** e **NON** ha tempo di prepararli la mattina → devono essere preparati in anticipo (sera prima/batch weekend) e trasportabili. Vedi [[user-profile]].
- `Recipe.office?: boolean`. Marcate `office: true` le 8 ricette-pranzo usate nei giorni feriali del piano: ceci-tonno, quinoa-gamberetti, pasta-sgombro, cous-cous-feta, wrap-hummus-tacchino, farro-pollo-verdure, zuppa-lenticchie, orzo-feta-verdure. (Wrap: `storage` aggiornato per la prep la sera prima.)
- UI: badge **🥡 ufficio** sul pranzo **solo nei giorni Lun–Ven** (`mondayIndex(date) < 5 && slot==='pranzo' && recipe.office`) in `Today` (oggi+domani) e `Plan` (Day/Week); `RecipeDetail` mostra un banner "🥡 Da ufficio"; `Recipes` mostra il pill. Scelta utente: tenere i 5 pranzi diversi + etichetta (non meal-prep batch).

### Verifica fonti scientifiche (giugno 2026)
- L'utente pretende rigore: solo fonti primarie reali, niente articoli AI, niente citazioni inventate. Vedi [[research-standards]].
- Verificate alla fonte (PubMed/PMC) **tutte** le citazioni in `dailyEssentials.ts` e `guide.ts`. Trovati e corretti **2 nomi di primo autore sbagliati**:
  - Grasso viscerale, BMC Medicine 2022;20:327 (PMID 36175997): primo autore è **Zelicha H** (non "Yaskolka Meir A", che è 4°, né "Tsaban", 6°). VAT: green-MED −14,1% vs MED −6,0% vs HDG −4,2%, n=294, 18 mesi.
  - OEA, PMC9886573: è **Igarashi M et al., *Frontiers in Endocrinology* 2023** (non "Diep TA").
- Confermate corrette: Bahadoran Z (Int J Food Sci Nutr 2012, PMID 22537070), Axelsson AS (Sci Transl Med 2017), Curtis PJ (AJCN 2019, PMC6537945), Grassi D (AJCN 2005, PMID 15755830), Kreider ISSN creatina 2017 (PMC5469049).
- PDF/guida rigenerati con le citazioni corrette (`npm run build:pdf`).

### Bilanciamento proteico del piano (giugno 2026)
- Verificate proteine/fibre per giorno (bundle esbuild di recipes+mealPlan, fattore moderata ×1.3). Trovati giorni sotto il target proteico del piano (~130-150 g): estate Gio/Dom, inverno Mer/Gio/Ven/Sab/Dom.
- Correzione in `mealPlan.ts` (scambi mirati, calorie invariate): spuntini poveri di proteine → `spuntino-edamame-salati`/`spuntino-yogurt-mandorle`; estate Dom cena→`platessa`, colazione→`yogurt-avena`; estate Gio colazione→`frittata-microonde`; inverno Mer colazione→`frittata-microonde`; inverno Sab cena→`tacchino-padella-funghi`.
- Risultato: tutti i 14 giorni ≥122 g proteine (moderata); medie estate **141 g**, inverno **131 g**; calorie 1867-2296 (moderata). Fibre alte ma ok (un paio di giorni invernali ~57-66 g → introdurre gradualmente). Guida/PDF rigenerati.

### Aggancio ai giorni reali + rotazione 2 settimane estate (giugno 2026)
- `getDayTemplate` (in `planning.ts`) ora sceglie il template dal **giorno reale** della settimana (Lun=0…Dom=6) e dal numero di settimana (allineato al lunedì), non più da `epochDay % 7`. Così le etichette Lun…Dom coincidono coi giorni veri ed è coerente con gli allenamenti (già su `mondayIndex`) e col giorno "attivo" (tapis roulant).
- `SeasonPlan.days` = concatenazione di settimane da 7 (Lun→Dom): 7 = 1 settimana fissa, 14 = 2 che si alternano. **Estate E inverno = 2 settimane (A+B)** (settimana B inverno aggiunta giugno 2026; vedi sezione dedicata).
- **+5 nuovi pranzi "da ufficio" estivi**: `pranzo-orzo-pollo-feta`, `pranzo-pasta-tonno-verdure`, `pranzo-riso-ceci-feta`, `pranzo-cous-cous-sgombro`, `pranzo-lenticchie-feta-estiva` (tutti `office`, freddi/make-ahead). Settimana B: ogni pasto diverso dalla A nello stesso giorno; pranzi feriali tutti `office`. Media B ~1647 kcal / 108 g base (×1.3 moderata ≈ 2140 kcal / 140 g); tutti i giorni ≥122 g proteine (moderata).
- **Zenzero** reso `opzionale` nel riso+edamame (ricetta ok senza); gli ingredienti con nota `opzional*` ora **non** entrano in lista spesa (`ingredientsForRange` in `shopping.ts`).

### Sincronizzazione cloud telefono ↔ PC (giugno 2026)
- **Scelta utente:** voleva sincronizzare i dispositivi → accettata un'eccezione al "solo locale". Backend scelto: **gist PRIVATO di GitHub** (account che già usa; dati nel suo account, non in un DB di terzi; gratis). Alternative scartate: Supabase/Firebase (nuovo SaaS), Drive (OAuth fragile da sito statico).
- **Sicurezza:** serve un PAT con **solo scope `gist`**, salvato **solo in localStorage** (`sync.token`), mai nel backup né nel gist, inviato solo ad `api.github.com`. Mai chiedere/incollare il token in chat.
- **Cosa si sincronizza:** i 5 store dati (pantry, shopping, weights, essentials, workouts). **NON le settings** (stagione, intensità, orari notifiche restano per-dispositivo apposta) → in `syncNow` si fa `{...exportData(), settings: undefined}` e `importData` salta le settings se assenti.
- **`src/lib/sync.ts`** (nuovo): config in localStorage; API GitHub (`/user`, `/gists`); `findGist` ritrova da solo il gist sul 2° dispositivo via filename marcatore `dieta-mediterranea-cangiante-sync.json`; `syncNow` (guardia anti-concorrenza `inFlight`) = pull→merge→push, scrive in locale/sul gist **solo se la forma canonica cambia**; `syncInBackground` (silenziosa); `linkAccount`/`unlinkAccount`.
- **Fusione anti-perdita** in `backup.ts`: `mergeBackup`/`canonicalString` fondono **record per record** su chiave stabile (pantry/shopping=ingredientId, weights=date, essentials=date|essentialId, workouts=date|title) con **newest-wins via `updatedAt`** (id autoincrement rimosso → Dexie ne assegna di nuovi). Aggiunto `updatedAt?` a WeightEntry/EssentialLog/WorkoutLog e settato a ogni scrittura (Today/Workouts/Weight). `BackupData.settings` ora opzionale. Limite noto: union-merge non propaga le cancellazioni (es. flag spesa cancellati possono riapparire dall'altro dispositivo finché non sincronizza; impatto minimo).
- **Trigger** in `App.tsx`: `syncInBackground()` all'avvio e su `visibilitychange` (visible = pull, hidden = push). UI in **Impostazioni → Sincronizzazione**: incolla token → «Collega», poi «Sincronizza ora»/«Scollega»; stato + ultimo errore mostrati.
- **Lint:** la regola `react-hooks/purity` segnala `Date.now()` inline negli handler con argomenti non in `useCallback` → `toggleEssential` (Today) e `markDone` (Workouts) avvolti in `useCallback` (come `toggleBought` in Shopping).

### Migliorie giugno 2026: settimana B inverno + pasti mangiati + scambia pasto
- **Settimana B invernale:** `invernoDays` ora 14 giorni come l'estate. Settimana B allineata ai giorni reali, ogni pasto diverso dalla A nello stesso giorno, pranzi feriali tutti `office`, cene tutte distinte. Totali base 1452–1850 kcal (banda di A; ×1.3 moderata ≈ target). PDF: `planTable` mostra un separatore «Settimana A/B» quando il piano ha >7 giorni.
- **Lazy-load grafico Peso:** già presente da prima (`lazy(() => import('../components/WeightChart'))` + `Suspense`); recharts è un chunk separato, non nel bundle iniziale. Nessuna modifica necessaria.
- **DB v2:** due nuovi store con chiave composta `[date+slot]`: `mealStatus` (eaten/half/skipped) e `mealOverride` (recipeId sostitutivo). `this.version(2).stores({...})` aggiunge solo i nuovi store (gli altri restano da v1). Entrambi inclusi in `exportData`/`importData`/`mergeBackup` (chiave merge `${date}|${slot}`), quindi **si sincronizzano** col gist. `BackupData.mealStatus/mealOverride` opzionali.
- **Barra calorie (schermo Oggi):** ogni pasto ha i pulsanti Mangiato/Metà/Saltato; la barra mostra consumate vs pianificate del giorno (half = 50%). `setMealStatus` in `useCallback` (ri-tocco sullo stato attivo → lo azzera).
- **Scambia pasto:** override per `[date+slot]` applicato in **planning** (`getRecipesForDate` ha un param opzionale `overrides?: OverrideMap`, mappa `${dataISO}|${slot}`→recipeId; helper `buildOverrideMap`, `recipesForSlot`). Propagato a `shopping.ts` (`ingredientsForRange`/`buildShoppingList`/`missingForDate`), a **Today/Plan/Shopping** (ognuno carica `db.mealOverride` via `useLiveQuery`) e al promemoria «compra per domani» in `App.tsx`. UI di scambio solo in Oggi (modale con `recipesForSlot`, vale per oggi; pill «🔁 scambiato»; «Ripristina il pasto del piano»). Risolve l'attrito ricorrente «il piano mostra X ma io ho preparato Y».
- **Lint:** handler con argomenti che chiamano `Date.now()` vanno in `useCallback` (regola `react-hooks/purity`): `setMealStatus`, `setOverride`, `clearOverride`.

### Migliorie giugno 2026 (2ª ondata): dispensa quantitativa, uva, tagli, prep day
- **Dispensa quantitativa** (`src/lib/pantryQty.ts`): gli ingredienti consumabili (non staple,
  non condimenti/bevande/dispensa, unità g/ml/pz — `isQtyTracked`) possono avere `qty` reale in
  `PantryItem` (campo opzionale, niente migrazione). Segnare un pasto Mangiato/Metà scala gli
  ingredienti tracciati ×fattore intensità (`setMealStatusWithPantry`, transazione unica);
  lo snapshot `MealStatus.consumed` registra quanto è stato tolto davvero → **storno esatto**
  se si cambia idea. Saltato/non segnato = 0. Mai sotto zero.
- **Lista spesa quantitativa:** `buildShoppingList`/`missingForDate` accettano `qtyMap`+`factor`;
  per i tracciati compare solo la **differenza** (fabbisogno − dispensa), quindi «quasi finito»
  torna in lista senza aspettare lo zero. All'acquisto: selettore **formati pacco**
  (`PACK_PRESETS` per unità + campo libero, niente slider); «Aggiungi i comprati alla dispensa»
  somma le quantità (`addPurchaseToPantry`). `ShoppingCheck.qty` opzionale.
- **Abbondanze:** `surplusIngredients` = qty > fabbisogno dei prossimi 7 giorni; badge
  «📦 abbondante» in Dispensa ed evidenza «📦 usa la dispensa» (in cima) nello scambia pasto.
  In Dispensa: bottone quantità per ingrediente (editor con preset + «smetti di contare»).
  Il toggle manuale ✓/✗ azzera la quantità (conteggio non più affidabile).
- **Barra di quantità** (`src/components/QtyBar.tsx`, giugno 2026): per ogni ingrediente
  tracciato la barra mostra `qty/qtyFull`, dove `PantryItem.qtyFull` = livello dell'ultimo
  rifornimento (acquisto o correzione al rialzo lo resettano a «pieno»; consumo e correzioni
  al ribasso lo lasciano fermo → la barra scende; ≤20% diventa terracotta). Campo opzionale,
  niente migrazione; viaggia gratis in backup/sync (righe pantry intere). Visibile in
  Dispensa (sotto ogni riga), nel dettaglio ricetta (sotto ogni ingrediente, con «in
  dispensa: X g») e in Lista spesa (righe «ne hai X»). Hook `usePantryLevels()`; QtyBar è
  fatta di `<span display:block>` per poter stare nel `detail` inline di CheckRow.
- **Frutta:** eliminati mirtilli, lamponi e kiwi (l'utente NON tollera frutta con tanti piccoli
  semi → conati; niente frutti di bosco/fragole/kiwi). Fonte di antociani = **uva nera/rossa
  con la buccia** (80 g nelle ricette yogurt/kefir, macro ricalcolati; pilastro quotidiano
  aggiornato con fonte onesta: meta-analisi Pan 2025 sugli antociani come classe).
- **Lavaggio e tagli:** nuova sezione guida `lavaggio-tagli` (acqua corrente basta, amuchina
  solo immunodepressi/gravidanza, bicarbonato facoltativo; lavare solo al momento del consumo)
  + `src/data/cuttingGuide.ts` (fonte unica, 15 schede taglio per principianti). Nel dettaglio
  ricetta: bottone «🔪 Come tagliare» con le sole verdure della ricetta.
- **Giorni passati:** in Piano → Giorno si può segnare Mangiato/Metà/Saltato per oggi e i
  giorni precedenti (stessa logica dispensa); componente condiviso `MealStatusButtons`.
### Migliorie giugno 2026 (4ª ondata): tema scuro, icone lucide, lazy, shortcuts
- **Icone professionali**: emoji sostituite da **lucide-react** (SVG monocromatici currentColor)
  in nav (9 voci), header (Settings/CloudAlert), titoli card (`Card.icon` ora ReactNode,
  classe `.card-icon`), pill (`Briefcase` ufficio, `Package` abbondante, `Snowflake` freezer,
  `Star` base, `Flame` attivo), bottoni e banner (classe utility `svg.ic` = inline baseline).
  Le emoji restano SOLO come contenuto (verdetti prep 🧺🧊🍳, messaggi motivazionali).
- **Tema scuro**: `useTheme.ts` (pref `themePref` auto/chiaro/scuro in settings Dexie,
  per-dispositivo); App applica `data-theme` su `<html>` + aggiorna `meta theme-color`
  (chiaro #2f9389, scuro #12332f) e segue `prefers-color-scheme` in auto. CSS:
  `:root[data-theme='dark']` ridefinisce le var (teal notte #0e1b19, card #142624;
  ATTENZIONE: `--olive-dark` al buio è un colore da TESTO chiaro — le superfici che lo
  usavano come sfondo (header, sidebar desktop) e i testi che usavano `--cream` (header,
  `.btn`) hanno override dedicati). Toggle in Impostazioni, sezione «Tema».
- **Indicatore sync**: `SYNC_EVENT` emesso dopo ogni sync → icona `CloudAlert` ambra
  nell'header quando attiva+fallita (apre Impostazioni); lo stato in Impostazioni si
  auto-aggiorna sull'evento.
- **Lazy loading**: tutte le schermate tranne Oggi in `React.lazy` (bundle iniziale
  ~280 kB da ~506; il SW precacha comunque tutto → offline ok).
- **Shortcut Android** (manifest `shortcuts`): Lista spesa / Oggi / Pesata via `?view=`,
  letto all'avvio (`initialView()` in App).
- **Grafico Peso**: media mobile 7 gg per data (linea tratteggiata grigia), punti cerchiati
  sulle misure complete (`fullValue` quando c'è visceralFat), tooltip/griglia compatibili
  col tema scuro, legenda sotto il grafico.
- **scripts/screenshot.mjs** ora fotografa anche le varianti dark (4 combo).

### Migliorie giugno 2026 (3ª ondata): scadenze frigo, modalità cucina, germogli, aderenza
- **Avvisi scadenza frigo** (`src/lib/freshness.ts`): `PantryItem.freshSince` (timestamp,
  opzionale) viene impostato quando un DEPERIBILE entra in dispensa (acquisto in
  `addPurchaseToPantry` o spunta manuale in `setPantryHave`); deperibile = lo storage
  dell'ingrediente dichiara giorni di frigo (regex su "Frigo 1-2 gg"; uova "Frigo" senza numero
  = escluse). Quando i giorni sono raggiunti → banner in Oggi «cucinalo oggi o congelalo» con
  bottoni «🧊 Congelato» (= `markFrozen`: flag `PantryItem.frozen`, stop timer) e «Gestito»
  (= `dismissFreshness`, azzera solo il timer).
- **Promemoria scongelamento:** se un ingrediente flaggato `frozen` serve nei pasti di DOMANI
  → banner info in Oggi «stasera sposta dal freezer al frigo» (scongelamento lento); se serve
  OGGI → banner warn col recupero (microonde defrost o scambia pasto). «✓ è in frigo» =
  `markThawedToFridge`: toglie il flag e RIAVVIA `freshSince` (lo scongelato tiene 1-2 gg →
  tornerà l'avviso "cucinalo", e non si ricongela da crudo). Flag gestibile anche dal modal
  quantità in Dispensa (pill «🧊 freezer»); acquisti e toggle manuali lo azzerano.
- **Modalità cucina** (`src/components/CookMode.tsx`, bottone nel dettaglio ricetta): overlay
  a tutto schermo (z-index 1000, sopra i Modal), schermata ingredienti → un passo alla volta a
  caratteri grandi, **timer** auto-rilevato dai minuti nel testo del passo (resta attivo
  cambiando passo; bip WebAudio + vibrazione), **Wake Lock** con riacquisizione su
  visibilitychange.
- **Tracker germogli (DB v4):** store `sprouts` (`++id, startedAt`; `harvestedAt` opzionale;
  in backup/sync, merge key `startedAt`). `src/lib/sprouts.ts`: giorno 0 = ammollo, raccolto
  tipico giorno 5, istruzione per giorno (`sproutInstruction`). Card in Oggi
  (`SproutsCard.tsx`): avvia barattolo / barra avanzamento / istruzione del giorno / Raccolti
  (frigo 5-7 gg, avviso «avvia il prossimo» dal 4° giorno post-raccolto).
- **Aderenza al piano** (`src/lib/adherence.ts`, card in Peso): ultimi 28 giorni di
  `mealStatus` → % aderenza (mangiati + metà/2 sui segnati), conteggi, streak (giorni
  consecutivi con ≥1 mangiato e 0 saltati), **ricette saltate ≥2 volte** (top 3) con invito a
  scambiarle.
- **Promemoria misura completa** (Peso): banner se l'ultima registrazione con grasso
  viscerale ha più di 30 giorni (o non esiste). Il form StarFit completo esisteva già.
- **Esporta lista spesa** (Spesa): «Condividi / copia la lista» — testo raggruppato per
  reparto delle sole voci non comprate; `navigator.share` sul telefono, appunti sul PC.

- **Prep day (DB v3):** store `prepLog` `[date+slot]` (sincronizzato in backup/gist). Sezione dedicata «🍱 Prep day» nel menu (9ª voce, schermata `src/screens/Prep.tsx`): i 5 pranzi da ufficio della settimana target (weekend → settimana
  prossima; feriale → corrente). Layout stile «Oggi» (richiesta utente 2026-06-12): UNICA
  spunta = il toggle «prep day fatto»; niente spunte per pranzo. Ogni giorno Lun–Ven è una
  card col verdetto 🧺/🧊/🍳 e la ricetta COMPLETA aperta inline (`RecipeDetail`),
  richiudibile dal titolo. Banner domenicale in Home → apre la sezione Prep day. NB:
  l'utente la vuole come voce di menu PROPRIA, consultabile ogni giorno (non solo la
  domenica) — me l'ha ribadito due volte.
- **Toggle «prep day fatto»** (`src/lib/prep.ts`) — IMPORTANTE: il piano base NON si tocca
  (l'utente l'ha chiesto esplicitamente dopo un primo tentativo sbagliato di riordino fisso).
  Sentinella in `prepLog` (`slot: 'settimana'`, date = lunedì). ON → `prepWeekArrangement`
  riassegna i 5 pranzi feriali del piano base ai giorni (sort stabile per robustezza:
  shelf-life corta → Lun, surgelabili → Gio-Ven) e li materializza come normali `mealOverride`
  (così spesa/notifiche/sync funzionano gratis). OFF → rimuove sentinella e SOLO gli override
  che corrispondono ancora al riordino (gli scambi manuali restano). In estate le insalate
  fredde NON si congelano → il riordino mette comunque le più deperibili prima, e
  `prepAdvice()` deriva il verdetto 🧺/🧊/🍳 dalla nota `storage` (regex frigo N giorni/congel).
- **Ufficio: SOLO microonde max 850 W** → `office: true` aggiunto a riso-integrale-edamame e
  zuppa-lenticchie-farro (si scaldano lì); istruzioni di riscaldamento (850 W, tempi) nel
  banner «Da ufficio» del dettaglio ricetta e nella vista Prep.
- **PWA update fix:** la PWA installata non si aggiornava finché non veniva riaperta da zero →
  `main.tsx` ora fa `registration.update()` a ogni ritorno in primo piano e ogni ora.

### Note tecniche per riprendere
- PDF: la rigenerazione richiede Edge/Chrome (assente su CI Linux) → il PDF è in `public/` e va versionato; rigenerare in locale con `npm run build:pdf`.
- Edge headless richiede `--user-data-dir` dedicato (vedi build-pdf.mjs), altrimenti se Edge è già aperto esce con status 0 senza creare il file.
- Warning build non bloccante: chunk JS ~751 KB (recharts). Possibile miglioria: lazy-load del grafico Peso.
- esbuild aggiunto come devDependency solo per bundlare i dati nel generatore PDF.

## Come girare
```
npm run dev      # sviluppo
npm run build    # build statica in dist/
npm run lint     # eslint
```

## Note integrità
BMI in classe obesità → il PDF/app consiglia consulto medico. Contenuti educativi, non sostituiscono parere medico.
