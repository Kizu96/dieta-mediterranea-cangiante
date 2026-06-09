import type { DailyEssential } from './types';

// Pilastri quotidiani anti-grasso viscerale / anti-insulina (green-MED / DIRECT-PLUS).
// Le fonti citate sono reali e verificate (vedi anche la sezione "Scienza" della Guida).
export const dailyEssentials: DailyEssential[] = [
  {
    id: 'germogli-broccoli',
    name: 'Germogli di broccoli (crudi)',
    detail:
      '1 porzione (~20-30 g) cruda ogni giorno, aggiunta a fine cottura o sull’insalata. Il sulforafano è associato a riduzione di insulina e HOMA-IR; va consumato crudo perché il calore degrada l’enzima mirosinasi.',
    ingredientId: 'broccoli-germogli',
    source:
      'Bahadoran et al., RCT su germogli di broccoli e insulino-resistenza nel diabete tipo 2, 2012 (PubMed 22537070)',
  },
  {
    id: 'te-verde',
    name: 'Tè verde',
    detail:
      '3-4 tazze al giorno (non zuccherato). Nel protocollo green-MED il tè verde, insieme alla Mankai e alle noci, è associato a una perdita di grasso viscerale doppia rispetto alla dieta mediterranea classica.',
    ingredientId: 'te-verde',
    source:
      'Zelicha et al., DIRECT-PLUS, BMC Medicine 2022;20:327 (PubMed 36175997; DOI 10.1186/s12916-022-02525-8)',
  },
  {
    id: 'olio-evo',
    name: 'Olio EVO a crudo',
    detail:
      '3-4 cucchiai al giorno, preferibilmente a crudo. L’acido oleico stimola nell’intestino la sintesi di OEA (oleoiletanolamide), un agonista di PPAR-α che aumenta sazietà e ossidazione dei grassi.',
    ingredientId: 'olio-evo',
    source:
      'Igarashi et al., Dietary oleic acid e sintesi intestinale di OEA, Frontiers in Endocrinology 2023 (PMC9886573)',
  },
  {
    id: 'verde-foglia',
    name: 'Verdura a foglia / frullato verde',
    detail:
      'Sostituto del Mankai (non reperibile in Italia): una porzione abbondante di verdura a foglia (spinaci, cavolo nero, rucola) o un frullato verde, con eventuale spirulina/clorella per i polifenoli e le proteine vegetali.',
    source:
      'DIRECT-PLUS (green-MED), BMC Medicine 2022 (PubMed 36175997)',
  },
  {
    id: 'fermentati',
    name: 'Fermentati (kimchi / crauti)',
    detail:
      'Una piccola porzione (~30-50 g) di kimchi o crauti per nutrire il microbiota intestinale. Inserire gradualmente e a crudo per preservare i fermenti vivi.',
    ingredientId: 'crauti',
  },
  {
    id: 'frutti-bosco',
    name: 'Uva nera o rossa',
    detail:
      "Una porzione (~80-100 g) di uva nera o rossa con la buccia: è ricca di antociani, gli stessi polifenoli viola-rossi dei frutti di bosco. La buccia scura è la parte più preziosa, non toglierla. Con moderazione perché è più zuccherina della frutta di bosco.",
    ingredientId: 'uva',
    source:
      'Pan et al., gli antociani migliorano i marcatori della sindrome metabolica (LDL, trigliceridi, glicemia), meta-analisi di 29 RCT (2006 persone), PLoS One 2025 (PMID 39928643)',
  },
  {
    id: 'cioccolato-85',
    name: 'Cioccolato fondente 85%',
    detail:
      '1-2 quadratini (~10-15 g): i flavanoli del cacao sono associati a un miglioramento della sensibilità insulinica. Scegli alta percentuale di cacao e basso zucchero.',
    ingredientId: 'cioccolato-85',
    source:
      'Grassi et al., cioccolato fondente e sensibilità insulinica, Am J Clin Nutr 2005 (PubMed 15755830)',
  },
  {
    id: 'frutta-secca',
    name: 'Noci / mandorle',
    detail:
      '~28 g al giorno (una manciata). Nel protocollo green-MED le noci forniscono polifenoli (acido ellagico → urolitina A) e grassi buoni; saziano e aiutano a preservare la massa muscolare nel deficit.',
    ingredientId: 'noci',
    source:
      'DIRECT-PLUS, BMC Medicine 2022 (PubMed 36175997)',
  },
  {
    id: 'proteine-ogni-pasto',
    name: 'Proteine a ogni pasto',
    detail:
      'Includi una fonte proteica (uova, pesce, legumi, yogurt greco, pollo/tacchino) in ogni pasto per preservare la massa muscolare durante il deficit calorico e aumentare la sazietà.',
  },
  {
    id: 'acqua',
    name: 'Acqua',
    detail:
      'Almeno 1,5-2 litri al giorno. Una buona idratazione sostiene il metabolismo e aiuta a distinguere fame e sete; bevi soprattutto lontano e durante l’allenamento sul tapis roulant.',
  },
  {
    id: 'creatina',
    name: 'Creatina monoidrato (opzionale)',
    detail:
      '3-5 g al giorno, anche nei giorni di riposo, con acqua. Sostiene forza e mantenimento della massa muscolare durante il deficit. Nota: può trattenere ~1 kg di acqua nei primi giorni (è peso, non grasso): non spaventarti sulla bilancia.',
    ingredientId: 'creatina',
    source: 'ISSN Position Stand sulla creatina, Kreider et al., JISSN 2017 (PMC5469049)',
  },
];
