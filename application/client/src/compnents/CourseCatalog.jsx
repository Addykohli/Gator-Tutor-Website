import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const CourseCatalog = () => {
    const { darkMode } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCourse, setNewCourse] = useState({
        department_code: '',
        course_number: '',
        title: ''
    });
    const [addingCourse, setAddingCourse] = useState(false);
    const [addError, setAddError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 768;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch all courses
    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/admin/allcourses`);
            if (!response.ok) throw new Error('Failed to fetch courses');
            const data = await response.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Add new course
    const handleAddCourse = async (e) => {
        e.preventDefault();
        setAddingCourse(true);
        setAddError('');

        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/admin/addcourse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCourse),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to add course');
            }

            const addedCourse = await response.json();
            setCourses(prev => [...prev, addedCourse]);
            setShowAddModal(false);
            setNewCourse({ department_code: '', course_number: '', title: '' });
            setSuccessMessage(`Course "${addedCourse.department_code} ${addedCourse.course_number}" added successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setAddError(err.message);
        } finally {
            setAddingCourse(false);
        }
    };

    // Deactivate course
    const handleDeactivateCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to deactivate this course?')) return;

        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/admin/deactivate/${courseId}`, {
                method: 'PATCH',
            });

            if (!response.ok) throw new Error('Failed to deactivate course');

            const updatedCourse = await response.json();
            setCourses(prev =>
                prev.map(c => c.course_id === courseId ? updatedCourse : c)
            );
            setSuccessMessage(`Course deactivated successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    // Get unique departments for filter dropdown
    const departments = [...new Set(courses.map(c => c.department_code))].sort();

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.department_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.course_number.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDepartment = !filterDepartment || course.department_code === filterDepartment;

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && course.is_active) ||
            (filterStatus === 'inactive' && !course.is_active);

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: darkMode ? 'rgb(30, 30, 30)' : '#f8f9fa',
        },
        content: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '20px 12px' : '40px 20px',
            width: '100%',
            flex: 1,
            boxSizing: 'border-box',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
        },
        heading: {
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '600',
            color: darkMode ? '#fff' : '#333',
            margin: 0,
            borderBottom: '4px solid rgb(255, 220, 112)',
        },
        addButton: {
            backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
        },
        filtersContainer: {
            backgroundColor: darkMode ? 'rgb(45, 45, 45)' : '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
        },
        filtersRow: {
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        searchInput: {
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fff',
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            outline: 'none',
        },
        selectInput: {
            padding: '12px 16px',
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fff',
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            minWidth: '150px',
            cursor: 'pointer',
        },
        resultCount: {
            fontSize: '14px',
            color: darkMode ? '#aaa' : '#666',
            marginBottom: '16px',
        },
        coursesGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
        },
        courseCard: {
            backgroundColor: darkMode ? 'rgb(50, 50, 50)' : '#fff',
            border: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
        },
        courseHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
        },
        courseCode: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            marginBottom: '4px',
        },
        courseTitle: {
            fontSize: '14px',
            color: darkMode ? '#bbb' : '#666',
            marginBottom: '8px',
        },
        statusBadge: (isActive) => ({
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: isActive ? 'rgb(16, 185, 129)' : 'rgb(189, 42, 71)',
            color: 'white',
        }),
        courseDetails: {
            padding: '12px 0',
            borderTop: darkMode ? '1px solid #444' : '1px solid #eee',
            marginTop: '8px',
            flex: 1,
        },
        detailRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: darkMode ? '#bbb' : '#666',
            marginBottom: '8px',
        },
        cardActions: {
            display: 'flex',
            gap: '12px',
            marginTop: 'auto',
            paddingTop: '16px',
        },
        deactivateButton: {
            flex: 1,
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            color: '#dc3545',
            border: '1px solid #dc3545',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        viewButton: {
            flex: 1,
            backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        // Modal styles
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
        },
        modal: {
            backgroundColor: darkMode ? 'rgb(45, 45, 45)' : '#fff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        modalTitle: {
            fontSize: '24px',
            fontWeight: '600',
            color: darkMode ? '#fff' : '#333',
            margin: 0,
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: darkMode ? '#aaa' : '#666',
            cursor: 'pointer',
            padding: '4px',
        },
        formGroup: {
            marginBottom: '20px',
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: darkMode ? '#ccc' : '#555',
            marginBottom: '8px',
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? 'rgb(60, 60, 60)' : '#fff',
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none',
        },
        modalActions: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
        },
        cancelButton: {
            flex: 1,
            backgroundColor: 'transparent',
            color: darkMode ? '#ccc' : '#666',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
        },
        submitButton: {
            flex: 1,
            backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
        },
        successBanner: {
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
        errorBanner: {
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            color: '#dc3545',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px 20px',
            color: darkMode ? '#aaa' : '#666',
        },
    };

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.heading}>Course Catalog</h1>
                    <button
                        style={styles.addButton}
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="fas fa-plus" />
                        Add Course
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div style={styles.successBanner}>
                        <i className="fas fa-check-circle" />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={styles.errorBanner}>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }} />
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div style={styles.filtersContainer}>
                    <div style={styles.filtersRow}>
                        <input
                            style={styles.searchInput}
                            type="text"
                            placeholder="Search courses by name, code, or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            style={styles.selectInput}
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <select
                            style={styles.selectInput}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Results Count */}
                <div style={styles.resultCount}>
                    Showing {filteredCourses.length} of {courses.length} courses
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={styles.emptyState}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px' }} />
                        <p>Loading courses...</p>
                    </div>
                )}

                {/* Courses Grid */}
                {!loading && filteredCourses.length > 0 && (
                    <div style={styles.coursesGrid}>
                        {filteredCourses.map(course => (
                            <div
                                key={course.course_id}
                                style={styles.courseCard}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.boxShadow = darkMode
                                        ? '0 8px 24px rgba(0,0,0,0.4)'
                                        : '0 8px 24px rgba(0,0,0,0.12)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={styles.courseHeader}>
                                    <div>
                                        <div style={styles.courseCode}>
                                            {course.department_code} {course.course_number}
                                        </div>
                                        <div style={styles.courseTitle}>{course.title}</div>
                                    </div>
                                    <span style={styles.statusBadge(course.is_active)}>
                                        {course.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div style={styles.courseDetails}>
                                    <div style={styles.detailRow}>
                                        <i className="fas fa-graduation-cap" />
                                        <span>Department: {course.department_code}</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                        <i className="fas fa-hashtag" />
                                        <span>Course ID: {course.course_id}</span>
                                    </div>
                                </div>

                                <div style={styles.cardActions}>
                                    {course.is_active && (
                                        <button
                                            style={styles.deactivateButton}
                                            onClick={() => handleDeactivateCourse(course.course_id)}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#dc3545';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                                                e.currentTarget.style.color = '#dc3545';
                                            }}
                                        >
                                            <i className="fas fa-ban" style={{ marginRight: '6px' }} />
                                            Deactivate
                                        </button>
                                    )}
                                    <button
                                        style={styles.viewButton}
                                        onClick={() => window.location.href = `/search?q=${course.department_code}+${course.course_number}&type=tutor`}
                                    >
                                        <i className="fas fa-search" style={{ marginRight: '6px' }} />
                                        Find Tutors
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredCourses.length === 0 && (
                    <div style={styles.emptyState}>
                        <i className="fas fa-book-open" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: darkMode ? '#fff' : '#333' }}>No courses found</h3>
                        <p style={{ margin: 0 }}>Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
            <Footer />

            {/* Add Course Modal */}
            {showAddModal && (
                <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Add New Course</h2>
                            <button
                                style={styles.closeButton}
                                onClick={() => setShowAddModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {addError && (
                            <div style={styles.errorBanner}>{addError}</div>
                        )}

                        <form onSubmit={handleAddCourse}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Department Code *</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="e.g., CSC, MATH, PHYS"
                                    value={newCourse.department_code}
                                    onChange={(e) => setNewCourse(prev => ({
                                        ...prev,
                                        department_code: e.target.value.toUpperCase()
                                    }))}
                                    required
                                    maxLength={10}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Course Number *</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="e.g., 101, 648, 210"
                                    value={newCourse.course_number}
                                    onChange={(e) => setNewCourse(prev => ({
                                        ...prev,
                                        course_number: e.target.value
                                    }))}
                                    required
                                    maxLength={10}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Course Title *</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="e.g., Introduction to Programming"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    style={styles.cancelButton}
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.submitButton,
                                        opacity: addingCourse ? 0.7 : 1,
                                        cursor: addingCourse ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={addingCourse}
                                >
                                    {addingCourse ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }} />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Course'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCatalog;
