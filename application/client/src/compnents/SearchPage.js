import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from './Footer';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "rgb(250, 245, 255)",
    },
    heading: {
      color: "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid #9A2250",
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
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
      }
    },
    courseCard: {
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      transition: 'box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
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
      color: '#35006D',
      marginBottom: '4px',
    },
    courseName: {
      fontSize: '14px',
      color: '#666',
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
      color: '#666',
    },
    detailLabel: {
      fontWeight: '500',
      color: '#333',
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
      '&:hover': {
        opacity: 0.9,
      },
    },
    tutorCard: {
      backgroundColor: "#fafafa",
      border: "1px solid #e8e8e8",
      borderRadius: "8px",
      padding: "24px",
      transition: "box-shadow 0.2s",
      display: "flex",
      flexDirection: "column",
      height: "100%",
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
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "4px",
      color: "#2c3e50",
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
      backgroundColor: "#fafafa",
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

  // Mock data for local development - Tutors from FindTutorPage.js
  const mockTutors = [
    {
      id: "1",
      first_name: "John",
      last_name: "Doe",
      name: "John Doe",
      email: "john@sfsu.edu",
      hourly_rate_cents: 5000,
      languages: ["English", "Spanish"],
      courses: [
        { department_code: "CSC", course_number: "415", title: "Operating Systems" },
        { department_code: "CSC", course_number: "510", title: "Analysis of Algorithms" }
      ],
      avg_rating: 5.0,
      sessions_completed: 42,
      availability: ["Mon 10:00-12:00", "Wed 14:00-16:00", "Fri 10:00-12:00"]
    },
    {
      id: "2",
      first_name: "John",
      last_name: "Smith",
      name: "John Smith",
      email: "smith@sfsu.edu",
      hourly_rate_cents: 4500,
      languages: ["English", "French"],
      courses: [
        { department_code: "CSC", course_number: "415", title: "Operating Systems" },
        { department_code: "CSC", course_number: "600", title: "Advanced Programming" }
      ],
      avg_rating: 4.0,
      sessions_completed: 28,
      availability: ["Tue 09:00-11:00", "Thu 13:00-15:00"]
    },
    {
      id: "3",
      first_name: "Jane",
      last_name: "Wilson",
      name: "Jane Wilson",
      email: "jane@sfsu.edu",
      hourly_rate_cents: 4800,
      languages: ["English", "Spanish"],
      courses: [
        { department_code: "BIOL", course_number: "101", title: "General Biology" },
        { department_code: "BIOL", course_number: "202", title: "Genetics" },
        { department_code: "CSC", course_number: "415", title: "Operating Systems" }
      ],
      avg_rating: 5.0,
      sessions_completed: 35,
      availability: ["Mon 14:00-16:00", "Wed 10:00-12:00"]
    }
  ];

  // Mock data for local development - Courses from FindCoursePage.js
  const mockCourses = [
    {
      id: "1",
      department_code: "CSC",
      course_number: "415",
      title: "Operating Systems",
      description: "Fundamentals of operating systems including process management, memory management, file systems, and I/O systems.",
      tutor_count: 3,
      instructor: "Dr. John Smith",
      department: "Computer Science"
    },
    {
      id: "2",
      department_code: "CSC",
      course_number: "510",
      title: "Analysis of Algorithms",
      description: "Advanced techniques for the design and analysis of algorithms, including divide-and-conquer, dynamic programming, and greedy algorithms.",
      tutor_count: 2,
      instructor: "Dr. Alice Johnson",
      department: "Computer Science"
    },
    {
      id: "3",
      department_code: "CSC",
      course_number: "600",
      title: "Advanced Programming",
      description: "Advanced programming concepts and techniques including design patterns, concurrency, and software architecture.",
      tutor_count: 5,
      instructor: "Dr. Robert Chen",
      department: "Computer Science"
    },
    {
      id: "4",
      department_code: "BIOL",
      course_number: "101",
      title: "General Biology",
      description: "Introduction to the fundamental principles of biology, including cell structure, genetics, evolution, and ecology.",
      tutor_count: 4,
      instructor: "Dr. Sarah Williams",
      department: "Biology"
    },
    {
      id: "5",
      department_code: "ECON",
      course_number: "301",
      title: "Microeconomics",
      description: "Analysis of the behavior of individual economic units including consumers, firms, and industries.",
      tutor_count: 0,
      instructor: "Dr. Michael Brown",
      department: "Economics"
    },
    {
      id: "6",
      department_code: "MATH",
      course_number: "226",
      title: "Calculus II",
      description: "Techniques of integration, applications of integration, infinite series, and parametric equations.",
      tutor_count: 6,
      instructor: "Dr. Emily Davis",
      department: "Mathematics"
    }
  ];

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
        // Use mock data when running on localhost
        if (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            let mockResults = [];
            
            // Handle search type 'all', 'tutor', or 'default' for tutors
            if (searchType === 'tutor' || searchType === 'all' || searchType === 'default') {
              const filteredTutors = searchTerm 
                ? mockTutors.filter(tutor => {
                    const searchStr = `${tutor.first_name} ${tutor.last_name} ${tutor.courses.map(c => `${c.department_code} ${c.course_number}`).join(' ')}`.toLowerCase();
                    return searchStr.includes(searchTerm);
                  })
                : [...mockTutors]; // Return all tutors if no search term
              
              mockResults = [...filteredTutors.map(t => ({ ...t, _kind: 'tutor' }))];
            }
            
            // Handle search type 'all', 'course', or 'default' for courses
            if (searchType === 'course' || searchType === 'all' || searchType === 'default') {
              const filteredCourses = searchTerm
                ? mockCourses.filter(course => {
                    const searchStr = `${course.department_code} ${course.course_number} ${course.title}`.toLowerCase();
                    return searchStr.includes(searchTerm);
                  })
                : [...mockCourses]; // Return all courses if no search term
                
              mockResults = [...mockResults, ...filteredCourses.map(c => ({ ...c, _kind: 'course' }))];
            }
            
            console.log('Setting mock results:', mockResults);
            console.log('Current searchTerm:', searchTerm, 'searchType:', searchType);
            setResults(mockResults);
            setStatus("done");
          }, 500); // Simulate network delay
        } else {
          // Original API call for production
          const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';
          
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
      if (status === "loading") {
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
      
      return (
        <div style={styles.tutorCard}>
          <div style={styles.tutorCardContent}>
            <div style={styles.tutorHeader}>
              <div style={styles.tutorAvatar}>
                {initials}
              </div>
              <div>
                <div style={styles.tutorName}>{fullName}</div>
                <div style={{fontWeight: '600', color: '#2c3e50', margin: '4px 0'}}>
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
            <span style={{...styles.statusBadge, backgroundColor: status.bg, color: status.color}}>
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
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      boxSizing: 'border-box',
      width: '100%',
      margin: '0 0 30px 0',
      position: 'relative'
    },
    searchInputContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '10px'
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s',
      '&:focus': {
        borderColor: '#35006D',
      }
    },
    searchButton: {
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '12px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#4b1a80',
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
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      '&:hover': {
        backgroundColor: '#e9ecef'
      }
    },
    categoryList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      width: '100%',
      padding: '8px 8px',
      margin: '4px 0 0',
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,.15)',
      borderRadius: '6px',
      boxShadow: '0 6px 12px rgba(0,0,0,.175)',
      listStyle: 'none',
      '& li': {
        padding: '8px 16px',
        cursor: 'pointer',
        textAlign: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        ':hover': {
          backgroundColor: '#f8f9fa',
          cursor: 'pointer !important'
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

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Search</h1>

      <div style={styles.content}>
        {/* Search Bar */}
        <div style={searchBarStyles.searchContainer}>
          <h3 style={{ margin: "0 0 5px 0", color: '#2c3e50' }}>Find Tutors & Courses</h3>
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
                    style={{ cursor: 'pointer' }}
                  >All</li>
                  <li 
                    onClick={() => selectCategory('tutor')}
                    style={{ cursor: 'pointer' }}
                  >Tutors</li>
                  <li 
                    onClick={() => selectCategory('course')}
                    style={{ cursor: 'pointer' }}
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
                    <h2 style={styles.sectionHeading}>Tutors</h2>
                    {results.some(item => item._kind === "tutor") ? (
                      <div style={styles.tutorsGrid}>
                        {results
                          .filter(item => item._kind === "tutor")
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
