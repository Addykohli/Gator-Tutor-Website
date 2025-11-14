import React, { useState } from 'react';
import Footer from './Footer';
import Header from './Header';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '80vh',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
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
      '&:focus': {
        backgroundColor: '#f8f9fa',
      },
    },
    usernameField: {
      borderBottom: '1px solid #e9ecef',
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px',
    },
    passwordField: {
      borderBottomLeftRadius: '15px',
      borderBottomRightRadius: '15px',
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
    inputContainer: {
      border: '1px solid rgba(114, 113, 113, 0.39)',
      borderRadius: '25px',
      margin: '60px 0px 40px 0px',
      overflow: 'hidden',
    },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Login logic will be implemented here
    console.log('Login attempt with:', { username, password });
  };

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Login</h1>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...styles.inputField, ...styles.usernameField }}
            required
          />
          <div style={{ borderTop: '1px solid #e9ecef' }} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.inputField, ...styles.passwordField }}
            required
          />
        </div>
        <button 
          type="submit" 
          style={styles.loginButton}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 141, 1, 0.7)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(28, 168, 70, 0.8)'}
        >
          Login
        </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
