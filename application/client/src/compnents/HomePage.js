import React from 'react';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';

const HomePage = () => {
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
      paddingBottom: "3px",
      borderBottom: "8px solid #9A2250",
      display: "block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content"
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
      borderRadius: '20px',
    },
    myScheduleSection: {
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
      borderBottom: '1px solid #f5f5f5',
      backgroundColor: 'rgba(154, 34, 80, 0.7)',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    link: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '1.1rem',
      padding: '8px',
      transition: 'all 0.2s',
      display: 'block',
      '&:hover': {
        color: '#2980b9',
        textDecoration: 'underline',
      },
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

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Home </h1>
      <div style={styles.content}>
        <div style={styles.columnsContainer}>
          <div style={styles.leftColumn}>
            <h1 style={styles.title}>Welcome, {isAuthenticated ? `${user.firstName} ${user.lastName}` : 'Guest'}</h1>
            
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Important Links</h2>
              <ul style={styles.linkList}>
                <li style={styles.linkItem}>
                  <a href="/find-tutor" style={{...styles.link, display: 'block', width: '100%', height: '100%'}}>
                    Find a tutor
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a href="/find-course" style={{...styles.link, display: 'block', width: '100%', height: '100%'}}>
                    Find a Course
                  </a>
                </li>
                <li style={styles.linkItem}>
                  <a href="/coverage-request" style={{...styles.link, display: 'block', width: '100%', height: '100%'}}>
                    Course Coverage Request
                  </a>
                </li>
              </ul>
            </div>

            {isAuthenticated && user.isTutor && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Tutor Links</h2>
                <ul style={styles.linkList}>
                  <li style={styles.linkItem}><a href="/my-courses" style={styles.link}>Courses I tutor</a></li>
                  <li style={styles.linkItem}><a href="/appointment-requests" style={styles.link}>Appointment Requests</a></li>
                  <li style={styles.linkItem}><a href="/appointments" style={styles.link}>Appointments</a></li>
                </ul>
              </div>
            )}
          </div>
          
          <div style={styles.rightColumn}>
            <div style={styles.myScheduleSection}>
              <button 
                onClick={() => window.location.href = '/myschedule'}
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
                My Schedule
              </button>
            </div>
            
            <div style={styles.todaySection}>
              <h3 style={styles.sectionTitleToday}>Today's Schedule</h3>
              <div style={{ 
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontStyle: 'italic'
              }}>
                No scheduled sessions for today
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;