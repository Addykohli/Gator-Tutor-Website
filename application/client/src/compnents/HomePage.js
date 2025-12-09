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
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, darkMode } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [isAnimating, setIsAnimating] = useState(false);
  const [tutorAvailability, setTutorAvailability] = useState([]);
  const [tutorBookings, setTutorBookings] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [tutorCourses, setTutorCourses] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Course Management State
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isRemoveCourseModalOpen, setIsRemoveCourseModalOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseSearchResults, setCourseSearchResults] = useState([]);
  const [isSearchingCourses, setIsSearchingCourses] = useState(false);
  const [requestedCourses, setRequestedCourses] = useState(new Set());

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 850);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 850);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize the API base URL with useMemo since it doesn't depend on any props or state
  const apiBaseUrl = React.useMemo(() => {
    return window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
  }, []);

  // Fetch tutor availability
  const fetchTutorAvailability = React.useCallback(async () => {
    if (!user?.isTutor) return;

    try {
      setIsLoadingAvailability(true);

      // Fetch actual recurring availability slots from the dedicated endpoint
      console.log('Fetching recurring availability slots from backend...');
      const response = await fetch(
        `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch availability slots:', response.status);
        setTutorAvailability([]);
        return;
      }

      const availabilitySlots = await response.json();
      console.log('Recurring availability slots from backend:', availabilitySlots);

      // Convert backend format to frontend format
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const availabilityData = availabilitySlots.map(slot => ({
        day_of_week: dayNames[slot.weekday],
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_id: slot.slot_id,
        valid_from: slot.valid_from,
        valid_until: slot.valid_until
      }));

      console.log('Final parsed availability:', availabilityData);
      setTutorAvailability(Array.isArray(availabilityData) && availabilityData.length > 0 ? availabilityData : []);
    } catch (error) {
      console.error('Error fetching tutor availability:', error);
      setTutorAvailability([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [user?.isTutor, user?.id, apiBaseUrl]);

  // Fetch tutor's courses
  const fetchTutorCourses = React.useCallback(async () => {
    if (!user?.isTutor) return;

    try {
      setIsLoadingCourses(true);
      const response = await fetch(`${apiBaseUrl}/search/tutors/${user.id}`);

      if (!response.ok) {
        console.warn('Failed to fetch tutor courses:', response.status);
        setTutorCourses([]);
        return;
      }

      const tutorData = await response.json();
      setTutorCourses(tutorData.courses || []);
    } catch (error) {
      console.error('Error fetching tutor courses:', error);
      setTutorCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [user?.isTutor, user?.id, apiBaseUrl]);

  // Course Management Handlers
  const handleCourseSearch = async (query) => {
    if (!query) {
      setCourseSearchResults([]);
      return;
    }
    setIsSearchingCourses(true);
    try {
      const response = await fetch(`${apiBaseUrl}/search/courses?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setCourseSearchResults(data.items || []);
    } catch (error) {
      console.error("Error searching courses:", error);
    } finally {
      setIsSearchingCourses(false);
    }
  };

  const requestAddCourse = async (courseId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/search/tutors/${user.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId })
      });
      if (response.ok) {
        // Success! Update state to show checkmark
        setRequestedCourses(prev => {
          const newSet = new Set(prev);
          newSet.add(courseId);
          return newSet;
        });
        // Note: We keep the modal open as requested
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error requesting course:", error);
      alert("Error requesting course");
    }
  };

  const removeCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to remove this course?")) return;
    try {
      const response = await fetch(`${apiBaseUrl}/search/tutors/${user.id}/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTutorCourses(tutorCourses.filter(c => c.course_id !== courseId && c.id !== courseId));
        alert("Course removed successfully");
        setIsRemoveCourseModalOpen(false);
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to remove course");
      }
    } catch (error) {
      console.error("Error removing course:", error);
      alert("Error removing course");
    }
  };

  // Fetch tutor bookings
  const fetchTutorBookings = React.useCallback(async () => {
    if (!user?.isTutor) return;

    try {
      // Get current timezone offset in minutes
      const timezoneOffset = new Date().getTimezoneOffset();

      // Fetch bookings where user is tutor and student
      const [
        confirmedResponse,
        pendingResponse,
        studentConfirmedResponse,
        studentPendingResponse
      ] = await Promise.all([
        fetch(`${apiBaseUrl}/schedule/bookings?tutor_id=${user.id}&status=confirmed`),
        fetch(`${apiBaseUrl}/schedule/bookings?tutor_id=${user.id}&status=pending`),
        // Fetch confirmed bookings where user is student
        fetch(`${apiBaseUrl}/schedule/bookings?student_id=${user.id}&status=confirmed&timezone_offset=${timezoneOffset}`),
        // Also fetch pending bookings where user is student
        fetch(`${apiBaseUrl}/schedule/bookings?student_id=${user.id}&status=pending&timezone_offset=${timezoneOffset}`)
      ]);

      if (!confirmedResponse.ok || !pendingResponse.ok || !studentConfirmedResponse.ok || !studentPendingResponse.ok) {
        throw new Error(`HTTP error! status: ${confirmedResponse.status} or ${pendingResponse.status} or ${studentConfirmedResponse.status} or ${studentPendingResponse.status}`);
      }

      const confirmedData = await confirmedResponse.json();
      const pendingData = await pendingResponse.json();
      const studentConfirmedData = await studentConfirmedResponse.json();
      const studentPendingData = await studentPendingResponse.json();

      // Combine all student bookings (both confirmed and pending)
      const studentBookingsData = [
        ...(Array.isArray(studentConfirmedData) ? studentConfirmedData : []),
        ...(Array.isArray(studentPendingData) ? studentPendingData : [])
      ];

      // Mark student bookings with isStudentBooking flag
      const studentBookings = Array.isArray(studentBookingsData)
        ? studentBookingsData.map(booking => {
          // Use parseTimeToLocal to properly convert UTC times to local time
          // This ensures the times are correctly displayed and placed in the calendar
          return {
            ...booking,
            isStudentBooking: true,
            // Keep the original time strings - parseTimeToLocal will handle them correctly
            // when they're used in formatHourRange and getBookingForSlot
          };
        })
        : [];

      // Combine all bookings
      const allBookings = [
        ...(Array.isArray(confirmedData) ? confirmedData : []),
        ...(Array.isArray(pendingData) ? pendingData : []),
        ...studentBookings
      ];

      console.log('Fetched tutor and student bookings:', allBookings);
      setTutorBookings(allBookings);

      // Update pending requests count
      const pendingCount = Array.isArray(pendingData) ? pendingData.length : 0;
      setPendingRequestsCount(pendingCount);
    } catch (error) {
      console.error('Error fetching tutor bookings:', error);
      setTutorBookings([]);
      setPendingRequestsCount(0);
    }
  }, [user?.isTutor, user?.id, apiBaseUrl]);

  // Fetch student bookings
  const fetchStudentBookings = React.useCallback(async () => {
    if (!user?.id || user?.isTutor) return;

    try {
      setIsLoadingStudentBookings(true);
      setBookingError(null);

      // Fetch both confirmed and pending bookings
      const [confirmedResponse, pendingResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/schedule/bookings?student_id=${user.id}&status=confirmed`),
        fetch(`${apiBaseUrl}/schedule/bookings?student_id=${user.id}&status=pending`)
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
  }, [user?.id, user?.isTutor, apiBaseUrl]);

  // Memoized fetch functions for the main effect
  const fetchData = React.useCallback(() => {
    if (!user) return;

    if (user.isTutor) {
      fetchTutorAvailability();
      fetchTutorBookings();
      fetchTutorCourses(); // Fetch tutor's courses when the component mounts
    } else {
      fetchStudentBookings();
    }
  }, [user, fetchTutorAvailability, fetchTutorBookings, fetchStudentBookings]);

  // Effect to fetch data when component mounts or when user changes
  useEffect(() => {
    const fetchDataAndHighlight = async () => {
      await fetchData();

      // Check for any booking to highlight when component mounts
      const params = new URLSearchParams(window.location.search);
      const highlightId = params.get('highlight');
      if (highlightId) {
        setGlowBookingId(highlightId);
      }
    };

    fetchDataAndHighlight();
  }, [fetchData]);


  // Check if a specific hour on a specific day is available
  const isTimeSlotAvailable = (date, hour) => {
    if (!tutorAvailability || tutorAvailability.length === 0) {
      return false;
    }

    // Get day name in lowercase (e.g., "monday")
    const dayOfWeek = format(date, 'EEEE').toLowerCase();

    // Convert date to YYYY-MM-DD string for comparison (avoid timezone issues)
    const checkDateStr = format(date, 'yyyy-MM-dd');

    // Find ALL availability slots for this day (not just the first one)
    const dayAvailabilitySlots = tutorAvailability.filter(
      avail => {
        const availDay = (avail.day_of_week || avail.day || '').toLowerCase();
        if (availDay !== dayOfWeek) return false;

        // Check date validity using string comparison (avoids timezone issues)
        const validFrom = avail.valid_from; // Already a string "YYYY-MM-DD"
        const validUntil = avail.valid_until; // Already a string "YYYY-MM-DD"

        // String comparison works correctly: "2025-12-01" <= "2025-12-01" <= "2025-12-01"
        const isValidFrom = !validFrom || checkDateStr >= validFrom;
        const isValidUntil = !validUntil || checkDateStr <= validUntil;

        return isValidFrom && isValidUntil;
      }
    );

    if (!dayAvailabilitySlots || dayAvailabilitySlots.length === 0) {
      return false;
    }

    // Parse start and end times (format: "HH:MM:SS" or "HH:MM")
    const parseTimeToHour = (timeStr) => {
      if (!timeStr) return null;
      const [hours] = timeStr.split(':');
      return parseInt(hours, 10);
    };

    // Check if the hour falls within ANY of the availability slots for this day
    for (const slot of dayAvailabilitySlots) {
      const startTimeStr = slot.start_time || slot.startTime;
      const endTimeStr = slot.end_time || slot.endTime;

      if (!startTimeStr || !endTimeStr) {
        continue;
      }

      const availStart = parseTimeToHour(startTimeStr);
      const availEnd = parseTimeToHour(endTimeStr);

      // Check if hour is within this availability window
      if (hour >= availStart && hour < availEnd) {
        return true;
      }
    }

    // Hour doesn't fall within any availability slot
    return false;
  };

  // State for student bookings
  const [studentBookings, setStudentBookings] = useState([]);
  const [isLoadingStudentBookings, setIsLoadingStudentBookings] = useState(false);
  const [bookingError, setBookingError] = useState(null);


  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchText = searchQuery.trim();
    // Only update localStorage when there's an actual search query
    if (searchText) {
      localStorage.setItem('searchQuery', searchText);
      localStorage.setItem('searchCategory', searchCategory);
    } else {
      // Clear the search from localStorage if the search is empty
      localStorage.removeItem('searchQuery');
      localStorage.removeItem('searchCategory');
    }

    const apiBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : '';

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
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : 'transparent',
      width: "100%",
      overflowX: "hidden",
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #35006D 0%, #5a1e96 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '30px', /* More pill-like and premium */
      padding: '12px 28px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 15px rgba(53, 0, 109, 0.3)',
      letterSpacing: '0.5px',
    },
    heading: {
      color: darkMode ? "#fff" : "#333",
      textAlign: "center",
      padding: "0px",
      borderBottom: "clamp(2px, 0.5vw, 4px) solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: "clamp(8px, 2vw, 12px) auto clamp(4px, 1vw, 10px)",
      fontSize: "clamp(1.5rem, 4vw, 2.8rem)",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
    },
    content: {
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "clamp(8px, 2vw, 20px) clamp(5px, 1.5vw, 10px)",
      flex: 1,
      boxSizing: "border-box",
      marginBottom: "clamp(40px, 8vw, 80px)",
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: "clamp(12px, 2.5vw, 20px)"
    },
    calendarHeader: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: "clamp(6px, 1.5vw, 12px)",
      gap: "clamp(4px, 1vw, 8px)"
    },
    weekDisplay: {
      fontSize: "clamp(0.7rem, 1.5vw, 1.2rem)",
      fontWeight: '600',
      color: darkMode ? "#fff" : "#2c3e50",
      textAlign: 'center'
    },
    calendarGrid: {
      width: '100%',
      position: 'relative',
      overflow: 'visible',
      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
      border: darkMode ? '1px solid #2d2d2d' : '1px solid #dee2e6',
      borderRadius: '8px',
      boxSizing: 'border-box',
      minHeight: '200px',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
      overflowX: 'visible',
      '--calendar-cell-bg': darkMode ? '#2d2d2d' : '#fff',
      '--calendar-cell-border': darkMode ? '#3d3d3d' : '#e9ecef',
      '--calendar-cell-text': darkMode ? '#e0e0e0' : '#2c3e50',
      '--calendar-cell-hover': darkMode ? '#333333' : '#f8f9fa',
      '--calendar-time-bg': darkMode ? '#2d2d2d' : '#fff',
      '--calendar-time-text': darkMode ? '#bbb' : '#666',
      '--calendar-time-border': darkMode ? '#3d3d3d' : '#e0e0e0',
      '--calendar-striped-bg': darkMode ? '#252525' : '#fafbfc',
      '--calendar-today-bg': darkMode ? 'rgba(255, 220, 100, 0.08)' : 'rgba(53, 0, 109, 0.04)',
      '--calendar-today-text': darkMode ? '#ffdc64' : '#35006D',
    },
    // Student calendar styles
    dayHeader: {
      background: 'linear-gradient(to bottom, #35006D, #2d0054)',
      color: '#fff',
      padding: "clamp(2px, 0.8vw, 8px) clamp(1px, 0.5vw, 4px)",
      textAlign: 'center',
      fontWeight: '600',
      fontSize: "clamp(0.5rem, 1.2vw, 0.9rem)",
      borderBottom: '1px solid #2d0054',
      borderRight: '1px solid #2d0054',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0px',
      minHeight: "clamp(28px, 5vw, 50px)",
    },
    dayCell: {
      backgroundColor: 'var(--calendar-cell-bg, white)',
      minHeight: "clamp(80px, 12vw, 120px)",
      height: 'auto',
      padding: "clamp(4px, 1vw, 8px)",
      position: 'relative',
      overflow: 'visible',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--calendar-cell-border)',
      borderBottom: '1px solid var(--calendar-cell-border)',
      transition: 'background-color 0.2s ease',
    },
    dateNumber: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: 'var(--calendar-cell-text, #2c3e50)',
      textAlign: 'center',
      width: '100%',
      '&.today': {
        color: 'var(--calendar-today-text, #2c3e50)',
        fontWeight: 'bold',
      },
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
      gridTemplateColumns: isMobile
        ? 'clamp(25px, 4vw, 30px) repeat(7, calc((100% - clamp(25px, 4vw, 30px)) / 3))'
        : 'clamp(50px, 6vw, 60px) repeat(7, 1fr)',
      backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
      border: darkMode ? '1px solid #3d3d3d' : '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: isAnimating ? 'hidden' : 'visible',
      overflowX: isMobile ? 'auto' : (isAnimating ? 'hidden' : 'visible'),
      '--tutor-cell-bg': darkMode ? '#1e1e1e' : '#fff',
      '--tutor-cell-border': darkMode ? '#333' : '#f0f0f0',
      '--tutor-time-bg': darkMode ? '#2d2d2d' : '#fff',
      '--tutor-time-text': darkMode ? '#bbb' : '#666',
      '--tutor-time-border': darkMode ? '#3d3d3d' : '#e0e0e0',
      '--tutor-striped-bg': darkMode ? '#252525' : '#f8f9fa',
    },
    timeLabel: {
      backgroundColor: 'var(--tutor-time-bg, #fff)',
      padding: "clamp(0px, 0.5vw, 4px) clamp(1px, 0.5vw, 4px) clamp(4px, 2vw, 20px)",
      textAlign: 'center',
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
      zIndex: 5,
      position: 'sticky',
      left: 0,
      fontSize: "clamp(0.5rem, 1vw, 0.75rem)",
      fontWeight: '500',
      color: 'var(--tutor-time-text, #666)',
      borderRight: '1px solid var(--tutor-time-border, #e0e0e0)',
      borderBottom: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tutorDayHeader: {
      background: 'linear-gradient(to bottom, #35006D, #2d0054)',
      color: '#fff',
      padding: "clamp(3px, 1.2vw, 12px) clamp(1px, 1vw, 8px)",
      textAlign: 'center',
      fontWeight: '500',
      fontSize: "clamp(0.5rem, 1.2vw, 0.9rem)",
      borderRight: darkMode ? '1px solid #3d3d3d' : '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'top',
    },
    tutorTimeSlot: (rowIndex) => ({
      minHeight: "clamp(30px, 4vw, 40px)",
      padding: "clamp(2px, 0.5vw, 4px)",
      position: 'relative',
      backgroundColor: rowIndex % 2 === 0
        ? 'var(--tutor-cell-bg, white)'
        : 'var(--tutor-striped-bg, #f8f9fa)',
      borderRight: '1px solid var(--tutor-cell-border, #f0f0f0)',
      borderBottom: '1px solid var(--tutor-cell-border, #f0f0f0)',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      '&:hover': {
        backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
      },
    }),
    availableSlot: {
      backgroundColor: 'rgba(255, 220, 100, 0.25)',
    },
    bookedSlot: {
      backgroundColor: 'rgba(200, 200, 200, 0.2)',
    },
    searchContainer: {
      background: darkMode
        ? "linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(25, 25, 25, 0.6))"
        : "#fff",
      borderRadius: "clamp(16px, 3vw, 24px)",
      padding: "clamp(16px, 3vw, 32px)",
      boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
      border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
      boxSizing: 'border-box',
      width: '100%',
      margin: "0 0 clamp(20px, 3vw, 32px) 0",
      position: 'relative',
    },
    searchInputContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      alignItems: 'center',
      gap: "clamp(6px, 1vw, 8px)",
      marginTop: "clamp(6px, 1.2vw, 10px)"
    },
    searchInput: {
      flex: 1,
      padding: "clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)",
      border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid #ced4da',
      borderRadius: '6px',
      fontSize: "clamp(14px, 1.8vw, 16px)",
      color: darkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
      backgroundColor: darkMode ? "rgb(80, 80, 80)" : "#ffffff",
      height: isMobile ? '42px' : 'auto',
      boxSizing: 'border-box'
    },
    categoryDropdown: {
      position: 'relative',
      display: 'inline-block',
      minWidth: isMobile ? '35%' : '120px',
      width: isMobile ? '35%' : '120px'
    },
    categoryButton: {
      padding: "clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)",
      backgroundColor: darkMode ? "rgb(80, 80, 80)" : '#f8f9fa',
      color: darkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
      border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid #ced4da',
      borderRadius: '6px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'space-between',
      fontSize: isMobile ? '0.8rem' : "clamp(14px, 1.8vw, 16px)",
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: isMobile ? '0 4px' : "clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)",
      height: isMobile ? '42px' : 'auto',
      boxSizing: 'border-box'
    },
    categoryList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      width: '100%',
      padding: '8px 8px',
      margin: '4px 0 0',
      backgroundColor: darkMode ? "rgb(80, 80, 80)" : 'white',
      border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid rgba(0,0,0,.15)',
      borderRadius: '6px',
      boxShadow: '0 6px 12px rgba(0,0,0,.175)',
      listStyle: 'none',
    },
    calendarContainer: {
      background: darkMode
        ? "linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(25, 25, 25, 0.6))"
        : "#fff",
      borderRadius: "clamp(16px, 3vw, 24px)",
      padding: "clamp(16px, 3vw, 32px)",
      boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
      border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
      boxSizing: 'border-box',
      width: '100%',
      margin: "0 0 clamp(20px, 3vw, 32px) 0",
      position: 'relative',
    },
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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
          backgroundColor: isToday
            ? 'var(--calendar-today-bg)'
            : (i % 2 === 0 ? 'var(--calendar-cell-bg)' : 'var(--calendar-striped-bg)'),
          minHeight: isMobile ? '100px' : '150px',
          borderRight: i < 6 ? '1px solid var(--calendar-cell-border)' : 'none',
          borderBottom: '1px solid var(--calendar-cell-border)',
          padding: isMobile ? '6px 4px' : '12px 8px',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
          onMouseEnter={(e) => {
            if (!isToday) {
              e.currentTarget.style.backgroundColor = 'var(--calendar-cell-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isToday) {
              e.currentTarget.style.backgroundColor = i % 2 === 0
                ? 'var(--calendar-cell-bg)'
                : 'var(--calendar-striped-bg)';
            }
          }}>

          {isLoadingStudentBookings ? (
            <div style={{ ...styles.noSessions, fontSize: isMobile ? '0.65rem' : '0.9rem' }}>Loading...</div>
          ) : bookingError ? (
            <div style={{ ...styles.noSessions, fontSize: isMobile ? '0.65rem' : '0.9rem', color: '#e74a3b' }}>Error loading bookings</div>
          ) : dayBookings.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '4px' : '10px',
              padding: isMobile ? '2px 0' : '4px 0'
            }}>
              {dayBookings.map((booking, index) => (
                <div
                  key={`${booking.booking_id || index}`}
                  style={{
                    backgroundColor: `${booking.color}44`,
                    color: darkMode ? '#fff' : '#333',
                    borderRadius: isMobile ? '4px' : '6px',
                    padding: isMobile ? '4px 6px' : '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderLeft: `${isMobile ? '2px' : '3px'} solid ${booking.color}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '2px' : '6px',
                    ':hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                    }
                  }}
                  onClick={() => handleStudentBookingClick(booking)}
                  className={glowBookingId === booking.booking_id ? 'glow-animation' : ''}
                >
                  {booking.status === 'pending' && (
                    <div style={{
                      alignSelf: 'flex-start',
                      marginBottom: isMobile ? '2px' : '4px'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.55rem' : '0.7rem',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: isMobile ? '1px 4px' : '2px 6px',
                        borderRadius: isMobile ? '3px' : '4px',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        Pending
                      </span>
                    </div>
                  )}
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.8rem',
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#6c757d',
                    fontWeight: isMobile ? '600' : '400'
                  }}>
                    {booking.formattedTime}
                  </div>
                  <div style={{
                    fontWeight: '500',
                    fontSize: isMobile ? '0.7rem' : '1rem',
                    color: darkMode ? '#fff' : '#212529',
                    lineHeight: isMobile ? '1.2' : '1.4'
                  }}>
                    {booking.tutor_name || 'Tutoring Session'}
                  </div>
                  {booking.course_name && (
                    <div style={{
                      fontSize: isMobile ? '0.6rem' : '0.8rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#495057',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: isMobile ? '2px' : '4px'
                    }}>
                      <i className="fas fa-book" style={{
                        marginRight: isMobile ? '4px' : '6px',
                        color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6c757d',
                        width: isMobile ? '10px' : '14px',
                        fontSize: isMobile ? '0.6rem' : '0.8rem',
                        textAlign: 'center'
                      }}></i>
                      {booking.course_name}
                    </div>
                  )}
                  {booking.location && (
                    <div style={{
                      fontSize: isMobile ? '0.6rem' : '0.8rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: isMobile ? '2px' : '4px'
                    }}>
                      <i className="fas fa-map-marker-alt" style={{
                        marginRight: isMobile ? '4px' : '6px',
                        color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6c757d',
                        width: isMobile ? '10px' : '14px',
                        fontSize: isMobile ? '0.6rem' : '0.8rem',
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
              height: isMobile ? '60px' : '100px',
              color: '#6c757d',
              fontSize: isMobile ? '0.65rem' : '0.9rem',
              textAlign: 'center',
              padding: isMobile ? '10px 5px' : '20px 10px',
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

    // Get existing availability for this day - find ALL slots for this weekday
    // that are valid on this specific date
    const dayName = format(date, 'EEEE').toLowerCase();
    const checkDateStr = format(date, 'yyyy-MM-dd'); // Use string comparison

    const daySlots = tutorAvailability.filter(
      avail => {
        const availDay = (avail.day_of_week || avail.day || '').toLowerCase();
        if (availDay !== dayName) return false;

        // Check date validity using string comparison (avoids timezone issues)
        const validFrom = avail.valid_from; // Already a string "YYYY-MM-DD"
        const validUntil = avail.valid_until; // Already a string "YYYY-MM-DD"

        // String comparison works correctly
        const isValidFrom = !validFrom || checkDateStr >= validFrom;
        const isValidUntil = !validUntil || checkDateStr <= validUntil;

        return isValidFrom && isValidUntil;
      }
    );

    if (daySlots && daySlots.length > 0) {
      // Create edit slots from all existing slots for this day
      const slots = daySlots.map((slot, index) => {
        // Parse time (format: "HH:MM:SS" -> "HH:MM")
        const startTime = (slot.start_time || slot.startTime || '09:00').substring(0, 5);
        const endTime = (slot.end_time || slot.endTime || '17:00').substring(0, 5);
        return { id: Date.now() + index, startTime, endTime };
      });
      setEditSlots(slots);
    } else {
      // Default empty slot if no availability
      setEditSlots([{ id: Date.now(), startTime: '09:00', endTime: '17:00' }]);
    }

    // Reset animation flag after animation completes
    setTimeout(() => {
      setIsEditPanelAnimating(false);
      // Scroll to the edit panel after it's rendered
      const editPanel = document.querySelector('[data-edit-panel]');
      if (editPanel) {
        editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
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
    cells.push(<div key="empty-header" style={{ ...styles.timeLabel, background: 'linear-gradient(to bottom, #35006D, #2d0054)' }}></div>);

    // Add day headers
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(currentWeekStart, i);
      const isToday = isSameDay(currentDate, today);
      const isFutureDate = currentDate > today;

      cells.push(
        <div key={`header-${i}`} style={styles.tutorDayHeader}>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.9rem', lineHeight: isMobile ? '1.1' : '1.3', fontWeight: '600', letterSpacing: '0.5px' }}>{weekDays[i]}</div>
          <div style={{ fontSize: isMobile ? '0.55rem' : '0.85rem', marginTop: isMobile ? '1px' : '4px', lineHeight: isMobile ? '1.1' : '1.3' }}>
            {format(currentDate, 'MMM d')}
          </div>
          {isToday && (
            <div style={{
              fontSize: isMobile ? '0.5rem' : '0.7rem',
              marginTop: isMobile ? '2px' : '8px',
              backgroundColor: 'rgba(255, 220, 100, 0.9)',
              color: '#333',
              padding: isMobile ? '1px 3px 0px' : '2px 6px',
              borderRadius: isMobile ? '6px' : '10px',
              fontWeight: '600',
              lineHeight: isMobile ? '1.2' : '1.4'
            }}>
              {isMobile ? 'Today' : 'Today'}
            </div>
          )}
          {isFutureDate && (
            <button
              onClick={(e) => handleEditAvailability(currentDate, e)}
              style={{
                marginTop: isMobile ? '5px' : '12px',
                padding: isMobile ? '2px 4px' : '4px 12px',
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '0.5rem' : '0.7rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 220, 100, 0.95)',
                border: '1px solid rgba(255, 220, 100, 0.95)',
                borderRadius: isMobile ? '0px' : '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '500',
                lineHeight: isMobile ? '1.2' : '1.4'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <i className="fas fa-edit" style={{ marginRight: isMobile ? '2px' : '4px', fontSize: isMobile ? '0.5rem' : '0.7rem' }}></i>
              Edit
            </button>
          )}
        </div>
      );
    }

    // Time slots
    hours.forEach((hour, rowIndex) => {
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

        // Time marker logic
        const now = new Date();
        const isToday = isSameDay(currentDate, now);
        const currentHour = now.getHours();
        const showTimeMarker = isToday && (hour === currentHour);
        const currentMinute = now.getMinutes();
        const markerTop = (currentMinute / 60) * 100;

        // Debug logging for all slots when bookings exist
        if (tutorBookings && tutorBookings.length > 0) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const matchingBookings = tutorBookings.filter(b => {
            if (!b.start_time) return false;
            const bookingDate = format(new Date(b.start_time), 'yyyy-MM-dd');
            return bookingDate === dateStr;
          });

          if (matchingBookings.length > 0) {

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
              ...styles.tutorTimeSlot(rowIndex), // Pass the row index for alternating row colors
              ...(isAvailable ? styles.availableSlot : {}),
              position: 'relative',
              overflow: 'visible',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
              willChange: 'transform, background-color, border-color'
            }}
          >
            {showTimeMarker && (
              <div
                style={{
                  position: 'absolute',
                  top: `${markerTop}%`,
                  left: 0,
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#EA4335',
                  zIndex: 15,
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '-4px',
                  top: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#EA4335',
                }} />
              </div>
            )}
            {booking ? (
              <button
                id={`booking-btn-${booking.booking_id}`}
                type="button"
                className={`calendar-booking-btn${glowBookingId === booking.booking_id ? ' glow-animation' : ''}`}
                onClick={() => booking.isStudentBooking ? handleStudentBookingClick(booking) : handleBookingClick(booking.booking_id)}
                style={{
                  position: 'absolute',
                  top: '1px', left: '1px', right: '1px', bottom: '1px',
                  backgroundColor: booking.isStudentBooking
                    ? 'rgba(255, 255, 255, 0.82)'
                    : booking.status === 'confirmed'
                      ? 'rgba(53, 0, 109, 0.55)'
                      : 'rgba(255, 193, 7, 0.55)',
                  color: booking.isStudentBooking ? '#333' : '#fff',
                  borderRadius: '0px',
                  padding: isMobile ? '2px 1px' : '6px 3px',
                  fontSize: isMobile ? '0.4rem' : '0.5rem',
                  fontWeight: '500',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  border: `1px solid ${booking.isStudentBooking ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255,255,255,0.3)'}`,
                  borderLeft: (booking.isStudentBooking && booking.status === 'confirmed')
                    ? `${isMobile ? '3px' : '6px'} solid rgb(95, 0, 196)`
                    : booking.status === 'confirmed'
                      ? `${isMobile ? '3px' : '6px'} solid rgba(53, 0, 109, 0.95)`
                      : `${isMobile ? '3px' : '6px'} solid rgba(255, 193, 7, 0.95)`,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s, background 0.3s, transform 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.5rem' : '0.7rem',
                  marginBottom: isMobile ? '1px' : '4px',
                  color: booking.isStudentBooking ? '#333' : '#fff',
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  padding: '0 2px'
                }}>
                  {booking.isStudentBooking
                    ? (booking.tutor_name || booking.tutor_first_name || 'Tutor')
                    : (booking.student_name || booking.student_first_name || 'Student')}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.45rem' : '0.55rem',
                  opacity: booking.isStudentBooking ? 0.8 : 0.95,
                  margin: 0,
                  color: booking.isStudentBooking ? '#555' : '#fff',
                  lineHeight: '1.2',
                  padding: '0 2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
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
  const [editingDate, setEditingDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });

  // Function to save availability for a specific date
  // Replace the saveAvailability function in HomePage.js with this corrected version

  // Replace the saveAvailability function in HomePage.js with this corrected version

  const saveAvailability = async (date, isRecurring = false) => {
    if (!user?.isTutor || !editingDate) return;

    setIsSaving(true);
    setSaveStatus({ success: false, message: '' });

    try {
      const apiBaseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : '';

      const weekday = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Calculate day boundaries (not week boundaries!)
      const dayBefore = format(addDays(date, -1), 'yyyy-MM-dd');
      const dayAfter = format(addDays(date, 1), 'yyyy-MM-dd');

      console.log('========================================');
      console.log('SAVE AVAILABILITY STARTED');
      console.log('Date:', formattedDate, 'Weekday:', weekday);
      console.log('Day Before:', dayBefore);
      console.log('Day After:', dayAfter);
      console.log('IsRecurring:', isRecurring);
      console.log('Edit Slots:', editSlots);
      console.log('========================================');

      // STEP 1: Fetch all existing slots for this tutor
      console.log('STEP 1: Fetching all existing slots...');
      const allSlotsResponse = await fetch(
        `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!allSlotsResponse.ok) {
        const errorText = await allSlotsResponse.text();
        console.error('Failed to fetch slots:', allSlotsResponse.status, errorText);
        throw new Error(`Failed to fetch existing slots: ${allSlotsResponse.status}`);
      }

      const allSlots = await allSlotsResponse.json();
      console.log('All existing slots received:', JSON.stringify(allSlots, null, 2));

      // Ensure allSlots is an array
      const slotsArray = Array.isArray(allSlots) ? allSlots : [];

      // STEP 2: Filter slots that match this weekday
      console.log('STEP 2: Filtering slots for weekday:', weekday);

      const slotsToDelete = [];
      const slotsToModify = [];

      for (const slot of slotsArray) {
        const slotWeekday = slot.weekday;

        console.log('Checking slot:', {
          slot_id: slot.slot_id,
          weekday: slotWeekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
          valid_from: slot.valid_from,
          valid_until: slot.valid_until
        });

        // First check: does the weekday match?
        if (slotWeekday !== weekday) {
          console.log('Weekday mismatch - Skip');
          continue;
        }

        const slotValidFrom = slot.valid_from ? new Date(slot.valid_from) : null;
        const slotValidUntil = slot.valid_until ? new Date(slot.valid_until) : null;
        const targetDate = new Date(formattedDate);

        // If recurring mode (apply to all future occurrences):
        // Delete slots that are still active on or after the target date
        if (isRecurring) {
          // Keep slots that ended before the target date (don't delete past slots)
          if (slotValidUntil && slotValidUntil < targetDate) {
            console.log('Past slot (ended before target) - Skip');
            continue;
          }
          // Delete all other slots for this weekday (active now or in the future)
          console.log('Recurring mode - slot active on/after target date - MATCH (will delete)');
          slotsToDelete.push(slot);
          continue;
        }

        // For single day mode:
        // Check if this slot covers the target date
        const isValidFrom = !slotValidFrom || slotValidFrom <= targetDate;
        const isValidUntil = !slotValidUntil || slotValidUntil >= targetDate;
        const coversTargetDate = isValidFrom && isValidUntil;

        if (!coversTargetDate) {
          console.log('Slot does not cover target date - Skip');
          continue;
        }

        console.log('Slot covers target date - need to split by day');

        // This slot needs to be split by DAY:
        // 1. If slot starts before target date, keep the "before" part (up to day before target)
        // 2. Delete the slot (it will be replaced)
        // 3. If slot continues after target date, create an "after" part (from day after target)

        // Convert Date objects to strings for proper comparison
        const slotValidFromStr = slotValidFrom ? format(new Date(slotValidFrom), 'yyyy-MM-dd') : null;
        const slotValidUntilStr = slotValidUntil ? format(new Date(slotValidUntil), 'yyyy-MM-dd') : null;

        const startsBeforeTargetDay = !slotValidFromStr || slotValidFromStr < formattedDate;
        const continuesAfterTargetDay = !slotValidUntilStr || slotValidUntilStr > formattedDate;

        console.log('Date comparison details:', {
          slotValidFrom: slotValidFrom,
          slotValidFromStr: slotValidFromStr,
          slotValidUntil: slotValidUntil,
          slotValidUntilStr: slotValidUntilStr,
          formattedDate: formattedDate,
          startsBeforeTargetDay: startsBeforeTargetDay,
          continuesAfterTargetDay: continuesAfterTargetDay,
          comparison1_less: slotValidFromStr < formattedDate,
          comparison2_greater: slotValidUntilStr > formattedDate
        });

        if (startsBeforeTargetDay || continuesAfterTargetDay) {
          // We need to split this recurring slot
          slotsToModify.push({
            original: slot,
            startsBeforeTargetDay,
            continuesAfterTargetDay
          });
        }

        // Always delete the original slot when applying to single day
        slotsToDelete.push(slot);
      }

      console.log(`Found ${slotsToDelete.length} slots to delete:`,
        slotsToDelete.map(s => ({ id: s.slot_id, weekday: s.weekday, time: `${s.start_time}-${s.end_time}` }))
      );

      // STEP 3: Delete all matching slots FIRST (before creating split slots)
      if (slotsToDelete.length > 0) {
        console.log('STEP 3: Deleting slots...');

        for (const slot of slotsToDelete) {
          const slotId = slot.slot_id;
          console.log(`Deleting slot ID: ${slotId}`);

          try {
            const deleteResponse = await fetch(
              `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots/${slotId}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!deleteResponse.ok) {
              const errorData = await deleteResponse.json().catch(() => ({}));
              const errorMsg = errorData.detail || deleteResponse.statusText;
              console.error(`Failed to delete slot ${slotId}:`, errorMsg);
              throw new Error(`Failed to delete slot ${slotId}: ${errorMsg}`);
            }

            const deleteResult = await deleteResponse.json();
            console.log(`Successfully deleted slot ${slotId}:`, deleteResult);
          } catch (error) {
            console.error(`Error deleting slot ${slotId}:`, error);
            throw error;
          }
        }

        console.log(`Successfully deleted all ${slotsToDelete.length} slots`);
      } else {
        console.log('No slots to delete');
      }

      // STEP 4: Handle slot modifications for single-day mode (AFTER deletion)
      if (!isRecurring && slotsToModify.length > 0) {
        console.log('STEP 4: Creating split slots for recurring availability (split by day)...');
        console.log('Modifications to process:', slotsToModify.length);

        for (const modification of slotsToModify) {
          const { original, startsBeforeTargetDay, continuesAfterTargetDay } = modification;

          console.log('Processing modification:', {
            slot_id: original.slot_id,
            startsBeforeTargetDay,
            continuesAfterTargetDay
          });

          // Create "before" part if needed (ends at the day before target)
          if (startsBeforeTargetDay) {
            console.log('Creating BEFORE slot...');
            const beforeSlot = {
              weekday: original.weekday,
              start_time: original.start_time,
              end_time: original.end_time,
              location_mode: original.location_mode || 'online',
              location_note: `Recurring slot (before ${formattedDate})`,
              valid_from: original.valid_from,
              valid_until: dayBefore // End at the day before target
            };

            console.log('Creating before slot:', JSON.stringify(beforeSlot, null, 2));

            const beforeResponse = await fetch(
              `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(beforeSlot)
              }
            );

            if (!beforeResponse.ok) {
              const errorData = await beforeResponse.json().catch(() => ({}));
              console.error('Failed to create before slot:', errorData);
            } else {
              console.log('Successfully created before slot');
            }
          }

          // Create "after" part if needed (starts at the day after target)
          if (continuesAfterTargetDay) {
            const afterSlot = {
              weekday: original.weekday,
              start_time: original.start_time,
              end_time: original.end_time,
              location_mode: original.location_mode || 'online',
              location_note: `Recurring slot (after ${formattedDate})`,
              valid_from: dayAfter, // Start at the day after target
              valid_until: original.valid_until
            };

            console.log('Creating after slot:', JSON.stringify(afterSlot, null, 2));

            const afterResponse = await fetch(
              `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(afterSlot)
              }
            );

            if (!afterResponse.ok) {
              const errorData = await afterResponse.json().catch(() => ({}));
              console.error('Failed to create after slot:', errorData);
            } else {
              console.log('Successfully created after slot');
            }
          }
        }
      }

      // STEP 5: If editSlots is empty, we're done (just deleted everything)
      if (!editSlots || editSlots.length === 0) {
        console.log('STEP 5: No new slots to create - availability cleared');
        setSaveStatus({
          success: true,
          message: isRecurring
            ? `Cleared availability for all future ${format(editingDate, 'EEEE')}s`
            : 'Cleared availability for this day'
        });
        await fetchTutorAvailability();
        console.log('========================================');
        console.log('SAVE AVAILABILITY COMPLETED (CLEARED)');
        console.log('========================================');
        return;
      }

      // STEP 6: Create new slots
      console.log('STEP 6: Creating new slots...');

      for (const slot of editSlots) {
        if (!slot.startTime || !slot.endTime) {
          throw new Error('Please set both start and end times');
        }

        // Format times in HH:MM:SS
        const startTime = slot.startTime.includes(':')
          ? (slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime)
          : `${slot.startTime}:00:00`;
        const endTime = slot.endTime.includes(':')
          ? (slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime)
          : `${slot.endTime}:00:00`;

        // Prepare request body
        const requestBody = {
          weekday: weekday,
          start_time: startTime,
          end_time: endTime,
          location_mode: 'online',
          location_note: isRecurring
            ? `Recurring weekly slot starting ${formattedDate}`
            : `One-time availability for ${formattedDate}`,
          valid_from: formattedDate,
          valid_until: isRecurring ? null : formattedDate,
          ...(isRecurring && { duration: 'forever' })
        };

        console.log('Creating slot with data:', JSON.stringify(requestBody, null, 2));

        try {
          const createResponse = await fetch(
            `${apiBaseUrl}/schedule/tutors/${user.id}/availability-slots`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(requestBody)
            }
          );

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            const errorMsg = errorData.detail || createResponse.statusText;
            console.error('Failed to create slot:', errorMsg);
            throw new Error(errorMsg);
          }

          const createResult = await createResponse.json();
          console.log('Successfully created slot:', createResult);
        } catch (error) {
          console.error('Error creating slot:', error);
          throw error;
        }
      }

      console.log('Successfully created all slots');

      // STEP 7: Success!
      setSaveStatus({
        success: true,
        message: isRecurring
          ? `Availability updated for all future ${format(editingDate, 'EEEE')}s!`
          : 'Availability updated for this day!'
      });

      // Refresh availability data
      console.log('Refreshing availability data...');
      await fetchTutorAvailability();

      console.log('========================================');
      console.log('SAVE AVAILABILITY COMPLETED (SUCCESS)');
      console.log('========================================');

    } catch (error) {
      console.error('========================================');
      console.error('SAVE AVAILABILITY ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('========================================');

      setSaveStatus({
        success: false,
        message: error.message || 'Error saving availability. Please try again.'
      });
    } finally {
      setIsSaving(false);

      // Clear status message after 5 seconds with fade out
      const timer = setTimeout(() => {
        const statusElement = document.querySelector('[data-status-message]');
        if (statusElement) {
          statusElement.style.opacity = '0';
          statusElement.style.transform = 'translate(-50%, -20px)';
          statusElement.style.pointerEvents = 'none';

          // Remove from DOM after animation completes
          setTimeout(() => {
            setSaveStatus({ success: false, message: '' });
          }, 300);
        } else {
          setSaveStatus({ success: false, message: '' });
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  };

  // Handle apply to this day
  const handleApplyToThisDay = () => {
    if (!editingDate) return;
    saveAvailability(editingDate, false);
  };

  // Handle apply to all future days of week
  const handleApplyToAllFutureDays = () => {
    if (!editingDate) return;
    saveAvailability(editingDate, true);
  };
  const [editSlots, setEditSlots] = useState([]);
  const [isEditPanelAnimating, setIsEditPanelAnimating] = useState(false);
  const [editButtonPosition, setEditButtonPosition] = useState({ x: 0, y: 0 });
  const [glowBookingId, setGlowBookingId] = useState(null);

  // Helper function to format hour range for display
  const formatHourRange = (startTime, endTime, currentHour) => {
    if (!startTime || !endTime) return '';

    // Parse times to local using the same function as booking placement
    const start = parseTimeToLocal(startTime);
    const end = parseTimeToLocal(endTime);

    if (!start || !end) return '';

    // Get local hours and minutes
    const startHours = start.getHours();
    const startMinutes = start.getMinutes().toString().padStart(2, '0');
    const endHours = end.getHours();
    const endMinutes = end.getMinutes().toString().padStart(2, '0');

    // Determine if we should show minutes (if it's the current hour or if minutes are not :00)
    const shouldShowMinutes = start.getHours() === currentHour || start.getMinutes() !== 0 || end.getMinutes() !== 0;

    if (shouldShowMinutes) {
      return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
    }

    // Otherwise just show the hour range
    return `${startHours}:00 - ${endHours}:00`;
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
    @keyframes slideInFromRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutToRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes slideDown {
      from { 
        transform: translate(-50%, -20px);
        opacity: 0;
      }
      to { 
        transform: translate(-50%, 0);
        opacity: 1;
      }
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
      minHeight: '400px',
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    },
    'slide-in-left': {
      animation: 'slideInLeft 0.3s ease-out forwards',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: darkMode ? '#2d3748' : '#fff',
      zIndex: 2,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    },
    'slide-out-left': {
      animation: 'slideOutLeft 0.3s ease-out forwards',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: darkMode ? '#2d3748' : '#fff',
      zIndex: 1,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    },
    'slide-in-right': {
      animation: 'slideInRight 0.3s ease-out forwards',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: darkMode ? '#2d3748' : '#fff',
      zIndex: 2,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    },
    'slide-out-right': {
      animation: 'slideOutRight 0.3s ease-out forwards',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: darkMode ? '#2d3748' : '#fff',
      zIndex: 1,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>{isAuthenticated ? 'Dashboard' : 'Welcome to Gator Tutor'}</h1>

      <div style={styles.content}>
        <div style={{
          display: isMobile ? 'flex' : (isAuthenticated ? 'grid' : 'flex'),
          flexDirection: isMobile ? 'column' : 'row',
          gridTemplateColumns: isMobile ? 'none' : (isSidebarCollapsed ? '80px 1fr' : '280px 1fr'),
          width: '100%',
          gap: '20px',
          padding: isMobile ? '0 6px' : '0 20px',
          boxSizing: 'border-box',
          maxWidth: '1400px',
          margin: '0 auto',
          transition: 'all 0.3s ease'
        }}>
          {/* Left Column - User Profile */}
          {isAuthenticated ? (
            <>
              <div style={{
                backgroundColor: darkMode ? "rgba(40, 40, 40, 0.4)" : '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: isMobile ? '12px' : (isSidebarCollapsed ? '24px 10px' : '24px'),
                height: 'fit-content',
                border: darkMode ? '1px solid rgb(0, 0, 0)' : '1px solid #f0f0f0',
                width: isMobile ? '100%' : (isSidebarCollapsed ? '80px' : '280px'),
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                minHeight: isMobile ? 'auto' : '300px',
                position: 'relative'
              }}>
                {/* Collapse/Expand Button - Hidden on mobile */}
                {!isMobile && (
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
                        backgroundColor: 'rgba(231, 230, 230, 0.29)',
                        border: 'none',
                        cursor: 'pointer',
                        color: darkMode ? 'rgba(0, 0, 0, 0.91)' : '#6c757d',
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
                        e.currentTarget.style.backgroundColor = 'rgba(231, 230, 230, 0.5)';
                        e.currentTarget.style.color = '#35006D';
                        if (isSidebarCollapsed) {
                          e.currentTarget.style.boxShadow = '-2px 0 12px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(231, 230, 230, 0.29)';
                        e.currentTarget.style.color = 'rgba(0, 0, 0, 0.91)';
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
                )}
                {/* Profile Header */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '12px' : '0',
                  paddingBottom: isMobile ? '20px' : '20px',
                  marginBottom: '20px',
                  borderBottom: user ? '1px solid rgb(100, 100, 100)' : 'none',
                  opacity: isSidebarCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  position: 'relative'
                }}>
                  {/* Mobile Buttons - Appointment Requests and Messages */}
                  {user && isMobile && (
                    <div style={{
                      position: 'absolute',
                      right: '6px',
                      top: '2px',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      alignItems: 'flex-end',
                      width: 'auto'
                    }}>
                      {/* Appointment Requests Button */}
                      {user?.isTutor && (
                        <div style={{ position: 'relative', width: '100%' }}>
                          <button
                            onClick={() => navigate('/appointment-requests')}
                            style={{
                              position: 'relative',
                              padding: '4px 10px',
                              minWidth: 'clamp(60px, 12vw, 80px)',
                              background: 'rgba(255, 255, 255, 0.15)',
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                              border: '1px solid rgba(180, 180, 190, 0.4)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s',
                              zIndex: 1,
                              minHeight: '28px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                            }}
                          >
                            <i className="fas fa-calendar-check" style={{ fontSize: '0.85rem' }}></i>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              height: '100%',
                              lineHeight: '1.1',
                              textAlign: 'left',
                              fontSize: '0.6rem',
                              fontWeight: '200',
                              margin: '0 4px 0 0',
                              padding: 0,
                              minWidth: 'clamp(60px, 12vw, 80px)',
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: '500' }}>Requests</span>
                            </div>
                          </button>
                          {pendingRequestsCount > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              borderRadius: '50%',
                              minWidth: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              border: '2px solid ' + (darkMode ? 'rgb(60, 60, 60)' : '#fff'),
                              zIndex: 2
                            }}>
                              {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Messages Button */}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <button
                          onClick={() => navigate('/messages')}
                          style={{
                            position: 'relative',
                            padding: '4px 10px',
                            minWidth: 'clamp(60px, 12vw, 80px)',
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                            border: '1px solid rgba(180, 180, 190, 0.4)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                            zIndex: 1,
                            minHeight: '28px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                          }}
                        >
                          <i className="fas fa-envelope" style={{ fontSize: '0.85rem' }}></i>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '100%',
                            lineHeight: '1.1',
                            textAlign: 'left',
                            fontSize: '0.6rem',
                            fontWeight: '200',
                            margin: '0 4px 0 0',
                            padding: 0,
                            minWidth: 'clamp(60px, 12vw, 80px)',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '500' }}>Messages</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{
                    width: isMobile ? '60px' : '90px',
                    height: isMobile ? '60px' : '90px',
                    borderRadius: '50%',
                    backgroundColor: user ? '#f0f7ff' : '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: isMobile ? '0' : '16px',
                    overflow: 'hidden',
                    border: `2px solid ${user ? '#d0e3ff' : '#e9ecef'}`,
                    flexShrink: 0
                  }}>
                    {user?.firstName && user?.lastName ? (
                      <div style={{
                        fontSize: isMobile ? '20px' : '36px',
                        fontWeight: '600',
                        color: '#9A2250',
                        textTransform: 'uppercase'
                      }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                    ) : (
                      <i className="fas fa-user" style={{
                        fontSize: isMobile ? '20px' : '36px',
                        color: '#9A2250',
                        opacity: 0.7
                      }}></i>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'column',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flex: 1,
                    minWidth: 0,
                    gap: isMobile ? '4px' : '0',
                    paddingRight: isMobile ? '110px' : '0'
                  }}>
                    <h3 style={{
                      margin: isMobile ? '0' : '8px 0 6px',
                      color: darkMode ? "rgb(255, 255, 255)" : user ? '#2c3e50' : '#6c757d',
                      fontSize: isMobile ? '1.3rem' : '1.2rem',
                      fontWeight: user ? '600' : '500',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2'
                    }}>
                      {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Welcome User' : 'Welcome to Gator Tutor'}
                    </h3>

                    {user && (
                      <div style={{
                        backgroundColor: user?.isTutor ? '#e6f7e6' : '#e6f0ff',
                        color: user?.isTutor ? '#1e7b1e' : '#1967d2',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: '600',
                        marginTop: isMobile ? '0' : '4px',
                        letterSpacing: '0.3px',
                        alignSelf: isMobile ? 'flex-start' : 'center',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.4'
                      }}>
                        {user?.isTutor ? 'Tutor' : 'Student'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons Section - Desktop */}
                {user && !isMobile && (
                  <div style={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                    width: '100%',
                    marginBottom: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0')
                  }}>
                    {/* Appointment Requests Button */}
                    {user?.isTutor && (
                      <div style={{ marginBottom: '12px' }}>
                        <button
                          onClick={() => navigate('/appointment-requests')}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                            border: '1px solid rgba(180, 180, 190, 0.4)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '10px',
                            transition: 'all 0.2s',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            position: 'relative',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                          }}
                        >
                          <i className="fas fa-calendar-check" style={{ fontSize: '1rem' }}></i>
                          Appointment Requests
                          {pendingRequestsCount > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              borderRadius: '50%',
                              minWidth: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              border: '2px solid ' + (darkMode ? 'rgb(60, 60, 60)' : '#fff'),
                              padding: '0 6px'
                            }}>
                              {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Messages Button */}
                    <div>
                      <button
                        onClick={() => navigate('/messages')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                          border: '1px solid rgba(180, 180, 190, 0.4)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.2s',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          position: 'relative',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                      >
                        <i className="fas fa-envelope" style={{ fontSize: '1rem' }}></i>
                        Messages
                      </button>
                    </div>
                  </div>
                )}

                {/* Courses I Tutor Section - Only for tutors */}
                {user?.isTutor && (
                  <div style={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                    width: '100%',
                    marginBottom: '20px',
                    paddingBottom: '20px',
                  }}>
                    <h4 style={{
                      color: darkMode ? "#fff" : '#495057',
                      fontSize: '0.95rem',
                      margin: '0 0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      letterSpacing: '0.3px'
                    }}>
                      <i className="fas fa-book" style={{
                        color: darkMode ? 'rgb(255, 220, 100)' : '#9A2250',
                        width: '20px',
                        textAlign: 'center'
                      }}></i>
                      Courses I Tutor
                    </h4>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '8px',
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      {isLoadingCourses ? (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          padding: '10px 0'
                        }}>
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : tutorCourses.length > 0 ? (
                        tutorCourses.map((course, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'white',
                            borderRadius: '6px',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e9ecef',
                            transition: 'all 0.2s',
                            ':hover': {
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }
                          }}>
                            <div style={{
                              backgroundColor: darkMode
                                ? 'rgba(255, 220, 100, 0.1)'
                                : '#fff3cd',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              marginRight: '12px',
                              flexShrink: 0,
                              color: darkMode
                                ? 'rgba(255, 220, 100, 0.9)'
                                : '#856404',
                              fontWeight: '600',
                              fontSize: '0.7rem',
                              border: darkMode
                                ? '1px solid rgba(255, 220, 100, 0.2)'
                                : '1px solid #ffeeba'
                            }}>
                              {course.department_code}
                            </div>
                            <div style={{
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                color: darkMode ? '#fff' : '#2c3e50',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {course.department_code} {course.course_number}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#6c757d',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {course.title}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{
                          fontSize: '0.8rem',
                          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6c757d',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '8px 0'
                        }}>
                          No courses added yet
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '16px' }}>
                      <button
                        onClick={() => setIsRemoveCourseModalOpen(true)}
                        style={{
                          flex: 1,
                          padding: '8px 6px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                          border: '1px solid rgba(180, 180, 190, 0.4)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          fontWeight: '600',
                          fontSize: '0.7rem',
                          position: 'relative',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          width: isMobile ? '100%' : 'auto'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button
                        onClick={() => {
                          setCourseSearchQuery('');
                          setCourseSearchResults([]);
                          setIsAddCourseModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 6px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: darkMode ? 'white' : 'rgba(14, 14, 14, 0.9)',
                          border: '1px solid rgba(180, 180, 190, 0.4)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          fontWeight: '600',
                          fontSize: '0.7rem',
                          position: 'relative',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Right Column - Search and Calendar */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Search Section - Show before calendar for students */}
            {!user?.isTutor && (
              <div style={{
                ...styles.searchContainer,
                width: '100%',
                margin: 0
              }}>
                <h3 style={{ margin: "0 0 5px 0", color: darkMode ? '#fff' : '#2c3e50' }}>Find Tutors & Courses</h3>
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
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto',
                      marginTop: isMobile ? '6px' : '0'
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
            )}

            {/* Welcome Section for Non-Logged-In Users */}
            {!isAuthenticated && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                borderRadius: '8px',
                background: darkMode
                  ? 'linear-gradient(145deg, rgba(40, 40, 40, 0.8), rgba(25, 25, 25, 0.9))'
                  : 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e0e0e0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  color: darkMode ? '#fff' : '#2c3e50',
                  fontSize: '1.4rem',
                  fontWeight: '600'
                }}>
                  Welcome to Gator Tutor! 🎓
                </h3>

                <p style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#495057',
                  marginBottom: '20px',
                  lineHeight: '1.6'
                }}>
                  Connect with expert tutors, schedule one-on-one sessions, and get the help you need to succeed in your courses. Our platform makes it easy to find the perfect tutor for your learning style and schedule.
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#35006D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      flex: isMobile ? '1' : 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.backgroundColor = '#4b1a80';
                      e.currentTarget.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.backgroundColor = '#35006D';
                      e.currentTarget.boxShadow = 'none';
                    }}
                  >
                    Log In
                  </button>

                  <button
                    onClick={() => navigate('/register')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: darkMode ? '#fff' : '#35006D',
                      border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : '#35006D'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      flex: isMobile ? '1' : 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(53, 0, 109, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.backgroundColor = 'transparent';
                    }}
                  >
                    Create Account
                  </button>
                </div>

                <div style={{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '8px',
                  padding: '15px',
                  borderLeft: `4px solid ${darkMode ? 'rgba(255, 220, 112, 0.8)' : '#35006D'}`
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    color: darkMode ? 'rgba(255, 220, 112, 0.9)' : '#2c3e50',
                    fontSize: '1.1rem'
                  }}>
                    Get the most out of Gator Tutor:
                  </h4>
                  <ul style={{
                    margin: '0',
                    paddingLeft: '20px',
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#495057'
                  }}>
                    <li>📅 Schedule one-on-one tutoring sessions</li>
                    <li>💬 Message tutors directly</li>
                    <li>📚 Request course coverage for specific topics</li>
                    <li>👨‍🏫 View and manage your tutoring sessions</li>
                    <li>👩‍🏫 Apply to be a tutor yourself!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Edit Availability Section */}
            {user?.isTutor && editingDate && (
              <div
                data-edit-panel
                style={{
                  ...styles.searchContainer,
                  width: '100%',
                  margin: 0,
                  animation: isEditPanelAnimating ? 'editPanelPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  transformOrigin: 'center top',
                  padding: "clamp(16px, 3vw, 32px)",
                }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: "clamp(12px, 2vw, 16px)"
                }}>
                  <h3 style={{
                    margin: 0,
                    color: darkMode ? '#fff' : '#2c3e50',
                    fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                    lineHeight: 1.2
                  }}>
                    Edit Availability <br style={{ display: isMobile ? 'block' : 'none' }} />
                    <span style={{ fontSize: "clamp(0.9rem, 2vw, 1.2rem)", fontWeight: 'normal', color: darkMode ? '#ccc' : '#666' }}>
                      {isMobile ? format(editingDate, 'MMM d, yyyy') : `- ${format(editingDate, 'EEEE, MMMM d, yyyy')}`}
                    </span>
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
                      fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                      padding: "clamp(4px, 1vw, 8px)",
                      transition: 'color 0.2s',
                      marginLeft: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#6c757d'}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div style={{ marginBottom: "clamp(12px, 2vw, 16px)" }}>
                  {editSlots.map((slot, index) => (
                    <div key={slot.id} style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: isMobile ? 'flex-end' : 'center',
                      gap: "clamp(8px, 1.5vw, 12px)",
                      marginBottom: "clamp(8px, 1.5vw, 12px)",
                      padding: "clamp(10px, 1.5vw, 12px)",
                      backgroundColor: 'rgba(255, 220, 100, 0.3)',
                      borderRadius: '8px',
                      border: darkMode ? '1px solid #444' : '1px solid #e9ecef',
                      animation: isEditPanelAnimating ? `editPanelPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + index * 0.1}s backwards` : 'none'
                    }}>
                      <div style={{ display: 'flex', gap: "clamp(8px, 1.5vw, 12px)", flex: 1 }}>
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center',
                          gap: isMobile ? '4px' : '8px'
                        }}>
                          <label style={{
                            fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
                            fontWeight: '500',
                            color: darkMode ? 'rgb(173, 180, 187)' : '#495057',
                            minWidth: '40px',
                            marginBottom: isMobile ? '2px' : '0'
                          }}>
                            From{isMobile ? '' : ':'}
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotTimeChange(slot.id, 'startTime', e.target.value)}
                            style={{
                              padding: "clamp(4px, 1vw, 8px)",
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              fontSize: "clamp(0.85rem, 1.5vw, 0.9rem)",
                              width: '100%',
                              minHeight: "clamp(32px, 5vw, 36px)",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center',
                          gap: isMobile ? '4px' : '8px'
                        }}>
                          <label style={{
                            fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
                            fontWeight: '500',
                            color: darkMode ? 'rgb(173, 180, 187)' : '#495057',
                            minWidth: isMobile ? 'auto' : '30px',
                            marginBottom: isMobile ? '2px' : '0'
                          }}>
                            To{isMobile ? '' : ':'}
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotTimeChange(slot.id, 'endTime', e.target.value)}
                            style={{
                              padding: "clamp(4px, 1vw, 8px)",
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              fontSize: "clamp(0.85rem, 1.5vw, 0.9rem)",
                              width: '100%',
                              minHeight: "clamp(32px, 5vw, 36px)",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: isMobile ? '0' : "clamp(8px, 1.5vw, 8px) clamp(12px, 2vw, 12px)",
                          cursor: 'pointer',
                          fontSize: "clamp(0.85rem, 1.5vw, 0.85rem)",
                          transition: 'background-color 0.2s',
                          minWidth: isMobile ? '36px' : '80px',
                          height: isMobile ? '36px' : 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: isMobile ? '0' : '0'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        aria-label="Delete slot"
                      >
                        <i className="fas fa-trash" style={{ marginRight: isMobile ? '0' : '4px' }}></i>
                        {!isMobile && 'Delete'}
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleAddSlot}
                    style={{
                      width: '100%',
                      padding: "clamp(10px, 2vw, 12px)",
                      backgroundColor: 'transparent',
                      border: darkMode ? '2px dashed rgb(114, 117, 120)' : '2px dashed rgb(206, 212, 218)',
                      borderRadius: '8px',
                      color: '#6c757d',
                      cursor: 'pointer',
                      fontSize: "clamp(0.9rem, 1.5vw, 0.9rem)",
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: "clamp(8px, 1.5vw, 12px)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(196, 180, 7)';
                      e.currentTarget.style.color = '#35006D';
                      e.currentTarget.style.backgroundColor = darkMode ? 'rgb(114, 117, 120)' : 'rgb(206, 212, 218)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? 'rgb(114, 117, 120)' : 'rgb(206, 212, 218)';
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
                  flexDirection: 'column',
                  gap: "clamp(12px, 2vw, 16px)",
                  paddingTop: "clamp(16px, 2vw, 16px)",
                  borderTop: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: "clamp(10px, 1.5vw, 12px)",
                    width: '100%'
                  }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <button
                        onClick={handleApplyToThisDay}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: "clamp(10px, 2vw, 12px)",
                          backgroundColor: isSaving ? '#6c757d' : '#35006D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          fontSize: "clamp(0.9rem, 1.5vw, 0.9rem)",
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          opacity: isSaving ? 0.7 : 1,
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          height: "clamp(42px, 6vw, 44px)",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#4b1a80')}
                        onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#35006D')}
                      >
                        {isSaving ? 'Saving...' : 'Apply to This Day'}
                      </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                      <button
                        onClick={handleApplyToAllFutureDays}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: "clamp(10px, 2vw, 12px) clamp(35px, 3vw, 40px) clamp(10px, 2vw, 12px) clamp(10px, 2vw, 12px)",
                          backgroundColor: isSaving ? 'rgb(173, 181, 189)' : 'rgb(53, 0, 109)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          fontSize: "clamp(0.9rem, 1.5vw, 0.9rem)",
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          opacity: isSaving ? 0.7 : 1,
                          textAlign: 'center',
                          position: 'relative',
                          boxSizing: 'border-box',
                          height: "clamp(42px, 6vw, 44px)",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'rgb(75, 26, 128)')}
                        onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'rgb(53, 0, 109)')}
                      >
                        {isSaving ? 'Saving...' : `Apply to All Future ${format(editingDate, 'EEEE')}s`}
                        <div
                          style={{
                            position: 'absolute',
                            right: "clamp(8px, 1.5vw, 12px)",
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            width: "clamp(18px, 2.5vw, 20px)",
                            height: "clamp(18px, 2.5vw, 20px)",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: "clamp(10px, 1.5vw, 12px)",
                            fontWeight: 'bold',
                            cursor: 'help',
                            pointerEvents: 'auto'
                          }}
                          title={`Change all the future ${format(editingDate, 'EEEE')}s availability to current selection. \n\nIf these days have other recurring or one time slots they will be DELETED and replaced by current selection.`}
                        >
                          ?
                        </div>
                      </button>
                    </div>
                  </div>

                  {saveStatus.message && (
                    <div style={{
                      position: 'fixed',
                      top: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: "clamp(10px, 2vw, 12px) clamp(20px, 3vw, 24px)",
                      backgroundColor: saveStatus.success ? 'rgba(212, 237, 218, 0.95)' : 'rgba(248, 215, 218, 0.95)',
                      color: saveStatus.success ? '#155724' : '#721c24',
                      borderRadius: '8px',
                      fontSize: "clamp(0.85rem, 1.5vw, 0.95rem)",
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      transition: 'all 0.3s ease-in-out',
                      opacity: 1,
                      maxWidth: '90%',
                      textAlign: 'center',
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${saveStatus.success ? '#c3e6cb' : '#f5c6cb'}`,
                      animation: 'slideDown 0.3s ease-out'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <i className={`fas ${saveStatus.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {saveStatus.message}
                      </div>
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
                  overflow: 'visible',
                  minHeight: '400px',
                  height: 'auto'
                }}>
                  <div style={styles.calendarHeader}>
                    <button
                      onClick={prevWeek}
                      style={{
                        backgroundColor: '#35006D',
                        color: 'white',
                        border: 'none',
                        borderRadius: "clamp(4px, 0.8vw, 6px)",
                        padding: "clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)",
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: "clamp(4px, 1vw, 8px)",
                        fontWeight: '500',
                        fontSize: "clamp(0.7rem, 1.2vw, 1rem)",
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
                        borderRadius: "clamp(4px, 0.8vw, 6px)",
                        padding: "clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)",
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: "clamp(4px, 1vw, 8px)",
                        fontWeight: '500',
                        fontSize: "clamp(0.7rem, 1.2vw, 1rem)",
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
                      Next Week <i className="fas fa-chevron-right" style={{ marginLeft: "clamp(4px, 1vw, 8px)" }}></i>
                    </button>
                  </div>

                  <style>{keyframes}</style>

                  {/* Student Calendar */}
                  {!user?.isTutor && (
                    <div style={{
                      position: 'relative',
                      minHeight: '400px',
                      overflow: isAnimating ? 'hidden' : (isMobile ? 'auto' : 'visible')
                    }}>
                      <div style={{
                        ...styles.calendarGrid,
                        ...calendarAnimation[slideDirection],
                        height: 'auto',
                        minHeight: '400px',
                        overflow: isAnimating ? 'hidden' : 'visible',
                        overflowX: isMobile ? 'auto' : (isAnimating ? 'hidden' : 'visible')
                      }}>
                        <div style={{
                          position: 'relative',
                          display: 'grid',
                          gridTemplateColumns: isMobile ? 'repeat(7, calc(100% / 3))' : 'repeat(7, 1fr)',
                          gap: '1px',
                          backgroundColor: darkMode ? '#2d3748' : '#e9ecef',
                          border: 'none',
                          borderRadius: '8px',
                          overflow: 'visible',
                        }}>
                          {weekDays.map((day, i) => {
                            const currentDate = addDays(currentWeekStart, i);
                            const isToday = isSameDay(currentDate, today);
                            return (
                              <div key={day} style={{
                                ...styles.dayHeader,
                                backgroundColor: isToday
                                  ? (darkMode ? '#4b1a80' : '#4b1a80')
                                  : (darkMode ? '#35006D' : 'rgb(53, 0, 109)'),
                                borderRight: i < 6 ? (darkMode ? '1px solid #4b1a80' : '1px solid #2d0054') : 'none'
                              }}>
                                <div style={{
                                  fontSize: isMobile ? '0.5rem' : '0.75rem',
                                  fontWeight: '500',
                                  letterSpacing: isMobile ? '0.2px' : '0.5px',
                                  textTransform: 'uppercase',
                                  lineHeight: isMobile ? '1.1' : '1.3'
                                }}>
                                  {day}
                                </div>
                                <div style={{
                                  fontSize: isMobile ? '0.7rem' : '1.1rem',
                                  fontWeight: '600',
                                  lineHeight: isMobile ? '1.1' : '1.3'
                                }}>
                                  {format(currentDate, 'd')}
                                </div>
                                {isToday && (
                                  <div style={{
                                    fontSize: isMobile ? '0.5rem' : '0.6rem',
                                    marginTop: isMobile ? '2px' : '4px',
                                    backgroundColor: 'rgba(255, 220, 100, 0.9)',
                                    color: '#333',
                                    padding: isMobile ? '1px 3px' : '1px 5px',
                                    borderRadius: isMobile ? '6px' : '8px',
                                    fontWeight: '700',
                                    lineHeight: isMobile ? '1.2' : '1.3',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}>
                                    Today
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {renderStudentDays()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tutor Calendar */}
                  {user?.isTutor && (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: '500px'
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
                          <div>Loading your calendar...</div>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            position: 'sticky',
                            top: '0',
                            zIndex: 1,
                            marginBottom: isMobile ? '6px' : '10px',
                            padding: isMobile ? '4px 6px' : '8px 12px',
                            backgroundColor: darkMode ? 'rgba(110, 110, 110, 0.32)' : 'rgba(237, 237, 237, 0.9)',
                            borderRadius: isMobile ? '4px' : '6px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            fontSize: isMobile ? '0.6rem' : '0.85rem',
                            color: darkMode ? '#b2b2b2ff' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: isMobile ? '6px' : '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '16px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px' }}>
                                <div style={{
                                  width: isMobile ? '10px' : '16px',
                                  height: isMobile ? '10px' : '16px',
                                  backgroundColor: darkMode ? 'rgba(255, 219, 100, 0.6)' : 'rgba(255, 220, 100, 0.4)',
                                  borderRadius: '0px',
                                }}></div>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.85rem' }}>Available</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px' }}>
                                <div style={{
                                  minWidth: isMobile ? '16px' : '26px',
                                  height: isMobile ? '12px' : '20px',
                                  backgroundColor: 'rgba(255, 193, 7, 0.27)',
                                  borderRadius: isMobile ? '2px' : '4px',
                                  borderLeft: `${isMobile ? '3px' : '5px'} solid rgba(255, 193, 7, 0.95)`,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}></div>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.85rem' }}>Pending</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px' }}>
                                <div style={{
                                  minWidth: isMobile ? '16px' : '26px',
                                  height: isMobile ? '12px' : '20px',
                                  backgroundColor: 'rgba(53, 0, 109, 0.51)',
                                  borderRadius: isMobile ? '2px' : '4px',
                                  borderLeft: `${isMobile ? '3px' : '5px'} solid rgba(53, 0, 109, 0.95)`,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}></div>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.85rem' }}>Confirmed</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '16px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px' }}>
                                <div style={{
                                  minWidth: isMobile ? '16px' : '26px',
                                  height: isMobile ? '12px' : '20px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  borderRadius: isMobile ? '2px' : '4px',
                                  borderLeft: `${isMobile ? '3px' : '5px'} solid rgba(255, 193, 7, 1)`,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}></div>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.85rem' }}>Sent</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px' }}>
                                <div style={{
                                  minWidth: isMobile ? '16px' : '26px',
                                  height: isMobile ? '12px' : '20px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  borderRadius: isMobile ? '2px' : '4px',
                                  borderLeft: `${isMobile ? '3px' : '5px'} solid rgba(95, 0, 196, 1)`,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}></div>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.85rem' }}>Your session</span>
                              </div>
                            </div>
                          </div>
                          <div style={{
                            position: 'relative',
                            minHeight: '500px',
                            overflow: isAnimating ? 'hidden' : 'visible'
                          }}>
                            <div style={{
                              ...styles.tutorCalendarGrid,
                              ...calendarAnimation[slideDirection],
                              willChange: 'transform, opacity',
                              backfaceVisibility: 'hidden',
                              transformStyle: 'preserve-3d'
                            }}>
                              {renderTutorCalendar()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Search Section - Show after calendar for tutors */}
            {user?.isTutor && (
              <div style={{
                ...styles.searchContainer,
                width: '100%',
                margin: 0
              }}>
                <h3 style={{ margin: "0 0 5px 0", color: darkMode ? '#fff' : '#2c3e50' }}>Find Tutors & Courses</h3>
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
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto',
                      marginTop: isMobile ? '6px' : '0'
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
            )}
          </div>
        </div>
      </div>
      {/* Add Course Modal */}
      {isAddCourseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : 'white',
            padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px',
            maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            color: darkMode ? 'white' : 'black'
          }}>
            <h3 style={{ marginTop: 0, color: darkMode ? 'white' : 'black' }}>Request to Add Course</h3>
            <input
              type="text"
              placeholder="Search course (e.g. CSC 300)..."
              value={courseSearchQuery}
              onChange={(e) => {
                setCourseSearchQuery(e.target.value);
                handleCourseSearch(e.target.value);
              }}
              style={{
                width: '100%', padding: '10px', marginBottom: '15px',
                borderRadius: '4px', border: '1px solid #ccc',
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#fff' : '#000'
              }}
            />

            <div style={{ marginBottom: '15px', maxHeight: '300px', overflowY: 'auto' }}>
              {isSearchingCourses && <p>Searching...</p>}
              {!isSearchingCourses && courseSearchQuery && courseSearchResults.length === 0 && <p>No courses found.</p>}
              {courseSearchResults.map(course => {
                const isRequested = requestedCourses.has(course.course_id);
                const isAlreadyHas = tutorCourses.some(c => (c.course_id || c.id) === course.course_id);

                return (
                  <div key={course.course_id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', borderBottom: '1px solid #eee'
                  }}>
                    <div>
                      <strong>{course.department_code} {course.course_number}</strong>
                      <div style={{ fontSize: '0.9em', opacity: 0.8 }}>{course.title}</div>
                    </div>
                    <button
                      onClick={() => !isRequested && !isAlreadyHas && requestAddCourse(course.course_id)}
                      disabled={isRequested || isAlreadyHas}
                      style={{
                        backgroundColor: (isRequested || isAlreadyHas) ? '#28a745' : '#35006D',
                        color: 'white', border: 'none',
                        padding: '5px 10px', borderRadius: '4px',
                        cursor: (isRequested || isAlreadyHas) ? 'default' : 'pointer',
                        opacity: isAlreadyHas ? 0.7 : 1,
                        minWidth: '60px'
                      }}
                    >
                      {isRequested ? <i className="fas fa-check"></i> : (isAlreadyHas ? "Added" : "Add")}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                style={{
                  padding: '8px 16px', backgroundColor: 'transparent',
                  border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer',
                  color: darkMode ? 'white' : 'black'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Course Modal */}
      {isRemoveCourseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : 'white',
            padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            color: darkMode ? 'white' : 'black'
          }}>
            <h3 style={{ marginTop: 0, color: darkMode ? 'white' : 'black' }}>Remove Course</h3>
            <p>Select a course to remove from your profile.</p>

            <div style={{ marginBottom: '15px', maxHeight: '400px', overflowY: 'auto' }}>
              {tutorCourses.length === 0 && <p>No courses to remove.</p>}
              {tutorCourses.map((course, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px', borderBottom: '1px solid #eee',
                  backgroundColor: darkMode ? '#333' : '#f9f9f9', marginBottom: '5px', borderRadius: '4px'
                }}>
                  <div>
                    <strong>{course.department_code} {course.course_number}</strong>
                  </div>
                  <button
                    onClick={() => removeCourse(course.course_id || course.id)}
                    style={{
                      backgroundColor: '#dc3545', color: 'white', border: 'none',
                      padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setIsRemoveCourseModalOpen(false)}
                style={{
                  padding: '8px 16px', backgroundColor: 'transparent',
                  border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer',
                  color: darkMode ? 'white' : 'black'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePage;