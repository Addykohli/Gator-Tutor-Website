import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
    },
    title: {
        color: "#333",
        textAlign: "center",
        paddingBottom: "3px",
        borderBottom: "8px solid #9A2250",
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
      border: '1px solid rgba(114, 113, 113, 0.39)',
      borderRadius: '25px',
      margin: '60px 0px 40px 0px',
      overflow: 'hidden',
    },
    errorMessage: {
      backgroundColor: '#fee',
      color: '#c00',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
    },
    successMessage: {
      backgroundColor: '#efe',
      color: '#0a0',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
    },
    linkText: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#666',
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

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
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
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Register</h1>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ ...styles.inputField, ...styles.firstField }}
              required
              disabled={isLoading}
            />
            <div style={{ borderTop: '1px solid #e9ecef' }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputField}
              required
              disabled={isLoading}
            />
            <div style={{ borderTop: '1px solid #e9ecef' }} />
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
      <Footer />
    </div>
  );
};

export default RegisterPage;
