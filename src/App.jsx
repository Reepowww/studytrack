import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudyHabits from "./pages/StudyHabits.jsx";
import AcademicPerformance from "./pages/AcademicPerformance.jsx";
import StudentComparison from "./pages/StudentComparison.jsx";
import Analytics from "./pages/Analytics.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import About from "./pages/About.jsx";
import { students } from "./data/students.js";

const PAGES = {
  dashboard: Dashboard,
  habits: StudyHabits,
  performance: AcademicPerformance,
  comparison: StudentComparison,
  analytics: Analytics,
  recommendations: Recommendations,
  about: About,
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  if (!loggedIn) return <Login onLogin={(student) => { setCurrentStudent({ ...student, sessions: [...student.sessions] }); setLoggedIn(true); }} />;

  const Page = PAGES[page];
  const pageProps = { currentStudent, setCurrentStudent };

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
