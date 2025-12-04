import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from './Footer';
import { useAuth } from '../Context/Context';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { darkMode } = useAuth();
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: darkMode ? "rgb(30, 30, 30)" : "rgb(250, 245, 255)",
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
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
      width: "100%",
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
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginTop: '16px',
      '@media (max-width: 1200px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      '@media (maxWidth: 768px)': {
        gridTemplateColumns: '1fr',
      }
    },
    courseCard: {
      backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fafafa',
      border: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      transition: 'box-shadow 0.2s, background-color 0.3s, border-color 0.3s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '&:hover': {
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }
    },
    courseHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    courseCode: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      marginBottom: '4px',
      transition: 'color 0.3s',
    },
    courseName: {
      fontSize: '14px',
      color: darkMode ? '#bbb' : '#666',
      transition: 'color 0.3s',
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
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
      borderRadius: "8px",
      padding: "24px",
      transition: "box-shadow 0.2s, background-color 0.3s, border-color 0.3s",
      display: "flex",
      flexDirection: "column",
      height: "100%",
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
      marginBottom: '16px',
    },
    availabilitySection: {
      marginBottom: '16px',
    },
    tutorHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "16px",
    },
    tutorAvatar: {
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      backgroundColor: "#35006D",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "bold",
    },
    tutorName: {
      fontSize: '20px',
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
      fontSize: "14px",
    },
    sectionLabel: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "8px",
      fontWeight: "500",
    },
    courseBadge: {
      display: "inline-block",
      backgroundColor: "#FFCF01",
      color: "#35006D",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      margin: "4px",
    },
    availabilityBadge: {
      display: "inline-block",
      border: "1px solid #35006D",
      color: "#35006D",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      margin: "4px",
    },
    tutorActions: {
      display: "flex",
      flexDirection: "row",
      gap: "12px",
      marginTop: "auto",
    },
    contactButton: {
      flex: 1,
      backgroundColor: "#35006D",
      color: "white",
      border: "none",
      padding: "10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "background-color 0.2s",
    },
    bookButton: {
      flex: 1,
      backgroundColor: "#FFCF01",
      color: "#35006D",
      border: "none",
      padding: "10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
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
  const [results, setResults] = useState([]);            // unified results
  const [status, setStatus] = useState("idle");          // idle | loading | done | error
  const [error, setError] = useState("");

  // Use a ref to track the current status
  const statusRef = React.useRef(status);
  
  // Update the ref whenever status changes
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
        // Always use real API
        if (false) {
          // Mock data block skipped
        } else {
          // Original API call for production
          const apiBaseUrl = process.env.REACT_APP_API_URL || '';

          // Build the appropriate endpoint and parameters based on search type
          let endpoint, params = new URLSearchParams({
            limit: 20,
            offset: 0
          });

          if (searchTerm) {
            params.set('q', searchTerm);
          }

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
        }
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
          style={{...styles.tutorCard, cursor: 'pointer'}} 
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
                <div style={styles.sectionLabel}>Teaches</div>
                <div>
                  {item.courses.map((course, idx) => (
                    <span key={idx} style={styles.courseBadge}>
                      {course.department_code} {course.course_number}
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

            <div style={styles.tutorActions}>
              <button style={styles.contactButton}>
                Contact
              </button>
              <button style={styles.bookButton}>
                Book Session
              </button>
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
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Department:</span>
              <span>{item.department || 'N/A'}</span>
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
                window.location.href = `/find-tutor?course=${encodeURIComponent(courseCode)}`;
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
      gap: '12px',
      marginTop: '12px',
      width: '100%'
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: darkMode ? '1px solid #444' : '1px solid #ced4da',
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: darkMode ? 'rgb(70, 70, 70)' : '#fff',
      color: darkMode ? '#fff' : '#2c3e50',
      outline: 'none',
      transition: 'all 0.2s',
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
      minWidth: '120px',
      width: '120px'
    },
    categoryButton: {
      padding: '12px 16px',
      backgroundColor: darkMode ? 'rgb(80, 80, 80)' : '#f8f9fa',
      color: darkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
      border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid #ced4da',
      borderRadius: '6px',
      cursor: 'pointer',
      width: '100%',
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
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchType = searchCategory === 'default' ? 'all' : searchCategory;
    // Always trigger search when the button is clicked, even if the query hasn't changed
    // This ensures that changing the category will trigger a new search
    window.location.href = `/search?q=${encodeURIComponent(searchQuery || '')}&type=${searchType}`;
  };

  // Initialize search query and category from URL
  const [searchQuery, setSearchQuery] = useState(q.get('q') || '');
  const [searchCategory, setSearchCategory] = useState(q.get('type') || 'default');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [tutorSortOrder, setTutorSortOrder] = useState(null); // null, 'asc', 'desc'

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
    if (tutorSortOrder === null) {
      setTutorSortOrder('asc');
    } else if (tutorSortOrder === 'asc') {
      setTutorSortOrder('desc');
    } else {
      setTutorSortOrder(null);
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Search</h1>

      <div style={styles.content}>
        {/* Search Bar */}
        <div style={searchBarStyles.searchContainer}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: darkMode ? '#fff' : '#2c3e50',
            fontSize: '1.3rem',
            fontWeight: '600',
            transition: 'color 0.3s'
          }}>
            Find Tutors & Courses
          </h3>
          <div style={searchBarStyles.searchInputContainer}>
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
                  <li
                    onClick={() => selectCategory('default')}
                    style={{
                      padding: '10px 16px',
                      color: darkMode ? '#fff' : '#212529',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >All</li>
                  <li
                    onClick={() => selectCategory('tutor')}
                    style={{
                      padding: '10px 16px',
                      color: darkMode ? '#fff' : '#212529',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >Tutors</li>
                  <li
                    onClick={() => selectCategory('course')}
                    style={{
                      padding: '10px 16px',
                      color: darkMode ? '#fff' : '#212529',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >Courses</li>
                </ul>
              )}
            </div>
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
              style={{
                backgroundColor: '#35006D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#4b1a80';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#35006D';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-search"></i>
              Search
            </button>
          </div>
        </div>

        <div style={styles.columnsContainer}>
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

            {status === "done" && results.length > 0 && (
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
                      <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Tutors</h2>
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
                        <i className="fas fa-sort-amount-down" style={{
                          fontSize: '18px',
                          transform: tutorSortOrder === 'desc' ? 'scaleY(-1)' : 'scaleY(1)',
                          transition: 'transform 0.3s',
                          opacity: tutorSortOrder === null ? 0.5 : 1
                        }}></i>
                        <span style={{ fontSize: '12px' }}>Price</span>
                      </button>
                    </div>
                    {results.some(item => item._kind === "tutor") ? (
                      <div style={styles.tutorsGrid}>
                        {getSortedTutors(results.filter(item => item._kind === "tutor"))
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
                    {results.some(item => item._kind === "course") ? (
                      <div style={styles.coursesGrid}>
                        {results
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
      <Footer />
    </div>
  );
}
