// ===========================================================================
// Tecniche di taglio per principianti — fonte unica per app e PDF.
// Mostrate nel dettaglio ricetta (solo per le verdure presenti) e raccolte
// nella sezione "Come tagliare le verdure" della guida.
// ===========================================================================

export interface CuttingTechnique {
  ingredientIds: string[]; // a quali ingredienti si applica
  title: string;
  how: string; // testo semplice, stile principiante (usato anche nel PDF)
}

export const KNIFE_BASICS =
  'Tre regole che valgono per ogni taglio. 1) Tagliere fermo: metti un canovaccio umido ' +
  'sotto, così non scivola. 2) Coltello affilato: taglia con meno forza ed è PIÙ sicuro di ' +
  'uno che scivola sulla buccia. 3) Mano "ad artiglio": le dita che tengono la verdura stanno ' +
  'piegate con le punte all\'indietro, e la lama appoggia contro le nocche — così non puoi ' +
  'tagliarti. Prima mossa sempre uguale: crea un lato piatto (taglia a metà o una fettina) e ' +
  'appoggialo sul tagliere, così la verdura non rotola.';

export const cuttingTechniques: CuttingTechnique[] = [
  {
    ingredientIds: ['cipolla'],
    title: 'Cipolla',
    how:
      'Taglia via la punta (il ciuffo), ma NON la radice: tiene insieme gli strati. Dividi a ' +
      'metà dalla punta alla radice, sbuccia, e appoggia il lato piatto sul tagliere. Per le ' +
      'fette sottili: affetta seguendo le linee della cipolla, fermandoti prima della radice. ' +
      'Per i cubetti: prima tagli verticali verso la radice (senza arrivarci), poi tagli ' +
      'trasversali. Alla fine butti la radice. Se pizzica gli occhi, sciacqua cipolla e lama ' +
      'sotto l\'acqua fredda a metà lavoro.',
  },
  {
    ingredientIds: ['aglio'],
    title: 'Aglio',
    how:
      'Appoggia lo spicchio sul tagliere, metti sopra la parte piatta della lama e dai un ' +
      'colpo deciso col palmo: la buccia si stacca da sola. Se dentro c\'è il germoglio verde, ' +
      'toglilo (è amaro). Per profumare l\'olio basta lo spicchio schiacciato intero, che poi ' +
      'togli; se la ricetta lo vuole tritato, affettalo e poi passa la lama avanti e indietro ' +
      'tenendo la punta del coltello appoggiata al tagliere.',
  },
  {
    ingredientIds: ['pomodorini'],
    title: 'Pomodorini',
    how:
      'Usa un coltello che "morde" (seghettato è perfetto): la buccia del pomodoro fa ' +
      'scivolare le lame lisce poco affilate. Tienili fermi con l\'artiglio e tagliali a metà ' +
      'all\'equatore, senza schiacciarli.',
  },
  {
    ingredientIds: ['pomodori'],
    title: 'Pomodoro grande',
    how:
      'Coltello seghettato anche qui. Taglia a metà passando per il picciolo, appoggia il lato ' +
      'piatto, poi a spicchi; togli il picciolo con un taglietto a V. Per i cubetti, taglia gli ' +
      'spicchi di traverso alla misura che chiede la ricetta.',
  },
  {
    ingredientIds: ['cetriolo'],
    title: 'Cetriolo',
    how:
      'Spunta le due estremità. Taglialo a metà per il lungo così hai il lato piatto da ' +
      'appoggiare. Per le mezzelune affetta di traverso; per i cubetti taglia ogni metà in 2-3 ' +
      'strisce per il lungo e poi di traverso.',
  },
  {
    ingredientIds: ['peperoni'],
    title: 'Peperone',
    how:
      'Mettilo in piedi e taglia le 4 "guance" intorno al torsolo, una per lato: semi e ' +
      'filamenti restano attaccati al torsolo, che butti intero (niente semini in giro). ' +
      'Rifila le nervature bianche (amare), appoggia ogni falda con la buccia sul tagliere e ' +
      'taglia a strisce, poi di traverso se servono cubetti o pezzi.',
  },
  {
    ingredientIds: ['zucchine'],
    title: 'Zucchine',
    how:
      'Spunta le due estremità. Per le rondelle affetta di traverso a ~mezzo cm, facendo ' +
      'scorrere le nocche all\'indietro a ogni taglio. Per le mezzelune o i pezzi da ' +
      'friggitrice, prima a metà per il lungo (lato piatto sotto), poi di traverso alla misura ' +
      'della ricetta.',
  },
  {
    ingredientIds: ['carota'],
    title: 'Carota',
    how:
      'Pela e spunta. È dura e rotola: taglia prima una fettina sottile per il lungo e ' +
      'appoggiala su quel lato piatto. Rondelle = tagli di traverso; bastoncini = prima fette ' +
      'per il lungo, poi ogni fetta a strisce; julienne ("a fiammifero") = come i bastoncini ' +
      'ma con fette più sottili che puoi impilare. Vai piano: con le verdure dure la fretta è ' +
      'l\'unico vero pericolo.',
  },
  {
    ingredientIds: ['sedano'],
    title: 'Sedano',
    how:
      'Stacca le coste, lava bene anche all\'interno (si annida terra) e taglia via base e ' +
      'foglie. Se i filamenti ti danno fastidio, passa il pelapatate sul dorso della costa. ' +
      'Poi taglia a bastoncini della lunghezza che vuoi, o affetta di traverso a mezzaluna.',
  },
  {
    ingredientIds: ['finocchio'],
    title: 'Finocchio',
    how:
      'Taglia via i gambi verdi in alto e una fettina alla base; togli lo strato esterno se è ' +
      'rovinato. Dividi a metà dall\'alto in basso, appoggia il lato piatto e taglia via il ' +
      'torsolo duro alla base con due tagli in diagonale (a V). Poi affetta ogni metà il più ' +
      'sottile che riesci: più è sottile, più è dolce e croccante.',
  },
  {
    ingredientIds: ['broccolo', 'cavolfiore'],
    title: 'Broccolo e cavolfiore',
    how:
      'Capovolgilo e lavora dal gambo: taglia le cimette una a una dove il loro gambetto si ' +
      'attacca al tronco centrale, così non si sbriciolano. Le cimette grandi dividile a metà ' +
      'dal gambo verso il fiore. Il tronco non si butta: pela la parte esterna dura e taglia ' +
      'il cuore a cubetti, cuoce insieme al resto.',
  },
  {
    ingredientIds: ['cavolo-nero'],
    title: 'Cavolo nero',
    how:
      'Non serve il coltello per la prima parte: afferra la costa centrale con una mano e con ' +
      'l\'altra tira via la foglia facendo scorrere le dita — la costa dura resta in mano e la ' +
      'butti. Poi impila le foglie, arrotolale e affetta il rotolo a striscioline.',
  },
  {
    ingredientIds: ['funghi'],
    title: 'Funghi',
    how:
      'Niente ammollo: si impregnano d\'acqua. Puliscili con un panno umido o un pennello e ' +
      'taglia via solo la parte terrosa del gambo. Poi appoggiali con la cupola in su e ' +
      'affetta dall\'alto in basso, a fette regolari così cuociono uniformi.',
  },
  {
    ingredientIds: ['mela', 'pera'],
    title: 'Mela e pera',
    how:
      'Mettila in piedi e taglia 4 "guance" intorno al torsolo (come per il peperone): resti ' +
      'con 4 pezzi senza semi e il torsolo da buttare, senza scavare. Appoggia ogni pezzo sul ' +
      'lato piatto e taglia a fette o cubetti.',
  },
];

/** Tecniche pertinenti per una lista di ingredienti (ordine stabile della guida). */
export function techniquesForIngredients(ingredientIds: string[]): CuttingTechnique[] {
  const ids = new Set(ingredientIds);
  return cuttingTechniques.filter((t) => t.ingredientIds.some((id) => ids.has(id)));
}
