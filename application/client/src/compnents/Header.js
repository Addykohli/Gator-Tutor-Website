import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerContent = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '250px',
    width: '100%',
    margin: '0',
    gap: '5px',
    padding: isMobile ? '0 0px' : '0 0px',
  };

  const navButtonStyle = {
    color: 'black',
    textDecoration: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '400',
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid black',
    background: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    margin: '0 4px'
  };
  
  const dividerStyle = {
    color: 'rgba(0, 0, 0, 0.3)',
    margin: '0 8px',
    userSelect: 'none'
  };

  const classTitle = {
    padding: '0px 0px 0px 10px',
    margin: '0 0 0 0px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'normal',
    textAlign: isMobile ? 'center' : 'left',
    color: 'inherit',
    '&:hover': {
      color: '#9A2250',
      textDecoration: 'underline'
    }
  };

  const headerStyle = {
    backgroundColor: '#231161',
    color: 'white',
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '10px 10px' : '10px',
    boxSizing: 'border-box',
    width: '100%',
    position: 'relative',
  };

  const navBarStyle = {
    backgroundColor: 'rgb(255, 220, 112)',
    height: '45px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const menuButtonStyle = {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: 'black',
    border: '1px solid black',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    zIndex: 1001,
    whiteSpace: 'nowrap',
    marginRight: '20px',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)'
    }
  };

  // Overlay style for when menu is open
  const overlayStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    opacity: isMenuOpen ? 1 : 0,
    visibility: isMenuOpen ? 'visible' : 'hidden',
    transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
  };

  // Sidebar menu style
  const sidebarStyle = {
    position: 'fixed',
    top: '0',
    left: isMenuOpen ? '0' : '-300px',
    width: '280px',
    height: '100vh',
    backgroundColor: '#FFDC70',
    zIndex: 1001,
    transition: 'left 0.3s ease-in-out',
    paddingTop: '200px', // Space for header
    overflowY: 'auto',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
  };

  // Close button style
  const closeButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
    '&:hover': {
      color: '#9A2250'
    }
  };

  const menuItemStyle = {
    display: 'block',
    width: '100%',
    margin: '0 auto',
    padding: '15px 25px',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(0,0,0,0.0)',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'black',
    textDecoration: 'none',
    boxSizing: 'border-box',
    transition: 'background-color 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  return (
    <>
      <header style={headerStyle}>
        <div style={headerContent}>
          <button 
            onClick={() => navigate('/')}
            style={classTitle}
          >
            <img 
              src={require('../assets/gator icon logo.png')} 
              alt="Gator Tutor Logo" 
              style={{ height: '100px', width: 'auto' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </button>
        </div>
      </header>
      <div style={navBarStyle}>
        <button 
          style={menuButtonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={toggleMenu}
        >
          <i className="fas fa-bars" style={{ marginRight: '8px' }}></i>
          Menu
        </button>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            style={navButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
            Login
          </button>
          <span style={dividerStyle}>|</span>
          <button 
            style={navButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
          >
            <i className="fas fa-pen-to-square" style={{ marginRight: '8px' }}></i>
            Sign Up
          </button>
        </div>
      </div>
      
      {/* Overlay */}
      <div 
        style={overlayStyle}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Sidebar Menu */}
      <div style={sidebarStyle}>
        <button 
          style={closeButtonStyle}
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        >
          &times;
        </button>
        <nav style={{ padding: '20px 0' }}>
          <button 
            style={{
              ...menuItemStyle,
              display: 'flex',
              alignItems: 'center',
              padding: '15px 30px',
              width: '100%',
              textAlign: 'left',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => {
              navigate('/');
              setIsMenuOpen(false);
            }}
          >
            <i className="fas fa-home" style={{ marginRight: '12px', width: '24px', textAlign: 'center' }}></i>
            Dashboard
          </button>
          <button 
            style={{
              ...menuItemStyle,
              display: 'flex',
              alignItems: 'center',
              padding: '15px 30px',
              width: '100%',
              textAlign: 'left',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => {
              navigate('/messages');
              setIsMenuOpen(false);
            }}
          >
            <i className="fas fa-envelope" style={{ marginRight: '12px', width: '24px', textAlign: 'center' }}></i>
            Message
          </button>
          <button 
            style={{
              ...menuItemStyle,
              display: 'flex',
              alignItems: 'center',
              padding: '15px 30px',
              width: '100%',
              textAlign: 'left',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => {
              navigate('/request-coverage');
              setIsMenuOpen(false);
            }}
          >
            <i className="fas fa-book" style={{ marginRight: '12px', width: '24px', textAlign: 'center' }}></i>
            Request course coverage
          </button>
        </nav>
      </div>
    </>
);

};

export default Header;
