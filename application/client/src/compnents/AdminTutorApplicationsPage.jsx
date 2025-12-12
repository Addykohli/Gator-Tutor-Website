import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../Context/Context";

const AdminTutorApplicationsPage = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Mobile detection
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : '/api';

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/all-tutor-applications`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data.items || data || []);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setProcessing(true);
    setActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tutor-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications(prev =>
          prev.map(app =>
            app.application_id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        if (selectedApplication?.application_id === applicationId) {
          setSelectedApplication(prev => ({ ...prev, status: newStatus }));
        }
        // Refresh the list
        fetchApplications();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setActionError(errorData.detail || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize',
    };
    switch (status) {
      case 'pending':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'approved':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'rejected':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { ...baseStyle, backgroundColor: '#e9ecef', color: '#495057' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : "#f5f5f5",
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : "#f5f5f5",
    },
    content: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "30px 20px",
      width: "100%",
      flex: 1, // Push footer down
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "15px",
    },
    title: {
      color: darkMode ? "#fff" : "#35006D",
      fontSize: "32px",
      fontWeight: "600",
      margin: 0,
    },
    filterContainer: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    filterLabel: {
      color: darkMode ? "#bbb" : "#666",
      fontSize: "14px",
    },
    filterSelect: {
      padding: "8px 12px",
      borderRadius: "4px",
      border: darkMode ? "1px solid #444" : "1px solid #ddd",
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      color: darkMode ? "#fff" : "#333",
      fontSize: "14px",
      cursor: "pointer",
    },
    refreshButton: {
      padding: "8px 16px",
      backgroundColor: "#35006D",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer",
    },
    mainContent: {
      display: isMobile ? "flex" : "grid",
      flexDirection: isMobile ? "column-reverse" : undefined,
      gridTemplateColumns: !isMobile && selectedApplication ? "1fr 1fr" : "1fr",
      gap: "20px",
    },
    listSection: {
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    listHeader: {
      backgroundColor: "#35006D",
      color: "#fff",
      padding: "15px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    listTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: "600",
    },
    applicationCount: {
      backgroundColor: "#FFCF01",
      color: "#35006D",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
    },
    applicationList: {
      maxHeight: "600px",
      overflowY: "auto",
    },
    applicationItem: {
      padding: "15px 20px",
      borderBottom: darkMode ? "1px solid #444" : "1px solid #eee",
      cursor: "pointer",
      transition: "background-color 0.2s",
      backgroundColor: "transparent",
    },
    applicationItemSelected: {
      padding: "15px 20px",
      borderBottom: darkMode ? "1px solid #444" : "1px solid #eee",
      cursor: "pointer",
      backgroundColor: darkMode ? "rgba(53, 0, 109, 0.3)" : "#f0e6f5",
      borderLeft: "4px solid #35006D",
    },
    applicationName: {
      fontSize: "16px",
      fontWeight: "600",
      color: darkMode ? "#fff" : "#333",
      marginBottom: "4px",
    },
    applicationEmail: {
      fontSize: "13px",
      color: darkMode ? "#bbb" : "#666",
      marginBottom: "8px",
    },
    applicationMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    applicationCourses: {
      fontSize: "12px",
      color: darkMode ? "#999" : "#888",
    },
    detailSection: {
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    detailHeader: {
      backgroundColor: "#35006D",
      color: "#fff",
      padding: "15px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      backgroundColor: "transparent",
      color: "#fff",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      padding: "0",
      lineHeight: "1",
    },
    detailContent: {
      padding: "20px",
    },
    detailRow: {
      marginBottom: "15px",
    },
    detailLabel: {
      fontSize: "12px",
      color: darkMode ? "#999" : "#888",
      textTransform: "uppercase",
      marginBottom: "4px",
    },
    detailValue: {
      fontSize: "15px",
      color: darkMode ? "#fff" : "#333",
    },
    essayBox: {
      backgroundColor: darkMode ? "#3d3d3d" : "#f9f9f9",
      padding: "12px",
      borderRadius: "4px",
      fontSize: "14px",
      lineHeight: "1.6",
      color: darkMode ? "#ddd" : "#555",
      marginTop: "8px",
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "25px",
      paddingTop: "20px",
      borderTop: darkMode ? "1px solid #444" : "1px solid #eee",
    },
    approveButton: {
      flex: 1,
      padding: "12px",
      backgroundColor: "#28a745",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    rejectButton: {
      flex: 1,
      padding: "12px",
      backgroundColor: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    emptyState: {
      padding: "60px 20px",
      textAlign: "center",
      color: darkMode ? "#888" : "#888",
    },
    loadingState: {
      padding: "60px 20px",
      textAlign: "center",
      color: darkMode ? "#bbb" : "#666",
    },
    errorState: {
      padding: "60px 20px",
      textAlign: "center",
      color: "#dc3545",
    },
    actionError: {
      backgroundColor: "#f8d7da",
      border: "1px solid #f5c6cb",
      borderRadius: "4px",
      padding: "12px",
      color: "#721c24",
      marginBottom: "15px",
      fontSize: "14px",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#35006D",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer",
      marginBottom: "20px",
    },
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={styles.container}>
      <Header />

      <div style={styles.content}>
        <button
          onClick={() => navigate('/')}
          style={styles.backButton}
          data-testid="button-back-dashboard"
        >
          ← Back to Dashboard
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>Tutor Applications</h1>
          <div style={styles.filterContainer}>
            <span style={styles.filterLabel}>Filter by status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.filterSelect}
              data-testid="select-filter-status"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchApplications}
              style={styles.refreshButton}
              data-testid="button-refresh"
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.listSection}>
            <div style={styles.listHeader}>
              <h2 style={styles.listTitle}>Applications</h2>
              <span style={styles.applicationCount}>
                {filteredApplications.length} total
              </span>
            </div>

            {loading ? (
              <div style={styles.loadingState}>Loading applications...</div>
            ) : error ? (
              <div style={styles.errorState}>{error}</div>
            ) : filteredApplications.length === 0 ? (
              <div style={styles.emptyState}>No applications found</div>
            ) : (
              <div style={styles.applicationList}>
                {filteredApplications.map((app) => (
                  <div
                    key={app.application_id}
                    onClick={() => setSelectedApplication(app)}
                    style={
                      selectedApplication?.application_id === app.application_id
                        ? styles.applicationItemSelected
                        : styles.applicationItem
                    }
                    data-testid={`application-item-${app.application_id}`}
                  >
                    <div style={styles.applicationName}>
                      {app.user_name || app.full_name || `User #${app.user_id}`}
                    </div>
                    <div style={styles.applicationEmail}>
                      GPA: {app.gpa} | Courses: {app.courses}
                    </div>
                    <div style={styles.applicationMeta}>
                      <span style={styles.applicationCourses}>
                        {formatDate(app.created_at)}
                      </span>
                      <span style={getStatusBadgeStyle(app.status || 'pending')}>
                        {app.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedApplication && (
            <div style={styles.detailSection}>
              <div style={styles.detailHeader}>
                <h3 style={{ margin: 0 }}>Application Details</h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <div style={styles.detailContent}>
                {actionError && (
                  <div style={styles.actionError}>{actionError}</div>
                )}

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Applicant</div>
                  <div style={styles.detailValue}>
                    {selectedApplication.user_name || selectedApplication.full_name || `User #${selectedApplication.user_id}`}
                    {selectedApplication.email && (
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {selectedApplication.email}
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>GPA</div>
                  <div style={styles.detailValue}>{selectedApplication.gpa}</div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Courses</div>
                  <div style={styles.detailValue}>{selectedApplication.courses}</div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>About</div>
                  <div style={styles.essayBox}>{selectedApplication.bio || 'No bio provided'}</div>
                </div>


                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Status</div>
                  <span style={getStatusBadgeStyle(selectedApplication.status || 'pending')}>
                    {selectedApplication.status || 'pending'}
                  </span>
                </div>

                <div style={styles.actionButtons}>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplication.application_id, 'approved')}
                    disabled={processing || selectedApplication.status === 'approved'}
                    style={{
                      ...styles.approveButton,
                      opacity: processing || selectedApplication.status === 'approved' ? 0.5 : 1,
                    }}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplication.application_id, 'rejected')}
                    disabled={processing || selectedApplication.status === 'rejected'}
                    style={{
                      ...styles.rejectButton,
                      opacity: processing || selectedApplication.status === 'rejected' ? 0.5 : 1,
                    }}
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminTutorApplicationsPage;