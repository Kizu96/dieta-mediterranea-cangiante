import type { Ingredient } from './types';

// Lista ingredienti completa per la dieta mediterranea "cangiante" (green-MED).
// Tutti facili da reperire nei supermercati italiani e adatti a chi vive da solo.
// Ogni `id` usato in recipes.ts DEVE esistere qui.
// `staple: true` = da tenere sempre in dispensa (lunga conservazione).
export const ingredients: Ingredient[] = [
  // ----- CONDIMENTI / DISPENSA BASE ------------------------------------------
  { id: 'olio-evo', name: 'Olio extravergine di oliva', category: 'condimenti', unit: 'cucchiai', storage: 'Luogo fresco e buio, tappo ben chiuso', shelfLife: '18-24 mesi', staple: true },
  { id: 'sale', name: 'Sale fino', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta', shelfLife: 'illimitato', staple: true },
  { id: 'sale-grosso', name: 'Sale grosso (senza iodio per fermentazioni)', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta', shelfLife: 'illimitato', staple: true },
  { id: 'pepe', name: 'Pepe nero (in grani, da macinare)', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, macinino chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'aceto-mele', name: 'Aceto di mele', category: 'condimenti', unit: 'cucchiai', storage: 'Dispensa, tappo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'senape', name: 'Senape (tipo Dijon)', category: 'condimenti', unit: 'cucchiaini', storage: 'Dispensa; aperta in frigo', shelfLife: '12 mesi (aperta 6 mesi)', staple: true },
  { id: 'paprika', name: 'Paprika dolce (o affumicata, per un tocco grigliato)', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'curcuma', name: 'Curcuma in polvere', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'cumino', name: 'Cumino in polvere', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'origano', name: 'Origano secco', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'cannella', name: 'Cannella in polvere', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'peperoncino', name: 'Peperoncino (in fiocchi o macinato)', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta, barattolo chiuso', shelfLife: '2-3 anni', staple: true },
  { id: 'gochugaru', name: 'Peperoncino coreano in scaglie (gochugaru)', category: 'condimenti', unit: 'g', storage: 'Dispensa asciutta o freezer per lunga durata', shelfLife: '1-2 anni', staple: true },
  { id: 'zenzero', name: 'Zenzero fresco', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto; oppure pelato e congelato', shelfLife: '3-4 settimane in frigo' },
  { id: 'salsa-soia', name: 'Salsa di soia (a ridotto contenuto di sale)', category: 'condimenti', unit: 'cucchiai', storage: 'Dispensa; aperta meglio in frigo', shelfLife: '2 anni', staple: true },
  { id: 'tahin', name: 'Tahin (crema di sesamo)', category: 'condimenti', unit: 'cucchiai', storage: 'Dispensa; aperto in frigo, mescolare', shelfLife: '12 mesi', staple: true },
  { id: 'miele', name: 'Miele', category: 'dispensa', unit: 'cucchiaini', storage: 'Dispensa a temperatura ambiente', shelfLife: 'praticamente illimitato', staple: true },

  // ----- VERDURA -------------------------------------------------------------
  { id: 'aglio', name: 'Aglio', category: 'verdura', unit: 'spicchi', storage: 'Luogo fresco e ventilato, non in frigo', shelfLife: '2-3 mesi', staple: true },
  { id: 'cipolla', name: 'Cipolla dorata', category: 'verdura', unit: 'pz', storage: 'Luogo fresco, buio e ventilato', shelfLife: '1-2 mesi', staple: true },
  { id: 'cipollotto', name: 'Cipollotto fresco', category: 'verdura', unit: 'pz', storage: 'Frigo nel cassetto verdure', shelfLife: '1 settimana' },
  { id: 'carota', name: 'Carote', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '2-3 settimane', staple: true },
  { id: 'sedano', name: 'Sedano (a coste)', category: 'verdura', unit: 'g', storage: 'Frigo, avvolto in pellicola o panno umido', shelfLife: '1-2 settimane' },
  { id: 'broccoli-germogli', name: 'Germogli di broccoli (coltivati in casa)', category: 'verdura', unit: 'g', storage: 'Frigo in contenitore con carta assorbente', shelfLife: '4-6 giorni' },
  { id: 'germogli-misti', name: 'Germogli misti (alfalfa/lenticchie, in casa)', category: 'verdura', unit: 'g', storage: 'Frigo in contenitore con carta assorbente', shelfLife: '4-6 giorni' },
  { id: 'spinaci', name: 'Spinaci freschi', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '4-5 giorni' },
  { id: 'spinaci-surgelati', name: 'Spinaci surgelati', category: 'surgelati', unit: 'g', storage: 'Freezer', shelfLife: '12-18 mesi', staple: true },
  { id: 'rucola', name: 'Rucola', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '3-4 giorni' },
  { id: 'cavolo-nero', name: 'Cavolo nero', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '5-7 giorni', seasons: ['inverno'] },
  { id: 'cavolo-cappuccio', name: 'Cavolo cappuccio', category: 'verdura', unit: 'g', storage: 'Frigo; intero si conserva a lungo', shelfLife: '2-4 settimane', seasons: ['inverno'] },
  { id: 'cavolfiore', name: 'Cavolfiore bianco', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '1 settimana', seasons: ['inverno'] },
  { id: 'broccolo', name: 'Broccolo', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '5-7 giorni', seasons: ['inverno'] },
  { id: 'verza', name: 'Verza', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '1-2 settimane', seasons: ['inverno'] },
  { id: 'zucchine', name: 'Zucchine', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '5-7 giorni', seasons: ['estate'] },
  { id: 'melanzane', name: 'Melanzane', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '5-7 giorni', seasons: ['estate'] },
  { id: 'peperoni', name: 'Peperoni (rossi o gialli)', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '1 settimana', seasons: ['estate'] },
  { id: 'pomodori', name: 'Pomodori ramati (da insalata)', category: 'verdura', unit: 'g', storage: 'Temperatura ambiente (in frigo solo se molto maturi)', shelfLife: '5-7 giorni', seasons: ['estate'] },
  { id: 'pomodorini', name: 'Pomodorini ciliegino', category: 'verdura', unit: 'g', storage: 'Temperatura ambiente o frigo', shelfLife: '1 settimana', seasons: ['estate'] },
  { id: 'pomodori-pelati', name: 'Pomodori pelati (barattolo)', category: 'dispensa', unit: 'g', storage: 'Dispensa; aperti in frigo 3-4 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'cetriolo', name: 'Cetriolo', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '1 settimana', seasons: ['estate'] },
  { id: 'finocchio', name: 'Finocchio', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '1 settimana', seasons: ['inverno'] },
  { id: 'lattuga', name: 'Lattuga / insalata mista', category: 'verdura', unit: 'g', storage: 'Frigo nel cassetto verdure', shelfLife: '4-5 giorni' },
  { id: 'funghi', name: 'Funghi champignon', category: 'verdura', unit: 'g', storage: 'Frigo in sacchetto di carta', shelfLife: '4-5 giorni' },
  { id: 'patata-dolce', name: 'Patata dolce (batata)', category: 'verdura', unit: 'g', storage: 'Luogo fresco e buio, non in frigo', shelfLife: '2-3 settimane' },
  { id: 'prezzemolo', name: 'Prezzemolo', category: 'verdura', unit: 'g', storage: 'Frigo in bicchiere con acqua o congelato tritato', shelfLife: '1 settimana' },
  { id: 'basilico', name: 'Basilico fresco', category: 'verdura', unit: 'g', storage: 'Temperatura ambiente in bicchiere con acqua', shelfLife: '4-5 giorni', seasons: ['estate'] },

  // ----- FRUTTA --------------------------------------------------------------
  { id: 'limone', name: 'Limone', category: 'frutta', unit: 'pz', storage: 'Frigo nel cassetto', shelfLife: '2-3 settimane', staple: true },
  { id: 'mela', name: 'Mela (a piacere, es. Fuji o Gala)', category: 'frutta', unit: 'pz', storage: 'Frigo nel cassetto; o luogo fresco', shelfLife: '2-3 settimane', staple: true },
  { id: 'pera', name: 'Pera', category: 'frutta', unit: 'pz', storage: 'Temperatura ambiente fino a maturazione, poi frigo', shelfLife: '1 settimana', seasons: ['inverno'] },
  { id: 'arancia', name: 'Arancia', category: 'frutta', unit: 'pz', storage: 'Frigo o luogo fresco', shelfLife: '2-3 settimane', seasons: ['inverno'] },
  { id: 'mandarino', name: 'Mandarino / clementine', category: 'frutta', unit: 'pz', storage: 'Frigo o luogo fresco', shelfLife: '1-2 settimane', seasons: ['inverno'] },
  { id: 'banana', name: 'Banana', category: 'frutta', unit: 'pz', storage: 'Temperatura ambiente', shelfLife: '4-6 giorni', staple: true },
  { id: 'pesca', name: 'Pesca', category: 'frutta', unit: 'pz', storage: 'Temperatura ambiente, poi frigo', shelfLife: '4-5 giorni', seasons: ['estate'] },
  { id: 'anguria', name: 'Anguria', category: 'frutta', unit: 'g', storage: 'Frigo una volta tagliata', shelfLife: '3-4 giorni tagliata', seasons: ['estate'] },
  { id: 'melone', name: 'Melone', category: 'frutta', unit: 'g', storage: 'Frigo una volta tagliato', shelfLife: '3-4 giorni tagliato', seasons: ['estate'] },
  // Niente frutti di bosco, fragole o kiwi: la frutta con tanti piccoli semi non è
  // tollerata dall'utente. La fonte di antociani del piano è l'uva nera/rossa con la buccia.
  { id: 'uva', name: 'Uva nera o rossa (con buccia)', category: 'frutta', unit: 'g', storage: 'Frigo nel cassetto frutta; lavala solo poco prima di mangiarla', shelfLife: '5-7 giorni' },
  { id: 'uvetta', name: 'Uvetta (uva passa)', category: 'dispensa', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12 mesi', staple: true },

  // ----- PROTEINE (carne/uova) ----------------------------------------------
  { id: 'uova', name: 'Uova (medie, fresche)', category: 'proteine', unit: 'pz', storage: 'Frigo', shelfLife: '3-4 settimane', staple: true },
  { id: 'petto-pollo', name: 'Petto di pollo (fresco)', category: 'proteine', unit: 'g', storage: 'Frigo 1-2 gg; appena comprato dividilo in porzioni singole da ~150 g (un sacchetto gelo a porzione, schiacciato piatto) e congela: scongeli solo quella che ti serve', shelfLife: '3-4 mesi in freezer' },
  { id: 'fesa-tacchino', name: 'Fesa di tacchino fresca (fettine, da cuocere)', category: 'proteine', unit: 'g', storage: 'Frigo 1-2 gg; appena comprata dividi le fettine in porzioni singole da ~150 g (un sacchetto gelo a porzione, schiacciato piatto) e congela: scongeli solo quella che ti serve', shelfLife: '3-4 mesi in freezer' },

  // ----- PESCE ---------------------------------------------------------------
  { id: 'tonno-naturale', name: 'Tonno al naturale (scatoletta)', category: 'pesce', unit: 'g', storage: 'Dispensa; aperto in frigo 1-2 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'sgombro-naturale', name: 'Sgombro al naturale (scatoletta)', category: 'pesce', unit: 'g', storage: 'Dispensa; aperto in frigo 1-2 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'sardine-olio', name: "Sardine sott'olio o al naturale (scatoletta)", category: 'pesce', unit: 'g', storage: 'Dispensa; aperte in frigo 1-2 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'salmone-fresco', name: 'Filetto di salmone fresco', category: 'pesce', unit: 'g', storage: 'Frigo 1 giorno; oppure congelare', shelfLife: '2-3 mesi in freezer' },
  { id: 'salmone-affumicato', name: 'Salmone affumicato', category: 'pesce', unit: 'g', storage: 'Frigo; una volta aperto 2-3 gg', shelfLife: '2-3 settimane chiuso' },
  { id: 'gamberetti-surgelati', name: 'Gamberetti surgelati', category: 'surgelati', unit: 'g', storage: 'Freezer', shelfLife: '6-12 mesi', staple: true },
  { id: 'merluzzo-surgelato', name: 'Filetti di merluzzo surgelati', category: 'surgelati', unit: 'g', storage: 'Freezer', shelfLife: '6-12 mesi', staple: true },
  { id: 'platessa-surgelata', name: 'Filetti di platessa surgelati', category: 'surgelati', unit: 'g', storage: 'Freezer', shelfLife: '6-12 mesi' },

  // ----- LATTICINI -----------------------------------------------------------
  { id: 'yogurt-greco', name: 'Yogurt greco bianco 0-2%', category: 'latticini', unit: 'g', storage: 'Frigo', shelfLife: '2-3 settimane (vedi data)' },
  { id: 'yogurt-intero', name: 'Yogurt bianco intero', category: 'latticini', unit: 'g', storage: 'Frigo', shelfLife: '2-3 settimane (vedi data)' },
  { id: 'skyr', name: 'Skyr (yogurt islandese)', category: 'latticini', unit: 'g', storage: 'Frigo', shelfLife: '2-3 settimane (vedi data)' },
  { id: 'ricotta', name: 'Ricotta (vaccina)', category: 'latticini', unit: 'g', storage: 'Frigo', shelfLife: '4-5 giorni (vedi data)' },
  { id: 'feta', name: 'Feta', category: 'latticini', unit: 'g', storage: 'Frigo nella sua salamoia', shelfLife: '1-2 settimane aperta' },
  { id: 'parmigiano', name: 'Parmigiano Reggiano', category: 'latticini', unit: 'g', storage: 'Frigo avvolto in panno o pellicola', shelfLife: '1-2 mesi', staple: true },
  { id: 'mozzarella', name: 'Mozzarella (fior di latte)', category: 'latticini', unit: 'g', storage: 'Frigo nel suo liquido', shelfLife: 'fino alla data, aperta 1-2 gg' },
  { id: 'latte', name: 'Latte parzialmente scremato', category: 'latticini', unit: 'ml', storage: 'Frigo (UHT in dispensa fino apertura)', shelfLife: 'UHT mesi; fresco 4-6 gg' },

  // ----- CEREALI -------------------------------------------------------------
  { id: 'avena', name: 'Fiocchi di avena', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12 mesi', staple: true },
  { id: 'pane-integrale', name: 'Pane integrale', category: 'cereali', unit: 'g', storage: 'Sacchetto a temp. ambiente; o affettato in freezer', shelfLife: '3-4 gg; mesi in freezer' },
  { id: 'fette-biscottate-integrali', name: 'Fette biscottate integrali', category: 'cereali', unit: 'pz', storage: 'Dispensa, confezione richiusa', shelfLife: '6-8 mesi', staple: true },
  { id: 'orzo', name: 'Orzo perlato', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12-18 mesi', staple: true },
  { id: 'farro', name: 'Farro perlato', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12-18 mesi', staple: true },
  { id: 'riso-integrale', name: 'Riso integrale', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12-18 mesi', staple: true },
  { id: 'quinoa', name: 'Quinoa', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '18-24 mesi', staple: true },
  { id: 'pasta-integrale', name: 'Pasta integrale (formato a piacere)', category: 'cereali', unit: 'g', storage: 'Dispensa, confezione richiusa', shelfLife: '2-3 anni', staple: true },
  { id: 'cous-cous-integrale', name: 'Cous cous integrale', category: 'cereali', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12-18 mesi', staple: true },
  { id: 'gallette-riso', name: 'Gallette di riso/mais integrali', category: 'cereali', unit: 'pz', storage: 'Dispensa, confezione richiusa', shelfLife: '6-8 mesi', staple: true },

  // ----- LEGUMI --------------------------------------------------------------
  { id: 'ceci-lessati', name: 'Ceci lessati (barattolo)', category: 'legumi', unit: 'g', storage: 'Dispensa; aperti in frigo 2-3 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'fagioli-cannellini', name: 'Fagioli cannellini lessati (barattolo)', category: 'legumi', unit: 'g', storage: 'Dispensa; aperti in frigo 2-3 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'fagioli-borlotti', name: 'Fagioli borlotti lessati (barattolo)', category: 'legumi', unit: 'g', storage: 'Dispensa; aperti in frigo 2-3 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'lenticchie-secche', name: 'Lenticchie rosse decorticate', category: 'legumi', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '2-3 anni', staple: true },
  { id: 'lenticchie-lessate', name: 'Lenticchie lessate (barattolo)', category: 'legumi', unit: 'g', storage: 'Dispensa; aperte in frigo 2-3 gg', shelfLife: '2-3 anni', staple: true },
  { id: 'edamame-surgelati', name: 'Edamame (fave di soia) surgelati', category: 'surgelati', unit: 'g', storage: 'Freezer', shelfLife: '12 mesi' },
  { id: 'hummus', name: 'Hummus (pronto, vaschetta)', category: 'legumi', unit: 'g', storage: 'Frigo', shelfLife: '4-5 giorni aperto (vedi data)' },

  // ----- FRUTTA SECCA --------------------------------------------------------
  { id: 'noci', name: 'Noci (gherigli)', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico, fresco; o frigo per lunga durata', shelfLife: '6 mesi (frigo 12)', staple: true },
  { id: 'mandorle', name: 'Mandorle (al naturale, non salate)', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico, fresco', shelfLife: '9-12 mesi', staple: true },
  { id: 'nocciole', name: 'Nocciole (al naturale, non salate)', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico, fresco', shelfLife: '9-12 mesi', staple: true },
  { id: 'pistacchi', name: 'Pistacchi (sgusciati, non salati)', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico, fresco', shelfLife: '6-9 mesi', staple: true },
  { id: 'semi-chia', name: 'Semi di chia', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12-24 mesi', staple: true },
  { id: 'semi-lino', name: 'Semi di lino', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico; macinati in frigo', shelfLife: '12 mesi interi', staple: true },
  { id: 'semi-zucca', name: 'Semi di zucca', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '6-9 mesi', staple: true },
  { id: 'semi-girasole', name: 'Semi di girasole', category: 'fruttaSecca', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '6-9 mesi', staple: true },
  { id: 'burro-arachidi', name: 'Burro o crema di arachidi (100% arachidi)', category: 'fruttaSecca', unit: 'g', storage: 'Dispensa; mescolare, aperto in frigo', shelfLife: '12 mesi', staple: true },

  // ----- FERMENTATI ----------------------------------------------------------
  { id: 'crauti', name: 'Crauti (fatti in casa o in busta)', category: 'fermentati', unit: 'g', storage: 'Frigo in barattolo, coperti dalla salamoia', shelfLife: '4-6 mesi' },
  { id: 'kimchi', name: 'Kimchi (fatto in casa)', category: 'fermentati', unit: 'g', storage: 'Frigo in barattolo chiuso', shelfLife: '3-6 mesi' },
  { id: 'kefir', name: 'Kefir di latte', category: 'fermentati', unit: 'ml', storage: 'Frigo', shelfLife: '1-2 settimane (vedi data)' },

  // ----- BEVANDE / VARIE -----------------------------------------------------
  { id: 'te-verde', name: 'Tè verde (foglie o bustine)', category: 'bevande', unit: 'bustine', storage: 'Dispensa asciutta, confezione chiusa', shelfLife: '1-2 anni', staple: true },
  { id: 'matcha', name: 'Tè matcha in polvere', category: 'bevande', unit: 'g', storage: 'Barattolo chiuso al buio; aperto in frigo', shelfLife: '12 mesi', staple: true },
  { id: 'caffe', name: 'Caffè', category: 'bevande', unit: 'g', storage: 'Barattolo ermetico in dispensa', shelfLife: '12 mesi', staple: true },
  { id: 'cacao-amaro', name: 'Cacao amaro in polvere', category: 'dispensa', unit: 'g', storage: 'Barattolo chiuso in dispensa', shelfLife: '2 anni', staple: true },
  { id: 'cioccolato-85', name: 'Cioccolato fondente 85%', category: 'dispensa', unit: 'g', storage: 'Luogo fresco e asciutto', shelfLife: '12-18 mesi', staple: true },
  { id: 'spirulina', name: 'Spirulina in polvere (opzionale)', category: 'dispensa', unit: 'g', storage: 'Barattolo chiuso al buio', shelfLife: '12-24 mesi', staple: true },
  { id: 'creatina', name: 'Creatina monoidrato (integratore, opzionale)', category: 'dispensa', unit: 'g', storage: 'Barattolo chiuso, luogo asciutto', shelfLife: '2-3 anni', staple: true },
];
