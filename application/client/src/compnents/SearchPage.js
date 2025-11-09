import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const styles = {
    container: { display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", overflowX: "hidden" },
    heading: {
      color: "#333", textAlign: "center", paddingBottom: "3px", borderBottom: "8px solid #9A2250",
      display: "block", margin: "20px auto", fontSize: "45px", fontWeight: "600", width: "fit-content"
    },
    content: { width: "100%", margin: "0 auto", padding: "20px", flex: 1, boxSizing: "border-box" },
    title: { textAlign: "left", margin: "0 0 20px 0", fontSize: "2rem", color: "#2c3e50", paddingBottom: "10px", borderBottom: "2px solid #f0f0f0" },
    section: { marginBottom: "20px", backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
    columnsContainer: { display: "flex", gap: "20px", width: "100%", maxWidth: "100%", boxSizing: "border-box" },
    leftColumn: { flex: "3", minWidth: 0, padding: "20px" },
    rightColumn: { flex: "1", minWidth: 0, padding: "20px" },
    card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 12 }
  };

  const q = useQuery();
  const navigate = useNavigate();

  const [type, setType] = useState(q.get("type") || "default"); // default | tutor | course
  const [term, setTerm] = useState(q.get("q") || "");
  const [results, setResults] = useState([]);            // unified results
  const [status, setStatus] = useState("idle");          // idle | loading | done | error
  const [error, setError] = useState("");

  const handleSearch = useCallback(async (selectedType = type, query = term) => {
    const searchText = (query || "").trim();
    if (!searchText) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setError("");
    setResults([]);

    try {
      // Determine API base URL for local vs production
      const apiBaseUrl = process.env.REACT_APP_API_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

      // Build API URL - backend returns {items: [...], total: ..., limit: ..., offset: ...}
      // All searches use /search/tutors endpoint (it searches by name and course)
      const tutorURL = `${apiBaseUrl}/search/tutors?q=${encodeURIComponent(searchText)}&limit=20&offset=0`;

      let payload = [];

      // Fetch tutors (backend searches both tutor names and courses)
      const r = await fetch(tutorURL);
      if (!r.ok) throw new Error(`Search responded ${r.status}`);
      
      const data = await r.json();
      
      // Handle backend response format: {items: [...], total: ..., limit: ..., offset: ...}
      // Also handle legacy formats: array or {results: [...]}
      let tutors = [];
      if (Array.isArray(data)) {
        tutors = data;
      } else if (Array.isArray(data.items)) {
        tutors = data.items;
      } else if (Array.isArray(data.results)) {
        tutors = data.results;
      }

      // All results are tutors (backend only returns tutors)
      // For course search, we show tutors that teach courses matching the search
      payload = tutors.map(it => ({ _kind: "tutor", ...it }));

      setResults(payload);
      setStatus("done");
      navigate(`/search?type=${encodeURIComponent(selectedType)}&q=${encodeURIComponent(searchText)}`, { replace: false });
    } catch (e) {
      setError(e.message || "Search failed");
      setStatus("error");
    }
  }, [type, term, navigate]);

  // On first mount, run if URL has q (run even when default)
  useEffect(() => {
    const initialType = q.get("type") || "default";
    const initialTerm = q.get("q") || "";
    setType(initialType);
    setTerm(initialTerm);
    if (initialTerm) {
      handleSearch(initialType, initialTerm);
    }
  }, [q, handleSearch]);

  function onSubmit(e) {
    e.preventDefault();
    handleSearch();
  }

  // Render a simple card for tutor or course (no external component)
  function ResultCard({ item }) {
    if (item._kind === "tutor") {
      const fullName = [item.first_name, item.last_name].filter(Boolean).join(" ") || item.name || "Tutor";
      const langs = Array.isArray(item.languages) ? item.languages.join(", ") : item.languages || "";
      const courses = Array.isArray(item.courses)
        ? item.courses.map(c => `${c.department_code} ${c.course_number} — ${c.title}`).join(" | ")
        : null;
      const hourlyRate = item.hourly_rate_cents ? `$${(item.hourly_rate_cents / 100).toFixed(2)}/hr` : null;

      return (
        <div style={styles.card}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{fullName}</div>
          {hourlyRate && <div style={{ color: "#6b7280", marginTop: 4 }}>Rate: {hourlyRate}</div>}
          {langs && <div style={{ color: "#6b7280", marginTop: 4 }}>Languages: {langs}</div>}
          {item.avg_rating != null && <div style={{ color: "#6b7280", marginTop: 4 }}>Rating: {item.avg_rating.toFixed(1)} ⭐</div>}
          {courses && <div style={{ color: "#6b7280", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
            <strong>Courses:</strong> {courses}
          </div>}
        </div>
      );
    } else {
      // course (if we ever add course results)
      const title = item.title || "Course";
      const code = [item.department_code, item.course_number].filter(Boolean).join(" ");
      return (
        <div style={styles.card}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
          {code && <div style={{ color: "#6b7280", marginTop: 4 }}>{code}</div>}
          {item.instructor && <div style={{ color: "#6b7280", marginTop: 4 }}>Instructor: {item.instructor}</div>}
        </div>
      );
    }
  }

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Search</h1>

      <div style={styles.content}>
        <div style={styles.columnsContainer}>
          <div style={styles.leftColumn}>
            <div style={styles.section}>
              <h2 style={styles.title}>Find a course or tutor</h2>
              <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "160px 1fr 120px", gap: 12 }}>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  <option value="default">Default (both)</option>
                  <option value="course">Course</option>
                  <option value="tutor">Tutor</option>
                </select>

                <input
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="Search..."
                  onKeyDown={(e) => { if (e.key === "Enter") onSubmit(e); }}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />

                <button
                  type="submit"
                  style={{ padding: "10px 14px", borderRadius: 10, background: "#f4c542", border: "1px solid #caa530", cursor: "pointer", fontWeight: 600 }}
                >
                  Search
                </button>
              </form>
            </div>

            {status === "idle" && <div style={{ color: "#6b7280" }}>Type a term and press Search</div>}
            {status === "loading" && <div>Searching…</div>}
            {status === "error" && <div style={{ color: "#b91c1c" }}>Error: {error}</div>}
            {status === "done" && results.length === 0 && <div>No results found</div>}

            <div style={{ marginTop: 10 }}>
              {results.map((item, idx) => (
                <ResultCard key={item.id || item.email || item.code || `${item._kind}-${idx}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
