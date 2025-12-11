import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const AdminCourseCoverageRequestsPage = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : '/api';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/coverage-requests`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch coverage requests');
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    setProcessing(true);
    setActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/coverage-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
        
      });
      if (!response.ok) throw new Error('Failed to update status');
      await fetchRequests();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#f5f5f5',
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#f5f5f5',
      color: darkMode ? '#e6e6e6' : '#2c3e50',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      width: '100%',
      flex: 1, // Push footer down
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#35006D',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    },
    filterContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '8px 16px',
      border: '1px solid #35006D',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s',
    },
    card: {
      backgroundColor: darkMode ? '#2a2a4a' : 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    courseName: {
      fontSize: '18px',
      fontWeight: '600',
      color: darkMode ? '#e6e6e6' : '#35006D',
      margin: 0,
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    infoRow: {
      display: 'flex',
      gap: '20px',
      marginBottom: '8px',
      flexWrap: 'wrap',
    },
    label: {
      color: darkMode ? '#aaa' : '#666',
      fontSize: '14px',
    },
    value: {
      fontSize: '14px',
      fontWeight: '500',
    },
    topicsSection: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: darkMode ? '#1a1a2e' : '#f8f9fa',
      borderRadius: '8px',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '16px',
    },
    approveButton: {
      padding: '8px 20px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    },
    rejectButton: {
      padding: '8px 20px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: darkMode ? '#aaa' : '#666',
    },
    loadingState: {
      textAlign: 'center',
      padding: '40px',
    },
    errorState: {
      textAlign: 'center',
      padding: '20px',
      color: '#dc3545',
      backgroundColor: '#f8d7da',
      borderRadius: '8px',
      marginBottom: '20px',
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { backgroundColor: '#d4edda', color: '#155724' };
      case 'rejected': return { backgroundColor: '#f8d7da', color: '#721c24' };
      default: return { backgroundColor: '#fff3cd', color: '#856404' };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.content}>
          <div style={styles.loadingState}>Loading coverage requests...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Course Coverage Requests</h1>
          <button style={styles.backButton} onClick={() => navigate('/admin')}>
            ← Back to Dashboard
          </button>
        </div>

        {error && <div style={styles.errorState}>{error}</div>}
        {actionError && <div style={styles.errorState}>{actionError}</div>}

        <div style={styles.filterContainer}>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              style={{
                ...styles.filterButton,
                backgroundColor: filterStatus === status ? '#35006D' : 'transparent',
                color: filterStatus === status ? 'white' : '#35006D',
              }}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No {filterStatus === 'all' ? '' : filterStatus} coverage requests found.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.courseName}>{request.course_number || request.courseNumber}</h3>
                <span style={{ ...styles.statusBadge, ...getStatusColor(request.status) }}>
                  {request.status}
                </span>
              </div>

              <div style={styles.infoRow}>
                <div>
                  <span style={styles.label}>Submitted by: </span>
                  <span style={styles.value}>{request.email}</span>
                </div>
                <div>
                  <span style={styles.label}>Date: </span>
                  <span style={styles.value}>
                    {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {request.topics && (
                <div style={styles.topicsSection}>
                  <span style={styles.label}>Topics Requested:</span>
                  <p style={{ margin: '8px 0 0 0' }}>{request.topics}</p>
                </div>
              )}

              {request.notes && (
                <div style={{ ...styles.topicsSection, marginTop: '8px' }}>
                  <span style={styles.label}>Additional Notes:</span>
                  <p style={{ margin: '8px 0 0 0' }}>{request.notes}</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div style={styles.actionButtons}>
                  <button
                    style={styles.approveButton}
                    onClick={() => handleUpdateStatus(request.id, 'approved')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    style={styles.rejectButton}
                    onClick={() => handleUpdateStatus(request.id, 'rejected')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminCourseCoverageRequestsPage;