import React, { useEffect, useState } from 'react';
import Header from './Header';
import { useAuth } from '../Context/Context';

const ReportsPage = () => {
    const { darkMode } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchName, setSearchName] = useState("");
    const [userNames, setUserNames] = useState({});
    const [userRoles, setUserRoles] = useState({}); // Store role context for each user in each report

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

                // Fetch user names for all unique user IDs
                const userIds = new Set();
                reportsData.forEach(report => {
                    userIds.add(report.reporter_id);
                    userIds.add(report.reported_user_id);
                });

                // Fetch user details
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

                    // Fetch all bookings to determine actual roles in sessions
                    fetch('/schedule/bookings')
                        .then(res => res.ok ? res.json() : [])
                        .then(allBookings => {
                            reportsData.forEach(report => {
                                const reportKey = `${report.report_id}`;
                                if (!rolesMap[reportKey]) rolesMap[reportKey] = {};

                                // Find a booking involving both users
                                const relatedBooking = Array.isArray(allBookings) ? allBookings.find(booking =>
                                    (booking.student_id === report.reporter_id && booking.tutor_id === report.reported_user_id) ||
                                    (booking.student_id === report.reported_user_id && booking.tutor_id === report.reporter_id)
                                ) : null;

                                if (relatedBooking) {
                                    // Use booking context to determine roles - student_id is the student, tutor_id is the tutor
                                    rolesMap[reportKey][relatedBooking.student_id] = 'student';
                                    rolesMap[reportKey][relatedBooking.tutor_id] = 'tutor';
                                } else {
                                    // Fallback: fetch user roles if no booking found
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
                        .catch(err => {
                            console.error('Error fetching bookings:', err);
                            // Fallback to just user roles without booking context
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
                console.error("Error fetching reports:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReports(searchName);
    };

    const styles = {
        container: {
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#ffffff',
            transition: 'background-color 0.3s ease',
        },
        content: {
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 20px",
            width: "100%",
            color: darkMode ? '#f0f0f0' : '#333',
        },
        heading: {
            textAlign: "center",
            marginBottom: "30px",
            fontSize: "32px",
            fontWeight: "600",
            color: darkMode ? '#fff' : '#333',
        },
        searchContainer: {
            display: "flex",
            justifyContent: "center",
            marginBottom: "30px",
            gap: "10px",
        },
        searchInput: {
            padding: "10px",
            borderRadius: "4px",
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            width: "300px",
        },
        searchButton: {
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            color: darkMode ? '#333' : '#fff',
            cursor: "pointer",
            fontWeight: "600",
        },
        tableContainer: {
            overflowX: "auto",
            boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
            borderRadius: "8px",
            backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fff',
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
        },
        th: {
            padding: "16px",
            textAlign: "left",
            borderBottom: darkMode ? '2px solid #555' : '2px solid #eee',
            color: darkMode ? '#ddd' : '#555',
            fontWeight: "600",
        },
        td: {
            padding: "16px",
            borderBottom: darkMode ? '1px solid #555' : '1px solid #eee',
            color: darkMode ? '#ccc' : '#333',
        },
        reportedUserCell: {
            padding: "16px",
            borderBottom: darkMode ? '1px solid #555' : '1px solid #eee',
            backgroundColor: 'rgba(220, 53, 69, 0.15)',
            color: darkMode ? '#ff6b6b' : '#dc3545',
            fontWeight: '600',
        },
        statusBadge: (status) => {
            const colors = {
                submitted: { bg: '#e3f2fd', text: '#0d47a1' },
                reviewing: { bg: '#fff3e0', text: '#e65100' },
                resolved: { bg: '#e8f5e9', text: '#1b5e20' },
                default: { bg: '#f5f5f5', text: '#616161' }
            };
            const style = colors[status?.toLowerCase()] || colors.default;
            return {
                backgroundColor: style.bg,
                color: style.text,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-block",
            };
        },
        emptyState: {
            textAlign: "center",
            padding: "40px",
            color: darkMode ? '#aaa' : '#666',
        }
    };

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                <h1 style={styles.heading}>Reports</h1>

                <form style={styles.searchContainer} onSubmit={handleSearch}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search by Reported User Name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                    <button style={styles.searchButton} type="submit">Search</button>
                </form>

                {loading && <div style={styles.emptyState}>Loading reports...</div>}
                {error && <div style={{ ...styles.emptyState, color: 'red' }}>Error: {error}</div>}

                {!loading && !error && reports.length === 0 && (
                    <div style={styles.emptyState}>No reports found.</div>
                )}

                {!loading && !error && reports.length > 0 && (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Reporter</th>
                                    <th style={styles.th}>Reported User</th>
                                    <th style={styles.th}>Reason</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(report => (
                                    <tr key={report.report_id}>
                                        <td style={styles.td}>#{report.report_id}</td>
                                        <td style={styles.td}>
                                            {userNames[report.reporter_id] || 'Loading...'}
                                            <span style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginLeft: '8px' }}>
                                                (ID: {report.reporter_id})
                                            </span>
                                            {userRoles[report.report_id] && userRoles[report.report_id][report.reporter_id] && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    backgroundColor: userRoles[report.report_id][report.reporter_id] === 'tutor' || userRoles[report.report_id][report.reporter_id].includes('tutor')
                                                        ? 'rgba(109, 102, 0, 0.15)'
                                                        : 'rgba(0, 123, 255, 0.15)',
                                                    color: userRoles[report.report_id][report.reporter_id] === 'tutor' || userRoles[report.report_id][report.reporter_id].includes('tutor')
                                                        ? '#cb9d07ff'
                                                        : '#007bff'
                                                }}>
                                                    {userRoles[report.report_id][report.reporter_id] === 'tutor' || userRoles[report.report_id][report.reporter_id].includes('tutor') ? 'Tutor' : 'Student'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.reportedUserCell}>
                                            {userNames[report.reported_user_id] || 'Loading...'}
                                            <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                (ID: {report.reported_user_id})
                                            </span>
                                            {userRoles[report.report_id] && userRoles[report.report_id][report.reported_user_id] && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    backgroundColor: userRoles[report.report_id][report.reported_user_id] === 'tutor' || userRoles[report.report_id][report.reported_user_id].includes('tutor')
                                                        ? 'rgba(109, 102, 0, 0.15)'
                                                        : 'rgba(0, 123, 255, 0.15)',
                                                    color: userRoles[report.report_id][report.reported_user_id] === 'tutor' || userRoles[report.report_id][report.reported_user_id].includes('tutor')
                                                        ? '#cb9d07ff'
                                                        : '#007bff'
                                                }}>
                                                    {userRoles[report.report_id][report.reported_user_id] === 'tutor' || userRoles[report.report_id][report.reported_user_id].includes('tutor') ? 'Tutor' : 'Student'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{report.reason}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge(report.status)}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
