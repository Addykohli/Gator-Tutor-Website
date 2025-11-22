import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const menuItems = [
    { icon: 'fas fa-home', label: 'Dashboard', path: '/' },
    { icon: 'fas fa-envelope', label: 'Message', path: '/messages' },
    { icon: 'fas fa-book', label: 'Request Course Coverage', path: '/request-coverage' }
  ];

  const isExpanded = isMenuOpen || isLocked;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsLocked(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navButtonStyle = {
    color: 'rgb(255, 220, 112)',
    textDecoration: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '400',
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgb(255, 220, 112)',
    background: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    margin: '0 4px'
  };
  
  const dividerStyle = {
    color: 'rgba(255, 220, 112)',
    margin: '0 8px',
    userSelect: 'none'
  };

  const classTitle = {
    padding: '0px',
    margin: '0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'normal',
    textAlign: isMobile ? 'center' : 'left',
    color: 'inherit',
  };

  const navBarStyle = {
    backgroundColor: 'rgb(35, 17, 97)',
    height: '54px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 100,
  };

  const menuWrapperStyle = {
    position: 'relative',
    zIndex: 1001,
    height: '40px',
  };

  // Hover area that covers both button and dropdown
  const hoverAreaStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: isExpanded ? '200px' : '100px',
    height: isExpanded ? '220px' : '40px',
    zIndex: 999,
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const borderContainerStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: isExpanded ? '200px' : '100px',
    height: isExpanded ? '220px' : '40px',
    border: '1px solid rgb(255, 220, 112)',
    borderRadius: isExpanded ? '8px' : '4px',
    backgroundColor: isExpanded ? 'rgba(255, 220, 112, 0.98)' : 'transparent',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    zIndex: 1000,
    boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
  };

  const menuButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: isExpanded ? '#1e1b4b' : 'rgb(255, 220, 112)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 1002,
    whiteSpace: 'nowrap',
    transition: 'color 0.3s ease',
    position: 'relative',
    height: '40px',
    width: '100px',
  };

  const barsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '18px',
    height: '14px',
    marginRight: '10px',
    position: 'relative',
  };

  const getBarInButtonStyle = (index) => ({
    position: 'absolute',
    left: '0',
    top: `${index * 6}px`,
    width: '18px',
    height: '2px',
    backgroundColor: isExpanded ? 'transparent' : 'rgb(255, 220, 112)',
    borderRadius: '1px',
    transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`,
    transformOrigin: 'left center',
  });

  const headerDividerStyle = {
    position: 'absolute',
    top: '40px',
    left: '12px',
    height: '1px',
    backgroundColor: 'rgba(0,0,0,0.15)',
    opacity: isExpanded ? 1 : 0,
    transition: 'all 0.3s ease 0.2s',
    transformOrigin: 'left',
    zIndex: 1003,
    width: isExpanded ? '176px' : '0px',
  };

  const getMenuItemStyle = (index) => {
    const collapsedTop = 12 + (index * 6);
    const expandedTop = 48 + (index * 54);
    
    return {
      position: 'absolute',
      left: '12px',
      display: 'flex',
      alignItems: 'center',
      top: isExpanded ? `${expandedTop}px` : `${collapsedTop}px`,
      width: isExpanded ? '176px' : '18px',
      height: isExpanded ? '46px' : '2px',
      backgroundColor: isExpanded ? 'transparent' : 'rgb(255, 220, 112)',
      borderRadius: isExpanded ? '6px' : '1px',
      transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
      cursor: isExpanded ? 'pointer' : 'default',
      overflow: 'hidden',
      border: 'none',
      padding: isExpanded ? '8px' : '0',
      boxSizing: 'border-box',
      pointerEvents: isExpanded ? 'auto' : 'none',
      zIndex: 1001,
    };
  };

  const getIconContainerStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isExpanded ? '24px' : '18px',
    height: isExpanded ? '24px' : '2px',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
  });

  const getIconStyle = (index) => ({
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
    transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.2 + index * 0.1}s`,
    color: '#1e1b4b',
    fontSize: '16px',
  });

  const getLabelStyle = (index) => ({
    marginLeft: '10px',
    color: '#1e1b4b',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-30px)',
    transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.25 + index * 0.1}s`,
    whiteSpace: 'normal',
    lineHeight: '1.2',
    textAlign: 'left',
    wordBreak: 'break-word',
  });

  const getDividerStyle = (index) => ({
    position: 'absolute',
    left: '12px',
    top: `${94 + index * 54}px`,
    height: '1px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scaleX(1)' : 'scaleX(0)',
    transition: `all 0.3s ease ${0.35 + index * 0.05}s`,
    transformOrigin: 'left',
    width: isExpanded ? '176px' : '0px',
    pointerEvents: 'none',
  });

  const handleMouseEnter = () => {
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setIsMenuOpen(false);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    setIsLocked(!isLocked);
    if (!isLocked) {
      setIsMenuOpen(true);
    }
  };

  return (
    <div style={navBarStyle}>
      {/* Menu Container */}
      <div ref={menuRef} style={menuWrapperStyle}>
        {/* Invisible hover area */}
        <div 
          style={hoverAreaStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Expanding border */}
        <div style={borderContainerStyle} />

        {/* Divider between button and dropdown */}
        <div style={headerDividerStyle} />

        {/* Menu Button */}
        <button 
          style={menuButtonStyle}
          onClick={handleButtonClick}
          onMouseEnter={handleMouseEnter}
        >
          <div style={barsContainerStyle}>
            <span style={getBarInButtonStyle(0)} />
            <span style={getBarInButtonStyle(1)} />
            <span style={getBarInButtonStyle(2)} />
          </div>
          Menu
        </button>

        {/* Menu items */}
        {menuItems.map((item, index) => (
          <button
            key={item.path}
            style={getMenuItemStyle(index)}
            onMouseEnter={(e) => {
              if (isExpanded) {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
                setIsMenuOpen(true);
              }
            }}
            onMouseLeave={(e) => {
              if (isExpanded) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => {
              if (isExpanded) {
                navigate(item.path);
                setIsMenuOpen(false);
                setIsLocked(false);
              }
            }}
          >
            <div style={getIconContainerStyle(index)}>
              <i className={item.icon} style={getIconStyle(index)} />
            </div>
            <span style={getLabelStyle(index)}>{item.label}</span>
          </button>
        ))}

        {/* Item dividers */}
        {menuItems.slice(0, -1).map((_, index) => (
          <div key={`divider-${index}`} style={getDividerStyle(index)} />
        ))}
      </div>

      {/* Logo */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        position: 'absolute', 
        left: '14%', 
        transform: 'translateX(-50%)',
        zIndex: 99,
      }}>
        <button onClick={() => navigate('/')} style={classTitle}>
          <img 
            src={require('../assets/gator icon logo.png')} 
            alt="Gator Tutor Logo" 
            style={{ height: '40px', width: 'auto' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        </button>
      </div>

      {/* Login/Signup buttons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginLeft: 'auto',
        paddingRight: '10px',
        zIndex: 99,
      }}>
        <button 
          style={navButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 228, 147, 0.47)';
            e.currentTarget.style.color = 'rgb(35, 17, 97)';
            e.currentTarget.style.border = '1px solid rgb(35, 17, 97)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgb(255, 220, 112)';
            e.currentTarget.style.border = '1px solid rgb(255, 220, 112)';
          }}
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }} />
          Login
        </button>
        <span style={dividerStyle}>|</span>
        <button 
          style={navButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 228, 147, 0.47)';
            e.currentTarget.style.color = 'rgb(35, 17, 97)';
            e.currentTarget.style.border = '1px solid rgb(35, 17, 97)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgb(255, 220, 112)';
            e.currentTarget.style.border = '1px solid rgb(255, 220, 112)';
          }}
          onClick={(e) => {
            e.preventDefault();
            navigate('/register');
          }}
        >
          <i className="fas fa-pen-to-square" style={{ marginRight: '8px' }} />
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Header;