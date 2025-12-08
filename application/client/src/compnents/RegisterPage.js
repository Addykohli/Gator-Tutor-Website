import React, { useState} from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      minHeight: 'calc(100vh - 120px)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#121212' : '#fff',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background-color 0.3s, color 0.3s',
    },
    title: {
      color: darkMode ? '#f5f5f5' : "#333",
      textAlign: "center",
      paddingBottom: "3px",
      borderBottom: "8px solid rgb(255, 220, 112)",
      display: "block",
      margin: "20px auto",
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
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
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
      backgroundColor: 'rgba(28, 168, 70, 0.8)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.3rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    inputContainer: {
      border: darkMode ? '1px solid #444' : '1px solid rgba(114, 113, 113, 0.39)',
      borderRadius: '25px',
      margin: '60px 0px 40px 0px',
      overflow: 'hidden',
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      transition: 'border-color 0.3s, background-color 0.3s',
    },
    errorMessage: {
      backgroundColor: darkMode ? '#3a1a1a' : '#fee',
      color: darkMode ? '#ff6b6b' : '#c00',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      border: darkMode ? '1px solid #5c2a2a' : 'none',
    },
    successMessage: {
      backgroundColor: darkMode ? '#1a3a1a' : '#efe',
      color: darkMode ? '#6bff6b' : '#0a0',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      border: darkMode ? '1px solid #2a5c2a' : 'none',
    },
    linkText: {
      textAlign: 'center',
      marginTop: '20px',
      color: darkMode ? '#aaa' : '#666',
      fontSize: '14px',
    },
    link: {
      color: 'rgba(28, 168, 70, 0.8)',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate email format
    const emailRegex = /^[^@\s]+@sfsu\.edu$/i;
    if (!emailRegex.test(email)) {
      setError('Email must be a valid SFSU email address (e.g., username@sfsu.edu)');
      setIsLoading(false);
      return;
    }

    // Check if there's content before @
    const emailParts = email.split('@');
    if (emailParts[0].trim() === '') {
      setError('Email must have a username before @sfsu.edu');
      setIsLoading(false);
      return;
    }

    // Validate password requirements
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least 1 number');
      setIsLoading(false);
      return;
    }

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

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
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
      backgroundColor: darkMode ? '#121212' : '#fff',
    }}>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Register</h1>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
          <div style={styles.inputContainer}>
            <div style={styles.nameContainer}>
              <div style={styles.nameField}>
                <input
                  type="text"
                  id="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{...styles.inputField, ...styles.firstField, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none'}}
                  required
                />
              </div>
              <div style={styles.verticalDivider}></div>
              <div style={styles.nameField}>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{...styles.inputField, ...styles.firstField, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none'}}
                  required
                />
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgb(68, 68, 68)' }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputField}
              required
              disabled={isLoading}
            />
            <div style={{ borderTop: '1px solid rgb(68, 68, 68)' }} />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.inputField, ...styles.lastField }}
              required
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
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(28, 168, 70, 0.8)')}
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
      <Footer style={{ marginTop: 'auto' }} />
    </div>
  );
};

export default RegisterPage;
