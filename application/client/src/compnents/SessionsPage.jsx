import React, { useEffect, useState } from "react";
import { useLocation} from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../Context/Context';


const SessionsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);

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
  }, [location, bookings]);  // Added bookings to dependencies to handle initial load

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

  // Tab logic
  function isUpcoming(b) {
    return (
      b.status === 'confirmed'
      && new Date(b.end_time) > new Date()
    );
  }
  function isPast(b) {
    return (
      (b.status === 'confirmed' && new Date(b.end_time) <= new Date())
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

  // Add glow effect for highlighted booking
  const sessionCardStyle = (bookingId) => {
    const isHighlighted = highlightedBookingId === bookingId;
    return {
      ...styles.sessionCard,
      boxShadow: isHighlighted ? '0 0 10px rgba(53, 0, 109, 0.7)' : '0 2px 5px rgba(0,0,0,0.1)',
      border: isHighlighted ? '2px solid #35006D' : '1px solid #ddd',
      position: 'relative',
      animation: isHighlighted ? 'pulse 1.5s infinite' : 'none',
      transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
      transition: 'all 0.3s ease-in-out',
      zIndex: isHighlighted ? 10 : 1,
    };
  };

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
    tabContainer: {
      display: "flex",
      gap: "10px",
      marginBottom: "30px",
      borderBottom: "2px solid #ddd",
    },
    tab: {
      padding: "12px 24px",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: "3px solid transparent",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      color: "#666",
      transition: "color 0.3s, border-color 0.3s",
    },
    activeTab: {
      padding: "12px 24px",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: "3px solid #35006D",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      color: "#35006D",
    },
    sessionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    sessionCard: {
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    sessionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: "10px",
    },
    sessionTitle: {
      color: "#35006D",
      fontSize: "20px",
      fontWeight: "600",
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
      color: "#666",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "4px",
    },
    detailValue: {
      color: "#333",
      fontSize: "14px",
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
      transition: "opacity 0.3s",
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
      backgroundColor: "#FFCF01",
      color: "#35006D",
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
      padding: "60px 20px",
      color: "#666",
    },
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
                  <div style={styles.detailValue}>{session.tutor_name || session.tutor || '-'}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Date</div>
                  <div style={styles.detailValue}>{session.start_time ? new Date(session.start_time).toLocaleDateString() : '-'}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Time</div>
                  <div style={styles.detailValue}>{session.start_time && session.end_time ? `${new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : '-'}</div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;