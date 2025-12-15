import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../Context/Context";
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
import './AppointmentRequestsPage.css';

const apiBaseUrl = process.env.REACT_APP_API_URL || '';

const AppointmentRequestsPage = () => {
  const { user, darkMode } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    pending: 0,
    upcoming: 0,
    completed: 0
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedSessionForReport, setSelectedSessionForReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Sorting and Pagination State
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch tutor's bookings
  const fetchAppointmentRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/schedule/bookings/tutor/${user.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointment requests');
      }

      const data = await response.json();

      // Student details are now included in the API response
      // Ensure student_name and student_email have fallback values
      const bookingsWithStudentDetails = data.map((booking) => {
        return {
          ...booking,
          student_name: booking.student_name || `Student #${booking.student_id}`,
          student_email: booking.student_email || `student-${booking.student_id}@sfsu.edu`
        };
      });

      console.log('Bookings with student details:', bookingsWithStudentDetails);

      setAllBookings(bookingsWithStudentDetails);

      // Update counts
      const now = new Date();
      setCounts({
        pending: bookingsWithStudentDetails.filter(b => b.status === 'pending').length,
        upcoming: bookingsWithStudentDetails.filter(b =>
          b.status === 'confirmed' && new Date(b.end_time) > now
        ).length,
        completed: bookingsWithStudentDetails.filter(b =>
          b.status === 'completed' || (b.status === 'confirmed' && new Date(b.end_time) <= now)
        ).length
      });

    } catch (err) {
      console.error('Error fetching appointment requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`${apiBaseUrl}/schedule/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          tutor_id: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${status} booking`);
      }

      // Refresh the list after update
      fetchAppointmentRequests();

      return true;
    } catch (err) {
      console.error(`Error ${status}ing booking:`, err);
      setError(err.message);
      return false;
    }
  };

  // Handle accept/decline/cancel actions
  const handleAccept = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'confirmed');
    if (success) {
      console.log('Booking confirmed successfully');
    }
  };

  const handleDecline = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'cancelled');
    if (success) {
      console.log('Booking cancelled successfully');
    }
  };

  const handleCancel = async (bookingId) => {
    const success = await updateBookingStatus(bookingId, 'cancelled');
    if (success) {
      console.log('Booking cancelled successfully');
    }
  };

  // Report handlers
  const openReportModal = (session) => {
    setSelectedSessionForReport(session);
    setReportReason("");
    setReportError(null);
    setReportSuccess(null);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedSessionForReport(null);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      setReportError("Please provide a reason for the report.");
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      const payload = {
        reporter_id: user.id,
        reported_user_id: selectedSessionForReport.student_id,
        reason: reportReason
      };

      const res = await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit report');
      }

      setReportSuccess("Report submitted successfully.");
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch data on component mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchAppointmentRequests();
    }
  }, [user?.id, fetchAppointmentRequests]);

  // Highlight and scroll effect
  const location = useLocation();
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const scrollToBookingRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bId = params.get('booking');
    if (bId) {
      setHighlightedBookingId(Number(bId));
      const el = document.getElementById(`booking-card-${bId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        scrollToBookingRef.current = bId;
      }
      // Remove highlight after 2.2s
      setTimeout(() => setHighlightedBookingId(null), 2200);
    }
  }, [location.search]);
  // Use effect to try again if booking cards load after mount
  useEffect(() => {
    if (scrollToBookingRef.current) {
      const el = document.getElementById(`booking-card-${scrollToBookingRef.current}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollToBookingRef.current = null;
      }
    }
  }, [allBookings]);

  // After setAllBookings(bookingsWithStudentDetails);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bId = params.get('booking');
    const tabParam = params.get('tab'); // Read tab from URL parameter

    if (!bId || isNaN(Number(bId)) || !allBookings.length) return;

    // Safely parse booking id
    const bookingIdNum = Number(bId);
    const found = allBookings.find(b => b.booking_id === bookingIdNum || b.id === bookingIdNum);

    if (found) {
      let desiredTab = 'pending'; // Default
      const now = new Date();
      const endTime = found.end_time ? new Date(found.end_time) : null;

      // Determine correct tab based on status AND end time
      if (found.status === 'pending') {
        desiredTab = 'pending';
      } else if (found.status === 'confirmed' && endTime && endTime > now) {
        desiredTab = 'upcoming';
      } else if (found.status === 'completed' || (found.status === 'confirmed' && endTime && endTime <= now)) {
        desiredTab = 'completed';
      }

      // Use URL tab param if provided and valid (as a hint from the calendar)
      if (tabParam && ['pending', 'upcoming', 'completed'].includes(tabParam)) {
        desiredTab = tabParam;
      }

      setActiveTab(desiredTab);
      setHighlightedBookingId(bookingIdNum);
      setTimeout(() => setHighlightedBookingId(null), 2200);
      // Scroll after tab activation (with slight delay in case rendering is pending)
      setTimeout(() => {
        const el = document.getElementById(`booking-card-${bookingIdNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  }, [location.search, allBookings]);

  // Format date and time for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startTime, endTime) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const timeZoneOffset = start.getTimezoneOffset() / 60;

      const startHours = start.getHours() - timeZoneOffset;
      const endHours = end.getHours() - timeZoneOffset;

      const format = (date, hours) => {
        const adjustedHours = hours < 0 ? 24 + hours : hours % 24;
        const ampm = adjustedHours >= 12 ? 'PM' : 'AM';
        const displayHours = adjustedHours % 12 || 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${displayHours}:${minutes} ${ampm}`;
      };

      return `${format(start, startHours)} - ${format(end, endHours)}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      const simpleFormat = (date) => {
        try {
          return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (e) {
          return 'Invalid time';
        }
      };
      return `${simpleFormat(startTime)} - ${simpleFormat(endTime)}`;
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = allBookings.filter(booking => {
    const now = new Date();
    const endTime = new Date(booking.end_time);

    if (activeTab === "pending") return booking.status === "pending";
    if (activeTab === "upcoming") {
      return booking.status === "confirmed" && endTime > now;
    }
    if (activeTab === "completed") {
      return booking.status === "completed" || (booking.status === "confirmed" && endTime <= now);
    }
    return false;
  });

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.start_time);
    const dateB = new Date(b.start_time);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);




  return (
    <div className={`page-container ${darkMode ? 'dark' : 'not-dark'}`}>
      <Header />

      <div className="page-content">
        <h1 className="page-heading">Your Appointments</h1>

        {loading ? (
          <div className="empty-state">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div>Loading appointment requests...</div>
              <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            </div>
          </div>
        ) : error ? (
          <div style={{
            color: '#dc3545',
            backgroundColor: darkMode ? 'rgba(220, 53, 69, 0.1)' : 'rgba(220, 53, 69, 0.05)',
            border: '1px solid',
            borderColor: darkMode ? 'rgba(220, 53, 69, 0.3)' : 'rgba(220, 53, 69, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <>
            <div className="tabs-container">
              <div
                className={`tab-item ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                <div className="tab-number">{counts.pending}</div>
                <div className="tab-label">Pending Requests</div>
              </div>
              <div
                className={`tab-item ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                <div className="tab-number">{counts.upcoming}</div>
                <div className="tab-label">Upcoming Appointments</div>
              </div>
              <div
                className={`tab-item ${activeTab === "completed" ? "active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                <div className="tab-number">{counts.completed}</div>
                <div className="tab-label">Completed</div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="empty-state">
                {activeTab === "pending" && "No pending appointment requests found."}
                {activeTab === "upcoming" && "No upcoming sessions scheduled."}
                {activeTab === "completed" && "No completed sessions yet."}
              </div>
            ) : (
              <>
                <div className="controls-header">
                  <div style={{ fontSize: '14px', color: darkMode ? '#aaa' : '#666' }}>
                    Showing {paginatedBookings.length} of {filteredBookings.length} results
                  </div>
                  <div
                    className="sort-control"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={`Sort by date (${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'})`}
                  >
                    <span>Sort by Date</span>
                    <i
                      className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} sort-arrow`}
                    />
                  </div>
                </div>

                <div className="requests-list">
                  {paginatedBookings.map((request) => (
                    <div
                      key={request.booking_id}
                      id={`booking-card-${request.booking_id}`}
                      className="request-card"
                      style={highlightedBookingId === request.booking_id ? {
                        boxShadow: darkMode
                          ? '0 0 6px 2px rgb(255, 220, 100), 0 0 0 3px #35006D'
                          : '0 0 6px 2px #fff82c, 0 0 0 3px #35006D',
                        background: darkMode ? 'rgba(255, 251, 229, 0.1)' : '#fffbe5',
                        animation: 'calendarGlow 1.7s cubic-bezier(0.4,0,1,1) 2'
                      } : {}}
                    >
                      <div className="request-card-header">
                        <div className="student-info">
                          <div className="student-name">
                            {request.student_name || 'Student'}
                          </div>
                          <div className="student-email">
                            {request.student_email || 'No email provided'}
                          </div>
                        </div>

                      </div>

                      <div className="request-details-grid">
                        <div className="detail-item">
                          <div className="detail-label">Course</div>
                          <div className="detail-value">
                            {request.course_title || 'No course specified'}
                          </div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Date</div>
                          <div className="detail-value">
                            {request.start_time ? formatDate(request.start_time) : 'N/A'}
                          </div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Time</div>
                          <div className="detail-value">
                            {request.start_time && request.end_time
                              ? formatTime(request.start_time, request.end_time)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Type</div>
                          <div className="detail-value">
                            {request.meeting_link?.includes('zoom') ? 'Online' : 'In-Person'}
                          </div>
                        </div>
                      </div>

                      <div className="description-box">
                        <div className="detail-label">Notes</div>
                        <div className="description-text">
                          {request.notes || 'No additional notes provided.'}
                        </div>
                      </div>

                      <div className="submitted-time">
                        Requested on {request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A'}
                      </div>

                      {request.status === "pending" && (
                        <div className="request-actions">
                          <button
                            className="action-btn btn-approve"
                            onClick={() => handleAccept(request.booking_id || request.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="action-btn btn-decline"
                            onClick={() => handleDecline(request.booking_id || request.id)}
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {request.status === "confirmed" && new Date(request.end_time) > new Date() && (
                        <div className="request-actions">
                          {request.meeting_link && request.meeting_link.startsWith('http') && (
                            <a
                              href={request.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="action-btn btn-join"
                              style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              Join Meeting
                            </a>
                          )}
                          <button
                            className="action-btn btn-cancel"
                            onClick={() => handleCancel(request.booking_id || request.id)}
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}

                      {/* Report button for completed sessions */}
                      {(request.status === "completed" || (request.status === "confirmed" && new Date(request.end_time) <= new Date())) && (
                        <div className="request-actions">
                          <button
                            className="action-btn btn-decline"
                            onClick={() => openReportModal(request)}
                          >
                            Report Student
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: darkMode ? '1px solid #444' : '1px solid #eee'
                  }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: darkMode ? '#fff' : '#333',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: currentPage === page
                            ? (darkMode ? 'rgb(255, 220, 100)' : '#35006D')
                            : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                          color: currentPage === page
                            ? (darkMode ? '#333' : '#fff')
                            : (darkMode ? '#fff' : '#333'),
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          minWidth: '32px'
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: darkMode ? '#fff' : '#333',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Next
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

export default AppointmentRequestsPage;