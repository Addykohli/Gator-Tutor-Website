import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

import './SessionsPage.css';

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
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    fetch(`/api/schedule/bookings?student_id=${user.id}`)
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

  // Sort function for bookings
  const sortBookings = (bookings, order) => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
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
  // Filter and sort bookings based on active tab and sort order
  const filtered = useMemo(() => {
    let result;
    if (activeTab === "requests") {
      result = bookings.filter(isRequestSent);
    } else if (activeTab === "upcoming") {
      result = bookings.filter(isUpcoming);
    } else {
      result = bookings.filter(isPast);
    }
    return sortBookings(result, sortOrder);
  }, [bookings, activeTab, sortOrder]);

  // Action handlers
  async function handleCancel(bookingId) {
    try {
      setLoading(true);
      setError(null);
      // Find the session object to get its tutor_id
      const session = bookings.find(b => b.booking_id === bookingId);
      const payloadTutorId = session && session.tutor_id ? session.tutor_id : user?.id;
      const res = await fetch(`/api/schedule/bookings/${bookingId}/status`, {
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
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#fff',
      backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#ffffff',
      transition: 'background-color 0.3s ease',
    },
    heading: {
      color: darkMode ? '#fff' : '#333',
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "0px auto",
      fontSize: isMobile ? "28px" : "45px",
      fontWeight: "600",
      width: "fit-content",
      transition: 'color 0.3s ease',
    },
    content: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "20px 20px",
      width: "100%",
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'color 0.3s ease',
      boxSizing: 'border-box',
    },
    tabContainer: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '16px' : '0',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      position: 'relative',
      borderBottom: isMobile ? 'none' : (darkMode ? '1px solid #444' : '1px solid #e0e0e0'),
      paddingBottom: isMobile ? '0' : '1px',
      marginBottom: '20px',
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
      padding: isMobile ? "16px" : "24px",
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
      fontSize: isMobile ? "18px" : "20px",
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
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
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
      flexDirection: isMobile ? 'column' : 'row',
    },
    button: {
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    secondaryButton: {
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#FFCF01',
      color: darkMode ? '#2c3e50' : '#35006D',
    },
    dangerButton: {
      backgroundColor: "#dc3545",
      color: "#fff",
    },
    stars: {
      color: "#FFCF01",
      fontSize: "16px",
    },
    emptyState: {
      textAlign: "center",
      padding: "80px 20px",
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedSessions = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of list
    const listElement = document.getElementById('sessions-list');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <h1 style={styles.heading}>My Sessions</h1>
        <div style={styles.tabContainer}>
          <div style={{
            display: 'flex',
            overflowX: isMobile ? 'auto' : 'visible',
            width: isMobile ? '100%' : 'auto',
            gap: isMobile ? '8px' : '0',
            scrollbarWidth: 'none', // Hide scrollbar for cleaner look
            paddingBottom: isMobile ? '8px' : '0'
          }}>
            <button
              style={{
                ...(activeTab === "requests" ? styles.activeTab : styles.tab),
                padding: isMobile ? "8px 16px" : "12px 24px",
                fontSize: isMobile ? "14px" : "16px",
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={() => setActiveTab("requests")}
              data-testid="tab-requests"
            >Requests Sent ({bookings.filter(isRequestSent).length})</button>
            <button
              style={{
                ...(activeTab === "upcoming" ? styles.activeTab : styles.tab),
                padding: isMobile ? "8px 16px" : "12px 24px",
                fontSize: isMobile ? "14px" : "16px",
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={() => setActiveTab("upcoming")}
              data-testid="tab-upcoming"
            >Upcoming ({bookings.filter(isUpcoming).length})</button>
            <button
              style={{
                ...(activeTab === "past" ? styles.activeTab : styles.tab),
                padding: isMobile ? "8px 16px" : "12px 24px",
                fontSize: isMobile ? "14px" : "16px",
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={() => setActiveTab("past")}
              data-testid="tab-past"
            >Past ({bookings.filter(isPast).length})</button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.2s ease',
              alignSelf: isMobile ? 'flex-end' : 'auto',
              ':hover': {
                color: darkMode ? '#fff' : '#000',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }
            }}
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={`Sort by date (${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'})`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: isMobile ? '14px' : 'inherit' }}>Sort by Date</span>
              <i
                className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}
                style={{
                  fontSize: '12px',
                  color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          </div>
        </div>

        {loading ? <div style={styles.emptyState}>Loading...</div> : null}
        {error ? <div style={{ ...styles.emptyState, color: 'red' }}>{error}</div> : null}
        {!loading && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <h3>No {activeTab === 'requests' ? 'requests sent' : activeTab} sessions</h3>
            <p>You don't have any {activeTab === 'requests' ? 'sent requests' : activeTab + ' sessions'} at this time.</p>
          </div>
        )}

        {/* Results Info */}
        {!loading && filtered.length > 0 && (
          <div style={{ fontSize: '14px', color: darkMode ? '#aaa' : '#666', marginBottom: '16px' }}>
            Showing {paginatedSessions.length} of {filtered.length} results
          </div>
        )}

        <div id="sessions-list" style={styles.sessionsList}>
          {paginatedSessions.map(session => (
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
                      boxShadow: darkMode ? '0 2px 4px rgba(0, 0, 0, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
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
                    {activeTab === 'upcoming' && session.status === 'confirmed' && session.meeting_link && session.meeting_link.startsWith('http') && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...styles.button, ...styles.secondaryButton, textDecoration: 'none', textAlign: 'center', marginRight: '10px' }}
                      >
                        Join Meeting
                      </a>
                    )}
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? '#fff' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentPage === page
                    ? (darkMode ? 'rgb(255, 220, 100)' : '#35006D')
                    : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                  color: currentPage === page
                    ? (darkMode ? '#333' : '#fff')
                    : (darkMode ? '#fff' : '#333'),
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '32px'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? '#fff' : '#333',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          </div>
        )}
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
      <Footer />
    </div>
  );
};

export default SessionsPage;