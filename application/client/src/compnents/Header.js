import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/Context';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const { isAuthenticated, user, logout, darkMode, toggleDarkMode } = useAuth();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const menuItems = [
    { icon: 'fas fa-home', label: 'Dashboard', path: '/' },
    { icon: 'fas fa-search', label: 'Find', path: '/search' },
    { icon: 'fas fa-envelope', label: 'Message', path: '/messages' },
    { icon: 'fas fa-book', label: 'Request Course Coverage', path: '/request-coverage' },
    { icon: 'fas fa-user-check', label: 'Sessions', path: '/sessions' },
    // Tutor-only menu items
    {
      icon: 'fas fa-calendar-check',
      label: 'Appointment Requests',
      path: '/appointment-requests',
      tutorOnly: true
    }
  ];

  const isExpanded = isMenuOpen || isLocked;

  const buttonWidth = 100;
  const expandedWidth = buttonWidth + 55;
  const leftShift = 20;

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

  const toggleContainerStyle = {
    position: 'relative',
    width: '50px',
    height: '24px',
    backgroundColor: darkMode ? 'rgb(255, 220, 112)' : 'rgba(255, 220, 112, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    border: '1px solid rgb(255, 220, 112)',
    margin: '0 8px'
  };

  const toggleCircleStyle = {
    position: 'absolute',
    top: '2px',
    left: darkMode ? '26px' : '2px',
    width: '18px',
    height: '18px',
    backgroundColor: 'rgb(255, 220, 112)',
    borderRadius: '50%',
    transition: 'left 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  const toggleIconStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '10px',
    color: 'rgb(35, 17, 97)',
    transition: 'opacity 0.3s ease'
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
    padding: '0 20px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 100,
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 0px 8px',
  };

  const menuWrapperStyle = {
    position: 'relative',
    zIndex: 1001,
    height: '40px',
  };

  // Hover area that covers both button and dropdown
  const hoverAreaStyle = {
    position: 'absolute',
    top: '0px',
    left: isExpanded ? `-${leftShift}px` : '0',
    width: isExpanded ? `${expandedWidth}px` : `${buttonWidth}px`,
    height: isExpanded ? '220px' : '40px',
    zIndex: 999,
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    color: 'rgb(255, 220, 112)',
  };

  // Filter menu items based on authentication and tutor status
  const filteredMenuItems = menuItems.filter(item => {
    // Show all items that are not tutor-only
    if (!item.tutorOnly) return true;
    // Show tutor-only items only if user is authenticated and is a tutor
    return isAuthenticated && user?.isTutor;
  });

  // Calculate dynamic height based on number of visible menu items
  const menuItemHeight = 54; // height per menu item in pixels
  const menuPadding = 58; // top and bottom padding
  const dynamicHeight = (filteredMenuItems.length * menuItemHeight) + menuPadding;

  const borderContainerStyle = {
    position: 'absolute',
    top: isExpanded ? '-8px' : '0',
    left: isExpanded ? `-${leftShift}px` : '0',
    width: isExpanded ? `${expandedWidth}px` : `${buttonWidth}px`,
    height: isExpanded ? `${dynamicHeight}px` : '40px',
    border: '1px solid rgb(255, 220, 112)',
    borderRadius: isExpanded ? '0px 0px 8px 8px' : '4px',
    backgroundColor: isExpanded ? 'rgb(35, 17, 97)' : 'transparent',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    zIndex: 1000,
    boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
    color: 'rgb(255, 220, 112)',
  };

  const menuButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'rgb(255, 220, 112)',
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
    width: `${buttonWidth}px`,
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
    color: 'rgb(255, 220, 112)',
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
    left: isExpanded ? `-${leftShift - 8}px` : '8px',
    height: '1px',
    backgroundColor: 'rgba(0,0,0,0.15)',
    opacity: isExpanded ? 1 : 0,
    transition: 'all 0.3s ease 0.2s',
    transformOrigin: 'left',
    zIndex: 1003,
    width: isExpanded ? `${expandedWidth - 16}px` : '0px',
    color: 'rgb(255, 220, 112)',
  };

  const getMenuItemStyle = (index) => {
    const collapsedTop = 12 + (index * 6);
    const expandedTop = 48 + (index * 54);
    const itemWidth = expandedWidth - 16; // 124px with 8px padding each side

    return {
      position: 'absolute',
      left: isExpanded ? `-${leftShift - 8}px` : '12px',
      display: 'flex',
      alignItems: 'center',
      top: isExpanded ? `${expandedTop}px` : `${collapsedTop}px`,
      width: isExpanded ? `${itemWidth}px` : '18px',
      height: isExpanded ? '46px' : '2px',
      color: 'rgb(255, 220, 112)',
      backgroundColor: isExpanded ? 'rgba(255, 220, 112, 0.2)' : 'rgb(255, 220, 112)',
      borderRadius: isExpanded ? '6px' : '1px',
      transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
      cursor: isExpanded ? 'pointer' : 'default',
      overflow: 'hidden',
      border: 'none',
      padding: isExpanded ? '6px' : '0',
      boxSizing: 'border-box',
      pointerEvents: isExpanded ? 'auto' : 'none',
      zIndex: 1001,
      opacity: isExpanded ? 1 : (index < 3 ? 1 : 0),
    };
  };

  const getIconContainerStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isExpanded ? '22px' : '18px',
    height: isExpanded ? '22px' : '2px',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
  });

  const getIconStyle = (index) => ({
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
    transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.2 + index * 0.1}s`,
    color: 'rgb(255, 220, 112)',
    fontSize: '14px',
  });

  const getLabelStyle = (index) => ({
    marginLeft: '8px',
    color: 'rgb(255, 220, 112)',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-30px)',
    transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.25 + index * 0.1}s`,
    whiteSpace: 'normal',
    lineHeight: '1.2',
    textAlign: 'left',
    wordBreak: 'break-word',
    flex: 1,
  });

  const getDividerStyle = (index) => ({
    position: 'absolute',
    left: isExpanded ? `-${leftShift - 8}px` : '8px',
    top: `${94 + index * 54}px`,
    height: '1px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scaleX(1)' : 'scaleX(0)',
    transition: `all 0.3s ease ${0.35 + index * 0.05}s`,
    transformOrigin: 'left',
    width: isExpanded ? `${expandedWidth - 16}px` : '0px',
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
        {filteredMenuItems.map((item, index) => {
          // Recalculate the visual index for dividers to account for filtered items
          const visualIndex = menuItems.findIndex(i => i.path === item.path);
          return (
            <React.Fragment key={item.path}>
              <button
                style={getMenuItemStyle(visualIndex)}
                onMouseEnter={(e) => {
                  if (isExpanded) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
                    setIsMenuOpen(true);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isExpanded) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 220, 112, 0.2)';
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
                <div style={getIconContainerStyle(visualIndex)}>
                  <i className={item.icon} style={getIconStyle(visualIndex)} />
                </div>
                <span style={getLabelStyle(visualIndex)}>{item.label}</span>
              </button>

              {/* Only show divider if not the last item */}
              {index < filteredMenuItems.length - 1 && (
                <div key={`divider-${index}`} style={getDividerStyle(visualIndex)} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Logo */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        left: '210px',
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

      {/* Auth buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto',
        paddingRight: '10px',
        zIndex: 99,
      }}>
        {/* Dark Mode Toggle */}
        <div
          style={toggleContainerStyle}
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div style={toggleCircleStyle}>
            <i
              className={darkMode ? 'fas fa-moon' : 'fas fa-sun'}
              style={{
                ...toggleIconStyle,
                left: darkMode ? '4px' : '4px'
              }}
            />
          </div>
        </div>

        {!isAuthenticated ? (
          <>
            <button
              style={navButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(255, 220, 112)';
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
                e.currentTarget.style.backgroundColor = 'rgb(255, 220, 112)';
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
          </>
        ) : (
          <button
            style={navButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(255, 220, 112)';
              e.currentTarget.style.color = 'rgb(35, 17, 97)';
              e.currentTarget.style.border = '1px solid rgb(35, 17, 97)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgb(255, 220, 112)';
              e.currentTarget.style.border = '1px solid rgb(255, 220, 112)';
            }}
            onClick={async (e) => {
              e.preventDefault();

              // Show confirmation dialog
              const confirmLogout = window.confirm('Are you sure you want to log out?');

              if (confirmLogout) {
                try {
                  logout();
                  // Redirect to login page after logout
                  navigate('/login');
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }} />
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;