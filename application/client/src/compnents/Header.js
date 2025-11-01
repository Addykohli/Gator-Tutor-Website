import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setShowPeople(false);
    }
  };

  const handlePeopleClick = (e) => {
    e.stopPropagation();
    setShowPeople(!showPeople);
  };


  const headerContent = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 40px',
    gap: '20px',
    padding: '20px 0',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      textAlign: 'center',
      gap: '15px',
    }
  };

  const classTitle = {
    margin: 0,
    fontSize: 'clamp(24px, 4vw, 45px)',
    fontWeight: '500',
    padding: '0 20px',
    whiteSpace: 'normal',
    textAlign: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    '&:hover': {
      color: '#9A2250',
      textDecoration: 'underline'
    },
    '@media (min-width: 769px)': {
      paddingLeft: '40px',
      textAlign: 'left',
    }
  };

  const divider = {
    height: '40px',
    width: '2px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    margin: '0 20px',
    '@media (max-width: 768px)': {
      height: '2px',
      width: '80%',
      margin: '10px 0',
    }
  };

  const infoSection = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0 20px',
    minWidth: 'fit-content',
    '@media (min-width: 769px)': {
      padding: '0 40px'
    }
  };

  const infoItem = {
    margin: 0,
    fontSize: '20px',
    fontWeight: '500',
  };
  const headerStyle = {
    backgroundColor: '#231161',
    color: 'white',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    width: '100%',
    '@media (max-width: 768px)': {
      padding: '20px 10px',
    }
  };

  const navBarStyle = {
    backgroundColor: 'rgb(255, 220, 112)',
    height: '60px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const menuButtonStyle = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'black',
    border: '1px solid black',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    position: 'absolute',
    right: '20px',
    zIndex: 1001,
  };

  const dropdownMenuStyle = {
    position: 'relative',
    backgroundColor: '#FFDC70',
    borderTop: isMenuOpen ? '1px solid black' : 'none',
    borderBottom: isMenuOpen ? '10px solid #FFDC70' : 'none',
    width: '100%',
    zIndex: 1000,
    maxHeight: isMenuOpen ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out'
  };

  const menuItemStyle = {
    display: 'block',
    width: '100%',
    margin: '0 auto',
    padding: '15px 20px',
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

  const subMenuStyle = {
    backgroundColor: 'white',
    width: '100%',
    display: showPeople ? 'block' : 'none'
  };

  const subMenuItemStyle = {
    ...menuItemStyle,
    paddingLeft: '50px',
    fontSize: '16px',
    textTransform: 'capitalize',
    letterSpacing: 'normal'
  };


  return (
    <div>
      <header style={headerStyle}>
        <div style={headerContent}>
          <button 
            onClick={() => navigate('/')}
            style={classTitle}
          >
            SOFTWARE ENGINEERING CLASS SFSU
          </button>
          <div style={divider}></div>
          <div style={infoSection}>
            <h2 style={infoItem}>Fall 2025</h2>
            <h3 style={infoItem}>Section 01</h3>
            <h3 style={infoItem}>Team 8</h3>
          </div>
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
      </div>
      <div style={dropdownMenuStyle}>
        <div style={{margin: '0 auto' }}>
        <button 
            style={menuItemStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => {
              navigate('/');
              setIsMenuOpen(false);
            }}
          >
            Home Page
          </button>
          <button 
            style={menuItemStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={() => {
              navigate('/people');
              setIsMenuOpen(false);
            }}
          >
            People Page
          </button>
          <button 
            style={menuItemStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            onClick={handlePeopleClick}
          >
            People ▼
          </button>
          <div style={subMenuStyle}>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/addy');
                setIsMenuOpen(false);
              }}
            >
              Addy
            </button>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/kojiro');
                setIsMenuOpen(false);
              }}
            >
              Kojiro
            </button>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/atharva');
                setIsMenuOpen(false);
              }}
            >
              Atharva
            </button>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/krinjal');
                setIsMenuOpen(false);
              }}
            >
              Krinjal
            </button>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/sonam');
                setIsMenuOpen(false);
              }}
            >
              Sonam
            </button>
            <button 
              style={subMenuItemStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/aketzali');
                setIsMenuOpen(false);
              }}
            >
              Aketzali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
