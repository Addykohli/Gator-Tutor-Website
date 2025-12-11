import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const { isAuthenticated, user, logout, darkMode, toggleDarkMode } = useAuth();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isCompact, setIsCompact] = useState(window.innerWidth <= 768);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 430);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const logoutRef = useRef(null);

  // Scroll detection state
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('none'); // 'up', 'down', or 'none'
  const [shouldShowFixed, setShouldShowFixed] = useState(false); // Whether to show fixed header (sliding in from top)
  const HEADER_HEIGHT = 70; // Height threshold for when header is considered "scrolled past"

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
        // When scrolling down, header should be relative (scroll away naturally)
        setShouldShowFixed(false);
        // Close menu when scrolling down
        if (currentScrollY > HEADER_HEIGHT) {
          setIsMenuOpen(false);
          setIsLocked(false);
        }
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
        // When scrolling UP and we're past the header, show fixed header
        if (currentScrollY > HEADER_HEIGHT) {
          setShouldShowFixed(true);
        }
      }

      // If we're at the top, reset to normal state
      if (currentScrollY < 10) {
        setScrollDirection('none');
        setShouldShowFixed(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const menuItems = [
    { icon: 'fas fa-home', label: 'Dashboard', path: '/' },
    { icon: 'fas fa-search', label: user?.role === 'admin' ? 'Tutors' : 'Find', path: '/search' },
    { icon: 'fas fa-envelope', label: 'Message', path: '/messages' },
    {
      icon: 'fas fa-book',
      label: 'Request Course Coverage',
      path: '/request-coverage',
      hideForAdmin: true
    },
    {
      icon: 'fas fa-chalkboard',
      label: 'Sessions',
      path: '/sessions',
      hideForAdmin: true
    },
    // Tutor-only menu items
    {
      icon: 'fas fa-calendar-check',
      label: 'Appointment Requests',
      path: '/appointment-requests',
      tutorOnly: true
    }
  ];

  const isExpanded = isMenuOpen || isLocked;

  // Dynamic dimensions based on screen size
  const buttonWidth = isCompact ? 90 : 100;
  // Ensure the expanded menu touches the left edge by matching the container padding
  const leftShift = isCompact ? 10 : 20;
  // Calculate top shift to touch the top edge (Header is 60px, Button is 40px, so 10px gap)
  const topShift = 10;

  const expandedWidth = buttonWidth + (isCompact ? 45 : 55);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsCompact(window.innerWidth <= 768);
      setIsSmallScreen(window.innerWidth < 430);
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
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: 'rgb(255, 220, 112)',
  };

  // Filter menu items based on authentication, role, and permissions
  const filteredMenuItems = menuItems.filter(item => {
    // Hide items marked for admin users
    if (user?.role === 'admin' && item.hideForAdmin) return false;
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
    top: isExpanded ? `-${topShift}px` : '0',
    left: isExpanded ? `-${leftShift}px` : '0',
    width: isExpanded ? `${expandedWidth}px` : `${buttonWidth}px`,
    height: isExpanded ? `${dynamicHeight}px` : '40px',
    border: '1px solid rgb(255, 220, 112)',
    borderRadius: isExpanded ? '0px 0px 8px 8px' : '4px',
    background: 'linear-gradient(90deg, rgb(53, 0, 109) 0%, rgb(45, 0, 84) 100%)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    transition: `all 0.25s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s`,
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
      backgroundColor: isExpanded ? 'transparent' : 'rgb(255, 220, 112)',
      borderRadius: isExpanded ? '6px' : '1px',
      transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`,
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
    transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`,
  });

  const getIconStyle = (index) => ({
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
    transition: `all 0.25s cubic-bezier(0.4, 0, 0.2, 1) ${0.1 + index * 0.06}s`,
    color: 'rgb(255, 220, 112)',
    fontSize: '14px',
  });

  const getLabelStyle = (index) => ({
    marginLeft: '8px',
    color: 'rgb(255, 220, 112)',
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-30px)',
    transition: `all 0.25s cubic-bezier(0.4, 0, 0.2, 1) ${0.15 + index * 0.06}s`,
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

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };


  // Determine if we're at the top of the page
  const isAtTop = lastScrollY < 10;

  return (
    <>
      <div
        className="header-container"
        style={{
          // Key behavior:
          // - At top OR scrolling down: relative (scrolls with page naturally)
          // - Scrolling up (past header): fixed, slides in from top
          position: shouldShowFixed ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          transform: shouldShowFixed ? 'translateY(0)' : 'none',
          transition: shouldShowFixed ? 'transform 0.3s ease-in-out' : 'none',
          zIndex: 1000
        }}
      >
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
                      e.currentTarget.style.backgroundColor = 'rgba(255, 220, 112, 0.1)';
                      setIsMenuOpen(true);
                      setHoveredIndex(visualIndex);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isExpanded) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      setHoveredIndex(null);
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
          left: isMobile ? '50%' : '210px',
          transform: 'translateX(-50%)',
          zIndex: 99,
        }}>
          <button onClick={() => navigate('/')} style={classTitle}>
            <img
              src={require('../assets/gator icon logo.png')}
              alt="Gator Tutor Logo"
              style={{ height: '45px', width: 'auto' }}
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
          paddingRight: isMobile ? '0px' : '10px',
          zIndex: 99,
        }}>
          {isMobile ? (
            <>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="settings-btn"
              >
                <i className="fas fa-cog"></i>
              </button>

              {isSettingsOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(3px)'
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setIsSettingsOpen(false);
                  }}
                >
                  <div style={{
                    backgroundColor: 'rgb(35, 17, 97)',
                    padding: '30px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    alignItems: 'center',
                    border: '1px solid rgb(255, 220, 112)',
                    minWidth: '200px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}>
                    {/* Dark Mode Toggle */}
                    <div
                      style={{ ...toggleContainerStyle, margin: 0 }}
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
                          className="header-btn auth-btn"
                          style={{ width: '100%', justifyContent: 'center', margin: 0 }}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/login');
                            setIsSettingsOpen(false);
                          }}
                        >
                          <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }} />
                          Login
                        </button>
                        <button
                          className="header-btn auth-btn"
                          style={{ width: '100%', justifyContent: 'center', margin: 0 }}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/register');
                            setIsSettingsOpen(false);
                          }}
                        >
                          <i className="fas fa-pen-to-square" style={{ marginRight: '8px' }} />
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <button
                        className="header-btn"
                        style={{ width: '100%', justifyContent: 'center', margin: 0 }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogoutConfirm();
                          setIsSettingsOpen(false);
                        }}
                      >
                        <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }} />
                        Logout
                      </button>
                    )}

                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      style={{
                        marginTop: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 220, 112, 0.7)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'underline'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
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
                    className="header-btn auth-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                  >
                    <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }} />
                    Login
                  </button>
                  <button
                    className="header-btn auth-btn"
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
                <div className="logout-container" ref={logoutRef}>
                  <button
                    className="header-btn"
                    onClick={handleLogoutClick}
                  >
                    <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }} />
                    Logout
                  </button>

                  {showLogoutConfirm && (
                    <div className="logout-confirm-dropdown">
                      <p className="logout-confirm-text">Are you sure you want to logout?</p>
                      <div className="logout-confirm-actions">
                        <button
                          onClick={handleLogoutConfirm}
                          className="logout-confirm-yes"
                        >
                          Yes, Logout
                        </button>
                        <button
                          onClick={handleLogoutCancel}
                          className="logout-confirm-no"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Spacer to prevent content overlap - only needed when header is fixed */}
      {shouldShowFixed && <div style={{ height: '60px' }} />}
    </>
  );
};

export default Header;