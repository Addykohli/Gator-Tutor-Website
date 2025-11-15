import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

const CourseCoverageRequestPage = () => {
  const [formData, setFormData] = useState({
    courseNumber: '',
    topics: '',
    notes: '',
    email: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
    },
    heading: {
      color: "#333",
      textAlign: "center",
      padding: "0px",
      borderBottom: "4px solid #9A2250",
      display: "inline-block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      width: '100%',
    },
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '32px',
      marginTop: '32px',
    },
    formCard: {
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '32px',
    },
    formGroup: {
      marginBottom: '24px',
    },
    formLabel: {
      display: 'block',
      color: '#35006D',
      fontWeight: '500',
      marginBottom: '8px',
    },
    required: {
      color: '#ef4444',
    },
    formInput: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    textarea: {
      resize: 'vertical',
      minHeight: '100px',
    },
    formActions: {
      display: 'flex',
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
      backgroundColor: '#FFCF01',
      color: '#35006D',
    },
    btnSecondary: {
      backgroundColor: 'white',
      color: '#35006D',
      border: '2px solid #35006D',
    },
    infoCard: {
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
    },
    infoCardTitle: {
      fontSize: '18px',
      marginBottom: '16px',
      color: '#35006D',
      fontWeight: '600',
    },
    infoCardText: {
      color: '#666',
      lineHeight: '1.6',
      marginBottom: '12px',
      fontSize: '14px',
    },
    contactEmail: {
      color: '#35006D',
      fontWeight: '600',
      marginTop: '8px',
    },
    tip: {
      fontSize: '12px',
      color: '#666',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #e8e8e8',
    },
    successMessage: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '16px',
      display: showSuccess ? 'block' : 'none',
    },
    '@media (max-width: 768px)': {
      twoColumn: {
        gridTemplateColumns: '1fr',
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting coverage request:', formData);
    
    setShowSuccess(true);
    
    // Reset form
    setFormData({
      courseNumber: '',
      topics: '',
      notes: '',
      email: ''
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    SFSU Course Number<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="courseNumber"
                    placeholder="e.g., CSC 415"
                    value={formData.courseNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Topics Needed (optional)
                  </label>
                  <textarea
                    name="topics"
                    placeholder="List specific topics or chapters you need help with..."
                    value={formData.topics}
                    onChange={handleChange}
                    style={{...styles.formInput, ...styles.textarea}}
                    rows="4"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Additional notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Any additional information that might help tutors..."
                    value={formData.notes}
                    onChange={handleChange}
                    style={{...styles.formInput, ...styles.textarea}}
                    rows="6"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Your Email<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@sfsu.edu"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formActions}>
                  <button
                    type="submit"
                    style={{...styles.btn, ...styles.btnPrimary}}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#FFCF01'}
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    style={{...styles.btn, ...styles.btnSecondary}}
                    onClick={() => window.location.href = '/'}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div>
            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>How it works</h3>
              <p style={styles.infoCardText}>
                1. Fill out the course information you need help with
              </p>
              <p style={styles.infoCardText}>
                2. We'll notify available tutors about your request
              </p>
              <p style={styles.infoCardText}>
                3. Tutors will reach out to you via email if they can help
              </p>
              <p style={styles.tip}>
                Tip: Be specific about topics to help tutors understand your needs better
              </p>
            </div>

            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>Need immediate help?</h3>
              <p style={styles.infoCardText}>
                Contact the tutoring center directly at:
              </p>
              <p style={styles.contactEmail}>
                tutoring@sfsu.edu
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
