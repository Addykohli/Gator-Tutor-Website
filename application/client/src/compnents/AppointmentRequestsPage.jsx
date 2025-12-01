import React, { useState, useEffect } from "react";
import Header from './Header';
import { useAuth } from '../Context/Context';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

const apiBaseUrl = process.env.REACT_APP_API_URL || '';

const AppointmentRequestsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    pending: 0,
    upcoming: 0,
    completed: 0
  });

  // Fetch student details by ID
  const fetchStudentDetails = async (studentId) => {
    console.log(`Fetching details for student ID: ${studentId}`);
    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${studentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Student details response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch student details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return { 
          firstName: 'Student', 
          lastName: `#${studentId}`,
          email: `student-${studentId}@sfsu.edu`
        };
      }
      
      const studentData = await response.json();
      console.log('Received student data:', studentData);
      
      if (!studentData) {
        console.error('No user data received for student ID:', studentId);
        return { 
          firstName: 'Student', 
          lastName: `#${studentId}`,
          email: `student-${studentId}@sfsu.edu`
        };
      }
      
      const firstName = studentData.first_name || 'Student';
      const lastName = studentData.last_name || `#${studentId}`;
      
      return {
        firstName,
        lastName,
        email: studentData.sfsu_email || studentData.email || `student-${studentId}@sfsu.edu`
      };
    } catch (err) {
      console.error('Error fetching student details:', err);
      return { firstName: 'Student', lastName: `#${studentId}`, email: 'No email provided' };
    }
  };

  // Fetch tutor's bookings
  const fetchAppointmentRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/schedule/bookings/tutor/${user.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointment requests');
      }
      
      const data = await response.json();
      
      // Fetch student details for each booking
      const bookingsWithStudentDetails = await Promise.all(
        data.map(async (booking) => {
          console.log('Processing booking:', booking);
          if (booking.student_id) {
            try {
              const student = await fetchStudentDetails(booking.student_id);
              console.log('Fetched student details:', student);
              return {
                ...booking,
                student_name: `${student.firstName} ${student.lastName}`.trim(),
                student_email: student.email,
                student_firstName: student.firstName,
                student_lastName: student.lastName
              };
            } catch (err) {
              console.error('Error processing student details:', err);
              return {
                ...booking,
                student_name: `Student #${booking.student_id}`,
                student_email: `student-${booking.student_id}@sfsu.edu`,
                student_firstName: 'Student',
                student_lastName: `#${booking.student_id}`
              };
            }
          }
          return booking;
        })
      );
      
      console.log('Bookings with student details:', bookingsWithStudentDetails);
      
      setAllBookings(bookingsWithStudentDetails);
      
      // Update counts
      setCounts({
        pending: bookingsWithStudentDetails.filter(b => b.status === 'pending').length,
        upcoming: bookingsWithStudentDetails.filter(b => b.status === 'confirmed').length,
        completed: bookingsWithStudentDetails.filter(b => b.status === 'completed').length
      });
      
    } catch (err) {
      console.error('Error fetching appointment requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`${apiBaseUrl}/schedule/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status,
          tutor_id: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${status} booking`);
      }

      // Refresh the list after update
      fetchAppointmentRequests();
      
      return true;
    } catch (err) {
      console.error(`Error ${status}ing booking:`, err);
      setError(err.message);
      return false;
    }
  };

  // Handle accept/decline/cancel actions
  const handleAccept = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'confirmed');
    if (success) {
      console.log('Booking confirmed successfully');
    }
  };

  const handleDecline = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'cancelled');
    if (success) {
      console.log('Booking cancelled successfully');
    }
  };

  const handleCancel = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'cancelled');
    if (success) {
      console.log('Booking cancelled successfully');
    }
  };

  // Fetch data on component mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchAppointmentRequests();
    }
  }, [user?.id, fetchAppointmentRequests]);

  // Highlight and scroll effect
  const location = useLocation();
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const scrollToBookingRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bId = params.get('booking');
    if (bId) {
      setHighlightedBookingId(Number(bId));
      const el = document.getElementById(`booking-card-${bId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        scrollToBookingRef.current = bId;
      }
      // Remove highlight after 2.2s
      setTimeout(() => setHighlightedBookingId(null), 2200);
    }
  }, [location.search]);
  // Use effect to try again if booking cards load after mount
  useEffect(() => {
    if (scrollToBookingRef.current) {
      const el = document.getElementById(`booking-card-${scrollToBookingRef.current}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollToBookingRef.current = null;
      }
    }
  }, [allBookings]);

  // After setAllBookings(bookingsWithStudentDetails);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bId = params.get('booking');
    if (!bId || isNaN(Number(bId)) || !allBookings.length) return;
    // Safely parse booking id
    const bookingIdNum = Number(bId);
    const found = allBookings.find(b => b.booking_id === bookingIdNum || b.id === bookingIdNum);
    if (found) {
      let desiredTab = 'pending';
      if (found.status === 'confirmed') desiredTab = 'upcoming';
      else if (found.status === 'completed') desiredTab = 'completed';
      setActiveTab(desiredTab);
      setHighlightedBookingId(bookingIdNum);
      setTimeout(() => setHighlightedBookingId(null), 2200);
      // Scroll after tab activation (with slight delay in case rendering is pending)
      setTimeout(() => {
        const el = document.getElementById(`booking-card-${bookingIdNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  }, [location.search, allBookings]);

  // Format date and time for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startTime, endTime) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const timeZoneOffset = start.getTimezoneOffset() / 60;
      
      const startHours = start.getHours() - timeZoneOffset;
      const endHours = end.getHours() - timeZoneOffset;
      
      const format = (date, hours) => {
        const adjustedHours = hours < 0 ? 24 + hours : hours % 24;
        const ampm = adjustedHours >= 12 ? 'PM' : 'AM';
        const displayHours = adjustedHours % 12 || 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${displayHours}:${minutes} ${ampm}`;
      };
      
      return `${format(start, startHours)} - ${format(end, endHours)}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      const simpleFormat = (date) => {
        try {
          return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (e) {
          return 'Invalid time';
        }
      };
      return `${simpleFormat(startTime)} - ${simpleFormat(endTime)}`;
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = allBookings.filter(booking => {
    if (activeTab === "pending") return booking.status === "pending";
    if (activeTab === "upcoming") return booking.status === "confirmed";
    if (activeTab === "completed") return booking.status === "completed";
    return false;
  });

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
    },
    heading: {
      color: "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content",
    },
    content: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
      width: "100%",
    },
    tabs: {
      display: "flex",
      gap: "20px",
      marginBottom: "30px",
    },
    tab: {
      flex: 1,
      backgroundColor: "#f0f0f0",
      border: "2px solid #ddd",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    activeTab: {
      backgroundColor: "#FFCF01",
      border: "2px solid #35006D",
    },
    tabNumber: {
      fontSize: "36px",
      fontWeight: "700",
      marginBottom: "5px",
    },
    tabLabel: {
      fontSize: "14px",
      fontWeight: "600",
      textTransform: "uppercase",
    },
    requestsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    requestCard: {
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "24px",
    },
    requestHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "15px",
      flexWrap: "wrap",
      gap: "10px",
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      color: "#35006D",
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "5px",
    },
    studentEmail: {
      color: "#666",
      fontSize: "14px",
    },
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
    },
    requestDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "15px",
    },
    detailItem: {
      display: "flex",
      flexDirection: "column",
    },
    detailLabel: {
      color: "#666",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "4px",
    },
    detailValue: {
      color: "#333",
      fontSize: "14px",
    },
    description: {
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "15px",
    },
    descriptionLabel: {
      color: "#666",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "8px",
    },
    descriptionText: {
      color: "#333",
      fontSize: "14px",
      lineHeight: "1.6",
    },
    requestActions: {
      display: "flex",
      gap: "12px",
      marginTop: "15px",
    },
    button: {
      flex: 1,
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "opacity 0.3s",
    },
    approveButton: {
      backgroundColor: "#35006D",
      color: "#fff",
    },
    declineButton: {
      backgroundColor: "#dc3545",
      color: "#fff",
    },
    cancelButton: {
      backgroundColor: "#dc3545",
      color: "#fff",
    },
    submittedTime: {
      color: "#999",
      fontSize: "12px",
      marginTop: "10px",
      textAlign: "right",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#666",
    },
  };

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <h1 style={styles.heading}>Appointment Requests</h1>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading appointment requests...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
            Error: {error}
          </div>
        ) : (
          <>
            <div style={styles.tabs}>
              <div 
                style={{
                  ...styles.tab,
                  ...(activeTab === "pending" ? styles.activeTab : {}),
                  color: activeTab === "pending" ? "#35006D" : "#666"
                }}
                onClick={() => setActiveTab("pending")}
              >
                <div style={styles.tabNumber}>{counts.pending}</div>
                <div style={styles.tabLabel}>Pending Requests</div>
              </div>
              <div 
                style={{
                  ...styles.tab,
                  ...(activeTab === "upcoming" ? styles.activeTab : {}),
                  color: activeTab === "upcoming" ? "#35006D" : "#666"
                }}
                onClick={() => setActiveTab("upcoming")}
              >
                <div style={styles.tabNumber}>{counts.upcoming}</div>
                <div style={styles.tabLabel}>Upcoming Sessions</div>
              </div>
              <div 
                style={{
                  ...styles.tab,
                  ...(activeTab === "completed" ? styles.activeTab : {}),
                  color: activeTab === "completed" ? "#35006D" : "#666"
                }}
                onClick={() => setActiveTab("completed")}
              >
                <div style={styles.tabNumber}>{counts.completed}</div>
                <div style={styles.tabLabel}>Completed</div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div style={styles.emptyState}>
                {activeTab === "pending" && "No pending appointment requests found."}
                {activeTab === "upcoming" && "No upcoming sessions scheduled."}
                {activeTab === "completed" && "No completed sessions yet."}
              </div>
            ) : (
              <div style={styles.requestsList}>
                {filteredBookings.map((request) => (
                  <div key={request.booking_id} id={`booking-card-${request.booking_id}`} style={{ ...styles.requestCard, ...(highlightedBookingId===request.booking_id ? {boxShadow:'0 0 6px 2px #fff82c,0 0 0 3px #35006D', background: '#fffbe5', animation: 'calendarGlow 1.7s cubic-bezier(0.4,0,1,1) 2' } : {}) }}>
                    <div style={styles.requestHeader}>
                      <div style={styles.studentInfo}>
                        <div style={styles.studentName}>
                          {request.student_name || 'Student'}
                        </div>
                        <div style={styles.studentEmail}>
                          {request.student_email || 'No email provided'}
                        </div>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: request.status === 'confirmed' 
                          ? '#d4edda' 
                          : request.status === 'cancelled'
                          ? '#f8d7da'
                          : request.status === 'completed'
                          ? '#d1ecf1'
                          : '#fff3cd',
                        color: request.status === 'confirmed'
                          ? '#155724'
                          : request.status === 'cancelled'
                          ? '#721c24'
                          : request.status === 'completed'
                          ? '#0c5460'
                          : '#856404'
                      }}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                    </div>

                    <div style={styles.requestDetails}>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Course</div>
                        <div style={styles.detailValue}>
                          {request.course_title || 'No course specified'}
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Date</div>
                        <div style={styles.detailValue}>
                          {request.start_time ? formatDate(request.start_time) : 'N/A'}
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Time</div>
                        <div style={styles.detailValue}>
                          {request.start_time && request.end_time 
                            ? formatTime(request.start_time, request.end_time)
                            : 'N/A'}
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Type</div>
                        <div style={styles.detailValue}>
                          {request.meeting_link?.includes('zoom') ? 'Online' : 'In-Person'}
                        </div>
                      </div>
                    </div>

                    <div style={styles.description}>
                      <div style={styles.descriptionLabel}>Notes</div>
                      <div style={styles.descriptionText}>
                        {request.notes || 'No additional notes provided.'}
                      </div>
                    </div>

                    <div style={styles.submittedTime}>
                      Requested on {request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A'}
                    </div>

                    {request.status === "pending" && (
                      <div style={styles.requestActions}>
                        <button
                          style={{ ...styles.button, ...styles.approveButton }}
                          onClick={() => handleAccept(request.booking_id || request.id)}
                        >
                          Accept
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.declineButton }}
                          onClick={() => handleDecline(request.booking_id || request.id)}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {request.status === "confirmed" && (
                      <div style={styles.requestActions}>
                        <button
                          style={{ ...styles.button, ...styles.cancelButton }}
                          onClick={() => handleCancel(request.booking_id || request.id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentRequestsPage;