// Calcoli nutrizionali puri (nessuna dipendenza da dati/contenuti).

export function bmi(kg: number, heightM: number): number {
  return kg / (heightM * heightM);
}

export type BmiClass =
  | 'sottopeso'
  | 'normopeso'
  | 'sovrappeso'
  | 'obesità I'
  | 'obesità II'
  | 'obesità III';

export function bmiClass(value: number): BmiClass {
  if (value < 18.5) return 'sottopeso';
  if (value < 25) return 'normopeso';
  if (value < 30) return 'sovrappeso';
  if (value < 35) return 'obesità I';
  if (value < 40) return 'obesità II';
  return 'obesità III';
}

// Mifflin-St Jeor (uomo). heightCm in cm.
export function mifflinBMR(kg: number, heightCm: number, age: number, male = true): number {
  const base = 10 * kg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (male ? 5 : -161));
}

export function tdee(bmr: number, activityFactor = 1.45): number {
  return Math.round(bmr * activityFactor);
}

// kg/settimana attesi da un deficit calorico giornaliero (7700 kcal ≈ 1 kg).
export function weeklyLoss(dailyDeficit: number): number {
  return (dailyDeficit * 7) / 7700;
}

export function weeksToTarget(currentKg: number, targetKg: number, perWeek: number): number {
  if (perWeek <= 0) return Infinity;
  return Math.max(0, Math.ceil((currentKg - targetKg) / perWeek));
}

// Profilo dell'utente (default — modificabile nelle impostazioni).
export const DEFAULT_PROFILE = {
  heightCm: 173,
  startKg: 112,
  age: 30,
  male: true,
  targetKg: 85, // obiettivo iniziale ragionevole (BMI ~28); rivedibile
};
