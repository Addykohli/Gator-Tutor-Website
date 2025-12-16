import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';

const RegisteredStudentsPage = () => {
    const navigate = useNavigate();
    const { user, darkMode } = useAuth();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name'); // name, sessions, email, date
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    // Fetch all students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setIsLoading(true);
                const apiBaseUrl = process.env.REACT_APP_API_URL || '';
                const response = await fetch(`${apiBaseUrl}/api/admin/registered-students`);

                if (!response.ok) {
                    throw new Error('Failed to fetch students');
                }

                const data = await response.json();
                setStudents(data.items || []);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Handle drop student
    const handleDropStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to drop ${studentName}? This action will soft-delete the student account.`)) {
            return;
        }

        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/admin/drop-user/${studentId}?role=student`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to drop student');
            }

            // Remove student from list
            setStudents(students.filter(s => s.user_id !== studentId));
            alert(`${studentName} has been dropped successfully`);
        } catch (err) {
            console.error('Error dropping student:', err);
            alert(`Error: ${err.message}`);
        }
    };

    // Filter and sort students
    const filteredStudents = students
        .filter(student => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                student.first_name?.toLowerCase().includes(query) ||
                student.last_name?.toLowerCase().includes(query) ||
                student.email?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                case 'sessions':
                    return (b.total_sessions || 0) - (a.total_sessions || 0);
                case 'email':
                    return (a.email || '').localeCompare(b.email || '');
                case 'date':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                default:
                    return 0;
            }
        });

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: darkMode ? '#121212' : '#f5f5f5'
        },
        content: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '10px' : '20px'
        },
        header: {
            marginBottom: '30px',
            textAlign: isMobile ? 'center' : 'left'
        },
        title: {
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: darkMode ? '#fff' : '#2c3e50',
            marginBottom: '10px'
        },
        subtitle: {
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: darkMode ? '#aaa' : '#666',
            marginBottom: '20px'
        },
        controls: {
            display: 'flex',
            gap: '15px',
            marginBottom: '25px',
            flexWrap: 'wrap',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row'
        },
        searchInput: {
            flex: '1',
            minWidth: isMobile ? '100%' : '250px',
            padding: '12px 16px',
            fontSize: '14px',
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            color: darkMode ? '#fff' : '#333',
            boxSizing: 'border-box'
        },
        select: {
            padding: '12px 16px',
            fontSize: '14px',
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            color: darkMode ? '#fff' : '#333',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            boxSizing: 'border-box'
        },
        stats: {
            display: 'flex',
            gap: '15px',
            marginBottom: '25px',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
        },
        statCard: {
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: isMobile ? 'auto' : '150px',
            flex: 1
        },
        statLabel: {
            fontSize: '12px',
            color: darkMode ? '#aaa' : '#666',
            marginBottom: '5px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        statValue: {
            fontSize: '24px',
            fontWeight: '700',
            color: darkMode ? '#fff' : '#2c3e50'
        },
        table: {
            width: '100%',
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        },
        tableHeader: {
            backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
            borderBottom: darkMode ? '2px solid #444' : '2px solid #dee2e6'
        },
        th: {
            padding: '16px',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: '600',
            color: darkMode ? '#aaa' : '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        tr: {
            borderBottom: darkMode ? '1px solid #333' : '1px solid #f0f0f0',
            transition: 'background-color 0.2s'
        },
        td: {
            padding: '16px',
            fontSize: '14px',
            color: darkMode ? '#e0e0e0' : '#333'
        },
        avatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#9A2250',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600',
            flexShrink: 0
        },
        dropButton: {
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: isMobile ? '100%' : 'auto'
        },
        badge: {
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
        },
        loading: {
            textAlign: 'center',
            padding: '60px 20px',
            fontSize: '18px',
            color: darkMode ? '#aaa' : '#666'
        },
        error: {
            textAlign: 'center',
            padding: '60px 20px',
            fontSize: '18px',
            color: '#dc3545'
        },
        noResults: {
            textAlign: 'center',
            padding: '60px 20px',
            fontSize: '16px',
            color: darkMode ? '#aaa' : '#666'
        },
        // Mobile styles
        mobileCard: {
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            border: darkMode ? '1px solid #333' : '1px solid #f0f0f0'
        },
        mobileCardRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            color: darkMode ? '#e0e0e0' : '#333'
        },
        mobileCardLabel: {
            fontWeight: '600',
            color: darkMode ? '#aaa' : '#666',
            marginRight: '8px'
        }
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <Header />
                <div style={styles.content}>
                    <div style={styles.loading}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                        Loading students...
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <Header />
                <div style={styles.content}>
                    <div style={styles.error}>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: '10px' }}></i>
                        Error: {error}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const totalSessions = students.reduce((sum, s) => sum + (s.total_sessions || 0), 0);
    const totalPending = students.reduce((sum, s) => sum + (s.pending_sessions || 0), 0);

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Registered Students</h1>
                    <p style={styles.subtitle}>Manage all registered students in the system</p>
                </div>

                {/* Stats */}
                <div style={styles.stats}>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Total Students</div>
                        <div style={styles.statValue}>{students.length}</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Total Sessions</div>
                        <div style={styles.statValue}>{totalSessions}</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Pending Sessions</div>
                        <div style={styles.statValue}>{totalPending}</div>
                    </div>
                </div>

                {/* Controls */}
                <div style={styles.controls}>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={styles.select}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="sessions">Sort by Sessions</option>
                        <option value="email">Sort by Email</option>
                        <option value="date">Sort by Join Date</option>
                    </select>
                </div>

                {/* Students List - Mobile Cards or Desktop Table */}
                {filteredStudents.length === 0 ? (
                    <div style={styles.noResults}>
                        {searchQuery ? `No students found matching "${searchQuery}"` : 'No students registered yet'}
                    </div>
                ) : (
                    <>
                        {isMobile ? (
                            // Mobile View - Cards
                            <div>
                                {filteredStudents.map((student) => {
                                    const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
                                    const joinDate = student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A';

                                    return (
                                        <div key={student.user_id} style={styles.mobileCard}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                <div style={styles.avatar}>{initials}</div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#999' }}>
                                                        ID: {student.user_id}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={styles.mobileCardRow}>
                                                <span style={styles.mobileCardLabel}>Email:</span>
                                                <span>{student.email}</span>
                                            </div>

                                            <div style={styles.mobileCardRow}>
                                                <span style={styles.mobileCardLabel}>Sessions:</span>
                                                <span style={{
                                                    ...styles.badge,
                                                    backgroundColor: darkMode ? '#2d5016' : '#d4edda',
                                                    color: darkMode ? '#7bc96f' : '#155724'
                                                }}>
                                                    {student.total_sessions || 0}
                                                </span>
                                            </div>

                                            <div style={styles.mobileCardRow}>
                                                <span style={styles.mobileCardLabel}>Pending:</span>
                                                {student.pending_sessions > 0 ? (
                                                    <span style={{
                                                        ...styles.badge,
                                                        backgroundColor: darkMode ? '#664d03' : '#fff3cd',
                                                        color: darkMode ? '#ffda6a' : '#856404'
                                                    }}>
                                                        {student.pending_sessions}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: darkMode ? '#666' : '#999' }}>-</span>
                                                )}
                                            </div>

                                            <div style={styles.mobileCardRow}>
                                                <span style={styles.mobileCardLabel}>Joined:</span>
                                                <span>{joinDate}</span>
                                            </div>

                                            <div style={{ marginTop: '16px' }}>
                                                <button
                                                    onClick={() => handleDropStudent(student.user_id, `${student.first_name} ${student.last_name}`)}
                                                    style={styles.dropButton}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                                >
                                                    <i className="fas fa-user-slash" style={{ marginRight: '6px' }}></i>
                                                    Drop Student
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // Desktop View - Table
                            <div style={styles.table}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={styles.tableHeader}>
                                        <tr>
                                            <th style={styles.th}>Student</th>
                                            <th style={styles.th}>Email</th>
                                            <th style={styles.th}>Total Sessions</th>
                                            <th style={styles.th}>Pending</th>
                                            <th style={styles.th}>Joined</th>
                                            <th style={styles.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => {
                                            const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
                                            const joinDate = student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A';

                                            return (
                                                <tr
                                                    key={student.user_id}
                                                    style={styles.tr}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#252525' : '#f8f9fa'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={styles.avatar}>{initials}</div>
                                                            <div>
                                                                <div style={{ fontWeight: '600' }}>
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#999' }}>
                                                                    ID: {student.user_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>{student.email}</td>
                                                    <td style={styles.td}>
                                                        <span style={{
                                                            ...styles.badge,
                                                            backgroundColor: darkMode ? '#2d5016' : '#d4edda',
                                                            color: darkMode ? '#7bc96f' : '#155724'
                                                        }}>
                                                            {student.total_sessions || 0}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        {student.pending_sessions > 0 ? (
                                                            <span style={{
                                                                ...styles.badge,
                                                                backgroundColor: darkMode ? '#664d03' : '#fff3cd',
                                                                color: darkMode ? '#ffda6a' : '#856404'
                                                            }}>
                                                                {student.pending_sessions}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: darkMode ? '#666' : '#999' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td style={styles.td}>{joinDate}</td>
                                                    <td style={styles.td}>
                                                        <button
                                                            onClick={() => handleDropStudent(student.user_id, `${student.first_name} ${student.last_name}`)}
                                                            style={styles.dropButton}
                                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                                        >
                                                            <i className="fas fa-user-slash" style={{ marginRight: '6px' }}></i>
                                                            Drop
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default RegisteredStudentsPage;
