import React, { useState } from "react";
import Header from './Header';

const AppointmentsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");

  // Mock appointments data
  const upcomingAppointments = [
    {
      id: 1,
      studentName: "Emily Chen",
      email: "emily.chen@sfsu.edu",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-25",
      time: "10:00 - 11:00",
      sessionType: "In-Person",
      location: "Library Room 301",
      status: "Confirmed",
      notes: "First session, review process management basics",
    },
    {
      id: 2,
      studentName: "David Lee",
      email: "david.lee@sfsu.edu",
      course: "CSC 510 - Analysis of Algorithms",
      date: "2025-11-26",
      time: "14:00 - 15:00",
      sessionType: "Online",
      location: "Zoom Link: https://zoom.us/j/123456789",
      status: "Confirmed",
      notes: "Graph algorithms and shortest paths",
    },
    {
      id: 3,
      studentName: "Sarah Martinez",
      email: "sarah.martinez@sfsu.edu",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-27",
      time: "09:00 - 10:00",
      sessionType: "In-Person",
      location: "Library Room 205",
      status: "Confirmed",
      notes: "Memory management review before exam",
    },
  ];

  const pastAppointments = [
    {
      id: 4,
      studentName: "Michael Brown",
      email: "michael.brown@sfsu.edu",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-20",
      time: "11:00 - 12:00",
      sessionType: "In-Person",
      location: "Library Room 301",
      status: "Completed",
      notes: "Covered threading and synchronization",
      feedback: "Very helpful session, explained concepts clearly!",
      rating: 5,
    },
    {
      id: 5,
      studentName: "Jessica Taylor",
      email: "jessica.taylor@sfsu.edu",
      course: "CSC 510 - Analysis of Algorithms",
      date: "2025-11-18",
      time: "15:00 - 16:00",
      sessionType: "Online",
      location: "Zoom",
      status: "Completed",
      notes: "Dynamic programming problems",
      feedback: "Great examples and patient explanations",
      rating: 5,
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
    summary: {
      display: "flex",
      gap: "20px",
      marginBottom: "30px",
    },
    summaryCard: {
      flex: 1,
      backgroundColor: "#FFCF01",
      border: "2px solid #35006D",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
    },
    summaryNumber: {
      color: "#35006D",
      fontSize: "36px",
      fontWeight: "700",
    },
    summaryLabel: {
      color: "#35006D",
      fontSize: "14px",
      fontWeight: "600",
      marginTop: "5px",
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
    appointmentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    appointmentCard: {
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "24px",
    },
    appointmentHeader: {
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
    courseName: {
      color: "#666",
      fontSize: "16px",
      fontWeight: "500",
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
    statusCompleted: {
      backgroundColor: "#d1ecf1",
      color: "#0c5460",
    },
    appointmentDetails: {
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
    notesSection: {
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "15px",
    },
    sectionLabel: {
      color: "#666",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "8px",
    },
    sectionText: {
      color: "#333",
      fontSize: "14px",
      lineHeight: "1.6",
    },
    feedbackSection: {
      backgroundColor: "#e8f4f8",
      border: "1px solid #bee5eb",
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "15px",
    },
    appointmentActions: {
      display: "flex",
      gap: "12px",
      marginTop: "15px",
    },
    button: {
      padding: "10px 20px",
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
    if (status === "Completed") return { ...styles.statusBadge, ...styles.statusCompleted };
    return styles.statusBadge;
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const appointments = activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <h1 style={styles.heading}>My Appointments</h1>

        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber} data-testid="text-upcoming-count">{upcomingAppointments.length}</div>
            <div style={styles.summaryLabel}>Upcoming Sessions</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber} data-testid="text-completed-count">{pastAppointments.length}</div>
            <div style={styles.summaryLabel}>Completed Sessions</div>
          </div>
        </div>

        <div style={styles.tabContainer}>
          <button
            style={activeTab === "upcoming" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("upcoming")}
            data-testid="tab-upcoming"
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            style={activeTab === "past" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("past")}
            data-testid="tab-past"
          >
            Past ({pastAppointments.length})
          </button>
        </div>

        {appointments.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No {activeTab} appointments</h3>
            <p>You don't have any {activeTab} appointments at the moment.</p>
          </div>
        ) : (
          <div style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <div key={appointment.id} style={styles.appointmentCard} data-testid={`appointment-${appointment.id}`}>
                <div style={styles.appointmentHeader}>
                  <div style={styles.studentInfo}>
                    <div style={styles.studentName}>{appointment.studentName}</div>
                    <div style={styles.courseName}>{appointment.course}</div>
                  </div>
                  <div style={getStatusStyle(appointment.status)}>
                    {appointment.status}
                  </div>
                </div>

                <div style={styles.appointmentDetails}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Email</div>
                    <div style={styles.detailValue}>{appointment.email}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Date</div>
                    <div style={styles.detailValue}>{appointment.date}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Time</div>
                    <div style={styles.detailValue}>{appointment.time}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Type</div>
                    <div style={styles.detailValue}>{appointment.sessionType}</div>
                  </div>
                  {appointment.rating && (
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Student Rating</div>
                      <div style={{ ...styles.detailValue, ...styles.stars }}>
                        {renderStars(appointment.rating)}
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.notesSection}>
                  <div style={styles.sectionLabel}>Session Notes:</div>
                  <div style={styles.sectionText}>{appointment.notes}</div>
                </div>

                {appointment.feedback && (
                  <div style={styles.feedbackSection}>
                    <div style={styles.sectionLabel}>Student Feedback:</div>
                    <div style={styles.sectionText}>{appointment.feedback}</div>
                  </div>
                )}

                {activeTab === "upcoming" && (
                  <div style={styles.appointmentActions}>
                    <button
                      style={{ ...styles.button, ...styles.primaryButton }}
                      data-testid={`button-contact-${appointment.id}`}
                    >
                      Contact Student
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.secondaryButton }}
                      data-testid={`button-reschedule-${appointment.id}`}
                    >
                      Reschedule
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.dangerButton }}
                      data-testid={`button-cancel-${appointment.id}`}
                    >
                      Cancel
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

export default AppointmentsPage;
