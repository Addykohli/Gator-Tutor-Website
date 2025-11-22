import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import format from 'date-fns/format';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import startOfWeek from 'date-fns/startOfWeek';
import addDays from 'date-fns/addDays';
import isSameDay from 'date-fns/isSameDay';
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('searchQuery');
    return saved || '';
  });
  
  const [searchCategory, setSearchCategory] = useState(() => {
    const saved = localStorage.getItem('searchCategory');
    return saved || 'default';
  });
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  // Mock data for calendar events
  const mockEvents = [
    {
      id: 1,
      title: 'CS 415 Review',
      date: addDays(new Date(), 1), // Tomorrow
      time: '10:00 AM - 11:30 AM',
      type: 'class',
      location: 'Library Room 203',
      color: '#4e73df'
    },
    {
      id: 2,
      title: 'Tutoring Session',
      date: addDays(new Date(), 1), // Tomorrow
      time: '2:00 PM - 3:30 PM',
      type: 'tutoring',
      tutor: 'Dr. Smith',
      color: '#1cc88a'
    },
    {
      id: 3,
      title: 'Group Study',
      date: addDays(new Date(), 3), // 3 days from now
      time: '4:00 PM - 6:00 PM',
      type: 'study',
      group: 'CS Study Group',
      location: 'Student Center',
      color: '#f6c23e'
    },
    {
      id: 4,
      title: 'Office Hours',
      date: addDays(new Date(), 4), // 4 days from now
      time: '1:00 PM - 3:00 PM',
      type: 'office_hours',
      professor: 'Prof. Johnson',
      location: 'SCI 217',
      color: '#e74a3b'
    },
    {
      id: 5,
      title: 'CS 600 Lecture',
      date: addDays(new Date(), 5), // 5 days from now
      time: '9:30 AM - 11:00 AM',
      type: 'class',
      course: 'CS 600',
      location: 'TH 101',
      color: '#4e73df'
    }
  ];
  
  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    localStorage.setItem('searchQuery', value);
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    const searchText = searchQuery.trim();
    localStorage.setItem('searchQuery', searchText);

    const apiBaseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : '/api';
    
    const typeMap = {
      'tutor': 'tutor',
      'course': 'course',
      'default': 'all'
    };
    
    const searchType = typeMap[searchCategory] || 'all';
    
    try {
      let results = [];
      
      if (searchType === 'tutor' || searchType === 'all') {
        const params = new URLSearchParams({
          limit: 20,
          offset: 0,
          ...(searchText && { q: searchText })
        });
        
        const response = await fetch(
          `${apiBaseUrl}/search/tutors?${params.toString()}`
        );
        const data = await response.json();
        results = [...results, ...(data.items || []).map(item => ({ _kind: 'tutor', ...item }))];
      }
      
      if (searchType === 'course' || searchType === 'all') {
        const params = new URLSearchParams({
          limit: 20,
          offset: 0,
          ...(searchText && { q: searchText })
        });
        
        const response = await fetch(
          `${apiBaseUrl}/search/courses?${params.toString()}`
        );
        const data = await response.json();
        results = [...results, ...(data.items || []).map(item => ({ _kind: 'course', ...item }))];
      }
      
      navigate(`/search?q=${encodeURIComponent(searchText)}&type=${searchType}`, {
        state: { results }
      });
      
    } catch (error) {
      console.error('Search error:', error);
      navigate(`/search?q=${encodeURIComponent(searchText)}&type=${searchType}`, {
        state: { error: error.message || 'Failed to fetch search results' }
      });
    }
  };
  
  const toggleCategory = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };
  
  const selectCategory = (category) => {
    setSearchCategory(category);
    localStorage.setItem('searchCategory', category);
    setIsCategoryOpen(false);
  };
  
  // Add styles for calendar events
  const eventStyles = {
    eventsContainer: {
      marginTop: '8px',
      maxHeight: '200px',
      overflowY: 'auto',
      paddingRight: '4px'
    },
    eventItem: {
      padding: '8px',
      marginBottom: '8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    eventTime: {
      fontWeight: '600',
      fontSize: '0.75rem',
      color: '#555',
      marginBottom: '4px'
    },
    eventTitle: {
      fontWeight: '600',
      marginBottom: '4px',
      color: '#2c3e50'
    },
    eventDetail: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.7rem',
      color: '#6c757d',
      marginTop: '2px'
    }
  };

  const styles = {
    container: { 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh", 
      width: "100%", 
      overflowX: "hidden",
      backgroundColor: "rgb(250, 245, 255)",
    },
    // Common button style for search and navigation buttons
    primaryButton: {
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
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: '#4b1a80',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      },
      ':active': {
        transform: 'translateY(1px)',
      }
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
      width: "100%", 
      maxWidth: "100%",
      margin: "0 auto", 
      padding: "20px 10px 20px 5px", 
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
      backgroundColor: 'rgb(53, 0, 109)',
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
      backgroundColor: 'rgb(53, 0, 109)',
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
      backgroundColor: 'rgb(53, 0, 109)',
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
    },
    searchContainer: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      boxSizing: 'border-box',
      width: '100%',
      margin: '0 0 20px 0',
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
      '&:focus': {
        outline: 'none',
        borderColor: '#9A2250',
        boxShadow: '0 0 0 0.2rem rgba(154, 34, 80, 0.25)'
      }
    },
    searchButton: {
      padding: '12px 24px',
      backgroundColor: 'rgb(53, 0, 109)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#7a1a3d'
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
    },
    calendarContainer: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      boxSizing: 'border-box',
      width: '100%',
      margin: '0 0 20px 0',
      position: 'relative'
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
      
      // Filter events for this specific day
      const dayEvents = mockEvents.filter(event => 
        isSameDay(event.date, currentDate)
      );
      
      days.push(
        <div key={i} style={styles.dayCell} className={isToday ? 'today' : ''}>
          <div style={styles.dateNumber}>
            {format(currentDate, 'd')}
            {isToday && <span style={styles.todayMarker}>Today</span>}
          </div>
          
          {dayEvents.length > 0 ? (
            <div style={styles.eventsContainer}>
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  style={{
                    ...styles.eventItem,
                    borderLeft: `3px solid ${event.color}`,
                    backgroundColor: `${event.color}15`
                  }}
                >
                  <div style={styles.eventTime}>{event.time}</div>
                  <div style={styles.eventTitle}>{event.title}</div>
                  {event.location && (
                    <div style={styles.eventDetail}>
                      <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>
                      {event.location}
                    </div>
                  )}
                  {event.tutor && (
                    <div style={styles.eventDetail}>
                      <i className="fas fa-chalkboard-teacher" style={{ marginRight: '4px' }}></i>
                      {event.tutor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noSessions}>No scheduled sessions</div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Dashboard</h1>
      
      <div style={styles.content}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isSidebarCollapsed ? '80px 1fr' : '280px 1fr',
          width: '100%',
          gap: '20px',
          padding: '0 20px',
          boxSizing: 'border-box',
          maxWidth: '1400px',
          margin: '0 auto',
          transition: 'grid-template-columns 0.3s ease'
        }}>
          {/* Left Column - User Profile */}
          <div style={{ 
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            padding: isSidebarCollapsed ? '24px 10px' : '24px',
            height: 'fit-content',
            position: 'sticky',
            border: '1px solid #f0f0f0',
            width: isSidebarCollapsed ? '80px' : '280px',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            minHeight: '300px',
            position: 'relative'
          }}>
            {/* Collapse/Expand Button */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              margin: isSidebarCollapsed ? '20px 0px' : '0px',
              height: isSidebarCollapsed ? '100%' : 'auto',
              width: '90%',
              display: 'flex',
              alignItems: isSidebarCollapsed ? 'center' : 'flex-start',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-end',
              pointerEvents: 'none',
              zIndex: 10,
              paddingTop: isSidebarCollapsed ? 0 : '10px',
            }}>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                style={{
                  position: 'relative',
                  backgroundColor: 'rgba(231, 230, 230, 0.49)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: isSidebarCollapsed ? '15px 8px' : '5px',
                  margin: isSidebarCollapsed ? '0px' : '0 10px',
                  borderRadius: isSidebarCollapsed ? '0 6px 6px 0' : '4px',
                  boxShadow: isSidebarCollapsed ? '-2px 0 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.3s ease',
                  pointerEvents: 'auto',
                  height: isSidebarCollapsed ? '100%' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ':hover': {
                    background: isSidebarCollapsed ? 'rgba(255, 255, 255, 1)' : '#f8f9fa',
                    color: '#35006D',
                    boxShadow: isSidebarCollapsed ? '-2px 0 12px rgba(0,0,0,0.15)' : 'none'
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 230, 230, 0.7)';
                  e.currentTarget.style.color = '#35006D';
                  if (isSidebarCollapsed) {
                    e.currentTarget.style.boxShadow = '-2px 0 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 230, 230, 0.49)';
                  e.currentTarget.style.color = '#6c757d';
                  if (isSidebarCollapsed) {
                    e.currentTarget.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.1)';
                  } else {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <span style={{ 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px'
                }}>
                  {isSidebarCollapsed ? (
                    <i className="fas fa-bars" style={{ fontSize: '16px' }}></i>
                  ) : (
                    <i className="fas fa-window-minimize" style={{ fontSize: '12px' }}></i>
                  )}
                </span>
              </button>
            </div>
            {/* Profile Header */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: '20px',
              marginBottom: '20px',
              borderBottom: user ? '1px solid #f0f0f0' : 'none',
              opacity: isSidebarCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: user ? '#f0f7ff' : '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                overflow: 'hidden',
                border: `2px solid ${user ? '#d0e3ff' : '#e9ecef'}`
              }}>
                {user?.firstName && user?.lastName ? (
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '600',
                    color: '#9A2250',
                    textTransform: 'uppercase'
                  }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                ) : (
                  <i className="fas fa-user" style={{ 
                    fontSize: '36px', 
                    color: '#9A2250',
                    opacity: 0.7 
                  }}></i>
                )}
              </div>
              
              <h3 style={{ 
                margin: '8px 0 6px',
                color: user ? '#2c3e50' : '#6c757d',
                fontSize: '1.2rem',
                textAlign: 'center',
                fontWeight: user ? '600' : '500'
              }}>
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Welcome User' : 'Welcome to Gator Tutor'}
              </h3>
              
              {user && (
                <div style={{
                  backgroundColor: user?.isTutor ? '#e6f7e6' : '#e6f0ff',
                  color: user?.isTutor ? '#1e7b1e' : '#1967d2',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginTop: '4px',
                  letterSpacing: '0.3px'
                }}>
                  {user?.isTutor ? 'Tutor' : 'Student'}
                </div>
              )}
            </div>
            
            {/* Enrolled Courses Section */}
            <div style={{
              opacity: isSidebarCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              <h4 style={{
                color: '#495057',
                fontSize: '0.95rem',
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>
                <i className="fas fa-book" style={{ 
                  color: '#9A2250',
                  width: '20px',
                  textAlign: 'center'
                }}></i>
                {user ? 'My Courses' : 'Featured Courses'}
              </h4>
              
              {(user ? [
                { code: 'CSC 415', name: 'Operating Systems' },
                { code: 'CSC 600', name: 'Advanced Programming' },
                { code: 'MATH 300', name: 'Discrete Mathematics' }
              ] : [
                { code: 'CSC 648', name: 'Software Engineering' },
                { code: 'CSC 413', name: 'Programming Languages' },
                { code: 'MATH 324', name: 'Probability & Statistics' }
              ]).map((course, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  border: '1px solid #f0f0f0',
                  '&:hover': {
                    backgroundColor: '#f1f3f5',
                    transform: 'translateX(2px)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    backgroundColor: user ? '#e6f0ff' : '#f0f0f0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0,
                    color: user ? '#1967d2' : '#6c757d',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    border: `1px solid ${user ? '#d0e3ff' : '#e9ecef'}`
                  }}>
                    {course.code.split(' ')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#343a40',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {course.code}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {course.name}
                    </div>
                  </div>
                </div>
              ))}
              
            {!user ? (
              <button 
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '12px',
                  backgroundColor: '#9A2250',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#7d1a42';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#9A2250';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Sign In to Enroll
              </button>
            ) : (
              <button 
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '12px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #ced4da',
                  borderRadius: '8px',
                  color: '#6c757d',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#9A2250';
                  e.currentTarget.style.color = '#9A2250';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#ced4da';
                  e.currentTarget.style.color = '#6c757d';
                }}
              >
                <i className="fas fa-plus"></i>
                Add Course
              </button>
            )}
            </div>
          </div>
          
          {/* Right Column - Search and Calendar */}
          <div style={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              ...styles.searchContainer,
              width: '100%',
              margin: 0
            }}>
              <h3 style={{ margin: "0 0 5px 0", color: '#2c3e50' }}>Find Tutors & Courses</h3>
              <div style={styles.searchInputContainer}>
                <div style={styles.categoryDropdown}>
                  <button 
                    style={styles.categoryButton}
                    onClick={toggleCategory}
                  >
                    {searchCategory === 'default' ? 'All' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)} ▼
                  </button>
                  {isCategoryOpen && (
                    <ul style={styles.categoryList}>
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
                  onChange={handleSearchQueryChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder={searchCategory === 'default' ? 'Search for tutors or courses...' : `Search ${searchCategory}s...`}
                  style={styles.searchInput}
                />
                <button 
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
                  onClick={handleSearch}
                >
                  <i className="fas fa-search"></i>
                  Search
                </button>
              </div>
            </div>
            
            <div style={{
              ...styles.calendarContainer,
              width: '100%',
              margin: 0
            }}>
              <div style={styles.calendarHeader}>
                <button 
                  onClick={prevWeek}
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
                  <i className="fas fa-chevron-left"></i> Previous Week
                </button>
                <div style={styles.weekDisplay}>
                  {format(currentWeekStart, 'MMM d, yyyy')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </div>
                <button 
                  onClick={nextWeek}
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
                  Next Week <i className="fas fa-chevron-right"></i>
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
