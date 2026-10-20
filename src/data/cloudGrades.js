import { supabase } from "../lib/supabase.js";

const EMPTY_GRADE_DATA = Object.freeze({
  grades: {},
  previousGrades: {},
  targets: {},
  periodGrades: {},
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
  const hasData = (data) => {
    const hasValues = (values) => Object.values(values || {}).some((value) =>
      value !== null && value !== undefined
      && !(typeof value === "string" && !value.trim())
      && Number.isFinite(Number(value)));
    return hasValues(data?.grades)
      || hasValues(data?.previousGrades)
      || hasValues(data?.targets)
      || Object.values(data?.periodGrades || {}).some(hasValues);
  };

  const cloudHasData = hasData(cloud);
  const localHasData = hasData(local);
  return {
    data: cloudHasData
      ? cloud
      : localHasData
        ? local
        : { ...local, termStructure: cloud?.termStructure || local?.termStructure },
    shouldUploadLocal: !cloudHasData && localHasData,
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
  termStructure: student?.termStructure || EMPTY_GRADE_DATA.termStructure,
});

export const createCloudGradesApi = (client) => ({
  async loadCloudGrades(userId) {
    validateUserId(userId);

    const [gradeResult, periodResult, profileResult] = await Promise.all([
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
    ]);
    if (gradeResult.error) throw gradeResult.error;
    if (periodResult.error) throw periodResult.error;
    if (profileResult.error) throw profileResult.error;

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
