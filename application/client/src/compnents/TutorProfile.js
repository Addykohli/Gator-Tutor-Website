import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const TutorProfile = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  
  // State for the tutor data
  const [tutor, setTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the booking form
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionType, setSessionType] = useState('zoom');
  const [notes, setNotes] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  // Fetch tutor data when component mounts
  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${apiBaseUrl}/api/tutors/${tutorId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTutor(data);
        
        // Fetch available time slots (if needed)
        // This is a placeholder - replace with actual API call if needed
        setAvailableTimeSlots([
          '09:00 AM - 09:30 AM',
          '09:30 AM - 10:00 AM',
          '10:00 AM - 10:30 AM',
          '02:00 PM - 02:30 PM',
          '02:30 PM - 03:00 PM',
          '03:00 PM - 03:30 PM'
        ]);
        
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
  
  // Calculate max date (2 years from now)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tutor) return;
    
    // Prepare booking data
    const bookingData = {
      tutorId: tutor.id,
      date: selectedDate,
      time: selectedTime,
      course: selectedCourse,
      sessionType,
      notes,
      price: tutor.hourly_rate_cents ? tutor.hourly_rate_cents / 100 : 0
    };
    
    console.log('Submitting booking:', bookingData);
    // Here you would typically send this to your backend
    // await fetch('/api/bookings', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(bookingData)
    // });
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
    profileImage: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #f0f0f0',
    },
    infoSection: {
      flex: 1,
      minWidth: '300px',
    },
    name: {
      fontSize: '38px',
      margin: '0 0 15px 0',
      color: '#2c3e50',
    },
    price: {
      fontSize: '18px',
      color: '#9A2250',
      margin: '0 0 0px 20px',
      fontWeight: '600',
    },
    email: {
      color: '#666',
      margin: '0 0 0px 20px',
      fontSize: '16px',
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
            <h1 style={styles.name}>{tutor.name}</h1>
            <p style={styles.price}>${tutor.price.toFixed(2)}/hour</p>
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
                    <label style={styles.label}>Available Times:</label>
                    <div style={styles.timeSlotsGrid}>
                      {availableTimeSlots.map((time, index) => (
                        <div 
                          key={index}
                          style={{
                            ...styles.timeSlot,
                            ...(selectedTime === time ? styles.selectedTimeSlot : {})
                          }}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
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
                    <option key={index} value={course}>{course}</option>
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
              
              <button 
                style={styles.bookButton}
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || !selectedCourse}
              >
                Book Session
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
