const MEMBERS = [
  { name: "Andrey Bael", role: "Member" },
  { name: "Bill Gedrick Griar", role: "Group Creator" },
  { name: "Cyrus Magbanua", role: "Member" },
  { name: "Justin Laxa", role: "Member" },
  { name: "Rhenz Indonilla", role: "Member" },
  { name: "Wiley Javier", role: "Member" },
];

const RESEARCH_QUESTIONS = [
  "Is there a relationship between weekly study hours and academic performance?",
  "Does study frequency affect grades?",
  "Which study methods are associated with higher academic averages?",
  "How does self-rated focus level relate to grades?",
];

export default function About() {
  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">The Project</div>
          <h1>About StudyTrack</h1>
          <p className="muted">A research-focused web platform for monitoring student study habits and academic performance.</p>
        </div>
        <div className="page-pill">Research prototype</div>
      </div>

      <div className="card">
        <div className="insight-kicker">Introduction</div>
        <h4 style={{ marginTop: 4 }}>What is StudyTrack?</h4>
        <p style={{ fontSize: 13 }}>
          Students have different study habits, learning methods, and academic experiences that can affect their performance in school.
          However, students may not always have an organized way to track their study time, habits, grades, and progress —
          making it difficult to recognize which habits help them perform better and which areas need improvement.
        </p>
        <p style={{ fontSize: 13, marginBottom: 0 }}>
          StudyTrack is a web-based platform focused on monitoring and analyzing students' study habits and academic performance.
          It allows students to record study sessions, track hours by subject, enter grades, monitor progress, and view performance
          through organized charts and summaries. The platform also identifies possible relationships between study habits and academic
          performance, and provides recommendations that may help students improve.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="insight-kicker">Research Focus</div>
          <h4 style={{ marginTop: 4 }}>What we're looking at</h4>
          <ul className="detail-list-plain" style={{ marginTop: 8 }}>
            <li>📚 Study time and frequency per subject</li>
            <li>🧠 Preferred study methods</li>
            <li>🎯 Focus and concentration levels</li>
            <li>📊 Academic grades and progress over time</li>
            <li>🔗 Patterns between study habits and grades</li>
          </ul>
        </div>
        <div className="card">
          <div className="insight-kicker">Research Questions</div>
          <h4 style={{ marginTop: 4 }}>What we want to find out</h4>
          <ul className="detail-list-plain" style={{ marginTop: 8 }}>
            {RESEARCH_QUESTIONS.map((q, i) => (
              <li key={i} style={{ fontSize: 13, paddingBottom: 6 }}>→ {q}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="insight-kicker">Group Members</div>
        <h4 style={{ marginTop: 4 }}>The Team</h4>
        <div className="members-grid">
          {MEMBERS.map((m) => (
            <div className="member-card" key={m.name}>
              <div className="member-avatar">{m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card insight-card">
        <div className="insight-kicker">Important Note</div>
        <h4 style={{ marginTop: 4 }}>Patterns are not proof of causation</h4>
        <p style={{ fontSize: 13, marginBottom: 0 }}>
          StudyTrack is an informational and research-oriented prototype. All data shown is based on mock records from six student profiles.
          Patterns observed in this sample do not establish broader conclusions. Larger datasets and further study would be required to draw generalizable findings.
        </p>
      </div>
    </div>
  );
}
