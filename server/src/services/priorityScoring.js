const WEIGHTS = {
  severity: 0.3,
  duplicateCount: 0.25,
  categoryWeight: 0.15,
  locationImportance: 0.1,
  ageFactor: 0.2,
};

const SEVERITY_SCORES = { low: 0.33, medium: 0.66, high: 1.0 };

const AGE_CAP_DAYS = 30; // 30 din unresolved rehne ke baad ageFactor max ho jaata hai
const DUPLICATE_CAP = 5; // 5 linked duplicates ke baad duplicateFactor max ho jaata hai

export function calculatePriorityScore({
  severity, // "low" | "medium" | "high" | null/undefined
  duplicateCount, // Number, default 0
  categoryWeight, // Number 0-1 (Category.priorityWeight) ya null
  locationImportance, // Number 0-1 (Ward.importanceWeight) ya null
  createdAt, // Date
}) {
  // Purani complaints me severity/ward null ho sakte hain — un factors ke liye
  // ek neutral default (0.5) use karte hain, taaki score galti se "sabse kam
  // priority" na dikhaye (0 ka matlab galat signal hota), balki "unknown/average"
  // reflect kare.
  const severityScore = severity != null ? (SEVERITY_SCORES[severity] ?? 0.5) : 0.5;
  const categoryScore = categoryWeight != null ? categoryWeight : 0.5;
  const locationScore = locationImportance != null ? locationImportance : 0.5;

  const duplicateFactor = Math.min((duplicateCount || 0) / DUPLICATE_CAP, 1);

  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageFactor = Math.min(Math.max(ageInDays, 0) / AGE_CAP_DAYS, 1);

  const breakdown = {
    severity: round1(WEIGHTS.severity * severityScore * 100),
    duplicateCount: round1(WEIGHTS.duplicateCount * duplicateFactor * 100),
    categoryWeight: round1(WEIGHTS.categoryWeight * categoryScore * 100),
    locationImportance: round1(WEIGHTS.locationImportance * locationScore * 100),
    ageFactor: round1(WEIGHTS.ageFactor * ageFactor * 100),
  };

  const priorityScore = round1(
    breakdown.severity +
      breakdown.duplicateCount +
      breakdown.categoryWeight +
      breakdown.locationImportance +
      breakdown.ageFactor
  );

  return { priorityScore, priorityBreakdown: breakdown };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}