import { isRecordedGrade, isValidTargetGrade } from "./studentData.js";

export const getDefaultPeriodWeights = (periods) => {
  const weight = Number((100 / periods.length).toFixed(1));
  return Object.fromEntries(periods.map((period, index) => [
    period.id,
    index === periods.length - 1
      ? Number((100 - weight * (periods.length - 1)).toFixed(1))
      : weight,
  ]));
};

export const getSubjectGradePlan = ({
  subject,
  termId,
  periods,
  periodGrades = {},
  gradeSettings = {},
}) => {
  if (!periods.length) {
    return { weights: {}, weightsTotal: 0, weightsValid: false, finalGrade: null, requiredAverage: null, missingPeriods: [] };
  }
  const defaultWeights = getDefaultPeriodWeights(periods);
  const savedWeights = gradeSettings.weights?.[subject]?.[termId] || {};
  const weights = Object.fromEntries(periods.map(({ id }) => {
    const saved = savedWeights[id];
    const value = saved === null || saved === undefined
      ? defaultWeights[id]
      : Number(saved);
    return [id, Number.isFinite(value) && value >= 0 && value <= 100 ? value : NaN];
  }));
  const weightsTotal = Object.values(weights).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
  const weightsValid = Object.values(weights).every(Number.isFinite)
    && Math.abs(weightsTotal - 100) < 0.051;
  const recorded = periods.filter(({ id }) => isRecordedGrade(periodGrades[id])
    && Number(periodGrades[id]) >= 0 && Number(periodGrades[id]) <= 100);
  const missingPeriods = periods.filter(({ id }) => !recorded.some((period) => period.id === id));
  const weightedPoints = recorded.reduce((total, { id }) =>
    total + Number(periodGrades[id]) * weights[id] / 100, 0);
  const remainingWeight = missingPeriods.reduce((total, { id }) => total + weights[id], 0);
  const finalGrade = weightsValid && !missingPeriods.length
    ? Number(weightedPoints.toFixed(2))
    : null;
  const passingGrade = isValidTargetGrade(gradeSettings.passingGrade)
    ? Number(gradeSettings.passingGrade)
    : 75;
  const requiredAverage = weightsValid && missingPeriods.length && remainingWeight > 0
    ? (passingGrade - weightedPoints) / (remainingWeight / 100)
    : null;

  return {
    weights,
    weightsTotal: Number(weightsTotal.toFixed(1)),
    weightsValid,
    finalGrade,
    requiredAverage: Number.isFinite(requiredAverage) ? requiredAverage : null,
    missingPeriods,
  };
};

export const calculateTermGwa = ({ subjects, termId, periods, periodGrades, gradeSettings }) => {
  const gradeBySubject = {};
  const missing = [];
  for (const subject of subjects) {
    const plan = getSubjectGradePlan({
      subject,
      termId,
      periods,
      periodGrades: periodGrades?.[subject] || {},
      gradeSettings,
    });
    const units = Number(gradeSettings.units?.[subject]);
    if (plan.finalGrade === null || !Number.isFinite(units) || units <= 0) {
      missing.push(subject);
    } else {
      gradeBySubject[subject] = { grade: plan.finalGrade, units };
    }
  }
  if (!subjects.length || missing.length) {
    return { gwa: null, missing };
  }
  const totalUnits = Object.values(gradeBySubject).reduce((total, value) => total + value.units, 0);
  const weightedGrade = Object.values(gradeBySubject).reduce(
    (total, value) => total + value.grade * value.units,
    0,
  );
  return {
    gwa: totalUnits > 0 ? Number((weightedGrade / totalUnits).toFixed(2)) : null,
    missing: [],
  };
};
