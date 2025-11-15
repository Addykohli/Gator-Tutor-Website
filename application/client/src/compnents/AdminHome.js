import React from 'react';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';

const AdminHome = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden',
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
      width: '100%',
      margin: '0 auto',
      padding: '0px 20px',
      flex: 1,
      boxSizing: 'border-box',
    },
    title: {
      textAlign: 'left',
      margin: '0 0 30px 0',
      fontSize: '2.2rem',
      color: '#2c3e50',
      paddingBottom: '10px',
      borderBottom: '2px solid #f0f0f0',
    },
    section: {
      padding: '20px',
      borderRadius: '40px',
      backgroundColor: 'rgb(240, 240, 240)',
      marginBottom: '20px',
    },
    myCalendarSection: {
      padding: '20px 20px 0px 20px',
      borderRadius: '20px',
    },
    todaySection: {
      padding: '10px 5px',
      borderRadius: '40px',
      backgroundColor: 'rgb(240, 240, 240)',
      margin: '0px 20px'
    },
    sectionTitle: {
      color: '#2c3e50',
      marginBottom: '15px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgb(200, 200, 200)'
    },
    sectionTitleToday: {
      color: '#2c3e50',
      marginBottom: '15px',
      paddingBottom: '8px',
      paddingTop: '8px',
      borderTop: '2px solid white',
      textAlign: 'center',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    linkItem: {
      margin: '0px 140px 12px 0px',
      padding: 0,
      border: 'none',
      backgroundColor: 'rgba(154, 34, 80, 0.7)',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    link: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '1.1rem',
      padding: '12px 16px',
      display: 'block',
      position: 'relative',
      zIndex: 1,
      transition: 'all 0.3s ease',
    },
    columnsContainer: {
      display: 'flex',
      gap: '90px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    },
    leftColumn: {
      flex: '3',
      minWidth: 0, 
      padding: '20px',
      maxWidth: '100%',
    },
    rightColumn: {
      flex: '1',
      minWidth: '200px', 
      padding: '0px 0px 20px 0px',
      maxWidth: '250px',
      borderRadius: '40px',
      backgroundColor: 'rgb(240, 240, 240)',
    },
    '@media (max-width: 768px)': {
      columnsContainer: {
        flexDirection: 'column',
      },
      leftColumn: {
        width: '100%',
        marginBottom: '20px',
      },
      rightColumn: {
        width: '100%',
      }
    }
  };

  const { user, isAuthenticated } = useAuth();

  // Function to handle admin link clicks
  const handleAdminLinkClick = (e, path) => {
    e.preventDefault();
    // Navigation logic will be added when routes are set up
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Admin Home</h1>
      <div style={styles.content}>
        <div style={styles.columnsContainer}>
          <div style={styles.leftColumn}>
            <h1 style={styles.title}>Welcome, {isAuthenticated ? `${user.firstName} ${user.lastName}` : 'Admin'}</h1>
            
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Admin Tools</h2>
              <ul style={styles.linkList}>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/registered-tutors" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/registered-tutors')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Registered Tutors</span>
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/registered-students" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/registered-students')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Registered Students</span>
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/tutor-applications" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/tutor-applications')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Tutor Applications</span>
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/reports" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/reports')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Reports</span>
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/tutor-course-applications" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/tutor-course-applications')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Tutor Course Addition Applications</span>
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a 
                    href="/admin/course-coverage-requests" 
                    style={styles.link}
                    onClick={(e) => handleAdminLinkClick(e, '/admin/course-coverage-requests')}
                  >
                    <span style={{position: 'relative', zIndex: 2}}>Course Coverage Requests</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div style={styles.rightColumn}>
            <div style={styles.myCalendarSection}>
              <button 
                onClick={() => window.location.href = '/mycalendar'}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgb(35, 17, 97, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(35, 17, 97, 0.9)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(35, 17, 97, 0.7)'}
              >
                My Calendar
              </button>
            </div>
            
            <div style={styles.todaySection}>
              <h3 style={styles.sectionTitleToday}>Meetings Today</h3>
              <div style={{ 
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontStyle: 'italic'
              }}>
                No meetings scheduled for today
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminHome;
