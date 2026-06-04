import type { WorkoutWeek } from './types';

// Progressione a basso impatto pensata per 112 kg (salva-articolazioni).
// Cardio = camminata in salita sul tapis roulant in Zona 2 (puoi parlare a fatica
// ma senza ansimare). Forza 2x/sett a corpo libero/elastico per preservare i muscoli.
// Orari: dopo il lavoro (18) o la sera prima del relax delle 22.
// Schema settimanale fisso: Lun cardio, Mar forza, Mer cardio, Gio mobilità,
// Ven forza, Sab cardio lungo, Dom riposo attivo. Cresce durata/pendenza nei blocchi.
export const workoutWeeks: WorkoutWeek[] = [
  // ===========================================================================
  // BLOCCO 1 — adattamento
  // ===========================================================================
  {
    weekLabel: 'Settimane 1-2',
    focus: 'Costruire l’abitudine: camminata in salita Zona 2 + forza base a corpo libero',
    days: [
      {
        dayLabel: 'Lun',
        title: 'Tapis roulant — camminata in salita',
        type: 'cardio',
        durationMin: 20,
        exercises: [
          { name: 'Riscaldamento', detail: '3 min di camminata in piano a velocità comoda (3,5-4 km/h).' },
          { name: 'Camminata in salita Zona 2', detail: '14 min a pendenza 3-4%, velocità 4-4,5 km/h. Devi riuscire a parlare a fatica.' },
          { name: 'Defaticamento', detail: '3 min in piano, rallentando.' },
        ],
        notes: 'Subito dopo il lavoro o la sera. Tieni una bottiglia d’acqua a portata di mano.',
      },
      {
        dayLabel: 'Mar',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 20,
        exercises: [
          { name: 'Squat su sedia', detail: '3 serie x 10. Siediti e rialzati controllando, senza slancio.' },
          { name: 'Piegamenti al muro', detail: '3 serie x 10. Mani al muro, corpo dritto, piega i gomiti.' },
          { name: 'Rematore con elastico (o bottiglie d’acqua)', detail: '3 serie x 12. Tira verso l’ombelico, stringi le scapole.' },
          { name: 'Plank in appoggio sulle ginocchia', detail: '3 x 15-20 secondi. Schiena dritta, addome contratto.' },
        ],
        notes: 'Recupero 60-90 secondi tra le serie. Fermati se senti dolore articolare (non muscolare).',
      },
      {
        dayLabel: 'Mer',
        title: 'Tapis roulant — camminata in salita',
        type: 'cardio',
        durationMin: 22,
        exercises: [
          { name: 'Riscaldamento', detail: '3 min in piano a ritmo comodo.' },
          { name: 'Camminata in salita Zona 2', detail: '16 min a pendenza 4%, velocità 4-4,5 km/h.' },
          { name: 'Defaticamento', detail: '3 min in piano.' },
        ],
      },
      {
        dayLabel: 'Gio',
        title: 'Mobilità e recupero',
        type: 'mobilita',
        durationMin: 15,
        exercises: [
          { name: 'Mobilità anche', detail: '8-10 oscillazioni per gamba avanti/indietro, tenendoti a un appoggio.' },
          { name: 'Mobilità caviglie', detail: '10 circonduzioni per caviglia + allungamento del polpaccio al muro.' },
          { name: 'Allungamento dorso e spalle', detail: '5 min di stretching dolce, respirando lentamente.' },
        ],
        notes: 'Giornata leggera: aiuta le articolazioni a recuperare dal carico.',
      },
      {
        dayLabel: 'Ven',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 20,
        exercises: [
          { name: 'Affondi assistiti', detail: '3 x 8 per gamba, tenendoti a un appoggio per equilibrio.' },
          { name: 'Spinte sopra la testa con elastico/bottiglie', detail: '3 x 12.' },
          { name: 'Ponte glutei a terra', detail: '3 x 12. Spingi sui talloni e stringi i glutei in alto.' },
          { name: 'Plank in appoggio sulle ginocchia', detail: '3 x 20 secondi.' },
        ],
      },
      {
        dayLabel: 'Sab',
        title: 'Tapis roulant — camminata lunga',
        type: 'cardio',
        durationMin: 28,
        exercises: [
          { name: 'Riscaldamento', detail: '4 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '20 min a pendenza 4%, ritmo costante.' },
          { name: 'Defaticamento', detail: '4 min in piano.' },
        ],
        notes: 'La seduta più lunga: idratati e ascolta un podcast o musica per renderla piacevole.',
      },
      {
        dayLabel: 'Dom',
        title: 'Riposo attivo',
        type: 'riposo',
        durationMin: 0,
        exercises: [
          { name: 'Riposo', detail: 'Recupero completo. Una passeggiata facoltativa all’aperto va benissimo.' },
        ],
        notes: 'Il riposo è parte dell’allenamento: è quando il corpo si adatta.',
      },
    ],
  },

  // ===========================================================================
  // BLOCCO 2 — costruzione
  // ===========================================================================
  {
    weekLabel: 'Settimane 3-4',
    focus: 'Aumentare durata e pendenza del cammino; più volume nella forza',
    days: [
      {
        dayLabel: 'Lun',
        title: 'Tapis roulant — camminata in salita',
        type: 'cardio',
        durationMin: 28,
        exercises: [
          { name: 'Riscaldamento', detail: '3 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '22 min a pendenza 5%, velocità 4,5 km/h.' },
          { name: 'Defaticamento', detail: '3 min in piano.' },
        ],
      },
      {
        dayLabel: 'Mar',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 25,
        exercises: [
          { name: 'Squat su sedia', detail: '3 serie x 12-14, più lenti in discesa.' },
          { name: 'Piegamenti su piano rialzato (tavolo/lavandino)', detail: '3 x 8-10, più impegnativi del muro.' },
          { name: 'Rematore con elastico', detail: '3 x 14.' },
          { name: 'Plank sulle punte dei piedi', detail: '3 x 20-25 secondi se la schiena resta dritta.' },
        ],
        notes: 'Recupero 60-90 secondi. Aumenta solo se l’esecuzione resta pulita.',
      },
      {
        dayLabel: 'Mer',
        title: 'Tapis roulant — camminata in salita',
        type: 'cardio',
        durationMin: 30,
        exercises: [
          { name: 'Riscaldamento', detail: '3 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '24 min a pendenza 5-6%, velocità 4,5 km/h.' },
          { name: 'Defaticamento', detail: '3 min in piano.' },
        ],
      },
      {
        dayLabel: 'Gio',
        title: 'Mobilità e recupero',
        type: 'mobilita',
        durationMin: 18,
        exercises: [
          { name: 'Mobilità anche e ginocchia', detail: 'Oscillazioni + mini-squat a corpo libero, lenti.' },
          { name: 'Allungamento polpacci e flessori dell’anca', detail: '2 min per lato.' },
          { name: 'Mobilità toracica', detail: '10 rotazioni del busto per lato, seduto o in piedi.' },
        ],
      },
      {
        dayLabel: 'Ven',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 25,
        exercises: [
          { name: 'Affondi (assistiti se serve)', detail: '3 x 10 per gamba.' },
          { name: 'Spinte sopra la testa con elastico', detail: '3 x 14.' },
          { name: 'Ponte glutei (1 gamba se possibile)', detail: '3 x 12.' },
          { name: 'Stacco con elastico (cerniera d’anca)', detail: '3 x 12, schiena dritta.' },
        ],
      },
      {
        dayLabel: 'Sab',
        title: 'Tapis roulant — camminata lunga',
        type: 'cardio',
        durationMin: 35,
        exercises: [
          { name: 'Riscaldamento', detail: '4 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '27 min a pendenza 5%, ritmo costante.' },
          { name: 'Defaticamento', detail: '4 min in piano.' },
        ],
      },
      {
        dayLabel: 'Dom',
        title: 'Riposo attivo',
        type: 'riposo',
        durationMin: 0,
        exercises: [
          { name: 'Riposo', detail: 'Recupero. Passeggiata leggera facoltativa.' },
        ],
      },
    ],
  },

  // ===========================================================================
  // BLOCCO 3 — consolidamento + primi intervalli leggeri
  // ===========================================================================
  {
    weekLabel: 'Settimane 5-6',
    focus: 'Camminate più lunghe, pendenza maggiore e primi tratti a passo sostenuto',
    days: [
      {
        dayLabel: 'Lun',
        title: 'Tapis roulant — salita con tratti sostenuti',
        type: 'cardio',
        durationMin: 32,
        exercises: [
          { name: 'Riscaldamento', detail: '4 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '24 min a pendenza 6%, velocità 4,5-5 km/h.' },
          { name: 'Tratti sostenuti', detail: 'Negli ultimi 12 min, 4 volte: 1 min a 5,5 km/h + 2 min facili.' },
          { name: 'Defaticamento', detail: '4 min in piano.' },
        ],
        notes: 'I tratti sostenuti restano camminata veloce, mai corsa: proteggi le articolazioni.',
      },
      {
        dayLabel: 'Mar',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 28,
        exercises: [
          { name: 'Squat a corpo libero', detail: '4 serie x 12, scendendo finché le cosce sono comode.' },
          { name: 'Piegamenti su piano rialzato', detail: '4 x 10.' },
          { name: 'Rematore con elastico a presa stretta', detail: '4 x 12.' },
          { name: 'Plank', detail: '3 x 30 secondi.' },
        ],
        notes: 'Recupero 75-90 secondi. Mantieni un diario delle ripetizioni per vedere i progressi.',
      },
      {
        dayLabel: 'Mer',
        title: 'Tapis roulant — camminata in salita',
        type: 'cardio',
        durationMin: 34,
        exercises: [
          { name: 'Riscaldamento', detail: '4 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '26 min a pendenza 6-7%, velocità 4,5 km/h.' },
          { name: 'Defaticamento', detail: '4 min in piano.' },
        ],
      },
      {
        dayLabel: 'Gio',
        title: 'Mobilità e recupero',
        type: 'mobilita',
        durationMin: 18,
        exercises: [
          { name: 'Mobilità completa anche/ginocchia/caviglie', detail: '8-10 min fluidi.' },
          { name: 'Allungamento catena posteriore', detail: '5 min: polpacci, femorali, lombari.' },
          { name: 'Respirazione diaframmatica', detail: '3 min per recuperare e ridurre la tensione.' },
        ],
      },
      {
        dayLabel: 'Ven',
        title: 'Forza a corpo libero — total body',
        type: 'forza',
        durationMin: 28,
        exercises: [
          { name: 'Affondi alternati', detail: '4 x 10 per gamba.' },
          { name: 'Spinte sopra la testa con elastico', detail: '4 x 12.' },
          { name: 'Stacco con elastico', detail: '4 x 12.' },
          { name: 'Ponte glutei a una gamba', detail: '3 x 10 per lato.' },
        ],
      },
      {
        dayLabel: 'Sab',
        title: 'Tapis roulant — camminata lunga',
        type: 'cardio',
        durationMin: 40,
        exercises: [
          { name: 'Riscaldamento', detail: '5 min in piano.' },
          { name: 'Camminata in salita Zona 2', detail: '30 min a pendenza 6%, ritmo costante.' },
          { name: 'Defaticamento', detail: '5 min in piano.' },
        ],
        notes: 'Hai raggiunto i 40 minuti: è un traguardo importante per il consumo di grassi.',
      },
      {
        dayLabel: 'Dom',
        title: 'Riposo attivo',
        type: 'riposo',
        durationMin: 0,
        exercises: [
          { name: 'Riposo', detail: 'Recupero. Concediti una passeggiata rilassante se ne hai voglia.' },
        ],
      },
    ],
  },
];
