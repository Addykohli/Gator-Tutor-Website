import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import format from 'date-fns/format';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import startOfWeek from 'date-fns/startOfWeek';
import addDays from 'date-fns/addDays';
import isSameDay from 'date-fns/isSameDay';
import parse from 'date-fns/parse';
import isWithinInterval from 'date-fns/isWithinInterval';
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [tutorAvailability, setTutorAvailability] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
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
  
  // Fetch tutor availability if user is a tutor
  useEffect(() => {
    const fetchTutorAvailability = async () => {
      if (user && user.isTutor) {
        try {
          setIsLoadingAvailability(true);
          const apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000' 
            : '/api';
          
          // First, try to get tutor profile which should include availability_slots
          const response = await fetch(`${apiBaseUrl}/search/tutors/${user.id}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Tutor profile data:', data);
          
          // Check for availability_slots in the response
          let availabilityData = data.availability_slots || data.availability || [];
          
          // If no availability in profile, try fetching from multiple dates to build a weekly pattern
          if (!availabilityData || availabilityData.length === 0) {
            console.log('No availability_slots in profile, fetching date-specific availability...');
            
            // Fetch availability for the current week to build the pattern
            const weeklyAvailability = {};
            const today = new Date();
            
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() + dayOffset);
              const dateStr = checkDate.toISOString().split('T')[0];
              
              try {
                const availResponse = await fetch(
                  `${apiBaseUrl}/search/tutors/${user.id}/availability?date=${dateStr}`
                );
                
                if (availResponse.ok) {
                  const availData = await availResponse.json();
                  console.log(`Availability for ${dateStr}:`, availData);
                  
                  if (availData.slots && availData.slots.length > 0) {
                    // Get day of week
                    const dayName = format(checkDate, 'EEEE').toLowerCase();
                    
                    // Find the earliest and latest times for this day
                    const times = availData.slots.map(slot => ({
                      start: new Date(slot.start_time).getHours(),
                      end: new Date(slot.end_time).getHours()
                    }));
                    
                    const minStart = Math.min(...times.map(t => t.start));
                    const maxEnd = Math.max(...times.map(t => t.end));
                    
                    weeklyAvailability[dayName] = {
                      day_of_week: dayName,
                      start_time: `${minStart.toString().padStart(2, '0')}:00:00`,
                      end_time: `${maxEnd.toString().padStart(2, '0')}:00:00`
                    };
                  }
                }
              } catch (err) {
                console.error(`Error fetching availability for ${dateStr}:`, err);
              }
            }
            
            // Convert weekly availability object to array
            availabilityData = Object.values(weeklyAvailability);
            console.log('Built weekly availability pattern:', availabilityData);
          }
          
          console.log('Final parsed availability:', availabilityData);
          
          if (Array.isArray(availabilityData) && availabilityData.length > 0) {
            setTutorAvailability(availabilityData);
          } else {
            console.warn('No availability data could be loaded');
            setTutorAvailability([]);
          }
        } catch (error) {
          console.error('Error fetching tutor availability:', error);
          setTutorAvailability([]);
        } finally {
          setIsLoadingAvailability(false);
        }
      }
    };
    
    fetchTutorAvailability();
  }, [user]);
  
  // Check if a specific hour on a specific day is available
  const isTimeSlotAvailable = (date, hour) => {
    if (!tutorAvailability || tutorAvailability.length === 0) {
      console.log('No availability data');
      return false;
    }
    
    // Get day name in lowercase (e.g., "monday")
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    console.log(`Checking availability for ${dayOfWeek} at hour ${hour}`);
    
    // Find availability for this day - check multiple possible field names
    const dayAvailability = tutorAvailability.find(
      avail => {
        const availDay = (avail.day_of_week || avail.day || '').toLowerCase();
        return availDay === dayOfWeek;
      }
    );
    
    if (!dayAvailability) {
      console.log(`No availability found for ${dayOfWeek}`);
      return false;
    }
    
    console.log(`Found availability for ${dayOfWeek}:`, dayAvailability);
    
    // Parse start and end times (format: "HH:MM:SS" or "HH:MM")
    const parseTimeToHour = (timeStr) => {
      if (!timeStr) return null;
      const [hours] = timeStr.split(':');
      return parseInt(hours, 10);
    };
    
    // Check multiple possible field names for start/end times
    const startTimeStr = dayAvailability.start_time || dayAvailability.startTime;
    const endTimeStr = dayAvailability.end_time || dayAvailability.endTime;
    
    if (!startTimeStr || !endTimeStr) {
      console.log('Missing start or end time:', { startTimeStr, endTimeStr });
      return false;
    }
    
    const availStart = parseTimeToHour(startTimeStr);
    const availEnd = parseTimeToHour(endTimeStr);
    
    console.log(`Time range: ${availStart} - ${availEnd}, checking hour: ${hour}`);
    
    // Check if hour is within availability window
    const isAvailable = hour >= availStart && hour < availEnd;
    console.log(`Hour ${hour} is ${isAvailable ? 'available' : 'not available'}`);
    
    return isAvailable;
  };
  
  // Mock data for calendar events (student view)
  const mockEvents = [
    {
      id: 1,
      title: 'CS 415 Review',
      date: addDays(new Date(), 1),
      time: '10:00 AM - 11:30 AM',
      type: 'class',
      location: 'Library Room 203',
      color: '#4e73df'
    },
    {
      id: 2,
      title: 'Tutoring Session',
      date: addDays(new Date(), 1),
      time: '2:00 PM - 3:30 PM',
      type: 'tutoring',
      tutor: 'Dr. Smith',
      color: '#1cc88a'
    },
    {
      id: 3,
      title: 'Group Study',
      date: addDays(new Date(), 3),
      time: '4:00 PM - 6:00 PM',
      type: 'study',
      group: 'CS Study Group',
      location: 'Student Center',
      color: '#f6c23e'
    },
    {
      id: 4,
      title: 'Office Hours',
      date: addDays(new Date(), 4),
      time: '1:00 PM - 3:00 PM',
      type: 'office_hours',
      professor: 'Prof. Johnson',
      location: 'SCI 217',
      color: '#e74a3b'
    },
    {
      id: 5,
      title: 'CS 600 Lecture',
      date: addDays(new Date(), 5),
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
  
  const styles = {
    container: { 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh", 
      width: "100%", 
      overflowX: "hidden",
      backgroundColor: "rgb(250, 245, 255)",
    },
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
    weekDisplay: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#2c3e50'
    },
    calendarGrid: {
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#e0e0e0',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxSizing: 'border-box',
      minHeight: '200px'
    },
    // Student calendar styles
    dayHeader: {
      backgroundColor: 'rgb(53, 0, 109)',
      color: 'white',
      padding: '12px',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '1rem',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
    },
    dayCell: {
      backgroundColor: 'white',
      minHeight: '120px',
      height: 'auto',
      padding: '8px',
      position: 'relative',
      overflow: 'visible',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
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
    eventsContainer: {
      marginTop: '8px',
      flex: 1,
      paddingRight: '4px',
      width: '100%'
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
    },
    // Tutor calendar styles
    tutorCalendarGrid: {
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '60px repeat(7, 1fr)',
      backgroundColor: '#f5f5f5',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    timeLabel: {
      backgroundColor: '#fff',
      padding: '8px 4px',
      textAlign: 'center',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: '#666',
      borderRight: '1px solid #e0e0e0',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tutorDayHeader: {
      backgroundColor: 'rgb(53, 0, 109)',
      color: 'white',
      padding: '12px 8px',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '0.9rem',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tutorTimeSlot: {
      backgroundColor: 'white',
      minHeight: '40px',
      borderRight: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
      position: 'relative',
      transition: 'background-color 0.2s',
    },
    availableSlot: {
      backgroundColor: 'rgba(255, 220, 100, 0.3)',
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
    },
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm (12 hours)
  const today = new Date();
  
  const nextWeek = () => {
    if (isAnimating) return;
    setSlideDirection('slide-out-left');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
      setSlideDirection('slide-in-right');
      
      setTimeout(() => {
        setSlideDirection('none');
        setIsAnimating(false);
      }, 300);
    }, 300);
  };
  
  const prevWeek = () => {
    if (isAnimating) return;
    setSlideDirection('slide-out-right');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
      setSlideDirection('slide-in-left');
      
      setTimeout(() => {
        setSlideDirection('none');
        setIsAnimating(false);
      }, 300);
    }, 300);
  };

  // Render student calendar days
  const renderStudentDays = () => {
    const days = [];
    let startDate = currentWeekStart;
    
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      const isToday = isSameDay(currentDate, today);
      
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

  // Handle opening edit availability for a specific date
  const handleEditAvailability = (date) => {
    setEditingDate(date);
    
    // Get existing availability for this day
    const dayName = format(date, 'EEEE').toLowerCase();
    const dayAvail = tutorAvailability.find(
      avail => (avail.day_of_week || avail.day || '').toLowerCase() === dayName
    );
    
    if (dayAvail) {
      // Parse existing slot
      const startTime = dayAvail.start_time || dayAvail.startTime || '09:00';
      const endTime = dayAvail.end_time || dayAvail.endTime || '17:00';
      setEditSlots([{ id: Date.now(), startTime, endTime }]);
    } else {
      // Default empty slot
      setEditSlots([{ id: Date.now(), startTime: '09:00', endTime: '17:00' }]);
    }
  };

  // Add a new time slot
  const handleAddSlot = () => {
    setEditSlots([...editSlots, { id: Date.now(), startTime: '09:00', endTime: '17:00' }]);
  };

  // Delete a time slot
  const handleDeleteSlot = (slotId) => {
    setEditSlots(editSlots.filter(slot => slot.id !== slotId));
  };

  // Update slot time
  const handleSlotTimeChange = (slotId, field, value) => {
    setEditSlots(editSlots.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ));
  };

  // Render tutor calendar with hourly slots
  const renderTutorCalendar = () => {
    const cells = [];
    
    // Header row - empty cell + day headers
    cells.push(<div key="empty-header" style={{ ...styles.timeLabel, backgroundColor: 'rgb(53, 0, 109)' }}></div>);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(currentWeekStart, i);
      const isToday = isSameDay(currentDate, today);
      
      cells.push(
        <div key={`header-${i}`} style={styles.tutorDayHeader}>
          <div>{weekDays[i]}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            {format(currentDate, 'MMM d')}
          </div>
          {isToday && (
            <div style={{ 
              fontSize: '0.7rem', 
              marginTop: '2px',
              backgroundColor: 'rgba(255, 220, 100, 0.9)',
              color: '#333',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: '600'
            }}>
              Today
            </div>
          )}
          <button
            onClick={() => handleEditAvailability(currentDate)}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              fontSize: '0.7rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>
            Edit
          </button>
        </div>
      );
    }
    
    // Time slots
    hours.forEach(hour => {
      // Time label
      const timeLabel = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      cells.push(
        <div key={`time-${hour}`} style={styles.timeLabel}>
          {timeLabel}
        </div>
      );
      
      // Day cells for this hour
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(currentWeekStart, i);
        const isAvailable = isTimeSlotAvailable(currentDate, hour);
        
        cells.push(
          <div 
            key={`slot-${hour}-${i}`} 
            style={{
              ...styles.tutorTimeSlot,
              ...(isAvailable ? styles.availableSlot : {})
            }}
          >
          </div>
        );
      }
    });
    
    return cells;
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [slideDirection, setSlideDirection] = useState('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [editSlots, setEditSlots] = useState([]);

  const keyframes = `
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutLeft {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-100%); opacity: 0; }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;

  const calendarAnimation = {
    'none': {
      transform: 'translateX(0)',
      opacity: 1,
      position: 'relative',
      transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
    },
    'slide-in-left': {
      animation: 'slideInLeft 0.3s ease-out forwards'
    },
    'slide-out-left': {
      animation: 'slideOutLeft 0.3s ease-out forwards'
    },
    'slide-in-right': {
      animation: 'slideInRight 0.3s ease-out forwards'
    },
    'slide-out-right': {
      animation: 'slideOutRight 0.3s ease-out forwards'
    }
  };

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
              height: isSidebarCollapsed ? '90%' : 'auto',
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
                        style={{ cursor: 'pointer', padding: '8px 16px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >All</li>
                      <li 
                        onClick={() => selectCategory('tutor')}
                        style={{ cursor: 'pointer', padding: '8px 16px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >Tutors</li>
                      <li 
                        onClick={() => selectCategory('course')}
                        style={{ cursor: 'pointer', padding: '8px 16px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
            
            {/* Edit Availability Section */}
            {user?.isTutor && editingDate && (
              <div style={{
                ...styles.searchContainer,
                width: '100%',
                margin: 0
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ margin: 0, color: '#2c3e50' }}>
                    Edit Availability - {format(editingDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <button
                    onClick={() => setEditingDate(null)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#6c757d',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '4px 8px',
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#6c757d'}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  {editSlots.map((slot, index) => (
                    <div key={slot.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057', minWidth: '40px' }}>
                          From:
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleSlotTimeChange(slot.id, 'startTime', e.target.value)}
                          style={{
                            padding: '8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            flex: 1
                          }}
                        />
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057', minWidth: '30px' }}>
                          To:
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleSlotTimeChange(slot.id, 'endTime', e.target.value)}
                          style={{
                            padding: '8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            flex: 1
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'background-color 0.2s',
                          minWidth: '80px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                      >
                        <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                        Delete
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleAddSlot}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'transparent',
                      border: '2px dashed #ced4da',
                      borderRadius: '8px',
                      color: '#6c757d',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#35006D';
                      e.currentTarget.style.color = '#35006D';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#ced4da';
                      e.currentTarget.style.color = '#6c757d';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add Time Slot
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: '#35006D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b1a80'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#35006D'}
                  >
                    Apply to This Day
                  </button>
                  
                  <button
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                  >
                    Apply to All {format(editingDate, 'EEEE')}s
                  </button>
                </div>
              </div>
            )}
            
            {/* Conditional Calendar Rendering */}
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
              
              <style>{keyframes}</style>
              
              {/* Student Calendar */}
              {!user?.isTutor && (
                <div style={styles.calendarGrid}>
                  <div style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '1px',
                    width: '100%',
                    minHeight: '200px',
                    boxSizing: 'border-box',
                    backgroundColor: '#e0e0e0',
                    ...calendarAnimation[slideDirection],
                    willChange: 'transform, opacity'
                  }}>
                    {weekDays.map(day => (
                      <div key={day} style={styles.dayHeader}>
                        {day}
                      </div>
                    ))}
                    {renderStudentDays()}
                  </div>
                </div>
              )}
              
              {/* Tutor Calendar */}
              {user?.isTutor && (
                <div style={{
                  ...calendarAnimation[slideDirection],
                  willChange: 'transform, opacity'
                }}>
                  {isLoadingAvailability ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                      <div>Loading availability...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        marginBottom: '10px', 
                        padding: '8px 12px', 
                        backgroundColor: 'rgba(255, 220, 100, 0.2)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 220, 100, 0.5)',
                        fontSize: '0.85rem',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'rgba(255, 220, 100, 0.6)',
                          borderRadius: '3px'
                        }}></div>
                        Available hours
                      </div>
                      <div style={styles.tutorCalendarGrid}>
                        {renderTutorCalendar()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;