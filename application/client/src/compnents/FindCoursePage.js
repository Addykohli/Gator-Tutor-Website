import React, { useState, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';

const FindCoursePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
    },
    heading: {
      color: "#333",
      textAlign: "center",
      padding: "0px",
      borderBottom: "4px solid #9A2250",
      display: "inline-block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      width: '100%',
    },
    searchSection: {
      display: 'flex',
      gap: '16px',
      marginBottom: '32px',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '12px 16px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px',
      fontFamily: 'inherit',
    },
    searchButton: {
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      padding: '12px 32px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
    },
    departmentSelect: {
      padding: '12px 16px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px',
      minWidth: '200px',
      backgroundColor: 'white',
      color: '#35006D',
    },
    resultsCount: {
      color: '#666',
      marginBottom: '24px',
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
    },
    courseCard: {
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      transition: 'box-shadow 0.2s',
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
      marginBottom: '8px',
    },
    courseName: {
      fontSize: '14px',
      color: '#333',
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
    },
  };

  // Mock course data
  const mockCourses = [
    {
      id: "1",
      code: "CSC 415",
      name: "Operating Systems",
      department: "Computer Science",
      hasTutors: 3
    },
    {
      id: "2",
      code: "CSC 510",
      name: "Analysis of Algorithms",
      department: "Computer Science",
      hasTutors: 2
    },
    {
      id: "3",
      code: "CSC 600",
      name: "Advanced Programming",
      department: "Computer Science",
      hasTutors: 5
    },
    {
      id: "4",
      code: "BIOL 101",
      name: "General Biology",
      department: "Biology",
      hasTutors: 4
    },
    {
      id: "5",
      code: "ECON 301",
      name: "Microeconomics",
      department: "Economics",
      hasTutors: 0
    },
    {
      id: "6",
      code: "MATH 226",
      name: "Calculus II",
      department: "Mathematics",
      hasTutors: 6
    }
  ];

  const departments = useMemo(() => {
    return [...new Set(mockCourses.map(c => c.department))].sort();
  }, []);

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesSearch = !searchQuery || 
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = department === 'all' || 
        course.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [searchQuery, department]);

  const getStatusBadge = (tutorCount) => {
    if (tutorCount >= 5) {
      return { text: 'Tutors Available', bg: '#10b981', color: 'white' };
    } else if (tutorCount > 0) {
      return { text: 'Limited', bg: '#f59e0b', color: 'white' };
    } else {
      return { text: 'No Tutors', bg: '#ef4444', color: 'white' };
    }
  };

  const handleCourseAction = (course) => {
    if (course.hasTutors > 0) {
      window.location.href = '/find-tutor';
    } else {
      window.location.href = '/coverage-request';
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Find A Course</h1>
      
      <div style={styles.content}>
        <div style={styles.searchSection}>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={styles.departmentSelect}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button style={styles.searchButton}>Search</button>
        </div>

        <div style={styles.resultsCount}>
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </div>

        <div style={styles.coursesGrid}>
          {filteredCourses.map((course) => {
            const status = getStatusBadge(course.hasTutors);
            const buttonBg = course.hasTutors > 0 ? '#35006D' : '#FFCF01';
            const buttonColor = course.hasTutors > 0 ? 'white' : '#35006D';
            const buttonText = course.hasTutors > 0 ? 'View Tutors' : 'Request Coverage';
            const tutorText = course.hasTutors === 0 
              ? 'No tutors' 
              : `${course.hasTutors} tutor${course.hasTutors > 1 ? 's' : ''} available`;

            return (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div>
                    <div style={styles.courseCode}>{course.code}</div>
                    <div style={styles.courseName}>{course.name}</div>
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
                    <span>{course.department}</span>
                  </div>
                </div>

                <button
                  style={{...styles.viewButton, backgroundColor: buttonBg, color: buttonColor}}
                  onClick={() => handleCourseAction(course)}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FindCoursePage;
