import React from 'react';
import { useAuth } from '../Context/Context';
import Header from './Header';

const HomePage = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
    },
    heading: {
      color: "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "4px solid #9A2250",
      display: "block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content"
    },
    content: {
      width: '100%',
      margin: '0 auto',
      padding: '20px',
      flex: 1,
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
      marginBottom: '30px',
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      color: '#2c3e50',
      marginBottom: '15px',
      paddingBottom: '8px',
      borderBottom: '1px solid #eee',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    linkItem: {
      margin: '12px 0',
      padding: '8px 0',
      borderBottom: '1px solid #f5f5f5',
    },
    link: {
      color: '#3498db',
      textDecoration: 'none',
      fontSize: '1.1rem',
      transition: 'color 0.2s',
      '&:hover': {
        color: '#2980b9',
        textDecoration: 'underline',
      },
    },
    columnsContainer: {
      display: 'flex',
      gap: '5%',
    },
    leftColumn: {
      width: '60%',
      padding: '20px'
    },
    rightColumn: {
      width: '35%',
      padding: '20px',
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
                <li style={styles.linkItem}><a href="/find-tutor" style={styles.link}>Find a tutor</a></li>
                <li style={styles.linkItem}><a href="/find-course" style={styles.link}>Find a Course</a></li>
                <li style={styles.linkItem}><a href="/coverage-request" style={styles.link}>Course Coverage Request</a></li>
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
            <h3>Sidebar</h3>
            <p>This is the sidebar (25% width).</p>
            {/* Add your sidebar content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;