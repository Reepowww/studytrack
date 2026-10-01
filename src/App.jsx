import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudyHabits from "./pages/StudyHabits.jsx";
import AcademicPerformance from "./pages/AcademicPerformance.jsx";
import Analytics from "./pages/Analytics.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import About from "./pages/About.jsx";
import { students, subjects } from "./data/students.js";

const PAGES = {
  dashboard: Dashboard,
  habits: StudyHabits,
  performance: AcademicPerformance,
  analytics: Analytics,
  recommendations: Recommendations,
  about: About,
};

const getStudentTargets = (student) => {
  try {
    const savedTargets = JSON.parse(localStorage.getItem(`studytrack:targets:${student.id}`) || "{}");
    return Object.fromEntries(subjects.map((subject) => {
      const target = Number(savedTargets?.[subject]);
      return [subject, Number.isFinite(target) && savedTargets?.[subject] !== "" && target >= 0 && target <= 100
        ? target
        : student.grades[subject]];
    }));
  } catch {
    return Object.fromEntries(subjects.map((subject) => [subject, student.grades[subject]]));
  }
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  useEffect(() => {
    if (!currentStudent) return;
    try {
      localStorage.setItem(`studytrack:targets:${currentStudent.id}`, JSON.stringify(currentStudent.targets));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [currentStudent?.id, currentStudent?.targets]);

  if (!loggedIn) return <Login onLogin={(student) => { setCurrentStudent({ ...student, sessions: [...student.sessions], targets: getStudentTargets(student) }); setLoggedIn(true); }} />;

  const Page = PAGES[page];
  const pageProps = { currentStudent, setCurrentStudent, setPage };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} open={navOpen} setOpen={setNavOpen} />
      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation">☰</button>
          <div className="topbar-title">StudyTrack <span>Research Prototype</span></div>
          <button className="btn-secondary" onClick={() => { setLoggedIn(false); setCurrentStudent(null); setPage("dashboard"); }}>Log Out</button>
        </header>
        <main className="content">
          <Page key={page} {...pageProps} />
        </main>
      </div>
    </div>
  );
}
