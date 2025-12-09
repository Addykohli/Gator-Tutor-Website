import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from './Footer';
import { useAuth } from '../Context/Context';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const FilterSection = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: '12px', minWidth: '140px' }}>
    <h4 style={{
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      color: darkMode ? '#fff' : '#2c3e50',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>{title}</h4>
    {children}
  </div>
);

const CheckboxGroup = ({ options, selected, onChange, darkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {options.map(opt => (
      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: darkMode ? '#ccc' : '#555' }}>
        <input
          type="checkbox"
          checked={selected.includes(opt.value)}
          onChange={(e) => {
            const newSelected = e.target.checked
              ? [...selected, opt.value]
              : selected.filter(v => v !== opt.value);
            onChange(newSelected);
          }}
          style={{ accentColor: '#35006D' }}
        />
        {opt.label} {opt.count !== undefined && <span style={{ color: darkMode ? '#777' : '#999', fontSize: '12px' }}>({opt.count})</span>}
      </label>
    ))}
  </div>
);

export default function SearchPage() {
  const navigate = useNavigate();
  const { darkMode, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 430;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Admin edit mode state
  const [editingTutorCourses, setEditingTutorCourses] = useState(null); // tutor ID being edited
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: null, tutorId: null, courseId: null, tutorName: '', courseName: '' });

  // Remove course from tutor (Admin only)
  const handleRemoveCourse = async (tutorId, courseId) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/tutor/${tutorId}/course/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to remove course');

      // Update UI locally without refresh
      setResults(prevResults => prevResults.map(item => {
        // Check if this is the tutor we modified
        if (item._kind === 'tutor' && (item.id === tutorId || item.tutor_id === tutorId)) {
          return {
            ...item,
            // Filter out the removed course
            courses: item.courses ? item.courses.filter(c => c.course_id !== courseId) : []
          };
        }
        return item;
      }));

    } catch (error) {
      console.error('Error removing course:', error);
      alert('Failed to remove course. Please try again.');
    }
  };

  // Demote tutor to student (Admin only)
  const handleDemoteTutor = async (userId) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/demote/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to demote tutor');
      // Refresh results
      setResults(prevResults => prevResults.filter(item => {
        // Remove the demoted tutor from the results list
        if (item._kind === 'tutor' && (item.id === userId || item.tutor_id === userId)) {
          return false;
        }
        return true;
      }));
    } catch (error) {
      console.error('Error demoting tutor:', error);
      alert('Failed to remove tutor status. Please try again.');
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : 'rgb(250, 245, 255)',
    },
    heading: {
      color: darkMode ? "#fff" : "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content",
    },
    content: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "40px 20px",
      width: "100%",
    },
    activeFiltersContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '16px',
      alignItems: 'center',
    },
    filterChip: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      backgroundColor: darkMode ? 'rgba(255, 220, 100, 0.1)' : 'rgba(53, 0, 109, 0.05)',
      color: darkMode ? '#fff' : '#35006D',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      border: darkMode ? '1px solid rgba(255, 220, 100, 0.2)' : '1px solid rgba(53, 0, 109, 0.1)',
    },
    removeFilter: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      fontSize: '10px',
      lineHeight: 1,
    },
    resultsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    resultCount: {
      fontSize: '14px',
      color: darkMode ? '#aaa' : '#666',
      fontWeight: '500',
      marginLeft: 'auto',
    },
    searchSection: {
      display: "flex",
      gap: "16px",
      marginBottom: "32px",
      maxWidth: "600px",
    },
    resultsTitle: {
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "24px",
      color: "#2c3e50",
    },
    tutorsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 25vw, 320px), 1fr))',
      gap: "clamp(12px, 2vw, 24px)",
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: "clamp(12px, 2vw, 24px)",
      marginTop: "clamp(12px, 2vw, 16px)",
    },
    courseCard: {
      backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fafafa',
      border: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
      borderRadius: "clamp(6px, 1vw, 8px)",
      padding: "clamp(10px, 2vw, 20px)",
      transition: 'box-shadow 0.2s, background-color 0.3s, border-color 0.3s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontSize: "clamp(12px, 1.8vw, 14px)",
      '&:hover': {
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }
    },
    courseHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: "clamp(10px, 2vw, 16px)",
    },
    courseCode: {
      fontSize: "clamp(16px, 2.5vw, 20px)",
      fontWeight: 'bold',
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      marginBottom: "clamp(2px, 0.5vw, 4px)",
      transition: 'color 0.3s',
    },
    courseName: {
      fontSize: "clamp(12px, 1.8vw, 14px)",
      color: darkMode ? '#bbb' : '#666',
      transition: 'color 0.3s',
    },
    statusBadge: {
      padding: "clamp(3px, 0.5vw, 4px) clamp(8px, 1.5vw, 12px)",
      borderRadius: "clamp(8px, 1.5vw, 12px)",
      fontSize: "clamp(10px, 1.5vw, 12px)",
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
    courseDetails: {
      margin: '16px 0',
      padding: '16px 0',
      borderTop: '1px solid #e8e8e8',
      borderBottom: '1px solid #e8e8e8',
      flexGrow: 1,
    },
    detailRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      fontSize: '14px',
      color: darkMode ? '#bbb' : '#666',
      transition: 'color 0.3s',
    },
    detailLabel: {
      fontWeight: '500',
      color: darkMode ? '#eee' : '#333',
      transition: 'color 0.3s',
    },
    viewButton: {
      width: '100%',
      padding: '12px',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: 'auto',
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      color: darkMode ? '#333' : 'white',
      '&:hover': {
        opacity: 0.9,
        transform: 'translateY(-1px)',
        boxShadow: darkMode ? '0 4px 8px rgba(255, 220, 100, 0.2)' : '0 4px 8px rgba(53, 0, 109, 0.2)'
      },
      '&:active': {
        transform: 'translateY(0)'
      }
    },
    tutorCard: {
      backgroundColor: darkMode ? 'rgb(60, 60, 60)' : "#fafafa",
      border: darkMode ? '1px solid #444' : "1px solid #e8e8e8",
      borderRadius: "clamp(6px, 1vw, 8px)",
      padding: "clamp(10px, 2vw, 20px)",
      transition: "box-shadow 0.2s, background-color 0.3s, border-color 0.3s",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      fontSize: "clamp(12px, 1.8vw, 14px)",
      '&:hover': {
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }
    },
    tutorCardContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    coursesSection: {
      marginBottom: "clamp(10px, 2vw, 16px)",
    },
    availabilitySection: {
      marginBottom: "clamp(10px, 2vw, 16px)",
    },
    tutorHeader: {
      display: "flex",
      alignItems: "center",
      gap: "clamp(8px, 1.5vw, 16px)",
      marginBottom: "clamp(10px, 2vw, 16px)",
    },
    tutorAvatar: {
      width: "clamp(36px, 8vw, 56px)",
      height: "clamp(36px, 8vw, 56px)",
      borderRadius: "50%",
      backgroundColor: "#35006D",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "clamp(14px, 3vw, 22px)",
      fontWeight: "bold",
      flexShrink: 0,
    },
    tutorName: {
      fontSize: "clamp(14px, 2.5vw, 18px)",
      fontWeight: '600',
      color: darkMode ? '#fff' : '#2c3e50',
      margin: 0,
      transition: 'color 0.3s',
    },
    tutorTitle: {
      fontSize: '14px',
      color: darkMode ? '#bbb' : '#666',
      margin: '4px 0 0 0',
      transition: 'color 0.3s',
    },
    sectionHeading: {
      fontSize: '24px',
      fontWeight: '600',
      color: darkMode ? '#fff' : '#2c3e50',
      margin: '0 0 20px 0',
      paddingBottom: '8px',
      borderBottom: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      transition: 'color 0.3s, border-color 0.3s'
    },
    tutorRating: {
      color: "#FFCF01",
      fontSize: "clamp(12px, 1.8vw, 14px)",
    },
    sectionLabel: {
      fontSize: "clamp(12px, 1.8vw, 14px)",
      color: darkMode ? "#ebeaeaff" : "#313131ff",
      marginBottom: "clamp(6px, 1vw, 8px)",
      fontWeight: "500",
    },
    courseBadge: {
      display: "inline-block",
      backgroundColor: "#FFCF01",
      color: "#35006D",
      padding: "clamp(3px, 0.5vw, 4px) clamp(8px, 1.5vw, 12px)",
      borderRadius: "clamp(8px, 1.5vw, 12px)",
      fontSize: "clamp(11px, 1.6vw, 13px)",
      fontWeight: "500",
      margin: "clamp(2px, 0.5vw, 4px)",
    },
    availabilityBadge: {
      display: "inline-block",
      border: "1px solid #35006D",
      color: "#35006D",
      padding: "clamp(3px, 0.5vw, 4px) clamp(8px, 1.5vw, 12px)",
      borderRadius: "clamp(8px, 1.5vw, 12px)",
      fontSize: "clamp(10px, 1.5vw, 12px)",
      margin: "clamp(2px, 0.5vw, 4px)",
    },
    tutorActions: {
      display: "flex",
      flexDirection: "row",
      gap: "clamp(8px, 1.5vw, 12px)",
      marginTop: "auto",
    },
    contactButton: {
      flex: 1,
      backgroundColor: "#35006D",
      color: "white",
      border: "none",
      padding: "clamp(8px, 1.2vw, 10px)",
      borderRadius: "clamp(4px, 0.8vw, 6px)",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "clamp(12px, 1.6vw, 14px)",
      transition: "background-color 0.2s",
    },
    bookButton: {
      flex: 1,
      backgroundColor: "#FFCF01",
      color: "#35006D",
      border: "none",
      padding: "clamp(8px, 1.2vw, 10px)",
      borderRadius: "clamp(4px, 0.8vw, 6px)",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "clamp(12px, 1.6vw, 14px)",
      transition: "background-color 0.2s",
    },
    noResults: {
      textAlign: "center",
      padding: "48px",
      backgroundColor: darkMode ? "rgb(30, 30, 30)" : "#fafafa",
      borderRadius: "8px",
      maxWidth: "600px",
    },
    noResultsTitle: {
      fontSize: "20px",
      marginBottom: "16px",
      color: "#2c3e50",
    },
    requestButton: {
      backgroundColor: "#FFCF01",
      color: "#35006D",
      border: "none",
      padding: "12px 32px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      marginTop: "16px",
    }
  };

  const q = useQuery();
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const statusRef = React.useRef(status);

  // Update the ref whenever status changes
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Filter State
  const [filterOptions, setFilterOptions] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sync local price state with URL params
  useEffect(() => {
    const min = q.get('min_rate');
    const max = q.get('max_rate');
    if (min) setMinPrice((parseInt(min) / 100).toString());
    else setMinPrice('');

    if (max) setMaxPrice((parseInt(max) / 100).toString());
    else setMaxPrice('');
  }, [q]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${apiBaseUrl}/search/filters`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchFilters();
  }, []);

  // Helper to update URL with new filters
  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(q);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(','));
        else params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset offset when filters change
    params.set('offset', '0');

    navigate(`/search?${params.toString()}`);
  };

  // Fetch results when URL query parameters change
  useEffect(() => {
    console.log('useEffect triggered with q:', q.toString());
    const searchTerm = (q.get("q") || "").toLowerCase();
    const searchType = q.get("type") || "default";

    console.log('Search params:', { searchTerm, searchType });

    const fetchResults = () => {
      setStatus("loading");
      setError("");

      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';

        // Build the appropriate endpoint and parameters
        let endpoint, params = new URLSearchParams({
          limit: 20,
          offset: 0
        });

        if (searchTerm) {
          params.set('q', searchTerm);
        }

        // filter params from URL
        ['min_rate', 'max_rate', 'languages', 'departments', 'course_levels', 'weekday', 'available_after', 'available_before', 'location_modes', 'sort_by', 'sort_order'].forEach(key => {
          const val = q.get(key);
          if (val) params.set(key, val);
        });

        if (searchType === 'tutor') {
          endpoint = '/search/tutors';
        } else if (searchType === 'course') {
          endpoint = '/search/courses';
        } else {
          endpoint = '/search/all';
        }

        fetch(`${apiBaseUrl}${endpoint}?${params.toString()}`)
          .then(response => {
            if (!response.ok) throw new Error(`Search responded with status ${response.status}`);
            return response.json();
          })
          .then(data => {
            if (endpoint.includes('tutors')) {
              const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
              setResults(items.map(item => ({ _kind: "tutor", ...item })));
            } else if (endpoint.includes('courses')) {
              const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
              setResults(items.map(item => ({ _kind: "course", ...item })));
            } else {
              const tutors = Array.isArray(data.tutors) ? data.tutors : [];
              const courses = Array.isArray(data.courses) ? data.courses : [];
              setResults([
                ...tutors.map(item => ({ _kind: "tutor", ...item })),
                ...courses.map(item => ({ _kind: "course", ...item }))
              ]);
            }
            setStatus("done");
          })
          .catch(e => {
            console.error("Search error:", e);
            setError(e.message || "Failed to fetch search results");
            setStatus("error");
          });

      } catch (e) {
        console.error("Search error:", e);
        setError(e.message || "Failed to process search results");
        setStatus("error");
      }
    };

    // Initial fetch
    fetchResults();

    // Set up a small delay to ensure the loading state is shown
    const timer = setTimeout(() => {
      if (statusRef.current === "loading") {
        // Force a re-render if still loading
        setStatus(prev => prev === "loading" ? "done" : prev);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [q]); // Only depend on q since we're getting searchTerm and searchType from it

  // Render a card for tutor or course
  function ResultCard({ item }) {
    if (item._kind === "tutor") {
      const fullName = [item.first_name, item.last_name].filter(Boolean).join(" ") || item.name || "Tutor";
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
      const hourlyRate = item.hourly_rate_cents ? `$${(item.hourly_rate_cents / 100).toFixed(2)}/hr` : 'Rate not specified';

      const handleTutorClick = () => {
        // Use the appropriate ID property based on the data structure
        const tutorId = item.id || item.tutor_id || item.user_id;
        if (tutorId) {
          navigate(`/tutor/${tutorId}`);
        } else {
          console.error('No valid tutor ID found in tutor data:', item);
        }
      };

      return (
        <div
          style={{ ...styles.tutorCard, cursor: 'pointer' }}
          onClick={handleTutorClick}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'}
        >
          <div style={styles.tutorCardContent}>
            <div style={styles.tutorHeader}>
              <div style={styles.tutorAvatar}>
                {initials}
              </div>
              <div>
                <div style={styles.tutorName}>{fullName}</div>
                <div style={{ fontWeight: '600', color: darkMode ? '#e2e8f0' : '#2c3e50', margin: '4px 0' }}>
                  {hourlyRate}
                </div>
                {item.avg_rating != null && (
                  <div style={styles.tutorRating}>
                    {'★'.repeat(Math.floor(item.avg_rating))}
                    {'☆'.repeat(5 - Math.ceil(item.avg_rating))}
                    {` ${item.avg_rating.toFixed(1)}`}
                    {item.sessions_completed != null && ` (${item.sessions_completed} sessions)`}
                  </div>
                )}
              </div>
            </div>

            {item.courses && item.courses.length > 0 && (
              <div style={styles.coursesSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.sectionLabel}>Teaches</div>
                  {isAdmin && (
                    <i
                      className="fas fa-pencil-alt"
                      style={{
                        color: '#dc3545',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTutorCourses(editingTutorCourses === (item.id || item.tutor_id) ? null : (item.id || item.tutor_id));
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Edit courses"
                    />
                  )}
                </div>
                <div>
                  {item.courses.map((course, idx) => (
                    <span key={idx} style={{ ...styles.courseBadge, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      {course.department_code} {course.course_number}
                      {isAdmin && editingTutorCourses === (item.id || item.tutor_id) && (
                        <i
                          className="fas fa-times"
                          style={{
                            color: '#dc3545',
                            fontSize: '10px',
                            marginLeft: '6px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDialog({
                              show: true,
                              type: 'removeCourse',
                              tutorId: item.id || item.tutor_id,
                              courseId: course.course_id,
                              tutorName: [item.first_name, item.last_name].filter(Boolean).join(' '),
                              courseName: `${course.department_code} ${course.course_number}`
                            });
                          }}
                          title="Remove course"
                        />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.availability && item.availability.length > 0 && (
              <div style={styles.availabilitySection}>
                <div style={styles.sectionLabel}>Availability</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.availability.map((slot, idx) => (
                    <div key={idx} style={styles.availabilityBadge}>
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...styles.tutorActions, flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
              <button style={{ ...styles.contactButton, fontSize: isMobile ? '12px' : 'inherit', padding: isMobile ? '8px' : '10px' }}>
                Contact
              </button>
              {isAdmin ? (
                <button
                  style={{
                    ...styles.bookButton,
                    fontSize: isMobile ? '12px' : 'inherit',
                    padding: isMobile ? '8px' : '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({
                      show: true,
                      type: 'demoteTutor',
                      tutorId: item.id || item.tutor_id || item.user_id,
                      courseId: null,
                      tutorName: [item.first_name, item.last_name].filter(Boolean).join(' '),
                      courseName: ''
                    });
                  }}
                >
                  Remove Tutor Status
                </button>
              ) : (
                <button style={{ ...styles.bookButton, fontSize: isMobile ? '12px' : 'inherit', padding: isMobile ? '8px' : '10px' }}>
                  Book
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else if (item._kind === "course") {
      const courseCode = `${item.department_code} ${item.course_number}`;
      const tutorCount = item.tutor_count || 0;
      const status = (() => {
        if (tutorCount > 0) return { text: 'Active', bg: 'rgb(16, 185, 129)', color: 'white' };
        return { text: 'Inactive', bg: 'rgb(189, 42, 71)', color: 'white' };
      })();

      const buttonBg = tutorCount > 0 ? '#35006D' : '#FFCF01';
      const buttonColor = tutorCount > 0 ? 'white' : '#35006D';
      const buttonText = tutorCount > 0 ? 'View Tutors' : 'Request Coverage';
      const tutorText = tutorCount === 0
        ? 'No tutors'
        : `${tutorCount} tutor${tutorCount > 1 ? 's' : ''} available`;

      return (
        <div style={styles.courseCard}>
          <div style={styles.courseHeader}>
            <div>
              <div style={styles.courseCode}>{courseCode}</div>
              <div style={styles.courseName}>{item.title}</div>
            </div>
            <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
              {status.text}
            </span>
          </div>

          <div style={styles.courseDetails}>
            <div style={styles.detailRow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>{tutorText}</span>
            </div>
          </div>

          <button
            style={{
              ...styles.viewButton,
              backgroundColor: buttonBg,
              color: buttonColor,
              cursor: 'pointer'
            }}
            onClick={() => {
              if (tutorCount > 0) {
                window.location.href = `/search?q=${item.department_code}+${item.course_number}&type=tutor`;
              } else {
                window.location.href = '/request-coverage';
              }
            }}
          >
            {buttonText}
          </button>
        </div>
      );
    }
    return null;
  }

  // Add styles for the search bar
  const searchBarStyles = {
    searchContainer: {
      backgroundColor: darkMode ? "rgb(60, 60, 60)" : "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
      boxSizing: 'border-box',
      width: '100%',
      margin: '0 0 30px 0',
      position: 'relative',
      transition: 'background-color 0.3s, box-shadow 0.3s'
    },
    searchInputContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
      width: '100%',
      flexDirection: isMobile ? 'column' : 'row',
    },
    mobileSearchTopRow: {
      display: 'flex',
      width: '100%',
      gap: '8px',
      alignItems: 'stretch'
    },
    searchInput: {
      flex: 1,
      padding: '10px 16px',
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#ddd'}`,
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
      color: darkMode ? '#fff' : '#333',
      outline: 'none',
      transition: 'all 0.3s ease',
      height: '40px',
      boxSizing: 'border-box',
      '&:focus': {
        borderColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
        boxShadow: darkMode
          ? '0 0 0 2px rgba(255, 220, 100, 0.2)'
          : '0 0 0 2px rgba(53, 0, 109, 0.2)',
      },
      '&::placeholder': {
        color: darkMode ? '#aaa' : '#6c757d',
      }
    },
    searchButton: {
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '100%' : 'auto',
      gap: '8px',
      fontWeight: '600',
      fontSize: '16px',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#4b1a80',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateY(-1px)'
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    },
    categoryDropdown: {
      position: 'relative',
      display: 'inline-block',
      minWidth: '100px',
      width: isMobile ? 'auto' : '120px',
      height: '40px',
    },
    categoryButton: {
      padding: '0 16px',
      backgroundColor: darkMode ? 'rgb(80, 80, 80)' : '#f8f9fa',
      color: darkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#ddd'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      whiteSpace: 'nowrap',
      border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid #ced4da',
      borderRadius: '6px',
      cursor: 'pointer',
      width: '100%',
      height: '40px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
      '&:hover': {
        backgroundColor: darkMode ? 'rgb(100, 100, 100)' : '#e9ecef',
        borderColor: darkMode ? 'rgb(50, 50, 50)' : '#adb5bd'
      },
      '&:active': {
        transform: 'translateY(1px)'
      }
    },
    categoryList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      width: '100%',
      padding: '8px 0',
      margin: '4px 0 0',
      backgroundColor: darkMode ? 'rgb(70, 70, 70)' : '#ffffff',
      border: darkMode ? '1px solid rgb(50, 50, 50)' : '1px solid rgba(0,0,0,.15)',
      borderRadius: '6px',
      boxShadow: '0 6px 12px rgba(0,0,0,.175)',
      listStyle: 'none',
      '& li': {
        padding: '10px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        color: darkMode ? '#fff' : '#212529',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          color: darkMode ? '#fff' : '#212529'
        },
        '&:active': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Toggle category dropdown
  const toggleCategory = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };

  // Select category
  const selectCategory = (category) => {
    setSearchCategory(category);
    setIsCategoryOpen(false);

    // Update the URL immediately when category changes
    const searchType = category === 'default' ? 'all' : category;
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('type', searchType);

    // Preserve other query parameters
    ['min_rate', 'max_rate', 'languages', 'departments', 'course_levels',
      'weekday', 'available_after', 'available_before', 'location_modes',
      'sort_by', 'sort_order'].forEach(key => {
        const val = q.get(key);
        if (val) params.set(key, val);
      });

    navigate(`/search?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchType = searchCategory === 'default' ? 'all' : searchCategory;
    // Update the URL with the current search query and type
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('type', searchType);

    // Preserve other query parameters
    ['min_rate', 'max_rate', 'languages', 'departments', 'course_levels',
      'weekday', 'available_after', 'available_before', 'location_modes',
      'sort_by', 'sort_order'].forEach(key => {
        const val = q.get(key);
        if (val) params.set(key, val);
      });

    navigate(`/search?${params.toString()}`);
  };

  // Initialize search query and category from URL
  const [searchQuery, setSearchQuery] = useState(q.get('q') || '');
  const [searchCategory, setSearchCategory] = useState(isAdmin ? 'tutor' : (q.get('type') || 'default'));
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [tutorSortOrder, setTutorSortOrder] = useState(q.get('sort_order')); // null, 'asc', 'desc'

  // Update tutorSortOrder when q changes
  useEffect(() => {
    setTutorSortOrder(q.get('sort_order'));
  }, [q]);

  // Apply client-side filters to results
  const getFilteredResults = (results) => {
    return results.filter(item => {
      // For courses: only apply department filter
      if (item._kind === 'course') {
        const departments = q.get('departments');
        if (departments) {
          const deptArray = departments.split(',');
          if (!deptArray.includes(item.department_code)) return false;
        }
        return true;
      }

      // For tutors: apply all filters
      if (item._kind !== 'tutor') return true;

      // Price filter
      const minRate = q.get('min_rate');
      const maxRate = q.get('max_rate');
      if (minRate && item.hourly_rate_cents < parseInt(minRate)) return false;
      if (maxRate && item.hourly_rate_cents > parseInt(maxRate)) return false;

      // Department filter
      const departments = q.get('departments');
      if (departments) {
        const deptArray = departments.split(',');
        const tutorDepts = item.courses?.map(c => c.department_code) || [];
        if (!deptArray.some(d => tutorDepts.includes(d))) return false;
      }

      // Language filter
      const languages = q.get('languages');
      if (languages) {
        const langArray = languages.split(',');
        const tutorLangs = item.languages || [];
        if (!langArray.some(l => tutorLangs.includes(l))) return false;
      }

      // Location mode filter
      const locationModes = q.get('location_modes');
      if (locationModes) {
        const modeArray = locationModes.split(',');
        const tutorModes = item.location_modes || [];
        if (!modeArray.some(m => tutorModes.includes(m))) return false;
      }

      // Note: Weekday filter is handled by the backend, so we don't need to filter here
      // The backend already returns only tutors with availability on the selected weekday

      return true;
    });
  };

  // Sort tutors by price
  const getSortedTutors = (tutors) => {
    if (!tutorSortOrder) return tutors;

    return [...tutors].sort((a, b) => {
      const priceA = a.hourly_rate_cents || 0;
      const priceB = b.hourly_rate_cents || 0;

      if (tutorSortOrder === 'asc') {
        return priceA - priceB;
      } else if (tutorSortOrder === 'desc') {
        return priceB - priceA;
      }
      return 0;
    });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    const currentOrder = q.get('sort_order');
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ sort_by: 'price', sort_order: newOrder });
  };

  // Helper to remove a specific filter
  const removeFilter = (key, value = null) => {
    const params = new URLSearchParams(q);
    if (value) {
      // Handle array-like params (comma separated)
      const current = params.get(key);
      if (current) {
        const values = current.split(',').filter(v => v !== value);
        if (values.length > 0) params.set(key, values.join(','));
        else params.delete(key);
      }
    } else {
      params.delete(key);
    }
    params.set('offset', '0');
    navigate(`/search?${params.toString()}`);
  };

  // Render active filters
  const ActiveFilters = ({ type }) => {
    const filters = [];

    // Price (Tutors only)
    if (type === 'tutor') {
      const minRate = q.get('min_rate');
      const maxRate = q.get('max_rate');
      if (minRate || maxRate) {
        const min = minRate ? `$${parseInt(minRate) / 100}` : '$0';
        const max = maxRate ? `$${parseInt(maxRate) / 100}` : 'Any';
        filters.push(
          <div key="price" style={styles.filterChip}>
            Price: {min} - {max}
            <span
              style={styles.removeFilter}
              onClick={() => {
                const params = new URLSearchParams(q);
                params.delete('min_rate');
                params.delete('max_rate');
                navigate(`/search?${params.toString()}`);
              }}
            >✕</span>
          </div>
        );
      }
    }

    // Departments (Both)
    const depts = q.get('departments');
    if (depts) {
      depts.split(',').forEach(d => {
        filters.push(
          <div key={`dept-${d}`} style={styles.filterChip}>
            Dept: {d}
            <span style={styles.removeFilter} onClick={() => removeFilter('departments', d)}>✕</span>
          </div>
        );
      });
    }

    // Languages (Tutors only)
    if (type === 'tutor') {
      const langs = q.get('languages');
      if (langs) {
        langs.split(',').forEach(l => {
          filters.push(
            <div key={`lang-${l}`} style={styles.filterChip}>
              Lang: {l}
              <span style={styles.removeFilter} onClick={() => removeFilter('languages', l)}>✕</span>
            </div>
          );
        });
      }
    }

    // Weekday (Tutors only)
    if (type === 'tutor') {
      const weekday = q.get('weekday');
      if (weekday) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        filters.push(
          <div key="weekday" style={styles.filterChip}>
            Day: {days[parseInt(weekday)]}
            <span style={styles.removeFilter} onClick={() => removeFilter('weekday')}>✕</span>
          </div>
        );
      }
    }

    // Location (Tutors only)
    if (type === 'tutor') {
      const locs = q.get('location_modes');
      if (locs) {
        locs.split(',').forEach(l => {
          filters.push(
            <div key={`loc-${l}`} style={styles.filterChip}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
              <span style={styles.removeFilter} onClick={() => removeFilter('location_modes', l)}>✕</span>
            </div>
          );
        });
      }
    }

    if (filters.length === 0) return null;

    return (
      <div style={styles.activeFiltersContainer}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#333' }}>Active Filters:</span>
        {filters}
        <button
          onClick={() => navigate(`/search?q=${q.get('q') || ''}&type=${q.get('type') || 'default'}`)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFCF01',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
            marginLeft: '8px'
          }}
        >
          Clear All
        </button>
      </div>
    );
  };

  // Filter UI Components removed from here

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.container}>

        <div style={{ ...styles.content, display: 'flex', gap: '30px', flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'wrap' : 'nowrap', padding: isMobile ? '20px 10px' : '40px 20px' }}>

          {/* Filters Sidebar - Only show for tutors or all, hidden on mobile */}
          <div style={{
            width: isMobile ? '100%' : '280px',
            flexShrink: 0,
            display: (isMobile || searchCategory === 'course') ? 'none' : 'block',
            order: 1
          }}>
            <div style={{
              backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fff',
              borderRadius: '12px',
              padding: '5px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: darkMode ? '1px solid #444' : '1px solid #e0e0e0',
              maxHeight: isMobile && !isFilterOpen ? '60px' : 'none',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
              cursor: isMobile && !isFilterOpen ? 'pointer' : 'default'
            }}
              onClick={(e) => {
                if (isMobile && !isFilterOpen) setIsFilterOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 0', borderBottom: isFilterOpen ? '1px inset rgba(179, 179, 179, 0.62)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: darkMode ? '#fff' : '#333' }}>Filter Tutors</h3>
                  {isMobile && (
                    <i className={`fas fa-chevron-${isFilterOpen ? 'up' : 'down'}`}
                      style={{ fontSize: '14px', color: darkMode ? '#fff' : '#333', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFilterOpen(!isFilterOpen);
                      }}
                    ></i>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Clear all filters
                    navigate(`/search?q=${q.get('q') || ''}&type=${q.get('type') || 'default'}`);
                  }}
                  style={{ background: 'none', border: 'none', color: darkMode ? 'rgb(255, 220, 112)' : 'rgb(35, 17, 97)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Reset
                </button>
              </div>

              {filterOptions ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr',
                    gap: isMobile ? '12px' : '24px',
                    alignItems: 'start'
                  }}>
                    <FilterSection title="Price Range" darkMode={darkMode}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          onBlur={() => updateFilters({ min_rate: minPrice ? Math.round(parseFloat(minPrice) * 100) : '' })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFilters({ min_rate: minPrice ? Math.round(parseFloat(minPrice) * 100) : '' });
                            }
                          }}
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                        />
                        <span style={{ color: darkMode ? '#fff' : '#333', fontSize: '12px' }}>to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          onBlur={() => updateFilters({ max_rate: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : '' })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFilters({ max_rate: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : '' });
                            }
                          }}
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                        />
                      </div>
                    </FilterSection>

                    <FilterSection title="Departments" darkMode={darkMode}>
                      <CheckboxGroup
                        options={filterOptions.departments.map(d => ({ label: d.code, value: d.code, count: d.count }))}
                        selected={q.get('departments') ? q.get('departments').split(',') : []}
                        onChange={(val) => updateFilters({ departments: val })}
                        darkMode={darkMode}
                      />
                    </FilterSection>

                    <FilterSection title="Languages" darkMode={darkMode}>
                      <CheckboxGroup
                        options={filterOptions.languages.map(l => ({ label: l.name, value: l.name, count: l.count }))}
                        selected={q.get('languages') ? q.get('languages').split(',') : []}
                        onChange={(val) => updateFilters({ languages: val })}
                        darkMode={darkMode}
                      />
                    </FilterSection>

                    <FilterSection title="Availability" darkMode={darkMode}>
                      <select
                        value={q.get('weekday') || ''}
                        onChange={(e) => updateFilters({ weekday: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                      >
                        <option value="">Any Day</option>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>

                    </FilterSection>
                  </div>
                </>
              ) : (
                <div style={{ color: darkMode ? '#aaa' : '#666' }}>Loading filters...</div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, order: 2, display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : 'auto' }}>
            <div style={{ ...searchBarStyles.searchContainer }}>
              <h3 style={{
                margin: '0 0 8px 0',
                color: darkMode ? '#fff' : '#2c3e50',
                fontSize: '1.3rem',
                fontWeight: '600',
                transition: 'color 0.3s'
              }}>
                {isAdmin ? 'Search Tutor by Name' : 'Find Tutors & Courses'}
              </h3>
              <div style={searchBarStyles.searchInputContainer}>
                {/* Mobile: 2 Rows (Row 1: Dropdown+Input, Row 2: Btn) */}
                {isMobile ? (
                  <>
                    <div style={searchBarStyles.mobileSearchTopRow}>
                      {!isAdmin && (
                        <div style={searchBarStyles.categoryDropdown}>
                          <button
                            style={{
                              ...searchBarStyles.categoryButton,
                              padding: '10px 12px',
                              justifyContent: 'center',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              boxSizing: 'border-box'
                            }}
                            onClick={toggleCategory}
                            type="button"
                          >
                            {searchCategory === 'default' ? 'All' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)} ▼
                          </button>
                          {isCategoryOpen && (
                            <ul style={{ ...searchBarStyles.categoryList, width: '140px' }}>
                              <li onClick={() => selectCategory('default')} style={{ padding: '10px', color: darkMode ? '#fff' : '#212529' }}>All</li>
                              <li onClick={() => selectCategory('tutor')} style={{ padding: '10px', color: darkMode ? '#fff' : '#212529' }}>Tutors</li>
                              <li onClick={() => selectCategory('course')} style={{ padding: '10px', color: darkMode ? '#fff' : '#212529' }}>Courses</li>
                            </ul>
                          )}
                        </div>
                      )}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        placeholder={`Search...`}
                        style={{
                          ...searchBarStyles.searchInput,
                          width: 'auto',
                          height: '40px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      style={{ ...searchBarStyles.searchButton, width: '100%', marginTop: '4px' }}
                    >
                      <i className="fas fa-search"></i>
                      Search
                    </button>
                  </>
                ) : (
                  // Desktop: 1 Row
                  <>
                    {!isAdmin && (
                      <div style={searchBarStyles.categoryDropdown}>
                        <button
                          style={searchBarStyles.categoryButton}
                          onClick={toggleCategory}
                          type="button"
                        >
                          {searchCategory === 'default' ? 'All' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)} ▼
                        </button>
                        {isCategoryOpen && (
                          <ul style={searchBarStyles.categoryList}>
                            <li onClick={() => selectCategory('default')} style={{ padding: '10px 16px', color: darkMode ? '#fff' : '#212529' }}>All</li>
                            <li onClick={() => selectCategory('tutor')} style={{ padding: '10px 16px', color: darkMode ? '#fff' : '#212529' }}>Tutors</li>
                            <li onClick={() => selectCategory('course')} style={{ padding: '10px 16px', color: darkMode ? '#fff' : '#212529' }}>Courses</li>
                          </ul>
                        )}
                      </div>
                    )}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                      placeholder={searchQuery === '' && searchCategory === 'default' ? 'Search all' : searchCategory === 'default' ? 'Search for tutors or courses...' : `Search ${searchCategory}${searchCategory === 'all' ? '' : 's'}...`}
                      style={searchBarStyles.searchInput}
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      style={searchBarStyles.searchButton}
                    >
                      <i className="fas fa-search"></i>
                      Search
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Filter Section - Only show on mobile, between search and results */}
            {isMobile && searchCategory !== 'course' && (
              <div style={{
                backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fff',
                borderRadius: '12px',
                padding: '5px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #444' : '1px solid #e0e0e0',
                maxHeight: !isFilterOpen ? '60px' : 'none',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
                cursor: !isFilterOpen ? 'pointer' : 'default',
                marginTop: '15px'
              }}
                onClick={(e) => {
                  if (!isFilterOpen) setIsFilterOpen(true);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 0', borderBottom: isFilterOpen ? '1px inset rgba(179, 179, 179, 0.62)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: darkMode ? '#fff' : '#333' }}>Filter Tutors</h3>
                    <i className={`fas fa-chevron-${isFilterOpen ? 'up' : 'down'}`}
                      style={{ fontSize: '14px', color: darkMode ? '#fff' : '#333', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFilterOpen(!isFilterOpen);
                      }}
                    ></i>
                  </div>
                  <button
                    onClick={() => {
                      navigate(`/search?q=${q.get('q') || ''}&type=${q.get('type') || 'default'}`);
                    }}
                    style={{ background: 'none', border: 'none', color: darkMode ? 'rgb(255, 220, 112)' : 'rgb(35, 17, 97)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                  >
                    Reset
                  </button>
                </div>

                {filterOptions ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    alignItems: 'start'
                  }}>
                    <FilterSection title="Price Range" darkMode={darkMode}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          onBlur={() => updateFilters({ min_rate: minPrice ? Math.round(parseFloat(minPrice) * 100) : '' })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFilters({ min_rate: minPrice ? Math.round(parseFloat(minPrice) * 100) : '' });
                            }
                          }}
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                        />
                        <span style={{ color: darkMode ? '#fff' : '#333', fontSize: '12px' }}>to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          onBlur={() => updateFilters({ max_rate: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : '' })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFilters({ max_rate: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : '' });
                            }
                          }}
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                        />
                      </div>
                    </FilterSection>

                    <FilterSection title="Departments" darkMode={darkMode}>
                      <CheckboxGroup
                        options={filterOptions.departments.map(d => ({ label: d.code, value: d.code, count: d.count }))}
                        selected={q.get('departments') ? q.get('departments').split(',') : []}
                        onChange={(val) => updateFilters({ departments: val })}
                        darkMode={darkMode}
                      />
                    </FilterSection>

                    <FilterSection title="Languages" darkMode={darkMode}>
                      <CheckboxGroup
                        options={filterOptions.languages.map(l => ({ label: l.name, value: l.name, count: l.count }))}
                        selected={q.get('languages') ? q.get('languages').split(',') : []}
                        onChange={(val) => updateFilters({ languages: val })}
                        darkMode={darkMode}
                      />
                    </FilterSection>

                    <FilterSection title="Availability" darkMode={darkMode}>
                      <select
                        value={q.get('weekday') || ''}
                        onChange={(e) => updateFilters({ weekday: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333', fontSize: '13px' }}
                      >
                        <option value="">Any Day</option>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>

                    </FilterSection>
                  </div>
                ) : (
                  <div style={{ color: darkMode ? '#aaa' : '#666' }}>Loading filters...</div>
                )}
              </div>
            )}

            <div style={{ ...styles.columnsContainer, marginTop: '20px' }}>
              <div style={{ width: '100%' }}>
                {status === "idle" && (
                  <div style={styles.noResults}>
                    <div style={styles.noResultsTitle}>Loading results...</div>
                  </div>
                )}

                {status === "loading" && (
                  <div style={styles.noResults}>
                    <div style={styles.noResultsTitle}>
                      Searching for "{q.get("q")}" in {q.get("type") === 'tutor' ? 'tutors' : q.get("type") === 'course' ? 'courses' : 'all'}...
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div style={styles.noResults}>
                    <div style={styles.noResultsTitle}>Error: {error}</div>
                    <button
                      onClick={() => window.location.reload()}
                      style={styles.requestButton}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {status === "done" && results.length === 0 && q.get("q") && (
                  <div style={styles.noResults}>
                    <div style={styles.noResultsTitle}>
                      No results found for "{q.get("q")}" in {q.get("type") === 'tutor' ? 'tutors' : q.get("type") === 'course' ? 'courses' : 'all'}
                    </div>
                    <button
                      onClick={() => window.history.back()}
                      style={styles.requestButton}
                    >
                      Go Back
                    </button>
                  </div>
                )}

                {status === "done" && (
                  <div style={styles.resultsContainer}>
                    {/* Only show Tutors section if search category is 'all', 'default', or 'tutor' */}
                    {(searchCategory === 'default' || searchCategory === 'all' || searchCategory === 'tutor') && (
                      <div style={{ marginBottom: '40px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '20px'
                        }}>
                          <h2 style={{ ...styles.sectionHeading, margin: 0 }}>{isAdmin ? 'Results' : 'Tutors'}</h2>
                          <button
                            onClick={toggleSortOrder}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: darkMode ? '#fff' : '#2c3e50',
                              fontSize: '14px',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title={tutorSortOrder === null ? 'Sort by price' : tutorSortOrder === 'asc' ? 'Price: Low to High' : 'Price: High to Low'}
                          >
                            <i className={`fas ${tutorSortOrder === 'asc' ? 'fa-arrow-down-short-wide' : 'fa-sort-amount-down'}`} style={{
                              fontSize: '18px',
                              transform: 'none',
                              transition: 'transform 0.3s',
                              opacity: tutorSortOrder === null ? 0.5 : 1
                            }}></i>
                            <span style={{ fontSize: '12px' }}>Price</span>
                          </button>
                        </div>

                        <div style={styles.resultsHeader}>
                          <div style={{ flex: 1 }}>
                            <ActiveFilters type="tutor" />
                          </div>
                          <div style={styles.resultCount}>
                            {getFilteredResults(results).filter(item => item._kind === "tutor").length} result{getFilteredResults(results).filter(item => item._kind === "tutor").length !== 1 ? 's' : ''} found
                          </div>
                        </div>

                        {getFilteredResults(results).some(item => item._kind === "tutor") ? (
                          <div style={styles.tutorsGrid}>
                            {getSortedTutors(getFilteredResults(results).filter(item => item._kind === "tutor"))
                              .map((item, idx) => (
                                <ResultCard key={`tutor-${item.id || idx}`} item={item} />
                              ))}
                          </div>
                        ) : (
                          <p style={styles.noItemsText}>No tutors found</p>
                        )}
                      </div>
                    )}

                    {/* Only show Courses section if search category is 'all', 'default', or 'course' */}
                    {(searchCategory === 'default' || searchCategory === 'all' || searchCategory === 'course') && (
                      <div>
                        <h2 style={styles.sectionHeading}>Courses</h2>

                        <div style={styles.resultsHeader}>
                          <div style={{ flex: 1 }}>
                            <ActiveFilters type="course" />
                          </div>
                          <div style={styles.resultCount}>
                            {getFilteredResults(results).filter(item => item._kind === "course").length} result{getFilteredResults(results).filter(item => item._kind === "course").length !== 1 ? 's' : ''} found
                          </div>
                        </div>

                        {getFilteredResults(results).some(item => item._kind === "course") ? (
                          <div style={styles.coursesGrid}>
                            {getFilteredResults(results)
                              .filter(item => item._kind === "course")
                              .map((item, idx) => (
                                <ResultCard key={`course-${item.course_id || idx}`} item={item} />
                              ))}
                          </div>
                        ) : (
                          <p style={styles.noItemsText}>No courses found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Closing the flex container started in content replacement */}
        </div>
      </div>

      {/* Admin Confirmation Dialog */}
      {confirmDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: darkMode ? '#fff' : '#333',
              fontSize: '18px'
            }}>
              {confirmDialog.type === 'removeCourse' ? 'Remove Course' : 'Remove Tutor Status'}
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              color: darkMode ? '#ccc' : '#666',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {confirmDialog.type === 'removeCourse'
                ? `Are you sure you want to remove "${confirmDialog.courseName}" from ${confirmDialog.tutorName}'s courses?`
                : `Are you sure you want to remove tutor status from ${confirmDialog.tutorName}? This will demote them to a student.`
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDialog({ show: false, type: null, tutorId: null, courseId: null, tutorName: '', courseName: '' })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  backgroundColor: 'transparent',
                  color: darkMode ? '#ccc' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.type === 'removeCourse') {
                    handleRemoveCourse(confirmDialog.tutorId, confirmDialog.courseId);
                  } else {
                    handleDemoteTutor(confirmDialog.tutorId);
                  }
                  setConfirmDialog({ show: false, type: null, tutorId: null, courseId: null, tutorName: '', courseName: '' });
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
