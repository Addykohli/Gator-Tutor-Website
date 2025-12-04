import React, { useState, useEffect } from "react";
import Header from './Header';
import { useAuth } from '../Context/Context';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

const apiBaseUrl = process.env.REACT_APP_API_URL || '';

const AppointmentRequestsPage = () => {
  const { user, darkMode } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    pending: 0,
    upcoming: 0,
    completed: 0
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedSessionForReport, setSelectedSessionForReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);

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
      const now = new Date();
      setCounts({
        pending: bookingsWithStudentDetails.filter(b => b.status === 'pending').length,
        upcoming: bookingsWithStudentDetails.filter(b =>
          b.status === 'confirmed' && new Date(b.end_time) > now
        ).length,
        completed: bookingsWithStudentDetails.filter(b =>
          b.status === 'completed' || (b.status === 'confirmed' && new Date(b.end_time) <= now)
        ).length
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

  // Report handlers
  const openReportModal = (session) => {
    setSelectedSessionForReport(session);
    setReportReason("");
    setReportError(null);
    setReportSuccess(null);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedSessionForReport(null);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      setReportError("Please provide a reason for the report.");
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      const payload = {
        reporter_id: user.id,
        reported_user_id: selectedSessionForReport.student_id,
        reason: reportReason
      };

      const res = await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit report');
      }

      setReportSuccess("Report submitted successfully.");
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
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
    const now = new Date();
    const endTime = new Date(booking.end_time);

    if (activeTab === "pending") return booking.status === "pending";
    if (activeTab === "upcoming") {
      return booking.status === "confirmed" && endTime > now;
    }
    if (activeTab === "completed") {
      return booking.status === "completed" || (booking.status === "confirmed" && endTime <= now);
    }
    return false;
  });

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#ffffff',
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    heading: {
      color: darkMode ? '#fff' : '#333',
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content",
      transition: 'color 0.3s ease',
    },
    content: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
      width: "100%",
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'color 0.3s ease',
    },
    tabs: {
      display: "flex",
      gap: "20px",
      marginBottom: "30px",
    },
    tab: {
      flex: 1,
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#f0f0f0',
      border: darkMode ? '2px solid #444' : '2px solid #ddd',
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: darkMode ? '0 4px 8px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)',
      },
    },
    activeTab: {
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#FFCF01',
      border: darkMode ? '2px solid rgb(255, 220, 100)' : '2px solid #35006D',
      color: darkMode ? '#2c3e50' : '#35006D',
    },
    tabNumber: {
      fontSize: "36px",
      fontWeight: "700",
      marginBottom: "5px",
      color: 'inherit',
    },
    tabLabel: {
      fontSize: "14px",
      fontWeight: "600",
      textTransform: "uppercase",
      color: 'inherit',
    },
    requestsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    requestCard: {
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#f9f9f9',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: "8px",
      padding: "24px",
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      },
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
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "5px",
      transition: 'color 0.3s ease',
    },
    studentEmail: {
      color: darkMode ? '#bbb' : '#666',
      fontSize: "14px",
      transition: 'color 0.3s ease',
    },
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'all 0.3s ease',
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
      color: darkMode ? '#aaa' : '#666',
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "4px",
      transition: 'color 0.3s ease',
    },
    detailValue: {
      color: darkMode ? '#f0f0f0' : '#333',
      fontSize: "14px",
      transition: 'color 0.3s ease',
    },
    description: {
      backgroundColor: darkMode ? 'rgb(50, 50, 50)' : '#fff',
      border: darkMode ? '1px solid #555' : '1px solid #ddd',
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "15px",
      transition: 'all 0.3s ease',
    },
    descriptionLabel: {
      color: darkMode ? '#aaa' : '#666',
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "8px",
      transition: 'color 0.3s ease',
    },
    descriptionText: {
      color: darkMode ? '#f0f0f0' : '#333',
      fontSize: "14px",
      lineHeight: "1.6",
      transition: 'color 0.3s ease',
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
      transition: "all 0.3s ease",
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    approveButton: {
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      color: darkMode ? '#2c3e50' : '#fff',
      '&:hover': {
        backgroundColor: darkMode ? 'rgb(255, 215, 90)' : '#2a0057',
        boxShadow: `0 2px 8px ${darkMode ? 'rgba(255, 220, 100, 0.4)' : 'rgba(53, 0, 109, 0.5)'}`,
      },
      '&:active': {
        transform: 'translateY(1px)',
        boxShadow: 'none',
      },
      transition: 'all 0.2s ease',
    },
    declineButton: {
      backgroundColor: darkMode ? '#c82333' : '#dc3545',
      color: "#fff",
      '&:hover': {
        backgroundColor: darkMode ? '#bd2130' : '#c82333',
        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)',
      },
      '&:active': {
        transform: 'translateY(1px)',
        boxShadow: 'none',
      },
      transition: 'all 0.2s ease',
    },
    cancelButton: {
      backgroundColor: 'rgb(107, 21, 36)',
      color: "#fff",
      '&:hover': {
        backgroundColor: darkMode ? '#5a6268' : '#5a6268',
        boxShadow: '0 2px 8px rgba(108, 117, 125, 0.5)',
      },
      '&:active': {
        transform: 'translateY(1px)',
        boxShadow: 'none',
      },
      transition: 'all 0.2s ease',
    },
    submittedTime: {
      color: darkMode ? '#888' : '#999',
      fontSize: "12px",
      marginTop: "10px",
      textAlign: "right",
      transition: 'color 0.3s ease',
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: '8px',
      border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
      color: darkMode ? '#aaa' : '#666',
      transition: 'all 0.3s ease',
      '& h3': {
        color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
        marginBottom: '12px',
        fontSize: '1.5rem',
      },
      '& p': {
        color: darkMode ? '#bbb' : '#666',
        fontSize: '1rem',
        lineHeight: '1.6',
      },
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fff',
      padding: "30px",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "500px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      color: darkMode ? '#f0f0f0' : '#333',
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "20px",
      color: darkMode ? '#fff' : '#333',
    },
    textarea: {
      width: "100%",
      minHeight: "100px",
      padding: "10px",
      marginBottom: "15px",
      borderRadius: "4px",
      border: darkMode ? '1px solid #555' : '1px solid #ddd',
      backgroundColor: darkMode ? '#333' : '#fff',
      color: darkMode ? '#fff' : '#333',
      resize: "vertical",
    },
    modalActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    },
    messageSuccess: {
      color: "#28a745",
      marginBottom: "15px",
      fontSize: "14px",
    },
    messageError: {
      color: "#dc3545",
      marginBottom: "15px",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      <Header />

      <div style={styles.content}>
        <h1 style={styles.heading}>Appointment Requests</h1>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: darkMode ? '#aaa' : '#666',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '8px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div>Loading appointment requests...</div>
              <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            </div>
          </div>
        ) : error ? (
          <div style={{
            color: '#dc3545',
            backgroundColor: darkMode ? 'rgba(220, 53, 69, 0.1)' : 'rgba(220, 53, 69, 0.05)',
            border: '1px solid',
            borderColor: darkMode ? 'rgba(220, 53, 69, 0.3)' : 'rgba(220, 53, 69, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <>
            <div style={styles.tabs}>
              <div
                style={{
                  ...styles.tab,
                  ...(activeTab === "pending" ? styles.activeTab : {}),
                  color: activeTab === "pending" ? (darkMode ? '#2c3e50' : '#35006D') : (darkMode ? '#aaa' : '#666')
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
                  color: activeTab === "upcoming" ? (darkMode ? '#2c3e50' : '#35006D') : (darkMode ? '#aaa' : '#666')
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
                  color: activeTab === "completed" ? (darkMode ? '#2c3e50' : '#35006D') : (darkMode ? '#aaa' : '#666')
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
                  <div
                    key={request.booking_id}
                    id={`booking-card-${request.booking_id}`}
                    style={{
                      ...styles.requestCard,
                      ...(highlightedBookingId === request.booking_id ? {
                        boxShadow: darkMode
                          ? '0 0 6px 2px rgb(255, 220, 100), 0 0 0 3px #35006D'
                          : '0 0 6px 2px #fff82c, 0 0 0 3px #35006D',
                        background: darkMode ? 'rgba(255, 251, 229, 0.1)' : '#fffbe5',
                        animation: 'calendarGlow 1.7s cubic-bezier(0.4,0,1,1) 2'
                      } : {})
                    }}
                  >
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
                          ? darkMode ? 'rgba(40, 167, 69, 0.2)' : '#d4edda'
                          : request.status === 'cancelled'
                            ? darkMode ? 'rgba(220, 53, 69, 0.2)' : '#f8d7da'
                            : request.status === 'completed'
                              ? darkMode ? 'rgba(23, 162, 184, 0.2)' : '#d1ecf1'
                              : darkMode ? 'rgba(255, 193, 7, 0.2)' : '#fff3cd',
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

                    {request.status === "confirmed" && new Date(request.end_time) > new Date() && (
                      <div style={styles.requestActions}>
                        <button
                          style={{ ...styles.button, ...styles.cancelButton }}
                          onClick={() => handleCancel(request.booking_id || request.id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}

                    {/* Report button for completed sessions */}
                    {(request.status === "completed" || (request.status === "confirmed" && new Date(request.end_time) <= new Date())) && (
                      <div style={styles.requestActions}>
                        <button
                          style={{ ...styles.button, ...styles.declineButton }}
                          onClick={() => openReportModal(request)}
                        >
                          Report Student
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

      {/* Report Modal */}
      {showReportModal && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeReportModal();
        }}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Report Student</h3>
            {reportSuccess && <div style={styles.messageSuccess}>{reportSuccess}</div>}
            {reportError && <div style={styles.messageError}>{reportError}</div>}

            {!reportSuccess && (
              <>
                <p style={{ marginBottom: '10px' }}>
                  Reason for reporting {selectedSessionForReport?.student_name || 'this student'}:
                </p>
                <textarea
                  style={styles.textarea}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  disabled={reportLoading}
                />
                <div style={styles.modalActions}>
                  <button
                    style={{ ...styles.button, backgroundColor: 'transparent', border: '1px solid #ccc', color: darkMode ? '#ccc' : '#666' }}
                    onClick={closeReportModal}
                    disabled={reportLoading}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#dc3545', color: '#fff' }}
                    onClick={submitReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestsPage;