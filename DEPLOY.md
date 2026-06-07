# Come pubblicare e installare l'app (gratis)

L'app è una PWA statica: dati solo sul dispositivo, nessun server, gratis per sempre.
La cartella pubblicabile è **`dist/`** (creata con `npm run build`).

> **Stato attuale (giugno 2026): hosting su GitHub Pages.**
> Netlify ha esaurito i crediti del piano gratuito (deploy di produzione bloccati), quindi per
> ora pubblichiamo su **GitHub Pages**. **Piano: ripristinare Netlify intorno a inizio luglio 2026**,
> quando i crediti si resettano (vedi "Tornare a Netlify" in fondo).

**URL live:** https://kizu96.github.io/dieta-mediterranea-cangiante/

---

## Metodo attuale — GitHub Pages (automatico)

Il repo `Kizu96/dieta-mediterranea-cangiante` è **pubblico** (GitHub Pages sul piano free richiede
repo pubblico) e ha l'Action `.github/workflows/deploy.yml`:

1. Fai `git push` su `main`.
2. L'Action builda (`npm run build`) e pubblica `dist/` su Pages (`actions/deploy-pages`).
3. In ~1 minuto le modifiche sono online.

Note tecniche:
- Vite usa `base: '/dieta-mediterranea-cangiante/'` (sottocartella di Pages). I percorsi runtime
  (icona notifiche, link al PDF) usano `import.meta.env.BASE_URL`, quindi restano corretti.
- Il PDF è già versionato in `public/Guida-Dieta.pdf`: la build in cloud non lo rigenera. Quando
  cambi ricette/guide, rigeneralo **in locale** con `npm run build:pdf` (serve Edge/Chrome) e
  committa il PDF aggiornato.
- I repo pubblici hanno GitHub Actions gratis e illimitato: nessun limite di crediti.

---

## Installare la PWA (per averla come app)

Apri **https://kizu96.github.io/dieta-mediterranea-cangiante/** e:

**Android (Chrome):** menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.
**Windows (Edge/Chrome):** icona *Installa* nella barra degli indirizzi (oppure menu → *App →
Installa questo sito come app*).

Una volta installata funziona offline e compare tra le app del dispositivo.

> Le notifiche locali (spesa serale, allenamento, pesata) funzionano mentre l'app è aperta/installata.
> Senza un server non è possibile garantire la consegna ad app chiusa: scelta voluta per restare
> gratis e senza account.

### ⚠️ Spostare i dati quando cambia l'URL
I dati (peso, misure, dispensa…) sono salvati **per-sito** (IndexedDB per-origin): cambiando
indirizzo NON si trasferiscono da soli. Per migrarli: vecchia app → **Impostazioni → Esporta dati**
(JSON), nuova app → **Impostazioni → Importa backup**.

---

## Lavorare in locale

```
npm install        # solo la prima volta
npm run dev        # sviluppo su http://localhost:5173
npm run build      # genera dist/ (produzione)
npm run preview    # serve dist/ su http://localhost:4173
npm run build:pdf  # rigenera public/Guida-Dieta.pdf dai contenuti (richiede Edge/Chrome)
```

---

## Tornare a Netlify (≈ inizio luglio 2026, quando i crediti si resettano)

Quando i crediti Netlify saranno di nuovo disponibili, per riportare l'hosting su Netlify:

1. **Rimetti `base: '/'`** in `vite.config.ts` (Netlify serve dalla radice, non da sottocartella),
   e riallinea `start_url`/`scope` del manifest a `'/'`. Poi `npm run build`.
2. Ripristina il workflow di deploy Netlify (vedi storia git: era `deploy.yml` con
   `netlify-cli deploy --prod --dir=dist`) e i secret `NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID`
   (rigenera il token Netlify se scaduto).
3. In alternativa, deploy manuale: trascina `dist/` su **https://app.netlify.com/drop** o, nel
   sito esistente, *Deploys → Deploy manually*.
4. Valuta se rimettere il repo **privato** (GitHub Pages non servirà più).
5. Ricorda la migrazione dati (Esporta/Importa) se cambia di nuovo l'URL.

> Per deploy in cloud non serve Edge: PDF e icone sono versionati in `public/`.
