import { useForm } from 'react-hook-form';
import React, { useState } from 'react';
import { useAuth } from '../Context/Context';
import Header from './Header';
import Footer from './Footer';

const CourseCoverageRequestPage = () => {
  const { darkMode } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#ffffff',
      transition: 'background 0.3s ease',
    },
    heading: {
      color: darkMode ? '#fff' : '#333',
      textAlign: "center",
      padding: "0px",
      borderBottom: "4px solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: "20px auto",
      fontSize: isMobile ? "28px" : "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative",
      transition: 'color 0.3s ease',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '20px 16px' : '40px 20px',
      width: '100%',
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'color 0.3s ease',
      boxSizing: 'border-box',
    },
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
      gap: '32px',
      marginTop: isMobile ? '20px' : '32px',
    },
    formCard: {
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fafafa',
      border: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: isMobile ? '20px' : '32px',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    formGroup: {
      marginBottom: '24px',
    },
    formLabel: {
      display: 'block',
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      fontWeight: '500',
      marginBottom: '8px',
      transition: 'color 0.3s ease',
    },
    required: {
      color: '#ef4444',
    },
    formInput: {
      width: '100%',
      padding: '12px',
      border: darkMode ? '2px solid #555' : '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? 'rgb(50, 50, 50)' : '#fff',
      color: darkMode ? '#f0f0f0' : '#333',
      transition: 'all 0.3s ease',
    },
    textarea: {
      resize: 'vertical',
      minHeight: '100px',
      backgroundColor: darkMode ? 'rgb(50, 50, 50)' : '#fff',
      color: darkMode ? '#f0f0f0' : '#333',
      border: darkMode ? '2px solid #555' : '2px solid #e0e0e0',
      transition: 'all 0.3s ease',
    },
    formActions: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '16px',
      marginTop: '32px',
    },
    btn: {
      flex: 1,
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    btnPrimary: {
      backgroundColor: darkMode ? 'rgb(255, 220, 100)' : '#FFCF01',
      color: darkMode ? '#2c3e50' : '#35006D',
      transition: 'all 0.3s ease',
    },
    btnSecondary: {
      backgroundColor: darkMode ? 'transparent' : 'white',
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      border: darkMode ? '2px solid rgb(255, 220, 100)' : '2px solid #35006D',
      transition: 'all 0.3s ease',
    },
    infoCard: {
      backgroundColor: darkMode ? 'rgb(40, 40, 40)' : '#fafafa',
      border: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    infoCardTitle: {
      fontSize: '18px',
      marginBottom: '16px',
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      fontWeight: '600',
      transition: 'color 0.3s ease',
    },
    infoCardText: {
      color: darkMode ? '#bbb' : '#666',
      lineHeight: '1.6',
      marginBottom: '12px',
      fontSize: '14px',
      transition: 'color 0.3s ease',
    },
    contactEmail: {
      color: darkMode ? 'rgb(255, 220, 100)' : '#35006D',
      fontWeight: '600',
      marginTop: '8px',
      transition: 'color 0.3s ease',
    },
    tip: {
      fontSize: '12px',
      color: darkMode ? '#999' : '#666',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: darkMode ? '1px solid #444' : '1px solid #e8e8e8',
      transition: 'all 0.3s ease',
    },
    successMessage: {
      backgroundColor: darkMode ? '#0d9f6e' : '#10b981',
      color: 'white',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '16px',
      display: showSuccess ? 'block' : 'none',
      transition: 'background-color 0.3s ease',
    },

  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const apiBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : '/api';

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/coverage-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseNumber: data.courseNumber,
          topics: data.topics || '',
          notes: data.notes || '',
          email: data.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setShowSuccess(true);
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error submitting coverage request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Course Coverage Request</h1>

      <div style={styles.content}>
        {showSuccess && (
          <div style={styles.successMessage}>
            ✓ Request submitted successfully! We'll notify tutors about this course.
          </div>
        )}

        <div style={styles.twoColumn}>
          <div>
            <div style={styles.formCard}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    SFSU Course Number<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CSC 415"
                    {...register("courseNumber", { required: "Course number is required" })}
                    style={styles.formInput}
                  />
                  {errors.courseNumber && <span style={{ color: 'red', fontSize: '12px' }}>{errors.courseNumber.message}</span>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Topics Needed (optional)
                  </label>
                  <textarea
                    placeholder="List specific topics or chapters you need help with..."
                    {...register("topics")}
                    style={{ ...styles.formInput, ...styles.textarea }}
                    rows="4"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Additional notes (optional)
                  </label>
                  <textarea
                    placeholder="Any additional information that might help tutors..."
                    {...register("notes")}
                    style={{ ...styles.formInput, ...styles.textarea }}
                    rows="6"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Your Email<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@sfsu.edu"
                    {...register("email", { required: "Email is required" })}
                    style={styles.formInput}
                  />
                  {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email.message}</span>}
                </div>

                <div style={styles.formActions}>
                  <button
                    type="submit"
                    style={{ ...styles.btn, ...styles.btnPrimary }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#FFCF01'}
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary }}
                    onClick={() => window.location.href = '/'}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info Cards Column */}
          <div>
            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>Need more courses covered?</h3>
              <p style={styles.infoCardText}>
                You can request new courses to be added to our catalog here, add the topics you need along with the course name.
              </p>
            </div>

            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>No tutors for a course you need tutoring for?</h3>
              <p style={styles.infoCardText}>
                Submit a request mentioning the course and we'll get right to it!
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseCoverageRequestPage;
