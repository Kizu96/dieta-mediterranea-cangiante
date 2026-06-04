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
- Cioccolato 85%, frutti di bosco, fermentati (kimchi/crauti): polifenoli + microbiota.

## Stack & hosting
Vite + React 19 + TypeScript + Dexie (IndexedDB) + recharts + date-fns + vite-plugin-pwa.
Hosting gratuito consigliato: **Netlify** (drag-&-drop di `dist/`). Alternative: GitHub Pages, Cloudflare Pages, Vercel.
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

### Deploy automatico
- `gh` autenticato (Kizu96). Repo GitHub creato e pushato → collegare il sito Netlify esistente (mydieting.netlify.app) al repo in dashboard per deploy continuo. PDF/icone versionati, build cloud = `npm run build` (no Edge richiesto).

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
