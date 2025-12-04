import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../Context/Context';


const SessionsPage = () => {
  const { user, darkMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedSessionForReport, setSelectedSessionForReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Set active tab from URL and handle booking highlighting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const highlightId = params.get('highlight') ||
      (location.state && location.state.highlightBooking) ||
      sessionStorage.getItem('highlightBooking');

    if (tab && ['upcoming', 'requests', 'past'].includes(tab)) {
      setActiveTab(tab);
    }

    if (highlightId) {
      setHighlightedBookingId(highlightId);
      sessionStorage.removeItem('highlightBooking');

      // Scroll to the highlighted booking after a short delay to allow the DOM to update
      const scrollToBooking = () => {
        const element = document.getElementById(`booking-${highlightId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      };

      // Need a small timeout to ensure the DOM has been updated with the new tab content
      const scrollTimer = setTimeout(scrollToBooking, 100);

      // Clear highlight after 3 seconds
      const highlightTimer = setTimeout(() => {
        setHighlightedBookingId(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [location, bookings]);

  // Fetch student's bookings
  useEffect(() => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    fetch(`/schedule/bookings?student_id=${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

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

  // Tab logic
  function isUpcoming(b) {
    const endTime = parseTimeToLocal(b.end_time);
    return (
      b.status === 'confirmed'
      && endTime > new Date()
    );
  }
  function isPast(b) {
    const endTime = parseTimeToLocal(b.end_time);
    return (
      (b.status === 'confirmed' && endTime <= new Date())
      || b.status === 'completed'
    );
  }
  function isRequestSent(b) {
    return b.status === "pending";
  }
  let filtered;
  if (activeTab === "requests") filtered = bookings.filter(isRequestSent);
  else if (activeTab === "upcoming") filtered = bookings.filter(isUpcoming);
  else filtered = bookings.filter(isPast);

  // Action handlers
  async function handleCancel(bookingId) {
    try {
      setLoading(true);
      setError(null);
      // Find the session object to get its tutor_id
      const session = bookings.find(b => b.booking_id === bookingId);
      const payloadTutorId = session && session.tutor_id ? session.tutor_id : user?.id;
      const res = await fetch(`/schedule/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled', tutor_id: payloadTutorId })
      });
      if (!res.ok) throw new Error('Could not cancel booking');
      setBookings(cur => cur.map(b => b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (e) {
      setError(e.message || 'Error cancelling');
    } finally {
      setLoading(false);
    }
  }

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
        reported_user_id: selectedSessionForReport.tutor_id,
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

  // Add glow effect for highlighted booking
  const sessionCardStyle = (bookingId) => {
    const isHighlighted = highlightedBookingId === bookingId;
    const highlightColor = darkMode ? 'rgba(255, 220, 100, 0.7)' : 'rgba(53, 0, 109, 0.7)';
    const borderColor = darkMode ? '#444' : '#ddd';

    return {
      ...styles.sessionCard,
      boxShadow: isHighlighted ? `0 0 15px ${highlightColor}` : `0 2px 5px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
      border: isHighlighted ? `2px solid ${darkMode ? 'rgb(255, 220, 100)' : '#35006D'}` : `1px solid ${borderColor}`,
      position: 'relative',
      animation: isHighlighted ? 'pulse 1.5s infinite' : 'none',
      transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
      transition: 'all 0.3s ease-in-out',
      zIndex: isHighlighted ? 10 : 1,
      '&:hover': {
        boxShadow: `0 4px 12px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
        transform: 'translateY(-2px)',
      },
    };
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#ffffff',
      transition: 'background-color 0.3s ease',
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
    tabContainer: {
      display: "flex",
      gap: "10px",
      marginBottom: "30px",
      borderBottom: darkMode ? '2px solid #444' : '2px solid #ddd',
      transition: 'border-color 0.3s ease',
    },
    tab: {
      padding: "12px 24px",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: "3px solid transparent",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      color: darkMode ? '#aaa' : '#666',
      transition: "all 0.3s ease",
      '&:hover': {
        color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      }
    },
    activeTab: {
      padding: "12px 24px",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: `3px solid ${darkMode ? 'rgb(255, 220, 100)' : '#35006D'}`,
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      transition: 'all 0.3s ease',
    },
    sessionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    sessionCard: {
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#f9f9f9',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: "8px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      transition: 'all 0.3s ease',
    },
    sessionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: "10px",
    },
    sessionTitle: {
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      fontSize: "20px",
      fontWeight: "600",
      transition: 'color 0.3s ease',
    },
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
    },
    statusConfirmed: {
      backgroundColor: "#d4edda",
      color: "#155724",
    },
    statusPending: {
      backgroundColor: "#fff3cd",
      color: "#856404",
    },
    statusCompleted: {
      backgroundColor: "#d1ecf1",
      color: "#0c5460",
    },
    sessionDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
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
    sessionActions: {
      display: "flex",
      gap: "12px",
      marginTop: "10px",

    },
    button: {
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      '&:hover': {
        opacity: 0.9,
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '@keyframes slideInLeft': {
        from: { transform: 'translateX(-100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
      '@keyframes slideOutLeft': {
        from: { transform: 'translateX(0)', opacity: 1 },
        to: { transform: 'translateX(-100%)', opacity: 0 },
      },
      '@keyframes pulse': {
        '0%': { boxShadow: '0 0 5px rgba(53, 0, 109, 0.5)' },
        '50%': { boxShadow: '0 0 20px rgba(53, 0, 109, 0.8)' },
        '100%': { boxShadow: '0 0 5px rgba(53, 0, 109, 0.5)' },
      }
    },
    secondaryButton: {
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#FFCF01',
      color: darkMode ? '#2c3e50' : '#35006D',
      '&:hover': {
        boxShadow: `0 2px 8px ${darkMode ? 'rgba(255, 220, 100, 0.3)' : 'rgba(255, 207, 1, 0.5)'}`,
      },
    },
    dangerButton: {
      backgroundColor: "#dc3545",
      color: "#fff",
      '&:hover': {
        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)',
      },
    },
    stars: {
      color: "#FFCF01",
      fontSize: "16px",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: darkMode ? '#aaa' : '#666',
      transition: 'color 0.3s ease',
      '& h3': {
        color: darkMode ? '#f0f0f0' : '#333',
        marginBottom: '8px',
      },
      '& p': {
        color: darkMode ? '#aaa' : '#666',
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
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <h1 style={styles.heading}>My Sessions</h1>
        <div style={styles.tabContainer}>
          <button
            style={activeTab === "requests" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("requests")}
            data-testid="tab-requests"
          >Requests Sent ({bookings.filter(isRequestSent).length})</button>
          <button
            style={activeTab === "upcoming" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("upcoming")}
            data-testid="tab-upcoming"
          >Upcoming ({bookings.filter(isUpcoming).length})</button>
          <button
            style={activeTab === "past" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("past")}
            data-testid="tab-past"
          >Past ({bookings.filter(isPast).length})</button>
        </div>

        {loading ? <div style={styles.emptyState}>Loading...</div> : null}
        {error ? <div style={{ ...styles.emptyState, color: 'red' }}>{error}</div> : null}
        {!loading && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <h3>No {activeTab === 'requests' ? 'requests sent' : activeTab} sessions</h3>
            <p>You don't have any {activeTab === 'requests' ? 'sent requests' : activeTab + ' sessions'} at this time.</p>
          </div>
        )}
        <div style={styles.sessionsList}>
          {filtered.map(session => (
            <div
              key={session.booking_id}
              id={`booking-${session.booking_id}`}
              style={sessionCardStyle(session.booking_id)}>
              <div style={styles.sessionHeader}>
                <div style={styles.sessionTitle}>{session.course_title || session.course || 'Course'}</div>
                <div style={styles.statusBadge}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </div>
              </div>
              <div style={styles.sessionDetails}>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Tutor</div>
                  <div 
                    style={{
                      ...styles.detailValue,
                      cursor: 'pointer',
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                      }
                    }}
                    onClick={() => navigate(`/tutor/${session.tutor_id || session.tutor_id || session.user_id}`)}
                  >
                    {session.tutor_name || session.tutor || '-'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Date</div>
                  <div style={styles.detailValue}>{session.start_time ? parseTimeToLocal(session.start_time).toLocaleDateString() : '-'}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Time</div>
                  <div style={styles.detailValue}>{session.start_time && session.end_time ? `${parseTimeToLocal(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${parseTimeToLocal(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-'}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Mode</div>
                  <div style={styles.detailValue}>{session.meeting_link?.includes('zoom') ? 'Online' : 'In-Person'}</div>
                </div>
              </div>
              {/* Show cancel for pending in requests and confirmed in upcoming */}
              {((activeTab === 'requests' && session.status === 'pending')
                || (activeTab === 'upcoming' && session.status === 'confirmed')) && (
                  <div style={styles.sessionActions}>
                    <button style={{ ...styles.button, ...styles.dangerButton }} onClick={() => handleCancel(session.booking_id)} disabled={loading}>
                      Cancel
                    </button>
                  </div>
                )}
              {/* Report button for past sessions */}
              {activeTab === 'past' && (
                <div style={{ ...styles.sessionActions, justifyContent: 'flex-end' }}>
                  <button
                    style={{ ...styles.button, ...styles.secondaryButton, backgroundColor: '#dc3545', color: '#fff' }}
                    onClick={() => openReportModal(session)}
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeReportModal();
        }}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Report User</h3>
            {reportSuccess && <div style={styles.messageSuccess}>{reportSuccess}</div>}
            {reportError && <div style={styles.messageError}>{reportError}</div>}

            {!reportSuccess && (
              <>
                <p style={{ marginBottom: '10px' }}>
                  Reason for reporting {selectedSessionForReport?.tutor_name || 'this user'}:
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

export default SessionsPage;