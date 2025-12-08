import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const TutorCourseApplications = () => {
    const { darkMode } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchRequests = () => {
        setLoading(true);
        const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';

        fetch(`${apiBaseUrl}/api/admin/all-tutor-course-requests`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch requests');
                return res.json();
            })
            .then(data => {
                setRequests(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching requests:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/tutor-course-request/${requestId}/${action}`, {
                method: 'PATCH'
            });

            if (response.ok) {
                // Update local state
                setRequests(prev => prev.map(req =>
                    req.request_id === requestId
                        ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
                        : req
                ));
                alert(`Request ${action}d successfully`);
            } else {
                const err = await response.json();
                alert(err.detail || `Failed to ${action} request`);
            }
        } catch (error) {
            console.error(`Error processing request:`, error);
            alert(`Error processing request`);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: { bg: '#fff3cd', text: '#856404' },
            approved: { bg: '#d4edda', text: '#155724' },
            rejected: { bg: '#f8d7da', text: '#721c24' },
            default: { bg: '#f8f9fa', text: '#383d41' }
        };
        const style = colors[status?.toLowerCase()] || colors.default;

        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    const sortedRequests = [...requests].sort((a, b) => {
        // Sort by Pending first, then by date
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const styles = {
        container: {
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#ffffff',
            color: darkMode ? '#ffffff' : '#333333',
        },
        content: {
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "16px 12px" : "40px 20px",
            width: "100%",
            flex: 1,
            boxSizing: 'border-box',
        },
        heading: {
            textAlign: "center",
            marginBottom: isMobile ? "20px" : "30px",
            fontSize: isMobile ? "24px" : "32px",
            fontWeight: "600",
            color: darkMode ? '#fff' : '#333',
            borderBottom: darkMode ? '1px solid #444' : '1px solid #ddd',
            paddingBottom: '10px'
        },
        tableContainer: {
            width: "100%",
            boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
            borderRadius: "8px",
            backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fff',
            overflow: 'hidden',
            overflowX: 'auto'
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            minWidth: '600px',
        },
        th: {
            padding: "15px",
            textAlign: "left",
            borderBottom: darkMode ? '2px solid #555' : '2px solid #eee',
            color: darkMode ? '#ddd' : '#555',
            fontWeight: "600",
            fontSize: '14px',
            backgroundColor: darkMode ? '#333' : '#f8f9fa'
        },
        td: {
            padding: "15px",
            borderBottom: darkMode ? '1px solid #444' : '1px solid #eee',
            color: darkMode ? '#ccc' : '#333',
            fontSize: '14px',
            verticalAlign: 'middle',
        },
        btn: {
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '8px',
            transition: 'opacity 0.2s',
        },
        approveBtn: {
            backgroundColor: '#28a745',
            color: 'white',
        },
        rejectBtn: {
            backgroundColor: '#dc3545',
            color: 'white',
        },
        emptyState: {
            textAlign: "center",
            padding: "40px 20px",
            color: darkMode ? '#aaa' : '#666',
        },
        // Mobile Card
        card: {
            backgroundColor: darkMode ? 'rgb(45, 45, 45)' : '#fff',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            border: darkMode ? '1px solid #444' : '1px solid #eee',
        },
        row: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
        },
        label: {
            fontWeight: '600',
            color: darkMode ? '#aaa' : '#666',
            fontSize: '12px',
            textTransform: 'uppercase'
        },
        value: {
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            textAlign: 'right'
        }
    };

    const renderActions = (req) => {
        if (req.status !== 'pending') return <span style={{ opacity: 0.6 }}>-</span>;

        return (
            <div style={{ display: 'flex' }}>
                <button
                    style={{ ...styles.btn, ...styles.approveBtn }}
                    onClick={() => handleAction(req.request_id, 'approve')}
                >
                    Approve
                </button>
                <button
                    style={{ ...styles.btn, ...styles.rejectBtn }}
                    onClick={() => handleAction(req.request_id, 'reject')}
                >
                    Deny
                </button>
            </div>
        );
    };

    const MobileCard = ({ req }) => (
        <div style={styles.card}>
            <div style={{ ...styles.row, borderBottom: darkMode ? '1px solid #555' : '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>#{req.request_id}</span>
                {getStatusBadge(req.status)}
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Tutor</span>
                <span style={styles.value}>{req.tutor?.user?.first_name} {req.tutor?.user?.last_name}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Course</span>
                <span style={styles.value}>{req.course?.department_code} {req.course?.course_number}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Title</span>
                <span style={styles.value}>{req.course?.title}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Date</span>
                <span style={styles.value}>{new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            {req.status === 'pending' && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        style={{ ...styles.btn, ...styles.approveBtn, flex: 1 }}
                        onClick={() => handleAction(req.request_id, 'approve')}
                    >
                        Approve
                    </button>
                    <button
                        style={{ ...styles.btn, ...styles.rejectBtn, flex: 1 }}
                        onClick={() => handleAction(req.request_id, 'reject')}
                    >
                        Deny
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                <h1 style={styles.heading}>Tutor Course Addition Request</h1>

                {loading && <div style={styles.emptyState}>Loading requests...</div>}
                {error && <div style={{ ...styles.emptyState, color: 'red' }}>Error: {error}</div>}

                {!loading && !error && requests.length === 0 && (
                    <div style={styles.emptyState}>No course requests found.</div>
                )}

                {!loading && !error && requests.length > 0 && (
                    isMobile ? (
                        <div>
                            {sortedRequests.map(req => <MobileCard key={req.request_id} req={req} />)}
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Tutor</th>
                                        <th style={styles.th}>Course</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRequests.map(req => (
                                        <tr key={req.request_id}>
                                            <td style={styles.td}>#{req.request_id}</td>
                                            <td style={styles.td}>
                                                {req.tutor?.user?.first_name} {req.tutor?.user?.last_name}
                                                <div style={{ fontSize: '11px', color: darkMode ? '#888' : '#666' }}>ID: {req.tutor_id}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <strong>{req.course?.department_code} {req.course?.course_number}</strong>
                                                <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{req.course?.title}</div>
                                            </td>
                                            <td style={styles.td}>{getStatusBadge(req.status)}</td>
                                            <td style={styles.td}>{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td style={styles.td}>{renderActions(req)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
            <Footer />
        </div>
    );
};

export default TutorCourseApplications;
