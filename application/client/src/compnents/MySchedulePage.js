import React, { useState } from 'react';
import Footer from './Footer';
import format from 'date-fns/format';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import startOfWeek from 'date-fns/startOfWeek';
import addDays from 'date-fns/addDays';
import isSameDay from 'date-fns/isSameDay';
import Header from './Header';

const MySchedulePage = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  
  const styles = {
    container: { 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh", 
      width: "100%", 
      overflowX: "hidden" 
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
      width: "100%", 
      maxWidth: "1200px",
      margin: "0 auto", 
      padding: "20px", 
      flex: 1, 
      boxSizing: "border-box",
      marginBottom: '80px'
    },
    calendarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    navButton: {
      backgroundColor: '#9A2250',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#7a1a3d'
      }
    },
    weekDisplay: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#2c3e50'
    },
    calendarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '1px',
      backgroundColor: '#e0e0e0',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    dayHeader: {
      backgroundColor: '#9A2250',
      color: 'white',
      padding: '12px',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '1rem'
    },
    dayCell: {
      backgroundColor: 'white',
      minHeight: '120px',
      padding: '8px',
      position: 'relative',
      '&.today': {
        backgroundColor: '#fff9e6'
      }
    },
    dateNumber: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#2c3e50'
    },
    todayMarker: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      backgroundColor: '#9A2250',
      color: 'white',
      borderRadius: '50%',
      width: '44px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8rem'
    },
    noSessions: {
      color: '#666',
      fontStyle: 'italic',
      fontSize: '0.9rem',
      marginTop: '8px'
    }
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  
  const nextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };
  
  const prevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const renderDays = () => {
    const days = [];
    let startDate = currentWeekStart;
    
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      const isToday = isSameDay(currentDate, today);
      
      days.push(
        <div key={i} style={styles.dayCell} className={isToday ? 'today' : ''}>
          <div style={styles.dateNumber}>
            {format(currentDate, 'd')}
            {isToday && <span style={styles.todayMarker}>Today</span>}
          </div>
          <div style={styles.noSessions}>No scheduled sessions</div>
          {/* Sessions will be rendered here */}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>My Schedule</h1>
      
      <div style={styles.content}>
        <div style={styles.calendarHeader}>
          <button onClick={prevWeek} style={styles.navButton}>
            &larr; Previous Week
          </button>
          <div style={styles.weekDisplay}>
            {format(currentWeekStart, 'MMM d, yyyy')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </div>
          <button onClick={nextWeek} style={styles.navButton}>
            Next Week &rarr;
          </button>
        </div>
        
        <div style={styles.calendarGrid}>
          {weekDays.map(day => (
            <div key={day} style={styles.dayHeader}>
              {day}
            </div>
          ))}
          {renderDays()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MySchedulePage;
