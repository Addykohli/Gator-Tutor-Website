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
import addMinutes from 'date-fns/addMinutes';
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user} = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [isAnimating, setIsAnimating] = useState(false);
  const [tutorAvailability, setTutorAvailability] = useState([]);
  const [tutorBookings, setTutorBookings] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  
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
            
            // Helper function to format date as YYYY-MM-DD in local time (not UTC)
            const formatLocalDate = (date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() + dayOffset);
              const dateStr = formatLocalDate(checkDate);
              
              try {
                const availResponse = await fetch(
                  `${apiBaseUrl}/search/tutors/${user.id}/availability?date=${dateStr}`
                );
                
                if (availResponse.ok) {
                  const availData = await availResponse.json();                  
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

  // Fetch tutor bookings
  const fetchTutorBookings = async () => {
    if (user?.isTutor) {
      try {
        setIsLoadingBookings(true);
        const apiBaseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000' 
          : '/api';
        
        // Fetch confirmed and pending bookings separately since backend doesn't support comma-separated status
        const [confirmedResponse, pendingResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/search/bookings?tutor_id=${user.id}&status=confirmed`),
          fetch(`${apiBaseUrl}/search/bookings?tutor_id=${user.id}&status=pending`)
        ]);
        
        if (!confirmedResponse.ok || !pendingResponse.ok) {
          throw new Error(`HTTP error! status: ${confirmedResponse.status} or ${pendingResponse.status}`);
        }
        
        const confirmedData = await confirmedResponse.json();
        const pendingData = await pendingResponse.json();
        
        // Combine both arrays
        const allBookings = [...(Array.isArray(confirmedData) ? confirmedData : []), ...(Array.isArray(pendingData) ? pendingData : [])];
        
        console.log('Fetched tutor bookings:', allBookings);
        console.log('Bookings with parsed dates:', allBookings.map(b => {
          const startTime = new Date(b.start_time);
          const endTime = new Date(b.end_time);
          return {
            id: b.booking_id,
            startUTC: b.start_time,
            startLocal: startTime.toString(),
            startDate: format(startTime, 'yyyy-MM-dd'),
            startHour: startTime.getHours(),
            startMinutes: startTime.getMinutes(),
            endUTC: b.end_time,
            endLocal: endTime.toString(),
            endHour: endTime.getHours(),
            endMinutes: endTime.getMinutes(),
            status: b.status
          };
        }));
        setTutorBookings(allBookings);
      } catch (error) {
        console.error('Error fetching tutor bookings:', error);
        setTutorBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    }
  };

  // Fetch data based on user type
  useEffect(() => {
    if (user) {
      if (user.isTutor) {
        fetchTutorAvailability();
        fetchTutorBookings();
      } else {
        fetchStudentBookings();
      }
    }
    
    // Check for any booking to highlight when component mounts
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get('highlight');
    if (highlightId) {
      setGlowBookingId(highlightId);
    }
  }, [user]);
  
  // Check if a specific hour on a specific day is available
  const isTimeSlotAvailable = (date, hour) => {
    if (!tutorAvailability || tutorAvailability.length === 0) {
      console.log('No availability data');
      return false;
    }
    
    // Get day name in lowercase (e.g., "monday")
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    //console.log(`Checking availability for ${dayOfWeek} at hour ${hour}`);
    
    // Find availability for this day - check multiple possible field names
    const dayAvailability = tutorAvailability.find(
      avail => {
        const availDay = (avail.day_of_week || avail.day || '').toLowerCase();
        return availDay === dayOfWeek;
      }
    );
    
    if (!dayAvailability) {
      //console.log(`No availability found for ${dayOfWeek}`);
      return false;
    }
    
    //console.log(`Found availability for ${dayOfWeek}:`, dayAvailability);
    
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
        
    // Check if hour is within availability window
    const isAvailable = hour >= availStart && hour < availEnd;
    console.log(`Hour ${hour} is ${isAvailable ? 'available' : 'not available'}`);
    
    return isAvailable;
  };
  
  // State for student bookings
  const [studentBookings, setStudentBookings] = useState([]);
  const [isLoadingStudentBookings, setIsLoadingStudentBookings] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  
  // Fetch student bookings
  const fetchStudentBookings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingStudentBookings(true);
      setBookingError(null);
      
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '/api';
      
      // Fetch both confirmed and pending bookings
      const [confirmedResponse, pendingResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/search/bookings?student_id=${user.id}&status=confirmed`),
        fetch(`${apiBaseUrl}/search/bookings?student_id=${user.id}&status=pending`)
      ]);
      
      if (!confirmedResponse.ok || !pendingResponse.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const confirmedData = await confirmedResponse.json();
      const pendingData = await pendingResponse.json();
      
      // Combine and process bookings
      const allBookings = [
        ...(Array.isArray(confirmedData) ? confirmedData : []), 
        ...(Array.isArray(pendingData) ? pendingData : [])
      ];
      
      console.log('Fetched student bookings:', allBookings);
      setStudentBookings(allBookings);
    } catch (error) {
      console.error('Error fetching student bookings:', error);
      setBookingError('Failed to load bookings. Please try again later.');
      setStudentBookings([]);
    } finally {
      setIsLoadingStudentBookings(false);
    }
  };
  
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
      borderBottom: "4px solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: "10px auto 5px",
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
      marginBottom: '12px',
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
      borderRight: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
    },
    dateNumber: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#2c3e50',
      textAlign: 'center',
      width: '100%'
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
      justifyContent: 'top',
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
    bookedSlot: {
      backgroundColor: 'rgba(200, 200, 200, 0.2)',
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
  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8am to 11pm (16 hours)
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
    
    // Group bookings by date for easier lookup
    const bookingsByDate = {};
    if (Array.isArray(studentBookings)) {
      studentBookings.forEach(booking => {
        if (!booking.start_time) return;
        
        const startTime = parseTimeToLocal(booking.start_time);
        const endTime = parseTimeToLocal(booking.end_time);
        
        if (!startTime || !endTime) return;
        
        const dateKey = format(startTime, 'yyyy-MM-dd');
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = [];
        }
        
        bookingsByDate[dateKey].push({
          ...booking,
          startTime,
          endTime,
          formattedTime: `${format(startTime, 'h:mma')} - ${format(endTime, 'h:mma')}`.toLowerCase(),
          color: booking.status === 'confirmed' ? '#1cc88a' : '#f6c23e'
        });
      });
    }
    
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      const isToday = isSameDay(currentDate, today);
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const dayBookings = bookingsByDate[dateKey] || [];
      
      days.push(
        <div key={i} style={{
          minHeight: '150px',
          borderRight: i < 6 ? '1px solid #e9ecef' : 'none',
          padding: '12px 8px',
          backgroundColor: isToday ? 'rgba(53, 0, 109, 0.02)' : 'white',
          position: 'relative',
          overflowY: 'auto',
          maxHeight: '500px'
        }}>
          {isLoadingStudentBookings ? (
            <div style={styles.noSessions}>Loading...</div>
          ) : bookingError ? (
            <div style={{ ...styles.noSessions, color: '#e74a3b' }}>Error loading bookings</div>
          ) : dayBookings.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '4px 0'
            }}>
              {dayBookings.map((booking, index) => (
                <div 
                  key={`${booking.booking_id || index}`} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    padding: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderLeft: `3px solid ${booking.color}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                    }
                  }}
                  onClick={() => handleStudentBookingClick(booking)}
                  className={glowBookingId === booking.booking_id ? 'glow-animation' : ''}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#6c757d',
                    marginBottom: '4px'
                  }}>
                    {booking.formattedTime}
                  </div>
                  <div style={{
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#212529',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {booking.tutor_name || 'Tutoring Session'}
                    {booking.status === 'pending' && (
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Pending
                      </span>
                    )}
                  </div>
                  {booking.course_name && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#495057',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '4px'
                    }}>
                      <i className="fas fa-book" style={{ 
                        marginRight: '6px',
                        color: '#6c757d',
                        width: '14px',
                        textAlign: 'center'
                      }}></i>
                      {booking.course_name}
                    </div>
                  )}
                  {booking.location && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '4px'
                    }}>
                      <i className="fas fa-map-marker-alt" style={{ 
                        marginRight: '6px',
                        color: '#6c757d',
                        width: '14px',
                        textAlign: 'center'
                      }}></i>
                      {booking.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100px',
              color: '#6c757d',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '20px 10px',
              opacity: 0.7
            }}>
              No sessions scheduled
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // Handle opening edit availability for a specific date
  const handleEditAvailability = (date, event) => {
    // Get button position for animation
    const rect = event.currentTarget.getBoundingClientRect();
    setEditButtonPosition({ x: rect.left, y: rect.top });
    
    setIsEditPanelAnimating(true);
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
    
    // Reset animation flag after animation completes
    setTimeout(() => setIsEditPanelAnimating(false), 500);
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

  // Helper function to parse time string to local time
  const parseTimeToLocal = (timeStr) => {
    if (!timeStr) return null;
    
    // If it's already a Date object, return it
    if (timeStr instanceof Date) return timeStr;
    
    // If it's an ISO string without timezone, append 'Z' to treat as UTC
    if (timeStr.includes('T') && !timeStr.includes('Z') && !timeStr.includes('+') && !timeStr.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(timeStr + 'Z');
    }
    
    // Otherwise, let the Date constructor handle it
    return new Date(timeStr);
  };

  // Helper function to check if a booking exists for a specific date and hour
  const getBookingForSlot = (date, hour) => {
    if (!tutorBookings || !tutorBookings.length) {
      return null;
    }
    
    // Create date objects in local time for the slot
    const slotDate = new Date(date);
    const slotStart = new Date(slotDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    // Convert to timestamps for comparison
    const slotStartTime = slotStart.getTime();
    const slotEndTime = slotEnd.getTime();
    
    // Find the first booking that overlaps with this hour slot
    const matchingBooking = tutorBookings.find(booking => {
      if (!booking.start_time || !booking.end_time) {
        return false;
      }
      
      // Parse the booking times to local time
      const startTime = parseTimeToLocal(booking.start_time);
      const endTime = parseTimeToLocal(booking.end_time);
      
      if (!startTime || !endTime) return false;
      
      // Convert to timestamps for comparison
      const bookingStartTime = startTime.getTime();
      const bookingEndTime = endTime.getTime();
      
      // Check if booking overlaps with the hour slot
      const overlaps = bookingStartTime < slotEndTime && bookingEndTime > slotStartTime;
      
      if (overlaps) {
        console.log(`✅ Booking MATCHED for ${format(slotStart, 'yyyy-MM-dd')} at hour ${hour}:`, {
          bookingId: booking.booking_id || 'unknown',
          bookingStart: format(startTime, 'yyyy-MM-dd HH:mm'),
          bookingEnd: format(endTime, 'yyyy-MM-dd HH:mm'),
          bookingLocal: startTime.toString(),
          slotStart: format(slotStart, 'yyyy-MM-dd HH:mm'),
          slotEnd: format(slotEnd, 'yyyy-MM-dd HH:mm'),
          slotHour: hour,
          status: booking.status || 'unknown'
        });
      }
      
      return overlaps;
    });
    
    return matchingBooking || null;
  };

  // Render tutor calendar with hourly slots
  const renderTutorCalendar = () => {
    const cells = [];
    
    // Header row - empty cell + day headers
    cells.push(<div key="empty-header" style={{ ...styles.timeLabel, backgroundColor: 'rgb(53, 0, 109)' }}></div>);
    
    // Add day headers
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(currentWeekStart, i);
      const isToday = isSameDay(currentDate, today);
      const isFutureDate = currentDate > today;
      
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
          {isFutureDate && (
            <button
              onClick={(e) => handleEditAvailability(currentDate, e)}
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
          )}
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
        const booking = getBookingForSlot(currentDate, hour);
        
        // Debug logging for all slots when bookings exist
        if (tutorBookings && tutorBookings.length > 0) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const matchingBookings = tutorBookings.filter(b => {
            if (!b.start_time) return false;
            const bookingDate = format(new Date(b.start_time), 'yyyy-MM-dd');
            return bookingDate === dateStr;
          });
          
          if (matchingBookings.length > 0) {
            console.log(`🔍 Checking slot: ${dateStr} hour ${hour}`, {
              foundBooking: booking ? booking.booking_id : 'none',
              matchingBookingsOnDate: matchingBookings.map(b => {
                const startTime = new Date(b.start_time);
                const endTime = new Date(b.end_time);
                return {
                  id: b.booking_id,
                  start: b.start_time,
                  startLocal: startTime.toString(),
                  startHour: startTime.getHours(),
                  startMinutes: startTime.getMinutes(),
                  endHour: endTime.getHours(),
                  endMinutes: endTime.getMinutes(),
                  // Check overlap manually
                  hourStart: hour * 60,
                  hourEnd: (hour + 1) * 60,
                  bookingStart: startTime.getHours() * 60 + startTime.getMinutes(),
                  bookingEnd: endTime.getHours() * 60 + endTime.getMinutes(),
                  shouldOverlap: (startTime.getHours() * 60 + startTime.getMinutes()) < ((hour + 1) * 60) && 
                                 (endTime.getHours() * 60 + endTime.getMinutes()) > (hour * 60)
                };
              })
            });
          }
        }
        
        // Log when we're about to render a booking
        if (booking) {
          console.log(`🎨 RENDERING booking ${booking.booking_id} for ${format(currentDate, 'yyyy-MM-dd')} hour ${hour}`);
        }
        
        cells.push(
          <div 
            key={`slot-${hour}-${i}`} 
            style={{
              ...styles.tutorTimeSlot,
              ...(isAvailable ? styles.availableSlot : {}),
              position: 'relative',
              overflow: 'visible'
            }}
          >
            {booking ? (
              <button
                id={`booking-btn-${booking.booking_id}`}
                type="button"
                className={`calendar-booking-btn${glowBookingId === booking.booking_id ? ' glow-animation' : ''}`}
                onClick={() => handleBookingClick(booking.booking_id)}
                style={{
                  position: 'absolute',
                  top: '4px', left: '4px', right: '4px', bottom: '4px',
                  backgroundColor: booking.status === 'confirmed' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(255, 193, 7, 0.95)',
                  borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '0.5rem', fontWeight: '500',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  textAlign: 'center', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 10, border: '1px solid rgba(255,255,255,0.3)', cursor:'pointer', borderWidth:'2px', transition: 'box-shadow 0.5s, background 0.5s',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '2px' }}>
                  {booking.student_name || booking.student_first_name || 'Student'}
                </div>
                <div style={{ fontSize: '0.6rem', opacity: 0.95, marginBottom: '2px' }}>
                  {formatHourRange(booking.start_time, booking.end_time, hour)}
                </div>
              </button>
            ) : null}
          </div>
        );
      }
    });
    
    return cells;
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [slideDirection, setSlideDirection] = useState('none');
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });

  // Function to save availability for a specific date
  const saveAvailability = async (date, isRecurring = false) => {
    if (!user?.isTutor || !editingDate) return;
    
    setIsSaving(true);
    setSaveStatus({ success: false, message: '' });
    
    try {
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '/api';
        
      const response = await fetch(`${apiBaseUrl}/schedule/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tutor_id: user.id,
          date: format(date, 'yyyy-MM-dd'),
          start_time: format(editingDate, 'HH:mm'),
          end_time: format(addMinutes(editingDate, 30), 'HH:mm'),
          is_recurring: isRecurring
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSaveStatus({ 
          success: true, 
          message: isRecurring 
            ? `Availability set for all ${format(editingDate, 'EEEE')}s successfully!`
            : 'Availability set for this day successfully!'
        });
        // Refresh availability data
        fetchTutorAvailability();
      } else {
        throw new Error(data.detail || 'Failed to save availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      setSaveStatus({ 
        success: false, 
        message: error.message || 'Error saving availability. Please try again.'
      });
    } finally {
      setIsSaving(false);
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setSaveStatus({ success: false, message: '' });
      }, 5000);
    }
  };
  
  // Handle apply to this day
  const handleApplyToThisDay = () => {
    if (!editingDate) return;
    saveAvailability(editingDate, false);
  };
  
  // Handle apply to all days of week
  const handleApplyToAllDays = () => {
    if (!editingDate) return;
    saveAvailability(editingDate, true);
  };
  const [editSlots, setEditSlots] = useState([]);
  const [isEditPanelAnimating, setIsEditPanelAnimating] = useState(false);
  const [editButtonPosition, setEditButtonPosition] = useState({ x: 0, y: 0 });
  const [glowBookingId, setGlowBookingId] = useState(null);

  // Helper function to format hour range for booking display with timezone handling
  const formatHourRange = (startTime, endTime, hour) => {
    // Parse the times using our helper function
    const start = parseTimeToLocal(startTime);
    const end = parseTimeToLocal(endTime);
    
    if (!start || !end) return '';
    
    // Create slot times based on the current date and hour
    const slotDate = new Date(start);
    slotDate.setHours(0, 0, 0, 0);
    
    const slotStart = new Date(slotDate);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(slotDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    // Calculate the display times, ensuring they're within the current hour slot
    const displayStart = start < slotStart ? slotStart : start;
    const displayEnd = end > slotEnd ? slotEnd : end;
    
    // Format the time range using the user's locale
    const formatTime = (date) => {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    };
    
    return `${formatTime(displayStart)} - ${formatTime(displayEnd)}`;
  };

  // Handle tutor booking clicks (navigates to appointment requests)
  function handleBookingClick(bookingId) {
    setGlowBookingId(bookingId);
    navigate(`/appointment-requests?booking=${bookingId}`);
  }

  // Handle student booking clicks (navigates to sessions page with correct tab)
  const handleStudentBookingClick = (booking) => {
    if (!booking) return;
    
    // Store the booking ID for highlighting
    const bookingId = booking.booking_id || booking.id;
    
    // Set glow effect immediately for visual feedback
    setGlowBookingId(bookingId);
    
    // Determine which tab to select based on booking status
    let tab = 'upcoming';
    if (booking.status === 'pending') {
      tab = 'requests';
    } else if (booking.status === 'completed' || (booking.end_time && new Date(booking.end_time) <= new Date())) {
      tab = 'past';
    }
    
    // Store in session storage as a fallback
    sessionStorage.setItem('highlightBooking', bookingId);
    
    // Navigate to sessions page with the correct tab and highlight
    navigate(`/sessions?tab=${tab}`, { 
      state: { 
        highlightBooking: bookingId,
        fromCalendar: true
      },
      replace: true
    });
  };

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
    @keyframes editPanelPopIn {
      0% {
        opacity: 0;
        transform: scale(0.3) translateY(-50px);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.05) translateY(-10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `;

  const calendarAnimation = {
    'none': {
      transform: 'translateX(0)',
      opacity: 1,
      position: 'relative',
      transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
      width: '100%',
      minHeight: '400px' // Ensure minimum height for the calendar
    },
    'slide-in-left': {
      animation: 'slideInLeft 0.3s ease-out forwards',
      position: 'absolute',
      top: '40px', // Leave space for the header
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: '#fff', // Ensure background covers the area
      zIndex: 2
    },
    'slide-out-left': {
      animation: 'slideOutLeft 0.3s ease-out forwards',
      position: 'absolute',
      top: '40px',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: '#fff',
      zIndex: 2
    },
    'slide-in-right': {
      animation: 'slideInRight 0.3s ease-out forwards',
      position: 'absolute',
      top: '40px',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: '#fff',
      zIndex: 2
    },
    'slide-out-right': {
      animation: 'slideOutRight 0.3s ease-out forwards',
      position: 'absolute',
      top: '40px',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: '#fff',
      zIndex: 2
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Dashboard</h1>
      
      <div style={styles.content}>
        <div style={{ 
          display: isAuthenticated ? 'grid' : 'flex',
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
          {isAuthenticated ? (
          <>
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
          </>
          ):null}
          
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
                margin: 0,
                animation: isEditPanelAnimating ? 'editPanelPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                transformOrigin: 'center top'
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
                    onClick={() => {
                      setEditingDate(null);
                      setIsEditPanelAnimating(false);
                    }}
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
                      border: '1px solid #e9ecef',
                      animation: isEditPanelAnimating ? `editPanelPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + index * 0.1}s backwards` : 'none'
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
                    onClick={handleApplyToThisDay}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: isSaving ? '#6c757d' : '#35006D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#4b1a80')}
                    onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#35006D')}
                  >
                    {isSaving ? 'Saving...' : 'Apply to This Day'}
                  </button>
                  
                  <button
                    onClick={handleApplyToAllDays}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      backgroundColor: isSaving ? '#adb5bd' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    {isSaving ? 'Saving...' : `Apply to All ${format(editingDate, 'EEEE')}s`}
                  </button>
                  
                  {saveStatus.message && (
                    <div style={{
                      position: 'absolute',
                      bottom: '60px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '10px 20px',
                      backgroundColor: saveStatus.success ? '#d4edda' : '#f8d7da',
                      color: saveStatus.success ? '#155724' : '#721c24',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      transition: 'all 0.3s ease-in-out',
                      opacity: saveStatus.message ? 1 : 0,
                      maxWidth: '80%',
                      textAlign: 'center'
                    }}>
                      {saveStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Conditional Calendar Rendering */}
            {isAuthenticated ? (
              <>
            <div style={{
              ...styles.calendarContainer,
              width: '100%',
              margin: 0,
              position: 'relative',
              overflow: 'hidden',
              minHeight: '600px'
            }}>
              <div style={styles.calendarHeader}>
                <button 
                  onClick={prevWeek}
                  style={{
                    backgroundColor: '#35006D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
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
                    padding: '6px 12px',
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
                <div style={{
                  ...styles.calendarGrid,
                  position: 'relative',
                  overflow: 'hidden',
                  ...calendarAnimation[slideDirection]
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '1px',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}>
                    {weekDays.map((day, index) => {
                      const currentDate = addDays(currentWeekStart, index);
                      const isToday = isSameDay(currentDate, today);
                      return (
                        <div key={day} style={{
                          ...styles.dayHeader,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 4px',
                          position: 'relative'
                        }}>
                          <div style={{ 
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                            fontWeight: isToday ? 'bold' : 'normal'
                          }}>
                            {day}
                          </div>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isToday ? 'rgba(53, 0, 109, 0.1)' : 'transparent',
                            color: isToday ? '#35006D' : 'inherit',
                            fontWeight: isToday ? 'bold' : 'normal'
                          }}>
                            {format(currentDate, 'd')}
                          </div>
                        </div>
                      );
                    })}
                    {renderStudentDays()}
                  </div>
                </div>
              )}
              
              {/* Tutor Calendar */}
              {user?.isTutor && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '500px' // Ensure enough height for the calendar
                }}>
                  {isLoadingAvailability ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      color: '#666',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0
                    }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                      <div>Loading availability...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        position: 'relative',
                        zIndex: 1,
                        marginBottom: '10px', 
                        padding: '8px 12px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '0.85rem',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'rgba(255, 220, 100, 0.6)',
                          borderRadius: '3px'
                        }}></div>
                        Available hours
                      </div>
                      <div style={{
                        ...styles.tutorCalendarGrid,
                        position: 'relative',
                        ...calendarAnimation[slideDirection],
                        willChange: 'transform, opacity'
                      }}>
                        {renderTutorCalendar()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            </>
            ):null}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;