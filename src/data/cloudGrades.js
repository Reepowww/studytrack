import { supabase } from "../lib/supabase.js";

const EMPTY_GRADE_DATA = Object.freeze({
  grades: {},
  previousGrades: {},
  targets: {},
  periodGrades: {},
  gradeSettings: {},
  termStructure: "dualSemester",
});

const validateUserId = (userId) => {
  if (typeof userId !== "string" || !userId.trim() || userId.startsWith("supabase_")) {
    throw new TypeError("A plain Supabase user id is required.");
  }
};

const numericValue = (value, label) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") {
    throw new TypeError(`${label} must be a number or null.`);
  }
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
  return number;
};

const subjectNameFromRelation = (relation) => {
  const subject = Array.isArray(relation) ? relation[0] : relation;
  return typeof subject?.name === "string" ? subject.name : null;
};

const addNonNullValue = (target, key, value) => {
  if (value === null || value === undefined) return;
  const number = Number(value);
  if (Number.isFinite(number)) target[key] = number;
};

const createGradeDataState = (cloud, local) => {
  const hasAcademicData = (data) => {
    const hasValues = (values) => Object.values(values || {}).some((value) =>
      value !== null && value !== undefined
      && !(typeof value === "string" && !value.trim())
      && Number.isFinite(Number(value)));
    return hasValues(data?.grades)
      || hasValues(data?.previousGrades)
      || hasValues(data?.targets)
      || Object.values(data?.periodGrades || {}).some(hasValues);
  };

  const cloudHasData = hasAcademicData(cloud);
  const localHasData = hasAcademicData(local);
  const cloudPlannerHasData = hasGradePlannerData(cloud);
  const localPlannerHasData = hasGradePlannerData(local);
  const data = cloudHasData
      ? cloud
      : localHasData
        ? local
        : { ...local, termStructure: cloud?.termStructure || local?.termStructure },
    localSettings = local.gradeSettings || {};
  const cloudSettings = cloud.gradeSettings || {};
  const mergedSettings = {
    ...localSettings,
    ...cloudSettings,
  };
  if (localSettings.units || cloudSettings.units) {
    mergedSettings.units = { ...(localSettings.units || {}), ...(cloudSettings.units || {}) };
  }
  if (localSettings.weights || cloudSettings.weights) {
    mergedSettings.weights = { ...(localSettings.weights || {}), ...(cloudSettings.weights || {}) };
    for (const subject of new Set([
      ...Object.keys(localSettings.weights || {}),
      ...Object.keys(cloudSettings.weights || {}),
    ])) {
      if (localSettings.weights?.[subject] || cloudSettings.weights?.[subject]) {
        mergedSettings.weights[subject] = {
          ...(localSettings.weights?.[subject] || {}),
          ...(cloudSettings.weights?.[subject] || {}),
        };
      }
    }
  }
  return {
    data: {
      ...data,
      gradeSettings: mergedSettings,
    },
    shouldUploadLocal: (!cloudHasData && localHasData)
      || (localPlannerHasData && (
        !cloudPlannerHasData
        || JSON.stringify(mergedSettings) !== JSON.stringify(cloudSettings)
      )),
    cloudHasData,
    localHasData,
  };
};

export const resolveCloudGradeData = createGradeDataState;

const gradeDataSnapshot = (student) => JSON.stringify({
  grades: student?.grades || {},
  previousGrades: student?.previousGrades || {},
  targets: student?.targets || {},
  periodGrades: student?.periodGrades || {},
  gradeSettings: student?.gradeSettings || {},
  termStructure: student?.termStructure || EMPTY_GRADE_DATA.termStructure,
});

const hasGradePlannerData = (data) => Boolean(data?.gradeSettings)
  && typeof data.gradeSettings === "object"
  && Object.keys(data.gradeSettings).length > 0;

const plannerSettingsFromRows = (preference, subjectRows) => {
  const settings = {};
  if (preference) {
    if (preference.passing_grade !== null && preference.passing_grade !== undefined) {
      settings.passingGrade = Number(preference.passing_grade);
    }
    if (preference.gwa_mode === "manual" || preference.gwa_mode === "units") {
      settings.gwaMode = preference.gwa_mode;
    }
    if (preference.manual_gwa && typeof preference.manual_gwa === "object") {
      settings.manualGwa = preference.manual_gwa;
    }
  }
  const weights = {};
  const units = {};
  for (const row of subjectRows || []) {
    const name = subjectNameFromRelation(row.subjects);
    if (!name) continue;
    if (row.weights && typeof row.weights === "object" && Object.keys(row.weights).length) {
      weights[name] = row.weights;
    }
    if (row.units !== null && row.units !== undefined) units[name] = Number(row.units);
  }
  if (Object.keys(weights).length) settings.weights = weights;
  if (Object.keys(units).length) settings.units = units;
  return settings;
};

const numericSetting = (value, label, { minimum = 0, maximum = 100, nullable = false } = {}) => {
  if (value === null || value === undefined || value === "") {
    if (nullable) return null;
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return number;
};

const normalizePlannerPreferences = (settings = {}) => {
  const passingGrade = numericSetting(settings.passingGrade, "Passing grade", { nullable: true });
  const manualGwa = {};
  for (const [termId, value] of Object.entries(settings.manualGwa || {})) {
    const number = numericSetting(value, `Manual GWA for ${termId}`, { nullable: true });
    if (number !== undefined) manualGwa[termId] = number;
  }
  return {
    passing_grade: passingGrade ?? 75,
    gwa_mode: settings.gwaMode === "manual" ? "manual" : "units",
    manual_gwa: manualGwa,
  };
};

const normalizeSubjectPlannerSettings = (settings = {}, subjects, subjectIds, userId) => {
  const rows = [];
  for (const subject of subjects) {
    const subjectId = subjectIds.get(subject);
    if (subjectId === undefined || subjectId === null) continue;
    const units = numericSetting(settings.units?.[subject], `Course units for ${subject}`, {
      minimum: Number.MIN_VALUE,
      nullable: true,
    });
    const subjectWeights = settings.weights?.[subject] || {};
    const weights = {};
    for (const [termId, termWeights] of Object.entries(subjectWeights)) {
      if (!termWeights || typeof termWeights !== "object" || Array.isArray(termWeights)) continue;
      weights[termId] = {};
      for (const [periodId, value] of Object.entries(termWeights)) {
        weights[termId][periodId] = numericSetting(value, `Weight for ${subject} ${periodId}`, {
          nullable: true,
        }) ?? null;
      }
    }
    rows.push({
      user_id: userId,
      subject_id: subjectId,
      units: units ?? null,
      weights,
    });
  }
  return rows;
};

export const createCloudGradesApi = (client) => ({
  async loadCloudGrades(userId) {
    validateUserId(userId);

    const [gradeResult, periodResult, profileResult, preferenceResult, plannerSubjectResult] = await Promise.all([
      client.from("grades")
        .select("grade,previous_grade,target_grade,subjects(name)")
        .eq("user_id", userId),
      client.from("period_grades")
        .select("period_id,grade,subjects(name)")
        .eq("user_id", userId),
      client.from("profiles")
        .select("term_structure")
        .eq("id", userId)
        .maybeSingle(),
      client.from("grade_planner_preferences")
        .select("passing_grade,gwa_mode,manual_gwa")
        .eq("user_id", userId)
        .maybeSingle(),
      client.from("grade_planner_subject_settings")
        .select("units,weights,subjects(name)")
        .eq("user_id", userId),
    ]);
    if (gradeResult.error) throw gradeResult.error;
    if (periodResult.error) throw periodResult.error;
    if (profileResult.error) throw profileResult.error;
    if (preferenceResult.error) throw preferenceResult.error;
    if (plannerSubjectResult.error) throw plannerSubjectResult.error;

    const grades = {};
    const previousGrades = {};
    const targets = {};
    for (const row of gradeResult.data || []) {
      const name = subjectNameFromRelation(row.subjects);
      if (!name) continue;
      addNonNullValue(grades, name, row.grade);
      addNonNullValue(previousGrades, name, row.previous_grade);
      addNonNullValue(targets, name, row.target_grade);
    }

    const periodGrades = {};
    for (const row of periodResult.data || []) {
      const name = subjectNameFromRelation(row.subjects);
      if (!name || row.grade === null || row.grade === undefined) continue;
      const number = Number(row.grade);
      if (!Number.isFinite(number)) continue;
      periodGrades[name] ||= {};
      periodGrades[name][row.period_id] = number;
    }

    return {
      grades,
      previousGrades,
      targets,
      periodGrades,
      gradeSettings: plannerSettingsFromRows(preferenceResult.data, plannerSubjectResult.data),
      termStructure: profileResult.data?.term_structure || EMPTY_GRADE_DATA.termStructure,
    };
  },

  async saveCloudGrades(userId, student) {
    validateUserId(userId);
    if (typeof student?.termStructure !== "string" || !student.termStructure) {
      throw new TypeError("A term structure is required.");
    }
    const { data: subjectRows, error: subjectError } = await client
      .from("subjects")
      .select("id,name")
      .eq("user_id", userId);
    if (subjectError) throw subjectError;

    const subjectIds = new Map((subjectRows || []).map(({ id, name }) => [name, id]));
    const gradeRows = [];
    const periodRowsBySubject = [];
    const periodGrades = student?.periodGrades && typeof student.periodGrades === "object"
      ? student.periodGrades
      : {};

    for (const subjectName of Array.isArray(student?.subjects) ? student.subjects : []) {
      const subjectId = subjectIds.get(subjectName);
      if (subjectId === undefined || subjectId === null) continue;

      gradeRows.push({
        user_id: userId,
        subject_id: subjectId,
        grade: numericValue(student.grades?.[subjectName], `Grade for ${subjectName}`),
        previous_grade: numericValue(student.previousGrades?.[subjectName], `Previous grade for ${subjectName}`),
        target_grade: numericValue(student.targets?.[subjectName], `Target grade for ${subjectName}`),
      });

      const subjectPeriods = periodGrades[subjectName]
        && typeof periodGrades[subjectName] === "object"
        ? periodGrades[subjectName]
        : {};
      const rows = Object.entries(subjectPeriods).reduce((result, [periodId, value]) => {
        const grade = numericValue(value, `Period grade for ${subjectName}`);
        if (grade !== null) result.push({
          user_id: userId,
          subject_id: subjectId,
          period_id: periodId,
          grade,
        });
        return result;
      }, []);
      periodRowsBySubject.push({ subjectId, rows });
    }

    if (gradeRows.length) {
      const { error } = await client.from("grades")
        .upsert(gradeRows, { onConflict: "subject_id" });
      if (error) throw error;
    }

    for (const { subjectId, rows } of periodRowsBySubject) {
      const { data: existingRows, error: existingError } = await client
        .from("period_grades")
        .select("period_id")
        .eq("user_id", userId)
        .eq("subject_id", subjectId);
      if (existingError) throw existingError;

      if (rows.length) {
        const { error } = await client.from("period_grades")
          .upsert(rows, { onConflict: "subject_id,period_id" });
        if (error) throw error;
      }

      const presentPeriodIds = new Set(rows.map(({ period_id }) => period_id));
      const removedPeriodIds = (existingRows || [])
        .map(({ period_id }) => period_id)
        .filter((periodId) => !presentPeriodIds.has(periodId));
      if (removedPeriodIds.length) {
        const { error } = await client.from("period_grades")
          .delete()
          .eq("user_id", userId)
          .eq("subject_id", subjectId)
          .in("period_id", removedPeriodIds);
        if (error) throw error;
      }
    }

    const preference = normalizePlannerPreferences(student.gradeSettings);
    const { error: preferenceError } = await client.from("grade_planner_preferences")
      .upsert({ user_id: userId, ...preference }, { onConflict: "user_id" });
    if (preferenceError) throw preferenceError;

    const plannerRows = normalizeSubjectPlannerSettings(
      student.gradeSettings,
      Array.isArray(student.subjects) ? student.subjects : [],
      subjectIds,
      userId,
    );
    if (plannerRows.length) {
      const { error: plannerError } = await client.from("grade_planner_subject_settings")
        .upsert(plannerRows, { onConflict: "user_id,subject_id" });
      if (plannerError) throw plannerError;
    }

    const { error: profileError } = await client.from("profiles")
      .update({ term_structure: student.termStructure })
      .eq("id", userId);
    if (profileError) throw profileError;
  },
});

const cloudGradesApi = createCloudGradesApi(supabase);

export const loadCloudGrades = (userId) => cloudGradesApi.loadCloudGrades(userId);
export const saveCloudGrades = (userId, student) => cloudGradesApi.saveCloudGrades(userId, student);
export { gradeDataSnapshot };
