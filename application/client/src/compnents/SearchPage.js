import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const [results, setResults] = useState([]);            // unified results
  const [status, setStatus] = useState("idle");          // idle | loading | done | error
  const [error, setError] = useState("");

  // Fetch results when URL query parameters change
  useEffect(() => {
    const searchTerm = q.get("q") || "";
    const searchType = q.get("type") || "default";
    
    if (!searchTerm) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const fetchResults = async () => {
      setStatus("loading");
      setError("");
      
      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 
          (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api');
        
        // Build the appropriate endpoint and parameters based on search type
        let endpoint, params;
        
        if (searchType === 'tutor') {
          endpoint = '/search/tutors';
          params = new URLSearchParams({
            q: searchTerm,
            limit: 20,
            offset: 0
          });
        } 
        else if (searchType === 'course') {
          endpoint = '/search/courses';
          params = new URLSearchParams({
            q: searchTerm,
            limit: 20,
            offset: 0
          });
        } 
        else { // default search (all)
          endpoint = '/search/all';
          params = new URLSearchParams({
            q: searchTerm,
            limit: 20,
            offset: 0
          });
        }
        
        const response = await fetch(`${apiBaseUrl}${endpoint}?${params.toString()}`);
        if (!response.ok) throw new Error(`Search responded with status ${response.status}`);
        
        const data = await response.json();
        
        // Process the response based on the endpoint
        if (endpoint.includes('tutors')) {
          const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
          setResults(items.map(item => ({ _kind: "tutor", ...item })));
        } 
        else if (endpoint.includes('courses')) {
          const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
          setResults(items.map(item => ({ _kind: "course", ...item })));
        } 
        else { // all
          const tutors = Array.isArray(data.tutors) ? data.tutors : [];
          const courses = Array.isArray(data.courses) ? data.courses : [];
          setResults([
            ...tutors.map(item => ({ _kind: "tutor", ...item })),
            ...courses.map(item => ({ _kind: "course", ...item }))
          ]);
        }
        
        setStatus("done");
      } catch (e) {
        console.error("Search error:", e);
        setError(e.message || "Failed to fetch search results");
        setStatus("error");
      }
    };
    
    fetchResults();
  }, [q]);

  // Render a card for tutor or course
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
          {item.avg_rating != null && (
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              Rating: {item.avg_rating.toFixed(1)} ⭐
              {item.sessions_completed != null && ` (${item.sessions_completed} sessions)`}
            </div>
          )}
          {courses && (
            <div style={{ color: "#6b7280", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
              <strong>Teaches:</strong> {courses}
            </div>
          )}
        </div>
      );
    } else if (item._kind === "course") {
      const courseCode = `${item.department_code} ${item.course_number}`;
      const tutorCount = item.tutor_count || 0;
      
      return (
        <div style={styles.card}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
          <div style={{ color: "#6b7280", marginBottom: 8 }}>{courseCode}</div>
          <div style={{ color: "#6b7280" }}>
            {tutorCount} {tutorCount === 1 ? 'tutor' : 'tutors'} available
          </div>
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
            {status === "idle" && (
              <div style={{ color: "#6b7280", textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Search for tutors or courses</div>
                <div>Use the search bar at the top of the page to find tutors or courses</div>
              </div>
            )}
            
            {status === "loading" && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div>Searching for "{q.get("q")}" in {q.get("type") === 'tutor' ? 'tutors' : q.get("type") === 'course' ? 'courses' : 'all'}...</div>
              </div>
            )}
            
            {status === "error" && (
              <div style={{ color: "#b91c1c", textAlign: 'center', padding: '40px 20px' }}>
                <div>Error: {error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#f4c542',
                    border: '1px solid #caa530',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
            
            {status === "done" && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                No results found for "{q.get("q")}" in {q.get("type") === 'tutor' ? 'tutors' : q.get("type") === 'course' ? 'courses' : 'all'}
              </div>
            )}

            {status === "done" && results.length > 0 && (
              <div style={{ marginBottom: '24px', color: '#6b7280' }}>
                Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{q.get("q")}" in {q.get("type") === 'tutor' ? 'tutors' : q.get("type") === 'course' ? 'courses' : 'all'}
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              {results.map((item, idx) => (
                <ResultCard key={item.id || item.course_id || `${item._kind}-${idx}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
