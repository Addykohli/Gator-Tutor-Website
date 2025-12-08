import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useAuth();

  const styles = {
    nameContainer: {
      display: 'flex',
      width: '100%',
      borderBottom: darkMode ? '1px solid #444' : '1px solid #e9ecef',
    },
    nameField: {
      flex: 1,
    },
    verticalDivider: {
      width: '1px',
      backgroundColor: darkMode ? '#444' : '#e9ecef',
      margin: '10px 0',
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      backgroundImage: `url(${require('../assets/Library_scene.JPG')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background-color 0.3s, color 0.3s',
      width: '100%',
    },
    glassWrapper: {
      background: darkMode ? "rgba(30, 30, 30, 0.45)" : "rgba(255, 255, 255, 0.45)",
      backdropFilter: "blur(12px)",
      borderRadius: "20px",
      padding: "clamp(20px, 5vw, 40px)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.4)",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '500px',
    },
    title: {
      color: darkMode ? '#f5f5f5' : "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "0 0 30px 0",
      fontSize: "45px",
      fontWeight: "600",
      width: "fit-content"
    },
    inputField: {
      width: '100%',
      padding: '20px',
      border: 'none',
      outline: 'none',
      fontSize: '1rem',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background-color 0.3s, color 0.3s',
      '&::placeholder': {
        color: darkMode ? '#aaa' : '#666',
      },
    },
    firstField: {
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px',
    },
    lastField: {
      borderBottomLeftRadius: '15px',
      borderBottomRightRadius: '15px',
    },
    registerButton: {
      width: '100%',
      maxWidth: '400px',
      padding: '15px',
      backgroundColor: 'rgba(28, 168, 70, 0.9)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.3rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    inputContainer: {
      border: darkMode ? '1px solid #444' : '1px solid rgba(114, 113, 113, 0.2)',
      borderRadius: '25px',
      margin: '0 0 30px 0',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      transition: 'border-color 0.3s, background-color 0.3s',
    },
    errorMessage: {
      backgroundColor: darkMode ? 'rgba(58, 26, 26, 0.8)' : 'rgba(255, 235, 238, 0.9)',
      color: darkMode ? '#ff6b6b' : '#c00',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      border: darkMode ? '1px solid #5c2a2a' : 'none',
      boxSizing: 'border-box'
    },
    successMessage: {
      backgroundColor: darkMode ? 'rgba(26, 58, 26, 0.8)' : 'rgba(238, 255, 238, 0.9)',
      color: darkMode ? '#6bff6b' : '#0a0',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      border: darkMode ? '1px solid #2a5c2a' : 'none',
      boxSizing: 'border-box'
    },
    linkText: {
      textAlign: 'center',
      marginTop: '20px',
      color: darkMode ? '#bbb' : '#444',
      fontSize: '14px',
    },
    link: {
      color: 'rgba(28, 168, 70, 0.9)',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  };

  const { register, handleSubmit: handleFormSubmit, formState: { errors: formErrors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    const { firstName, lastName, email, password } = data;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(responseData.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgb(102, 102, 102)',
    }}>
      <Header />
      <div style={styles.container}>
        <div style={styles.glassWrapper}>
          <h1 style={styles.title}>Register</h1>

          {error && <div style={styles.errorMessage}>{error}</div>}
          {success && <div style={styles.successMessage}>{success}</div>}

          {/* Validation Errors */}
          {(Object.keys(formErrors).length > 0) && (
            <div style={styles.errorMessage}>
              {Object.values(formErrors).map((err, index) => (
                <div key={index}>{err.message}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleFormSubmit(onSubmit)} style={{ width: '100%', maxWidth: '400px' }}>
            <div style={styles.inputContainer}>
              <div style={styles.nameContainer}>
                <div style={styles.nameField}>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="First Name"
                    {...register("firstName", { required: "First Name is required" })}
                    style={{ ...styles.inputField, ...styles.firstField, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
                  />
                </div>
                <div style={styles.verticalDivider}></div>
                <div style={styles.nameField}>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Last Name"
                    {...register("lastName", { required: "Last Name is required" })}
                    style={{ ...styles.inputField, ...styles.firstField, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}
                  />
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgb(68, 68, 68)' }} />
              <input
                type="email"
                placeholder="Email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^@\s]+@sfsu\.edu$/i,
                    message: "Email must be a valid SFSU email address (e.g., username@sfsu.edu)"
                  },
                  validate: {
                    notEmptyUsername: value => {
                      const parts = value.split('@');
                      return (parts[0] && parts[0].trim() !== '') || "Email must have a username before @sfsu.edu";
                    }
                  }
                })}
                style={styles.inputField}
                disabled={isLoading}
              />
              <div style={{ borderTop: '1px solid rgb(68, 68, 68)' }} />
              <input
                type="password"
                placeholder="Create Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long"
                  },
                  validate: {
                    hasNumber: value => /\d/.test(value) || "Password must contain at least 1 number"
                  }
                })}
                style={{ ...styles.inputField, ...styles.lastField }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              style={{
                ...styles.registerButton,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(6, 141, 1, 0.7)')}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(28, 168, 70, 0.9)')}
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>

            <div style={styles.linkText}>
              Already have an account?{' '}
              <span
                style={styles.link}
                onClick={() => !isLoading && (window.location.href = '/login')}
              >
                Login here
              </span>
            </div>
          </form>
        </div>
      </div>
      <Footer style={{ marginTop: 'auto' }} />
    </div>
  );
};

export default RegisterPage;
