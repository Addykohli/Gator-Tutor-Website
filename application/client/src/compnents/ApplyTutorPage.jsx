import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';

import Header from './Header';
import Footer from './Footer';

const ApplyTutorPage = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();

  const [formData, setFormData] = useState({
    gpa: '',
    courses: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    //block admins and  tutors to apply for additional courses
    if (user?.isTutor) {
      navigate('/');
    }
    if (user?.role === 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    const gpaNum = parseFloat(formData.gpa);
    if (!formData.gpa) {
      newErrors.gpa = 'GPA is required';
    } else if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
      newErrors.gpa = 'GPA must be between 0.0 and 4.0';
    }

    if (!formData.courses.trim()) {
      newErrors.courses = 'Please enter at least one course';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Please provide a brief bio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const apiBaseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : '';

      const response = await fetch(`${apiBaseUrl}/api/admin/tutor-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: user?.userId || user?.id || 0,
          email: user.email,  
          full_name: user.name || user.fullName,
          gpa: parseFloat(formData.gpa),
          courses: formData.courses,
          bio: formData.bio,
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Failed to submit application' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#f5f5f5',
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : '#f5f5f5',
    },
    contentWrapper: {
      flex: 1,
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    },
    card: {
      width: '100%',
      maxWidth: '600px',
      background: darkMode ? '#2d2d2d' : '#ffffff',
      borderRadius: '16px',
      boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
      padding: '32px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '24px',
      gap: '16px'
    },
    backButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      color: darkMode ? '#fff' : '#35006D'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: darkMode ? '#fff' : '#35006D',
      margin: 0
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#333',
      fontSize: '0.95rem'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      backgroundColor: darkMode ? '#3d3d3d' : '#fff',
      color: darkMode ? '#fff' : '#333',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      backgroundColor: darkMode ? '#3d3d3d' : '#fff',
      color: darkMode ? '#fff' : '#333',
      boxSizing: 'border-box',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    errorText: {
      color: '#dc3545',
      fontSize: '0.85rem',
      marginTop: '6px'
    },
    submitButton: {
      width: '100%',
      padding: '14px 24px',
      background: 'linear-gradient(135deg, #35006D 0%, #5a1e96 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    hint: {
      fontSize: '0.8rem',
      color: darkMode ? '#888' : '#666',
      marginTop: '4px'
    }
  };

  if (submitSuccess) {
    return (
      <div style={styles.pageContainer}>
        <Header />
        <div style={styles.contentWrapper}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#28a745', marginBottom: '20px' }}></i>
              <h2 style={{ color: darkMode ? '#fff' : '#333', marginBottom: '12px' }}>Application Submitted!</h2>
              <p style={{ color: darkMode ? '#bbb' : '#666', marginBottom: '24px' }}>
                Our admin team will review your application and get back to you soon.
              </p>
              <button onClick={() => navigate('/')} style={styles.submitButton}>
                <i className="fas fa-home"></i> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Header />
      <div style={styles.contentWrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <button onClick={() => navigate('/')} style={styles.backButton}>
              <i className="fas fa-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
            <h1 style={styles.title}>Apply to be a Tutor</h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* GPA */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="fas fa-graduation-cap" style={{ marginRight: '8px', color: '#FFCF01' }}></i>
                GPA (0.0 - 4.0) *
              </label>
              <input
                type="number"
                name="gpa"
                value={formData.gpa}
                onChange={handleInputChange}
                placeholder="e.g., 3.5"
                step="0.01"
                min="0"
                max="4"
                style={{ ...styles.input, borderColor: errors.gpa ? '#dc3545' : undefined }}
              />
              {errors.gpa && <div style={styles.errorText}>{errors.gpa}</div>}
            </div>

            {/* Courses - Simple text input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="fas fa-book" style={{ marginRight: '8px', color: '#FFCF01' }}></i>
                Courses You Can Tutor *
              </label>
              <input
                type="text"
                name="courses"
                value={formData.courses}
                onChange={handleInputChange}
                placeholder="e.g., CSC 648, CSC 413, MATH 226"
                style={{ ...styles.input, borderColor: errors.courses ? '#dc3545' : undefined }}
              />
              <div style={styles.hint}>Separate multiple courses with commas</div>
              {errors.courses && <div style={styles.errorText}>{errors.courses}</div>}
            </div>

            {/* Bio */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="fas fa-user" style={{ marginRight: '8px', color: '#FFCF01' }}></i>
                About You *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself and why you want to tutor..."
                style={{ ...styles.textarea, borderColor: errors.bio ? '#dc3545' : undefined }}
              />
              {errors.bio && <div style={styles.errorText}>{errors.bio}</div>}
            </div>


            {errors.submit && (
              <div style={{ ...styles.errorText, padding: '12px', backgroundColor: 'rgba(220,53,69,0.1)', borderRadius: '8px', marginBottom: '20px' }}>
                {errors.submit}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{ ...styles.submitButton, opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Submit Application</>
              )}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApplyTutorPage;