import React, { useState } from "react";
import Header from './Header';

const SessionsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");

  // Mock session data
  const upcomingSessions = [
    {
      id: 1,
      tutor: "John Doe",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-25",
      time: "10:00 - 11:00",
      type: "In-Person",
      location: "Library Room 301",
      status: "Confirmed",
    },
    {
      id: 2,
      tutor: "Jane Wilson",
      course: "BIOL 101 - Introduction to Biology",
      date: "2025-11-27",
      time: "14:00 - 15:00",
      type: "Online",
      location: "Zoom Link",
      status: "Confirmed",
    },
    {
      id: 3,
      tutor: "John Smith",
      course: "CSC 600 - Theory of Computation",
      date: "2025-11-28",
      time: "09:00 - 10:00",
      type: "In-Person",
      location: "Library Room 205",
      status: "Pending",
    },
  ];

  const pastSessions = [
    {
      id: 4,
      tutor: "John Doe",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-20",
      time: "10:00 - 11:00",
      type: "In-Person",
      location: "Library Room 301",
      status: "Completed",
      rating: 5,
    },
    {
      id: 5,
      tutor: "Jane Wilson",
      course: "BIOL 202 - Molecular Biology",
      date: "2025-11-18",
      time: "13:00 - 14:00",
      type: "Online",
      location: "Zoom Link",
      status: "Completed",
      rating: 4,
    },
  ];

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
      borderBottom: "8px solid #9A2250",
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
    },
    primaryButton: {
      backgroundColor: "#35006D",
      color: "#fff",
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

  const getStatusStyle = (status) => {
    if (status === "Confirmed") return { ...styles.statusBadge, ...styles.statusConfirmed };
    if (status === "Pending") return { ...styles.statusBadge, ...styles.statusPending };
    if (status === "Completed") return { ...styles.statusBadge, ...styles.statusCompleted };
    return styles.statusBadge;
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const sessions = activeTab === "upcoming" ? upcomingSessions : pastSessions;

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <h1 style={styles.heading}>My Sessions</h1>

        <div style={styles.tabContainer}>
          <button
            style={activeTab === "upcoming" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("upcoming")}
            data-testid="tab-upcoming"
          >
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            style={activeTab === "past" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("past")}
            data-testid="tab-past"
          >
            Past ({pastSessions.length})
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No {activeTab} sessions</h3>
            <p>You don't have any {activeTab} tutoring sessions yet.</p>
          </div>
        ) : (
          <div style={styles.sessionsList}>
            {sessions.map((session) => (
              <div key={session.id} style={styles.sessionCard} data-testid={`session-${session.id}`}>
                <div style={styles.sessionHeader}>
                  <div style={styles.sessionTitle}>{session.course}</div>
                  <div style={getStatusStyle(session.status)} data-testid={`status-${session.id}`}>
                    {session.status}
                  </div>
                </div>

                <div style={styles.sessionDetails}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Tutor</div>
                    <div style={styles.detailValue}>{session.tutor}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Date</div>
                    <div style={styles.detailValue}>{session.date}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Time</div>
                    <div style={styles.detailValue}>{session.time}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Type</div>
                    <div style={styles.detailValue}>{session.type}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Location</div>
                    <div style={styles.detailValue}>{session.location}</div>
                  </div>
                  {session.rating && (
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Your Rating</div>
                      <div style={{ ...styles.detailValue, ...styles.stars }}>
                        {renderStars(session.rating)}
                      </div>
                    </div>
                  )}
                </div>

                {activeTab === "upcoming" && (
                  <div style={styles.sessionActions}>
                    {session.status === "Confirmed" && (
                      <>
                        <button
                          style={{ ...styles.button, ...styles.primaryButton }}
                          data-testid={`button-join-${session.id}`}
                        >
                          {session.type === "Online" ? "Join Session" : "Get Directions"}
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.secondaryButton }}
                          data-testid={`button-reschedule-${session.id}`}
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                    <button
                      style={{ ...styles.button, ...styles.dangerButton }}
                      data-testid={`button-cancel-${session.id}`}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {activeTab === "past" && !session.rating && (
                  <div style={styles.sessionActions}>
                    <button
                      style={{ ...styles.button, ...styles.primaryButton }}
                      data-testid={`button-rate-${session.id}`}
                    >
                      Rate Session
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;