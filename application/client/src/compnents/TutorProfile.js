import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';

const TutorProfile = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  
  // State for the tutor data
  const [tutor, setTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // State for the booking form
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionType, setSessionType] = useState('zoom');
  const [notes, setNotes] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // State for appointment requests
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState(null);
  
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
        
        // Format the time slots for display
        const formattedSlots = data.slots.map(slot => ({
          id: `${slot.start_time}-${slot.end_time}`,
          start: new Date(slot.start_time),
          end: new Date(slot.end_time),
          display: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
        }));
        
        setAvailableTimeSlots(formattedSlots);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    
    fetchAvailability();
  }, [selectedDate, tutorId]);
  
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
      const bookingData = {
        tutor_id: tutor.id,
        student_id: user.id, // Use the ID from the authenticated user context
        start_time: formatDateTime(startDateTime),
        end_time: formatDateTime(endDateTime),
        course_id: courseIdNum, // Ensure it's a number
        meeting_link: sessionType === 'zoom' ? 'https://sfsu.zoom.us/j/meeting-id' : 'In-person meeting',
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
      setSessionType('zoom');
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
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: '1000px',
    },
    bookingContainer: {
      backgroundColor: '#f9f9f9',
      borderRadius: '15px',
      padding: '25px',
      marginTop: '30px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    bookingHeader: {
      fontSize: '24px',
      color: '#2c3e50',
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
      border: '1px solid #ddd',
      borderRadius: '5px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#f0f0f0',
      },
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
      color: '#2c3e50',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '14px',
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: 'white',
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
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '20px 0',
      backgroundColor: '#f8f9fa',
    },
    sessionTypeOption: {
      flex: '1',
      textAlign: 'center',
      padding: '15px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      '&:first-child': {
        borderRight: '1px solid #e0e0e0',
      },
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      },
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
      color: '#2c3e50',
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
      color: '#666',
      margin: '0 0 15px 0',
      fontSize: '16px',
      display: 'block',
    },
    profileImage: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #f0f0f0',
    },
    section: {
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '20px',
      color: '#2c3e50',
      margin: '0 0 0px 20px',
      paddingBottom: '5px',
      borderBottom: '2px solid #f0f0f0',
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
      color: '#555',
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
    <div>
      <Header />
      <div style={styles.container}>
        <div style={styles.header}>
          <img 
            src={tutor.image} 
            alt={`${tutor.name}'s profile`} 
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
          <div style={styles.bookingGrid}>
            {/* Left side - Time selection */}
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select a time slot</label>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pick a day:</label>
                  <input 
                    type="date" 
                    style={styles.input}
                    value={selectedDate}
                    onChange={(e) => {
                      const selected = new Date(e.target.value);
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() + 2);
                      
                      if (selected <= maxDate) {
                        setSelectedDate(e.target.value);
                      } else {
                        // If the selected date is beyond 2 years, set to max allowed date
                        setSelectedDate(maxDate.toISOString().split('T')[0]);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    max={getMaxDate()}
                    onKeyDown={(e) => {
                      // Prevent manual entry of invalid years
                      if (e.key >= '0' && e.key <= '9') {
                        const currentValue = e.target.value;
                        const year = currentValue.split('-')[0];
                        if (year && year.length >= 4) {
                          e.preventDefault();
                        }
                      }
                    }}
                  />
                </div>
                
                {selectedDate && (
                  <div>
                    <label style={styles.label}>
                      Available Times:
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
                            ...(selectedTime === slot.display ? styles.selectedTimeSlot : {})
                          }}
                          onClick={() => setSelectedTime(slot.display)}
                        >
                          {slot.display}
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
                <label style={styles.label}>Course:</label>
                <select 
                  style={styles.select}
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="">Select a course</option>
                  {tutor.courses.map((course, index) => (
                    <option key={index} value={`${course.department_code} ${course.course_number}`}>
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
                    ...(sessionType === 'in-person' ? styles.selectedSessionType : {})
                  }}
                  onClick={() => setSessionType('in-person')}
                >
                  In-Person
                </div>
                <div 
                  style={{
                    ...styles.sessionTypeOption,
                    ...(sessionType === 'zoom' ? styles.selectedSessionType : {})
                  }}
                  onClick={() => setSessionType('zoom')}
                >
                  Zoom
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
