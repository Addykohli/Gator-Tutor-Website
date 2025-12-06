import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TutorProfile = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();

  // State for the tutor data
  const [tutor, setTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, darkMode } = useAuth();

  // State for the booking form
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionType, setSessionType] = useState('online');
  const [notes, setNotes] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [tutorBookings, setTutorBookings] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingUserBookings, setIsLoadingUserBookings] = useState(false);
  const [isLoadingTutorBookings, setIsLoadingTutorBookings] = useState(false);

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


  // Format time to 12-hour format with AM/PM
  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${ampm}`;
  };

  // Fetch tutor data when component mounts
  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${apiBaseUrl}/search/tutors/${tutorId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Tutor data:', data); // Log tutor data to check its structure
        console.log('Tutor courses:', data.courses); // Log courses to check if they have id/course_id
        if (data.courses && data.courses.length > 0) {
          console.log('First course structure:', data.courses[0]);
        }
        setTutor(data);

      } catch (err) {
        console.error('Error fetching tutor data:', err);
        setError('Failed to load tutor profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorData();
    } else {
      setError('No tutor ID provided');
      setIsLoading(false);
    }
  }, [tutorId]);

  // Fetch user's existing bookings to check for conflicts
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user || !user.id) return;

      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';

        // Fetch bookings where user is student AND where user is tutor
        const [studentResponse, tutorResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/schedule/bookings?student_id=${user.id}`),
          fetch(`${apiBaseUrl}/schedule/bookings?tutor_id=${user.id}`)
        ]);

        let allBookings = [];

        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (Array.isArray(studentData)) {
            allBookings = [...allBookings, ...studentData];
          }
        }

        if (tutorResponse.ok) {
          const tutorData = await tutorResponse.json();
          if (Array.isArray(tutorData)) {
            allBookings = [...allBookings, ...tutorData];
          }
        }

        // Filter for confirmed or pending bookings only
        const activeBookings = allBookings.filter(booking =>
          booking.status === 'confirmed' || booking.status === 'pending'
        );

        console.log('User active bookings for conflict check:', activeBookings);
        setUserBookings(activeBookings);

      } catch (err) {
        console.error('Error fetching user bookings:', err);
      }
    };

    fetchUserBookings();
  }, [user]);

  // Fetch tutor's existing bookings to check for conflicts (booked/pending slots)
  useEffect(() => {
    const fetchTutorBookings = async () => {
      if (!tutorId) return;

      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';

        // Fetch bookings where tutor is student AND where tutor is tutor
        const [studentResponse, tutorResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/schedule/bookings?student_id=${tutorId}`),
          fetch(`${apiBaseUrl}/schedule/bookings?tutor_id=${tutorId}`)
        ]);

        let allBookings = [];

        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (Array.isArray(studentData)) {
            allBookings = [...allBookings, ...studentData];
          }
        }

        if (tutorResponse.ok) {
          const tutorData = await tutorResponse.json();
          if (Array.isArray(tutorData)) {
            allBookings = [...allBookings, ...tutorData];
          }
        }

        // Filter for confirmed or pending bookings only
        const activeBookings = allBookings.filter(booking =>
          booking.status === 'confirmed' || booking.status === 'pending'
        );

        console.log('Tutor active bookings for conflict check:', activeBookings);
        setTutorBookings(activeBookings);

      } catch (err) {
        console.error('Error fetching tutor bookings:', err);
      }
    };

    fetchTutorBookings();
  }, [tutorId]);

  // Helper to format date to YYYY-MM-DD (local time)
  const formatDateLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch availability for a month
  const fetchMonthAvailability = async (date) => {
    if (!tutorId) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    // Start of month
    const startDate = new Date(year, month, 1);
    // End of month
    const endDate = new Date(year, month + 1, 0);

    const startStr = formatDateLocal(startDate);
    const endStr = formatDateLocal(endDate);

    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(
        `${apiBaseUrl}/schedule/tutors/${tutorId}/availability-range?start_date=${startStr}&end_date=${endStr}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableDates(prev => {
          // Merge new dates with existing ones
          const newDates = data.available_dates;
          const uniqueDates = [...new Set([...prev, ...newDates])];
          return uniqueDates;
        });
      }
    } catch (err) {
      console.error('Error fetching month availability:', err);
    }
  };

  // Initial fetch for current month
  useEffect(() => {
    if (tutorId) {
      fetchMonthAvailability(new Date());
    }
  }, [tutorId]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !tutorId) return;

      try {
        setIsLoadingSlots(true);
        setSelectedTime('');

        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(
          `${apiBaseUrl}/schedule/tutors/${tutorId}/availability?date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }

        const data = await response.json();

        // Format the time slots for display and check for conflicts
        const formattedSlots = data.slots.map(slot => {
          const slotStart = new Date(slot.start_time);
          const slotEnd = new Date(slot.end_time);

          let conflictType = null;
          let conflictLabel = '';

          // 1. Check for conflicts with user's existing bookings (Priority 1)
          const userConflict = userBookings.some(booking => {
            if (!booking.start_time || !booking.end_time) return false;
            const bookingStart = parseTimeToLocal(booking.start_time);
            const bookingEnd = parseTimeToLocal(booking.end_time);
            return (slotStart < bookingEnd) && (slotEnd > bookingStart);
          });

          if (userConflict) {
            conflictType = 'user_conflict';
            conflictLabel = '(Conflict)';
          }

          // 2. Check for conflicts with tutor's schedule (Priority 2)
          if (!conflictType) {
            const tutorConflictBooking = tutorBookings.find(booking => {
              if (!booking.start_time || !booking.end_time) return false;
              const bookingStart = parseTimeToLocal(booking.start_time);
              const bookingEnd = parseTimeToLocal(booking.end_time);
              return (slotStart < bookingEnd) && (slotEnd > bookingStart);
            });

            if (tutorConflictBooking) {
              if (tutorConflictBooking.status === 'confirmed') {
                conflictType = 'tutor_booked';
                conflictLabel = '(Booked)';
              } else if (tutorConflictBooking.status === 'pending') {
                conflictType = 'tutor_pending';
                conflictLabel = '(Someone else requested)';
              }
            }
          }

          return {
            id: `${slot.start_time}-${slot.end_time}`,
            start: slotStart,
            end: slotEnd,
            display: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
            disabled: !!conflictType,
            conflictLabel: conflictLabel
          };
        });

        setAvailableTimeSlots(formattedSlots);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, tutorId, userBookings, tutorBookings]);

  // Calculate max date (2 years from now)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tutor || !user) {
      setBookingError('Please log in to book a session');
      return;
    }

    // Reset messages
    setBookingError(null);
    setBookingSuccess(false);
    setIsBooking(true);

    try {
      // Parse the selected time slot
      console.log('Selected time string:', selectedTime);
      const [startTimeStr] = selectedTime.split(' - ');
      console.log('Start time string:', startTimeStr);

      // Handle both 12-hour and 24-hour formats
      let hours, minutes;
      if (startTimeStr.includes(' ')) {
        // 12-hour format (e.g., "2:30 PM")
        const [time, period] = startTimeStr.split(' ');
        [hours, minutes] = time.split(':').map(Number);

        // Convert to 24-hour format
        if (period && period.toLowerCase() === 'pm' && hours < 12) {
          hours += 12;
        } else if (period && period.toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format (e.g., "14:30")
        [hours, minutes] = startTimeStr.split(':').map(Number);
      }

      console.log('Parsed hours:', hours, 'minutes:', minutes);

      const [year, month, day] = selectedDate.split('-').map(Number);
      console.log('Parsed date:', { year, month: month - 1, day });

      // Create date objects in local time
      const startDateTime = new Date(year, month - 1, day, hours, minutes || 0);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60000); // Add 60 minutes (1 hour)

      console.log('Start date time:', startDateTime);
      console.log('End date time:', endDateTime);

      // Format dates in ISO 8601 format
      const formatDateTime = (date) => {
        return date.toISOString();
      };

      // Validate that a course is selected
      if (!selectedCourse || selectedCourse.trim() === '') {
        throw new Error('Please select a course');
      }

      // Find the selected course
      const selectedCourseObj = tutor.courses.find(c =>
        `${c.department_code} ${c.course_number}` === selectedCourse
      );

      if (!selectedCourseObj) {
        console.error('Available courses:', tutor.courses);
        console.error('Selected course string:', selectedCourse);
        throw new Error('Selected course not found in tutor courses');
      }

      // Get course_id - check multiple possible field names
      let courseId = selectedCourseObj.id || selectedCourseObj.course_id || selectedCourseObj.courseId;

      // If course_id is still not found, try to fetch it from the API
      if (!courseId) {
        console.warn('Course ID not found in course object, attempting to fetch from API...');
        console.log('Course object:', selectedCourseObj);
        console.log('Available courses:', tutor.courses);

        // Try to fetch course by department_code and course_number
        try {
          const apiBaseUrl = process.env.REACT_APP_API_URL || '';
          const courseResponse = await fetch(
            `${apiBaseUrl}/search/courses?department_code=${selectedCourseObj.department_code}&course_number=${selectedCourseObj.course_number}&limit=1`
          );

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            if (courseData.items && courseData.items.length > 0) {
              courseId = courseData.items[0].course_id || courseData.items[0].id;
              console.log('Fetched course ID from API:', courseId);
            }
          }
        } catch (fetchError) {
          console.error('Error fetching course ID:', fetchError);
        }
      }

      if (!courseId) {
        console.error('Course object structure:', selectedCourseObj);
        console.error('Available courses:', tutor.courses);
        setBookingError(`Course ID not found. Please refresh the page and try again. Course: ${selectedCourseObj.department_code} ${selectedCourseObj.course_number}`);
        setIsBooking(false);
        return;
      }

      // Validate courseId is a number
      const courseIdNum = parseInt(courseId, 10);
      if (isNaN(courseIdNum) || courseIdNum <= 0) {
        setBookingError(`Invalid course ID: ${courseId}. Please refresh the page and try again.`);
        setIsBooking(false);
        return;
      }

      // Prepare booking data according to API schema
      let meetingLink = 'In-person meeting';
      if (sessionType === 'online') {
        // Generate a unique Jitsi Meet URL using guifi.net (no auth required)
        // Format: https://meet.guifi.net/SFSU-Tutor-<TutorID>-<StudentID>-<Timestamp>
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        meetingLink = `https://meet.guifi.net/SFSU-Tutor-${tutor.id}-${user.id}-${uniqueId}`;
      }

      const bookingData = {
        tutor_id: tutor.id,
        student_id: user.id, // Use the ID from the authenticated user context
        start_time: formatDateTime(startDateTime),
        end_time: formatDateTime(endDateTime),
        course_id: courseIdNum, // Ensure it's a number
        meeting_link: meetingLink,
        notes: notes || ''
      };

      console.log('Selected course object:', selectedCourseObj);
      console.log('Course ID being sent:', courseIdNum);
      console.log('Full booking data:', JSON.stringify(bookingData, null, 2));

      console.log('User context:', user); // Debug log
      console.log('Using student_id:', user.id); // Debug log

      console.log('Sending booking data:', bookingData);

      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      console.log('Sending booking request to:', `${apiBaseUrl}/schedule/bookings`);
      console.log('Request payload:', bookingData);

      const response = await fetch(`${apiBaseUrl}/schedule/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        credentials: 'include'  // Include cookies for authentication
      });

      const responseData = await response.json().catch((error) => {
        console.error('Failed to parse response:', error);
        return { detail: 'Invalid response from server' };
      });

      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        console.error('Error response details:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          requestData: bookingData  // Log the request data that caused the error
        });

        // Check for validation errors
        if (response.status === 422 && responseData.detail) {
          if (Array.isArray(responseData.detail)) {
            // Handle Pydantic validation errors
            const errorMessages = responseData.detail.map(err =>
              `${err.loc.join('.')}: ${err.msg}`
            ).join('\n');
            throw new Error(`Validation error:\n${errorMessages}`);
          } else if (typeof responseData.detail === 'string') {
            // Handle simple error message
            throw new Error(responseData.detail);
          }
        }

        throw new Error(
          responseData.detail ||
          responseData.message ||
          `Failed to book appointment (${response.status} ${response.statusText})`
        );
      }

      console.log('Booking successful:', responseData);

      // Handle successful booking
      setBookingSuccess(true);

      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCourse('');
      setNotes('');
      setSessionType('online');
      setAvailableTimeSlots([]);

    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading tutor profile...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Show no tutor found state
  if (!tutor) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No tutor found with the provided ID.</p>
        <button onClick={() => navigate('/search')} className="btn btn-primary">
          Browse Tutors
        </button>
      </div>
    );
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      color: darkMode ? '#e0e0e0' : '#333',
      minHeight: '100vh',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    bookingContainer: {
      backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
      borderRadius: '15px',
      padding: '25px',
      marginTop: '30px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    bookingHeader: {
      fontSize: '24px',
      color: darkMode ? '#fff' : '#2c3e50',
      marginBottom: '25px',
      paddingBottom: '10px',
      borderBottom: '2px solid #eee',
    },
    bookingGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      marginTop: '20px',
    },
    timeSlotsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginTop: '15px',
    },
    timeSlot: {
      padding: '10px',
      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
      borderRadius: '5px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
      color: darkMode ? '#e0e0e0' : '#333',
      '&:hover': {
        backgroundColor: darkMode ? '#3d3d3d' : '#f0f0f0',
      },
    },
    disabledTimeSlot: {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: darkMode ? '#222' : '#eee',
      color: darkMode ? '#666' : '#999',
      '&:hover': {
        backgroundColor: darkMode ? '#222' : '#eee',
      }
    },
    selectedTimeSlot: {
      backgroundColor: '#9A2250',
      color: 'white',
      borderColor: '#9A2250',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: darkMode ? '#e0e0e0' : '#2c3e50',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '5px',
      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
      color: darkMode ? '#e0e0e0' : '#333',
      fontSize: '14px',
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '5px',
      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
      color: darkMode ? '#fff' : '#000',
      fontSize: '14px',
      '& option': {
        color: '#000',
        backgroundColor: '#fff',
      },
    },
    textarea: {
      width: '100%',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      minHeight: '80px',
      resize: 'vertical',
    },
    sessionTypeContainer: {
      display: 'flex',
      border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '20px 0',
      backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
    },
    sessionTypeOption: {
      flex: '1',
      textAlign: 'center',
      padding: '15px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      color: darkMode ? '#e0e0e0' : '#333',
      '&:hover': {
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.02)',
      },
    },
    firstSessionTypeOption: {
      borderRight: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
    },
    selectedSessionType: {
      backgroundColor: 'rgba(154, 34, 80, 0.05)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      fontWeight: '600',
      color: '#9A2250',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '3px',
        backgroundColor: '#9A2250',
        borderRadius: '3px 3px 0 0',
      },
    },
    bookButton: {
      backgroundColor: '#9A2250',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '5px',
      fontSize: '16px',
      cursor: 'pointer',
      width: '100%',
      fontWeight: '600',
      marginTop: '10px',
      '&:hover': {
        backgroundColor: '#7a1c42',
      },
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: '30px',
      gap: '30px',
      flexWrap: 'wrap',
    },
    infoSection: {
      flex: 1,
      minWidth: '300px',
    },
    name: {
      fontSize: '38px',
      margin: '0 0 8px 0',
      color: darkMode ? '#fff' : '#2c3e50',
      fontWeight: '600',
      lineHeight: '1.2',
      display: 'block',
    },
    price: {
      fontSize: '20px',
      color: '#9A2250',
      margin: '0 0 10px 0',
      fontWeight: '600',
      display: 'block',
    },
    email: {
      color: darkMode ? '#aaa' : '#666',
      margin: '0 0 15px 0',
      fontSize: '16px',
      display: 'block',
    },
    profileImage: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: `3px solid ${darkMode ? '#444' : '#f0f0f0'}`,
    },
    section: {
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '20px',
      color: darkMode ? '#fff' : '#2c3e50',
      margin: '0 0 0px 20px',
      paddingBottom: '5px',
      borderBottom: `2px solid ${darkMode ? '#444' : '#f0f0f0'}`,
    },
    tag: {
      display: 'inline-block',
      backgroundColor: '#f0f0f0',
      padding: '5px 10px',
      borderRadius: '15px',
      margin: '0 10px 10px 0',
      fontSize: '14px',
    },
    bio: {
      lineHeight: '1.6',
      color: darkMode ? '#bbb' : '#555',
      margin: '0 0 0px 20px',
    },
    button: {
      backgroundColor: '#9A2250',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '5px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background-color 0.3s',
    },
  };

  return (
    <div style={{ backgroundColor: darkMode ? '#121212' : '#fff', minHeight: '100vh' }}>
      <Header />
      <div style={styles.container}>
        <div style={styles.header}>
          <img
            src={tutor.image || require('../assets/default_silhouette.png')}
            alt={`${tutor.first_name || 'User'} profile`}
            style={styles.profileImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = require('../assets/default_silhouette.png');
            }}
          />
          <div style={styles.infoSection}>
            <h1 style={styles.name}>{tutor.first_name} {tutor.last_name}</h1>
            <p style={styles.price}>
              ${tutor && tutor.hourly_rate_cents !== undefined && tutor.hourly_rate_cents !== null
                ? (parseFloat(tutor.hourly_rate_cents) / 100).toFixed(2)
                : '0.00'}/hour
            </p>
            <p style={styles.email}>{tutor.email}</p>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>About Me</h2>
              <p style={styles.bio}>{tutor.bio}</p>
            </div>
          </div>
        </div>

        <div style={styles.bookingContainer}>
          <h2 style={styles.bookingHeader}>Book a Session</h2>

          {/* Self-booking restriction message */}
          {user && tutor && user.id === tutor.id && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffeeba',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>Note:</strong> You cannot book a session with yourself.
            </div>
          )}

          <div style={{
            ...styles.bookingGrid,
            opacity: (user && tutor && user.id === tutor.id) ? 0.5 : 1,
            pointerEvents: (user && tutor && user.id === tutor.id) ? 'none' : 'auto'
          }}>
            {/* Left side - Time selection */}
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select a time slot</label>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pick a day: *</label>
                  <DatePicker
                    selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : null}
                    onChange={(date) => {
                      if (date) {
                        setSelectedDate(formatDateLocal(date));
                      } else {
                        setSelectedDate('');
                      }
                    }}
                    minDate={new Date()}
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 2))}
                    filterDate={(date) => {
                      // Disable past dates
                      if (date < new Date().setHours(0, 0, 0, 0)) return false;
                      // Check if date is in availableDates
                      const dateStr = formatDateLocal(date);
                      return availableDates.includes(dateStr);
                    }}
                    onMonthChange={(date) => fetchMonthAvailability(date)}
                    placeholderText="Select a date"
                    className="form-control"
                    wrapperClassName="datePickerWrapper"
                    customInput={
                      <input
                        style={{
                          ...styles.input,
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      />
                    }
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label style={styles.label}>
                      Available Times: *
                      {isLoadingSlots && <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>Loading...</span>}
                      {!isLoadingSlots && availableTimeSlots.length === 0 && (
                        <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>No available time slots for this date</span>
                      )}
                    </label>
                    <div style={styles.timeSlotsGrid}>
                      {availableTimeSlots.map((slot) => (
                        <div
                          key={slot.id}
                          style={{
                            ...styles.timeSlot,
                            ...(selectedTime === slot.display ? styles.selectedTimeSlot : {}),
                            ...(slot.disabled ? styles.disabledTimeSlot : {}),
                          }}
                          onClick={() => !slot.disabled && setSelectedTime(slot.display)}
                        >
                          <span style={{ textDecoration: slot.disabled ? 'line-through' : 'none' }}>
                            {slot.display}
                          </span>
                          {slot.disabled && <span style={{ fontSize: '0.7em', display: 'block' }}>{slot.conflictLabel}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Session details */}
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Course: *</label>
                <select
                  style={styles.select}
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="" style={{ color: darkMode ? '#fff' : '#000' }}>Select a course</option>
                  {tutor.courses.map((course, index) => (
                    <option
                      key={index}
                      value={`${course.department_code} ${course.course_number}`}
                      style={{ color: '#000' }}
                    >
                      {course.department_code} {course.course_number} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional):</label>
                <textarea
                  style={styles.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific topics or questions you'd like to cover?"
                />
              </div>

              <div style={styles.sessionTypeContainer}>
                <div
                  style={{
                    ...styles.sessionTypeOption,
                    ...styles.firstSessionTypeOption,
                    ...(sessionType === 'in-person' ? styles.selectedSessionType : {})
                  }}
                  onClick={() => setSessionType('in-person')}
                >
                  In-Person
                </div>
                <div
                  style={{
                    ...styles.sessionTypeOption,
                    ...(sessionType === 'online' ? styles.selectedSessionType : {})
                  }}
                  onClick={() => setSessionType('online')}
                >
                  Online (Video)
                </div>
              </div>

              {bookingError && (
                <div style={{
                  color: '#dc3545',
                  backgroundColor: '#f8d7da',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #f5c6cb'
                }}>
                  {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div style={{
                  color: '#0f5132',
                  backgroundColor: '#d1e7dd',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #badbcc'
                }}>
                  Booking successful! The tutor will confirm your appointment shortly.
                </div>
              )}

              <button
                style={{
                  ...styles.bookButton,
                  opacity: (!selectedDate || !selectedTime || !selectedCourse || isBooking) ? 0.7 : 1,
                  cursor: (!selectedDate || !selectedTime || !selectedCourse || isBooking) ? 'not-allowed' : 'pointer'
                }}
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || !selectedCourse || isBooking}
              >
                {isBooking ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TutorProfile;
