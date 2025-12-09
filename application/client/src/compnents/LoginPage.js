import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import Header from './Header';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, darkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundImage: `url(${require('../assets/Library_scene.JPG')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background 0.3s, color 0.3s',
      boxSizing: 'border-box',
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
      padding: "0px",
      borderBottom: "4px solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: "0 0 30px 0",
      fontSize: "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
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
      '&:focus': {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.5)' : '#fff',
      },
    },
    usernameField: {
      borderBottom: darkMode ? '1px solid #444' : '1px solid #e9ecef',
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px',
    },
    passwordField: {
      borderBottomLeftRadius: '15px',
      borderBottomRightRadius: '15px',
    },
    inputContainer: {
      border: darkMode ? '1px solid #444' : '1px solid rgba(114, 113, 113, 0.2)',
      borderRadius: '15px',
      margin: '0 0 30px 0',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      transition: 'border-color 0.3s, background-color 0.3s',
    },
    divider: {
      borderTop: darkMode ? '1px solid #444' : '1px solid #e9ecef',
      width: '100%',
      transition: 'border-color 0.3s'
    },
    loginButton: {
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
  };

  const { register, handleSubmit: handleFormSubmit, formState: { errors: formErrors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);

    const { email, password } = data;

    try {
      const apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed');
      }

      // Get user details after successful login
      const userResponse = await fetch(`${apiBaseUrl}/api/users/${responseData.user_id}`);
      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details');
      }

      // Determine user role
      const userRole = userData.role || 'student';

      // Login user in context
      const loginSuccess = await login({
        id: responseData.user_id,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: email,
        isTutor: userRole === 'tutor' || userRole === 'both',
        role: userRole,
        authToken: responseData.token || null
      });

      if (loginSuccess) {
        // Redirection is handled by the PublicRoute component based on authentication state
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
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
      <main style={styles.container}>
        <div style={styles.glassWrapper}>
          <h1 style={styles.title}>Login</h1>
          <form onSubmit={handleFormSubmit(onSubmit)} style={{ width: '100%', maxWidth: '400px' }}>
            <div style={styles.inputContainer}>
              <input
                type="email"
                placeholder="SFSU Email"
                {...register("email", {
                  required: "SFSU Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@sfsu\.edu$/,
                    message: "Please use your SFSU email address (@sfsu.edu)"
                  }
                })}
                style={{ ...styles.inputField, ...styles.usernameField }}
              />
              <div style={styles.divider} />
              <input
                type="password"
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                style={{ ...styles.inputField, ...styles.passwordField }}
              />
            </div>

            {/* Form Validation Errors */}
            {(formErrors.email || formErrors.password) && (
              <div style={{
                color: '#d32f2f',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: darkMode ? 'rgba(58, 26, 26, 0.8)' : 'rgba(255, 235, 238, 0.9)',
                borderRadius: '6px',
                width: '100%',
                border: darkMode ? '1px solid #5c2a2a' : 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
                fontSize: '0.9rem'
              }}>
                {formErrors.email?.message || formErrors.password?.message}
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.loginButton,
                backgroundColor: isLoading ? 'rgba(255, 210, 76, 0.8)' : 'rgba(255, 220, 112, 0.8)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'rgb(35, 17, 97)'
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(244, 205, 86, 0.9)')}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(255, 220, 112, 0.8)')}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            {error && (
              <div style={{
                color: '#d32f2f',
                marginTop: '15px',
                padding: '10px',
                backgroundColor: darkMode ? 'rgba(58, 26, 26, 0.8)' : 'rgba(255, 235, 238, 0.9)',
                borderRadius: '6px',
                width: '100%',
                border: darkMode ? '1px solid #5c2a2a' : 'none',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p>Don't have an account?{' '}
                <a
                  href="/register"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>
      <Footer style={{ marginTop: 'auto' }} />
    </div>
  );
};

export default LoginPage;
