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
  const activeAuthUserId = useRef(null);

  useEffect(() => {
    if (!currentStudent) return;
    try {
      localStorage.setItem(`studytrack:targets:${currentStudent.id}`, JSON.stringify(currentStudent.targets));
      if (!saveStudentSettings(currentStudent)) {
        setStorageMessage("Browser storage is unavailable. Changes will last only for this session.");
      } else {
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
  ]);

  const handleLogin = (student) => {
    activeAuthUserId.current = null;
    setAuthProvider("demo");
    setAuthNotice("");
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

  const handleSupabaseAuth = useCallback((user) => {
    if (!user?.id || activeAuthUserId.current === user.id) return;
    activeAuthUserId.current = user.id;
    setAuthProvider("supabase");
    setAuthNotice("");
    const loadedStudent = loadStudentSettings({
      ...createAuthenticatedStudent(user),
      sessions: [],
    });
    const onboarding = loadStudentOnboarding(loadedStudent.id);
    const hasExistingRecords = Object.keys(loadedStudent.grades || {}).length > 0
      || loadedStudent.sessions.length > 0;
    setCurrentStudent({
      ...loadedStudent,
      targets: getStudentTargets(loadedStudent),
      onboardingStep: onboarding.step,
    });
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
