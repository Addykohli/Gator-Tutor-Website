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

    // Filter state
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchRequests = () => {
        setLoading(true);
        const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

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

        const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
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
                // alert(`Request ${action}d successfully`);
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

    // Filter and sort requests
    const filteredRequests = requests.filter(req => {
        // Status filter
        if (statusFilter !== 'all' && req.status?.toLowerCase() !== statusFilter) {
            return false;
        }

        // Search filter (tutor name or course)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const tutorName = `${req.tutor?.user?.first_name || ''} ${req.tutor?.user?.last_name || ''}`.toLowerCase();
            const courseName = `${req.course?.department_code || ''} ${req.course?.course_number || ''} ${req.course?.title || ''}`.toLowerCase();

            if (!tutorName.includes(query) && !courseName.includes(query)) {
                return false;
            }
        }

        return true;
    });

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        // Sort by Pending first, then by date
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Pagination calculations
    const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRequests = sortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

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
        },
        // Filter and Pagination styles
        filterContainer: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginBottom: '24px',
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap'
        },
        searchInput: {
            padding: '10px 16px',
            borderRadius: '8px',
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            minWidth: isMobile ? '100%' : '250px',
            outline: 'none'
        },
        filterButton: (isActive) => ({
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isActive
                ? (darkMode ? 'rgb(255, 220, 100)' : '#35006D')
                : (darkMode ? '#444' : '#f0f0f0'),
            color: isActive
                ? (darkMode ? '#333' : '#fff')
                : (darkMode ? '#ccc' : '#666'),
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }),
        filterButtons: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
        },
        resultsInfo: {
            fontSize: '14px',
            color: darkMode ? '#aaa' : '#666',
            marginLeft: 'auto'
        },
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: darkMode ? '1px solid #444' : '1px solid #eee'
        },
        pageButton: (isActive, isDisabled) => ({
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isActive
                ? (darkMode ? 'rgb(255, 220, 100)' : '#35006D')
                : (darkMode ? '#444' : '#f0f0f0'),
            color: isActive
                ? (darkMode ? '#333' : '#fff')
                : (darkMode ? '#ccc' : '#666'),
            fontSize: '14px',
            fontWeight: isActive ? '600' : '400',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
            transition: 'all 0.2s',
            minWidth: '40px'
        })
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

                {!loading && !error && (
                    <>
                        {/* Filter Controls */}
                        <div style={styles.filterContainer}>
                            <input
                                type="text"
                                placeholder="Search tutor or course..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                style={styles.searchInput}
                            />
                            <div style={styles.filterButtons}>
                                {['all', 'pending', 'approved', 'rejected'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusFilterChange(status)}
                                        style={styles.filterButton(statusFilter === status)}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <span style={styles.resultsInfo}>
                                Showing {paginatedRequests.length} of {sortedRequests.length} results
                            </span>
                        </div>

                        {sortedRequests.length === 0 ? (
                            <div style={styles.emptyState}>
                                {requests.length === 0
                                    ? 'No course requests found.'
                                    : 'No requests match your filters.'}
                            </div>
                        ) : (
                            <>
                                {isMobile ? (
                                    <div>
                                        {paginatedRequests.map(req => <MobileCard key={req.request_id} req={req} />)}
                                    </div>
                                ) : (
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>TCA ID</th>
                                                    <th style={styles.th}>Tutor</th>
                                                    <th style={styles.th}>Course</th>
                                                    <th style={styles.th}>Status</th>
                                                    <th style={styles.th}>Date</th>
                                                    <th style={styles.th}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedRequests.map(req => (
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
                                )}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div style={styles.pagination}>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            style={styles.pageButton(false, currentPage === 1)}
                                        >
                                            ← Prev
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    style={styles.pageButton(currentPage === pageNum, false)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            style={styles.pageButton(false, currentPage === totalPages)}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default TutorCourseApplications;
