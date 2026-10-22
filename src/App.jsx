import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudyHabits from "./pages/StudyHabits.jsx";
import AcademicPerformance from "./pages/AcademicPerformance.jsx";
import Analytics from "./pages/Analytics.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import About from "./pages/About.jsx";
import { createAuthenticatedStudent } from "./data/authProfile.js";
import {
  completeStudentOnboarding,
  loadStudentOnboarding,
  loadStudentSettings,
  restoreStudentTargets,
  saveStudentSettings,
} from "./data/studentData.js";
import {
  loadCloudSubjects,
  normalizeCloudSubjectNames,
  saveCloudSubjects,
} from "./data/cloudSubjects.js";
import {
  gradeDataSnapshot,
  loadCloudGrades,
  resolveCloudGradeData,
  saveCloudGrades,
} from "./data/cloudGrades.js";
import {
  loadCloudStudy,
  pickHabits,
  saveCloudStudy,
  studyDataSnapshot,
} from "./data/cloudStudy.js";
import { supabase } from "./lib/supabase.js";

const PAGES = {
  dashboard: Dashboard,
  habits: StudyHabits,
  performance: AcademicPerformance,
  analytics: Analytics,
  recommendations: Recommendations,
  about: About,
};

const getStudentTargets = (student) => {
  let savedTargets = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(`studytrack:targets:${student.id}`) || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) savedTargets = parsed;
  } catch {}
  return restoreStudentTargets(student, savedTargets);
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [authPage, setAuthPage] = useState("login");
  const [authProvider, setAuthProvider] = useState(null);
  const [authNotice, setAuthNotice] = useState("");
  const [cloudSubjectSync, setCloudSubjectSync] = useState(null);
  const [studySync, setStudySync] = useState(null);
  const activeAuthUserId = useRef(null);
  const cloudSaveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    if (!currentStudent) return;
    try {
      localStorage.setItem(`studytrack:targets:${currentStudent.id}`, JSON.stringify(currentStudent.targets));
      if (!saveStudentSettings(currentStudent)) {
        setStorageMessage("Browser storage is unavailable. Changes will last only for this session.");
      } else if (!cloudSubjectSync?.error) {
        setStorageMessage("");
      }
    } catch {
      setStorageMessage("Browser storage is unavailable. Changes will last only for this session.");
    }
  }, [
    currentStudent?.id,
    currentStudent?.targets,
    currentStudent?.subjects,
    currentStudent?.termStructure,
    currentStudent?.periodGrades,
    currentStudent?.grades,
    currentStudent?.previousGrades,
    currentStudent?.sessions,
    currentStudent?.weeklyHours,
    currentStudent?.studyFrequency,
    currentStudent?.focusLevel,
    currentStudent?.preferredMethod,
    cloudSubjectSync?.error,
  ]);

  useEffect(() => {
    if (authProvider !== "supabase" || !currentStudent
      || !cloudSubjectSync?.subjectsLoaded || !cloudSubjectSync?.gradesLoaded
      || cloudSubjectSync.userId !== activeAuthUserId.current
      || currentStudent.id !== `supabase_${cloudSubjectSync.userId}`) return undefined;

    const names = Array.isArray(currentStudent.subjects) ? currentStudent.subjects : [];
    const subjectsChanged = JSON.stringify(names)
      !== JSON.stringify(cloudSubjectSync.baselineSubjects);
    const nextGradeSnapshot = gradeDataSnapshot(currentStudent);
    const gradesChanged = nextGradeSnapshot !== cloudSubjectSync.baselineGrades;
    if (!subjectsChanged && !gradesChanged) return undefined;

    const { userId } = cloudSubjectSync;
    const studentSnapshot = {
      ...currentStudent,
      subjects: names,
      grades: currentStudent.grades || {},
      previousGrades: currentStudent.previousGrades || {},
      targets: currentStudent.targets || {},
      periodGrades: currentStudent.periodGrades || {},
    };
    const timeout = window.setTimeout(() => {
      if (activeAuthUserId.current !== userId) return;
      cloudSaveQueueRef.current = cloudSaveQueueRef.current.catch(() => {}).then(async () => {
        if (activeAuthUserId.current !== userId) return;
        if (subjectsChanged) await saveCloudSubjects(userId, names);
        if (activeAuthUserId.current !== userId) return;
        if (gradesChanged) await saveCloudGrades(userId, studentSnapshot);
        if (activeAuthUserId.current !== userId) return;
        setCloudSubjectSync((current) => current?.userId === userId
          ? {
            ...current,
            baselineSubjects: normalizeCloudSubjectNames(names),
            baselineGrades: nextGradeSnapshot,
            error: false,
          }
          : current);
        setStorageMessage("");
      }).catch(() => {
        if (activeAuthUserId.current !== userId) return;
        setCloudSubjectSync((current) => current?.userId === userId
          ? { ...current, error: true }
          : current);
        setStorageMessage("Could not sync subjects or grades to Supabase. Your local data is still saved.");
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    authProvider,
    currentStudent?.id,
    currentStudent?.subjects,
    currentStudent?.grades,
    currentStudent?.previousGrades,
    currentStudent?.targets,
    currentStudent?.periodGrades,
    currentStudent?.termStructure,
    cloudSubjectSync?.baselineSubjects,
    cloudSubjectSync?.baselineGrades,
    cloudSubjectSync?.subjectsLoaded,
    cloudSubjectSync?.gradesLoaded,
    cloudSubjectSync?.userId,
  ]);

  // Load sessions and habits once per sign-in, after subjects and grades have loaded
  useEffect(() => {
    const userId = cloudSubjectSync?.userId;
    if (authProvider !== "supabase" || !userId || !cloudSubjectSync?.gradesLoaded
      || studySync?.userId === userId) return undefined;
    let cancelled = false;
    loadCloudStudy(userId).then((cloud) => {
      if (cancelled || activeAuthUserId.current !== userId) return;
      setCurrentStudent((student) => {
        if (!student || student.id !== `supabase_${userId}`) return student;
        return cloud
          ? { ...student, sessions: cloud.sessions, ...pickHabits(cloud.habits) }
          : student; // nothing in the cloud yet: keep local data, it uploads below
      });
      setStudySync({
        userId,
        loaded: true,
        baseline: cloud
          ? studyDataSnapshot({ sessions: cloud.sessions, ...pickHabits(cloud.habits) })
          : "",
        error: false,
      });
    }).catch(() => {
      if (cancelled || activeAuthUserId.current !== userId) return;
      setStudySync({ userId, loaded: false, baseline: "", error: true });
      setStorageMessage("Could not load study sessions from Supabase. Local data was kept and nothing was uploaded.");
    });
    return () => { cancelled = true; };
  }, [authProvider, cloudSubjectSync?.userId, cloudSubjectSync?.gradesLoaded, studySync?.userId]);

  // Save sessions and habits whenever they change
  useEffect(() => {
    if (authProvider !== "supabase" || !currentStudent || !studySync?.loaded
      || studySync.userId !== activeAuthUserId.current
      || currentStudent.id !== `supabase_${studySync.userId}`) return undefined;

    const snapshot = studyDataSnapshot(currentStudent);
    if (snapshot === studySync.baseline) return undefined;

    const { userId } = studySync;
    const studentSnapshot = currentStudent;
    const timeout = window.setTimeout(() => {
      if (activeAuthUserId.current !== userId) return;
      cloudSaveQueueRef.current = cloudSaveQueueRef.current.catch(() => {}).then(async () => {
        if (activeAuthUserId.current !== userId) return;
        await saveCloudStudy(userId, studentSnapshot);
        if (activeAuthUserId.current !== userId) return;
        setStudySync((current) => current?.userId === userId
          ? { ...current, baseline: snapshot, error: false }
          : current);
        setStorageMessage("");
      }).catch(() => {
        if (activeAuthUserId.current !== userId) return;
        setStudySync((current) => current?.userId === userId ? { ...current, error: true } : current);
        setStorageMessage("Could not sync study sessions to Supabase. Your local data is still saved.");
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    authProvider,
    currentStudent?.id,
    currentStudent?.sessions,
    currentStudent?.weeklyHours,
    currentStudent?.studyFrequency,
    currentStudent?.focusLevel,
    currentStudent?.preferredMethod,
    studySync?.loaded,
    studySync?.baseline,
    studySync?.userId,
  ]);

  const handleLogin = (student) => {
    activeAuthUserId.current = null;
    setCloudSubjectSync(null);
    setStudySync(null);
    setAuthProvider("demo");
    setAuthNotice("");
    setStorageMessage("");
    const loadedStudent = loadStudentSettings({
      ...student,
      sessions: Array.isArray(student.sessions) ? [...student.sessions] : [],
    });
    const onboarding = loadStudentOnboarding(loadedStudent.id);
    const hasExistingRecords = Object.keys(loadedStudent.grades || {}).length > 0
      || loadedStudent.sessions.length > 0;
    const shouldShowOnboarding = !onboarding.complete && !hasExistingRecords;
    setCurrentStudent({
      ...loadedStudent,
      targets: getStudentTargets(loadedStudent),
      onboardingStep: onboarding.step,
    });
    setOnboardingOpen(shouldShowOnboarding);
    setLoggedIn(true);
  };

  const handleSupabaseAuth = useCallback(async (user) => {
    if (!user?.id || activeAuthUserId.current === user.id) return;
    activeAuthUserId.current = user.id;
    setAuthProvider("supabase");
    setStudySync(null);
    setCloudSubjectSync({
      userId: user.id,
      subjectsLoaded: false,
      gradesLoaded: false,
      baselineSubjects: [],
      baselineGrades: "",
      error: false,
    });
    setAuthNotice("");
    const loadedStudent = loadStudentSettings({
      ...createAuthenticatedStudent(user),
      sessions: [],
    });
    let cloudSubjects;
    try {
      cloudSubjects = await loadCloudSubjects(user.id);
    } catch {
      if (activeAuthUserId.current !== user.id) return;
      const onboarding = loadStudentOnboarding(loadedStudent.id);
      const hasExistingRecords = Object.keys(loadedStudent.grades || {}).length > 0
        || loadedStudent.sessions.length > 0;
      setCurrentStudent({
        ...loadedStudent,
        targets: getStudentTargets(loadedStudent),
        onboardingStep: onboarding.step,
      });
      setCloudSubjectSync({
        userId: user.id,
        subjectsLoaded: false,
        gradesLoaded: false,
        baselineSubjects: [],
        baselineGrades: "",
        error: true,
      });
      setStorageMessage("Could not load subjects from Supabase. Local subjects were kept and nothing was uploaded.");
      setOnboardingOpen(!onboarding.complete && !hasExistingRecords);
      setLoggedIn(true);
      return;
    }

    if (activeAuthUserId.current !== user.id) return;
    const localStudent = {
      ...loadedStudent,
      targets: getStudentTargets(loadedStudent),
    };
    let cloudGrades;
    try {
      cloudGrades = await loadCloudGrades(user.id);
    } catch {
      if (activeAuthUserId.current !== user.id) return;
      const subjects = cloudSubjects.length ? cloudSubjects : localStudent.subjects;
      const onboarding = loadStudentOnboarding(localStudent.id);
      const hasExistingRecords = Object.keys(localStudent.grades || {}).length > 0
        || localStudent.sessions.length > 0;
      setCurrentStudent({ ...localStudent, subjects, onboardingStep: onboarding.step });
      setCloudSubjectSync({
        userId: user.id,
        subjectsLoaded: true,
        gradesLoaded: false,
        baselineSubjects: cloudSubjects,
        baselineGrades: "",
        error: true,
      });
      setStorageMessage("Could not load grades from Supabase. Local data was kept and nothing was uploaded.");
      setOnboardingOpen(!onboarding.complete && !hasExistingRecords);
      setLoggedIn(true);
      return;
    }

    if (activeAuthUserId.current !== user.id) return;
    const subjects = cloudSubjects.length ? cloudSubjects : localStudent.subjects;
    const localGradeData = {
      grades: localStudent.grades || {},
      previousGrades: localStudent.previousGrades || {},
      targets: localStudent.targets || {},
      periodGrades: localStudent.periodGrades || {},
      termStructure: localStudent.termStructure,
    };
    const resolvedGrades = resolveCloudGradeData(cloudGrades, localGradeData);
    const student = {
      ...localStudent,
      subjects,
      ...resolvedGrades.data,
    };
    const onboarding = loadStudentOnboarding(student.id);
    const hasExistingRecords = Object.keys(student.grades || {}).length > 0
      || student.sessions.length > 0;
    const cloudSubjectBaseline = cloudSubjects;
    const cloudGradeBaseline = resolvedGrades.cloudHasData
      || resolvedGrades.shouldUploadLocal
      ? gradeDataSnapshot(cloudGrades)
      : gradeDataSnapshot(student);
    setCurrentStudent({
      ...student,
      onboardingStep: onboarding.step,
    });
    setCloudSubjectSync({
      userId: user.id,
      subjectsLoaded: true,
      gradesLoaded: true,
      baselineSubjects: cloudSubjectBaseline,
      baselineGrades: cloudGradeBaseline,
      error: false,
    });
    setStorageMessage("");
    setOnboardingOpen(!onboarding.complete && !hasExistingRecords);
    setLoggedIn(true);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleSupabaseAuth(session.user);
      } else if (event === "SIGNED_OUT") {
        activeAuthUserId.current = null;
        setCloudSubjectSync(null);
        setStudySync(null);
        setAuthProvider(null);
        setCurrentStudent(null);
        setOnboardingOpen(false);
        setLoggedIn(false);
        setAuthPage("login");
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthNotice("Could not restore your sign-in session. Please log in again.");
        return;
      }
      if (data.session?.user) handleSupabaseAuth(data.session.user);
    }).catch(() => {
      if (active) setAuthNotice("Could not check your sign-in session. Please log in again.");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [handleSupabaseAuth]);

  const finishOnboarding = () => {
    if (!currentStudent) return;
    if (!completeStudentOnboarding(currentStudent.id)) {
      setStorageMessage("The setup finished, but this browser could not save its completion status.");
    }
    setOnboardingOpen(false);
  };

  const replayOnboarding = () => {
    if (!currentStudent) return;
    setCurrentStudent((student) => ({ ...student, onboardingStep: 0 }));
    setOnboardingOpen(true);
  };

  const handleLogout = async () => {
    if (authProvider === "supabase" && supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          setAuthNotice("Unable to sign out from Supabase. Please try again.");
          return;
        }
      } catch {
        setAuthNotice("Unable to reach Supabase to sign out. Please try again.");
        return;
      }
    }
    activeAuthUserId.current = null;
    setCloudSubjectSync(null);
    setStudySync(null);
    setAuthProvider(null);
    setCurrentStudent(null);
    setLoggedIn(false);
    setOnboardingOpen(false);
    setPage("dashboard");
    setAuthPage("login");
    setAuthNotice("");
  };

  if (!loggedIn) {
    return authPage === "signup"
      ? <SignUp
        onBackToLogin={() => setAuthPage("login")}
        onSupabaseAuth={handleSupabaseAuth}
        authNotice={authNotice}
      />
      : <Login
        onLogin={handleLogin}
        onSignUp={() => setAuthPage("signup")}
        onSupabaseAuth={handleSupabaseAuth}
        authNotice={authNotice}
      />;
  }

  const Page = PAGES[page];
  const pageProps = { currentStudent, setCurrentStudent, setPage, onReplayOnboarding: replayOnboarding };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} open={navOpen} setOpen={setNavOpen} />
      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation">☰</button>
          <div className="topbar-title">StudyTrack <span>Research Prototype</span></div>
          <button className="btn-secondary" onClick={handleLogout}>Log Out</button>
        </header>
        {storageMessage && <div className="app-storage-status" role="status">{storageMessage}</div>}
        <main className="content">
          <Page key={page} {...pageProps} />
        </main>
      </div>
      {onboardingOpen && currentStudent && (
        <Onboarding
          student={currentStudent}
          setStudent={setCurrentStudent}
          onComplete={finishOnboarding}
          onSkip={finishOnboarding}
        />
      )}
    </div>
  );
}