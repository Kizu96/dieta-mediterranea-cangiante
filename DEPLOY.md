# Come pubblicare e installare l'app (gratis)

L'app è una PWA statica: dati solo sul dispositivo, nessun server, gratis per sempre.
La cartella già pronta da pubblicare è **`dist/`** (creata con `npm run build`).

---

## Metodo A — Netlify Drop (più veloce, consigliato, zero configurazione)

1. Apri **https://app.netlify.com/drop** nel browser.
2. Trascina la cartella **`dist/`** (`G:\Clauding\Dieting\dist`) nel riquadro.
3. In pochi secondi ottieni un URL pubblico HTTPS (es. `https://nome-random.netlify.app`).
4. (Facoltativo) Crea un account gratuito per rinominare il sito e mantenerlo stabile.

Apri quell'URL su Android e su PC: è la tua app.

---

## Metodo B — Netlify collegato a Git (aggiornamenti automatici)

1. Crea un repo su GitHub e fai push del progetto.
2. Su Netlify: *Add new site → Import from Git* → seleziona il repo.
3. Netlify legge `netlify.toml`: build `npm run build`, publish `dist`. Conferma.
4. Ogni push aggiorna il sito.
   > Nota: il PDF è già versionato in `public/Guida-Dieta.pdf`, quindi la build in
   > cloud non deve rigenerarlo. Quando cambi le ricette/guide, rigeneralo **in locale**
   > con `npm run build:pdf` (serve Edge o Chrome) e fai commit del PDF aggiornato.

Alternative equivalenti gratuite: **GitHub Pages**, **Cloudflare Pages**, **Vercel**
(stessa cartella `dist/`).

---

## Installare la PWA (per averla come app)

**Android (Chrome):** apri l'URL → menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.
**Windows (Edge/Chrome):** apri l'URL → icona *Installa* nella barra degli indirizzi
(oppure menu → *App → Installa questo sito come app*).

Una volta installata funziona offline e compare tra le app del dispositivo.

> Le notifiche locali (spesa serale, allenamento, pesata) funzionano in modo affidabile
> mentre l'app è aperta/installata. Senza un server non è possibile garantire la consegna
> ad app chiusa: è una scelta voluta per restare gratis e senza account.

---

## Lavorare in locale

```
npm install        # solo la prima volta
npm run dev        # sviluppo su http://localhost:5173
npm run build      # genera dist/ (produzione)
npm run preview    # serve dist/ su http://localhost:4173
npm run build:pdf  # rigenera public/Guida-Dieta.pdf dai contenuti (richiede Edge/Chrome)
```
