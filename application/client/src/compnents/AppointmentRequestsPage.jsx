import React, { useState } from "react";
import Header from './Header';

const AppointmentRequestsPage = () => {
  // Mock appointment requests data
  const [requests, setRequests] = useState([
    {
      id: 1,
      studentName: "Alice Johnson",
      email: "alice.johnson@sfsu.edu",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-26",
      time: "10:00 - 11:00",
      sessionType: "In-Person",
      description: "Need help with process synchronization and deadlocks",
      status: "Pending",
      submittedAt: "2025-11-23 09:30",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      email: "bob.smith@sfsu.edu",
      course: "CSC 510 - Analysis of Algorithms",
      date: "2025-11-27",
      time: "14:00 - 15:00",
      sessionType: "Online",
      description: "Questions about dynamic programming problems",
      status: "Pending",
      submittedAt: "2025-11-23 10:15",
    },
    {
      id: 3,
      studentName: "Carol Davis",
      email: "carol.davis@sfsu.edu",
      course: "CSC 415 - Operating Systems",
      date: "2025-11-28",
      time: "13:00 - 14:00",
      sessionType: "In-Person",
      description: "Memory management and paging concepts",
      status: "Pending",
      submittedAt: "2025-11-23 11:00",
    },
  ]);

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
      backgroundColor: "#fff3cd",
      color: "#856404",
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

  const handleApprove = (id) => {
    setRequests((prev) =>
      prev.filter((req) => req.id !== id)
    );
    alert("Appointment request approved and confirmed!");
  };

  const handleDecline = (id) => {
    setRequests((prev) =>
      prev.filter((req) => req.id !== id)
    );
    alert("Appointment request declined.");
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <h1 style={styles.heading}>Appointment Requests</h1>

        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber} data-testid="text-pending-count">{pendingCount}</div>
            <div style={styles.summaryLabel}>Pending Requests</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber} data-testid="text-total-count">{requests.length}</div>
            <div style={styles.summaryLabel}>Total Requests</div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No Pending Requests</h3>
            <p>You don't have any pending appointment requests at the moment.</p>
          </div>
        ) : (
          <div style={styles.requestsList}>
            {requests.map((request) => (
              <div key={request.id} style={styles.requestCard} data-testid={`request-${request.id}`}>
                <div style={styles.requestHeader}>
                  <div style={styles.studentInfo}>
                    <div style={styles.studentName}>{request.studentName}</div>
                    <div style={styles.studentEmail}>{request.email}</div>
                  </div>
                  <div style={styles.statusBadge}>{request.status}</div>
                </div>

                <div style={styles.requestDetails}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Course</div>
                    <div style={styles.detailValue}>{request.course}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Preferred Date</div>
                    <div style={styles.detailValue}>{request.date}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Preferred Time</div>
                    <div style={styles.detailValue}>{request.time}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Session Type</div>
                    <div style={styles.detailValue}>{request.sessionType}</div>
                  </div>
                </div>

                {request.description && (
                  <div style={styles.description}>
                    <div style={styles.descriptionLabel}>Student Notes:</div>
                    <div style={styles.descriptionText}>{request.description}</div>
                  </div>
                )}

                <div style={styles.requestActions}>
                  <button
                    style={{ ...styles.button, ...styles.approveButton }}
                    onClick={() => handleApprove(request.id)}
                    data-testid={`button-approve-${request.id}`}
                  >
                    Approve & Confirm
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.declineButton }}
                    onClick={() => handleDecline(request.id)}
                    data-testid={`button-decline-${request.id}`}
                  >
                    Decline
                  </button>
                </div>

                <div style={styles.submittedTime}>
                  Submitted: {request.submittedAt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentRequestsPage;
