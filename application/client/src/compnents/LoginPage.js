import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import Header from './Header';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, darkMode } = useAuth();
  const navigate = useNavigate();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: 'calc(100vh - 120px)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      background: darkMode 
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 53%, rgba(23, 23, 23, 1) 36%, rgba(28, 28, 28, 1) 63%, rgba(33, 33, 33, 1) 70%, rgba(34, 34, 34, 1) 75%, rgba(37, 37, 37, 1) 80%, rgba(42, 42, 42, 1) 85%, rgba(52, 52, 52, 1) 99%, rgba(49, 49, 49, 1) 90%, rgba(51, 51, 51, 1) 93%, rgba(53, 53, 53, 1) 95%, rgba(54, 54, 54, 1) 98%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)' 
        : '#fff',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background 0.3s, color 0.3s',
      boxSizing: 'border-box',
      width: '100%',
    },
    title: {
      color: darkMode ? '#f5f5f5' : "#333",
      textAlign: "center",
      padding: "0px",
      borderBottom: "4px solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: "20px auto",
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
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      color: darkMode ? '#f5f5f5' : '#333',
      transition: 'background-color 0.3s, color 0.3s',
      '&:focus': {
        backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
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
      border: darkMode ? '1px solid #444' : '1px solid rgba(114, 113, 113, 0.39)',
      borderRadius: '15px',
      margin: '60px 0px 40px 0px',
      overflow: 'hidden',
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
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
      backgroundColor: 'rgba(28, 168, 70, 0.8)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.3rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email.endsWith('@sfsu.edu')) {
      setError('Please use your SFSU email address');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Get user details after successful login
      const userResponse = await fetch(`http://localhost:8000/api/users/${data.user_id}`);
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      // Determine user role
      const userRole = userData.role || 'student';
      
      // Login user in context
      const loginSuccess = await login({
        id: data.user_id,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: email,
        isTutor: userRole === 'tutor' || userRole === 'both',
        role: userRole,
        authToken: data.token || null
      });
      
      if (loginSuccess) {
        // Redirect based on user role
        if (userData.role === 'admin') {
          navigate('/admin');
        } else if (userData.role === 'tutor' || userData.role === 'both') {
          navigate('/');
        } else {
          navigate('/');
        }
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
      backgroundColor: darkMode ? '#121212' : '#fff',
    }}>
      <Header />
      <main style={styles.container}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <div style={styles.inputContainer}>
          <input
            type="email"
            placeholder="SFSU Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...styles.inputField, ...styles.usernameField }}
            required
          />
          <div style={styles.divider} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.inputField, ...styles.passwordField }}
            minLength="6"
            required
          />
        </div>
        <button 
          type="submit" 
          style={{
            ...styles.loginButton,
            backgroundColor: isLoading ? 'rgba(255, 210, 76, 0.8)' : 'rgba(255, 220, 112, 0.8)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(244, 205, 86, 0.7)')}
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
            backgroundColor: darkMode ? '#3a1a1a' : '#ffebee',
            borderRadius: '4px',
            width: '100%',
            border: darkMode ? '1px solid #5c2a2a' : 'none',
            textAlign: 'center'
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
                fontWeight: '500',
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
      </main>
      <Footer style={{ marginTop: 'auto' }} />
    </div>
  );
};

export default LoginPage;
