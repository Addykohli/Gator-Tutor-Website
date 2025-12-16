import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const ReportsPage = () => {
    const { darkMode } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userNames, setUserNames] = useState({});
    const [userRoles, setUserRoles] = useState({});
    const [sortOrder, setSortOrder] = useState('desc');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 600;

    const fetchReports = (name = "") => {
        setLoading(true);
        const url = name
            ? `/api/admin/userreports?name=${encodeURIComponent(name)}`
            : '/api/admin/allreports';

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch reports');
                return res.json();
            })
            .then(data => {
                const reportsData = Array.isArray(data) ? data : [];
                setReports(reportsData);

                const userIds = new Set();
                reportsData.forEach(report => {
                    userIds.add(report.reporter_id);
                    userIds.add(report.reported_user_id);
                });

                Promise.all(
                    Array.from(userIds).map(userId =>
                        fetch(`/api/users/${userId}`)
                            .then(res => res.ok ? res.json() : null)
                            .catch(() => null)
                    )
                ).then(users => {
                    const namesMap = {};
                    const rolesMap = {};

                    users.forEach(user => {
                        if (user) {
                            namesMap[user.user_id] = `${user.first_name} ${user.last_name}`;
                        }
                    });

                    fetch('/api/schedule/bookings')
                        .then(res => res.ok ? res.json() : [])
                        .then(allBookings => {
                            reportsData.forEach(report => {
                                const reportKey = `${report.report_id}`;
                                if (!rolesMap[reportKey]) rolesMap[reportKey] = {};

                                const relatedBooking = Array.isArray(allBookings) ? allBookings.find(booking =>
                                    (booking.student_id === report.reporter_id && booking.tutor_id === report.reported_user_id) ||
                                    (booking.student_id === report.reported_user_id && booking.tutor_id === report.reporter_id)
                                ) : null;

                                if (relatedBooking) {
                                    rolesMap[reportKey][relatedBooking.student_id] = 'student';
                                    rolesMap[reportKey][relatedBooking.tutor_id] = 'tutor';
                                } else {
                                    const reporter = users.find(u => u && u.user_id === report.reporter_id);
                                    const reported = users.find(u => u && u.user_id === report.reported_user_id);
                                    if (reporter) rolesMap[reportKey][report.reporter_id] = reporter.role;
                                    if (reported) rolesMap[reportKey][report.reported_user_id] = reported.role;
                                }
                            });

                            setUserNames(namesMap);
                            setUserRoles(rolesMap);
                            setLoading(false);
                        })
                        .catch(() => {
                            reportsData.forEach(report => {
                                const reportKey = `${report.report_id}`;
                                if (!rolesMap[reportKey]) rolesMap[reportKey] = {};
                                const reporter = users.find(u => u && u.user_id === report.reporter_id);
                                const reported = users.find(u => u && u.user_id === report.reported_user_id);
                                if (reporter) rolesMap[reportKey][report.reporter_id] = reporter.role;
                                if (reported) rolesMap[reportKey][report.reported_user_id] = reported.role;
                            });
                            setUserNames(namesMap);
                            setUserRoles(rolesMap);
                            setLoading(false);
                        });
                });
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const { register, handleSubmit } = useForm();

    const onSearch = (data) => {
        fetchReports(data.searchName);
    };

    const getRoleBadge = (reportId, userId) => {
        const role = userRoles[reportId]?.[userId];
        if (!role) return null;
        const isTutor = role === 'tutor' || (typeof role === 'string' && role.includes('tutor'));
        return (
            <span style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600',
                backgroundColor: isTutor ? 'rgba(109, 102, 0, 0.15)' : 'rgba(0, 123, 255, 0.15)',
                color: isTutor ? '#cb9d07' : '#007bff',
                marginLeft: '4px'
            }}>
                {isTutor ? 'Tutor' : 'Student'}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const colors = {
            submitted: { bg: '#e3f2fd', text: '#0d47a1' },
            reviewing: { bg: '#fff3e0', text: '#e65100' },
            resolved: { bg: '#e8f5e9', text: '#1b5e20' },
            default: { bg: '#f5f5f5', text: '#616161' }
        };
        const style = colors[status?.toLowerCase()] || colors.default;
        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
            }}>
                {status}
            </span>
        );
    };

    const sortedReports = [...reports].sort((a, b) => {
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
            marginBottom: isMobile ? "16px" : "30px",
            fontSize: isMobile ? "24px" : "32px",
            fontWeight: "600",
            color: darkMode ? '#fff' : '#333',
            borderBottom: '1px solid rgba(200, 200, 200, 0.49)',
        },
        searchContainer: {
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "center",
            marginBottom: "16px",
            gap: "8px",
        },
        searchInput: {
            padding: isMobile ? "10px 12px" : "10px",
            borderRadius: "6px",
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            width: "100%",
            boxSizing: 'border-box',
            fontSize: '14px',
        },
        searchButton: {
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            color: darkMode ? '#333' : '#fff',
            cursor: "pointer",
            fontWeight: "600",
            fontSize: '14px',
        },
        controlsRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            fontSize: '13px',
            color: darkMode ? '#aaa' : '#666',
        },
        sortButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            border: 'none',
            color: darkMode ? '#fff' : '#333',
            fontSize: '12px',
            fontWeight: '500',
        },
        // Mobile Card Styles
        cardContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        },
        card: {
            backgroundColor: darkMode ? 'rgb(45, 45, 45)' : '#fff',
            borderRadius: '10px',
            padding: '14px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            border: darkMode ? '1px solid #444' : '1px solid #eee',
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
        },
        cardId: {
            fontSize: '11px',
            color: darkMode ? '#888' : '#999',
            fontWeight: '600',
        },
        cardRow: {
            marginBottom: '8px',
        },
        cardLabel: {
            fontSize: '11px',
            color: darkMode ? '#888' : '#888',
            fontWeight: '600',
            marginBottom: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
        },
        cardValue: {
            fontSize: '13px',
            color: darkMode ? '#eee' : '#333',
            lineHeight: '1.4',
        },
        cardReportedUser: {
            fontSize: '13px',
            color: darkMode ? '#ff6b6b' : '#dc3545',
            fontWeight: '600',
        },
        cardFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: darkMode ? '1px solid #444' : '1px solid #eee',
        },
        cardDate: {
            fontSize: '11px',
            color: darkMode ? '#888' : '#888',
        },
        // Desktop Table Styles
        tableContainer: {
            width: "100%",
            boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
            borderRadius: "8px",
            backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fff',
            overflow: 'hidden',
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
        },
        th: {
            padding: "12px",
            textAlign: "left",
            borderBottom: darkMode ? '2px solid #555' : '2px solid #eee',
            color: darkMode ? '#ddd' : '#555',
            fontWeight: "600",
            fontSize: '13px',
        },
        td: {
            padding: "12px",
            borderBottom: darkMode ? '1px solid #444' : '1px solid #eee',
            color: darkMode ? '#ccc' : '#333',
            fontSize: '13px',
            verticalAlign: 'top',
            wordWrap: 'break-word',
            maxWidth: '300px',
            overflowWrap: 'break-word',
        },
        reportedUserCell: {
            padding: "12px",
            borderBottom: darkMode ? '1px solid #555' : '1px solid #eee',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            color: darkMode ? '#ff6b6b' : '#dc3545',
            fontWeight: '600',
            fontSize: '13px',
            verticalAlign: 'top',
        },
        emptyState: {
            textAlign: "center",
            padding: "40px 20px",
            color: darkMode ? '#aaa' : '#666',
        }
    };

    // Mobile Card View
    const MobileCardView = () => (
        <div style={styles.cardContainer}>
            {sortedReports.map(report => (
                <div key={report.report_id} style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardId}>Report #{report.report_id}</span>
                        {getStatusBadge(report.status)}
                    </div>

                    <div style={styles.cardRow}>
                        <div style={styles.cardLabel}>Reporter</div>
                        <div style={styles.cardValue}>
                            {userNames[report.reporter_id] || 'Loading...'}
                            {getRoleBadge(report.report_id, report.reporter_id)}
                        </div>
                    </div>

                    <div style={styles.cardRow}>
                        <div style={styles.cardLabel}>Reported User</div>
                        <div style={styles.cardReportedUser}>
                            {userNames[report.reported_user_id] || 'Loading...'}
                            {getRoleBadge(report.report_id, report.reported_user_id)}
                        </div>
                    </div>

                    <div style={styles.cardRow}>
                        <div style={styles.cardLabel}>Reason</div>
                        <div style={{ ...styles.cardValue, wordWrap: 'break-word', whiteSpace: 'normal' }}>{report.reason}</div>
                    </div>

                    <div style={styles.cardFooter}>
                        <span style={styles.cardDate}>
                            {report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    // Desktop Table View
    const DesktopTableView = () => (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{ ...styles.th, width: '60px' }}>ID</th>
                        <th style={styles.th}>Reporter</th>
                        <th style={styles.th}>Reported User</th>
                        <th style={{ ...styles.th, maxWidth: '300px' }}>Reason</th>
                        <th style={{ ...styles.th, width: '90px' }}>Status</th>
                        <th
                            style={{ ...styles.th, width: '100px', cursor: 'pointer' }}
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                            Date <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} style={{ fontSize: '11px', color: darkMode ? 'rgb(255, 220, 100)' : '#35006D' }} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedReports.map(report => (
                        <tr key={report.report_id}>
                            <td style={styles.td}>#{report.report_id}</td>
                            <td style={styles.td}>
                                {userNames[report.reporter_id] || 'Loading...'}
                                <span style={{ color: darkMode ? '#888' : '#999', fontSize: '11px', marginLeft: '6px' }}>
                                    (ID: {report.reporter_id})
                                </span>
                                {getRoleBadge(report.report_id, report.reporter_id)}
                            </td>
                            <td style={styles.reportedUserCell}>
                                {userNames[report.reported_user_id] || 'Loading...'}
                                <span style={{ marginLeft: '6px', fontSize: '11px' }}>
                                    (ID: {report.reported_user_id})
                                </span>
                                {getRoleBadge(report.report_id, report.reported_user_id)}
                            </td>
                            <td style={{ ...styles.td, maxWidth: '300px', whiteSpace: 'normal' }}>{report.reason}</td>
                            <td style={styles.td}>{getStatusBadge(report.status)}</td>
                            <td style={styles.td}>
                                {report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                <h1 style={styles.heading}>Reports</h1>

                <form style={styles.searchContainer} onSubmit={handleSubmit(onSearch)}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search by Reported User Name..."
                        {...register("searchName")}
                    />
                    <button style={styles.searchButton} type="submit">Search</button>
                </form>

                {!loading && !error && reports.length > 0 && (
                    <div style={styles.controlsRow}>
                        <span>Showing {reports.length} report{reports.length !== 1 ? 's' : ''}</span>
                        {isMobile && (
                            <button
                                style={styles.sortButton}
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            >
                                Sort: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
                                <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                            </button>
                        )}
                    </div>
                )}

                {loading && <div style={styles.emptyState}>Loading reports...</div>}
                {error && <div style={{ ...styles.emptyState, color: 'red' }}>Error: {error}</div>}

                {!loading && !error && reports.length === 0 && (
                    <div style={styles.emptyState}>No reports found.</div>
                )}

                {!loading && !error && reports.length > 0 && (
                    isMobile ? <MobileCardView /> : <DesktopTableView />
                )}
            </div>
            <Footer />
        </div>
    );
};

export default ReportsPage;
