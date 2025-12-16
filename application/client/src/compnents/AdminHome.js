import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import Header from './Header';
import ProfileBg from '../assets/Pinning Ceremony.jpg';

const AdminHome = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(darkMode);

  useEffect(() => {
    setIsDarkMode(darkMode);
  }, [darkMode]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth <= 768;

  // Search state
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('searchQuery');
    return saved || '';
  });

  const [searchCategory, setSearchCategory] = useState(() => {
    const saved = localStorage.getItem('searchCategory');
    return saved || 'default';
  });

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchText = searchQuery.trim();
    // Only update localStorage when there's an actual search query
    if (searchText) {
      localStorage.setItem('searchQuery', searchText);
      localStorage.setItem('searchCategory', searchCategory);
    } else {
      // Clear the search from localStorage if the search is empty
      localStorage.removeItem('searchQuery');
      localStorage.removeItem('searchCategory');
    }

    const apiBaseUrl = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

    const typeMap = {
      'tutor': 'tutor',
      'course': 'course',
      'default': 'all'
    };

    const searchType = typeMap[searchCategory] || 'all';

    try {
      let results = [];

      if (searchType === 'tutor' || searchType === 'all') {
        const params = new URLSearchParams({
          limit: 20,
          offset: 0,
          ...(searchText && { q: searchText })
        });

        const response = await fetch(
          `${apiBaseUrl}/api/search/tutors?${params.toString()}`
        );
        const data = await response.json();
        results = [...results, ...(data.items || []).map(item => ({ _kind: 'tutor', ...item }))];
      }

      if (searchType === 'course' || searchType === 'all') {
        const params = new URLSearchParams({
          limit: 20,
          offset: 0,
          ...(searchText && { q: searchText })
        });

        const response = await fetch(
          `${apiBaseUrl}/api/search/courses?${params.toString()}`
        );
        const data = await response.json();
        results = [...results, ...(data.items || []).map(item => ({ _kind: 'course', ...item }))];
      }

      navigate(`/search?q=${encodeURIComponent(searchText)}&type=${searchType}`, {
        state: { results }
      });

    } catch (error) {
      console.error('Search error:', error);
      navigate(`/search?q=${encodeURIComponent(searchText)}&type=${searchType}`, {
        state: { error: error.message || 'Failed to fetch search results' }
      });
    }
  };

  const toggleCategory = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };

  const selectCategory = (category) => {
    setSearchCategory(category);
    localStorage.setItem('searchCategory', category);
    setIsCategoryOpen(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: darkMode
        ? 'linear-gradient(36deg, rgba(8, 8, 8, 1) 17%, rgba(15, 15, 15, 1) 29%, rgba(22, 22, 22, 1) 46%, rgba(23, 23, 23, 1) 68%, rgba(23, 23, 23, 1) 68%, rgba(26, 26, 26, 1) 77%, rgba(28, 28, 28, 1) 80%, rgba(33, 33, 33, 1) 85%, rgba(34, 34, 34, 1) 84%, rgba(37, 37, 37, 1) 87%, rgba(42, 42, 42, 1) 89%, rgba(49, 49, 49, 1) 93%, rgba(51, 51, 51, 1) 100%, rgba(54, 54, 54, 1) 98%, rgba(52, 52, 52, 1) 99%, rgba(70, 70, 70, 1) 100%, rgba(61, 61, 61, 1) 100%)'
        : 'transparent',

      color: isDarkMode ? '#e6e6e6' : '#2c3e50',
      transition: 'all 0.3s ease'
    },
    content: {
      flex: 1,
      padding: "clamp(10px, 2vw, 20px)",
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
      backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.0)' : '#f8f9fa',
      //backdropFilter: 'blur(13.9px)',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(250px, 30vw, 300px), 1fr))',
      gap: "clamp(15px, 2vw, 20px)",
      width: '100%',
    },
    card: {
      display: 'flex',
      alignItems: 'center',
      padding: "clamp(15px, 2vw, 20px)",
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(6.8px)',
      WebkitBackdropFilter: 'blur(6.8px)',
      border: 'none',
      textDecoration: 'none',
      color: isDarkMode ? '#e6e6e6' : '#2c3e50',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      ':hover': {
        background: 'rgba(255, 255, 255, 0.25)',
        transform: 'translateY(-3px)',
        boxShadow: '0 6px 35px rgba(0, 0, 0, 0.15)',
      }
    },
    iconWrapper: {
      width: "clamp(40px, 5vw, 50px)",
      height: "clamp(40px, 5vw, 50px)",
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: "clamp(12px, 1.5vw, 15px)",
      flexShrink: 0,
      fontSize: "clamp(1.1rem, 1.5vw, 1.3rem)",
    },
    cardTitle: {
      fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
      fontWeight: '600',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      lineHeight: '1.4',
    },
    primaryButton: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(6.8px)',
      WebkitBackdropFilter: 'blur(6.8px)',
      border: '1px solid rgba(255, 255, 255, 0.49)',
      color: 'white',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: '500',
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        boxShadow: '0 6px 35px rgba(0, 0, 0, 0.15)',
      },
      ':active': {
        transform: 'translateY(1px)',
      }
    },
    heading: {
      color: isDarkMode ? '#e6e6e6' : '#2c3e50',
      textAlign: "center",
      padding: "0px",
      borderBottom: isMobile ? "2px solid rgb(255, 220, 112)" : "4px solid rgb(255, 220, 112)",
      display: "inline-block",
      margin: isMobile ? "10px auto" : "20px auto",
      fontSize: isMobile ? "28px" : "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
    },
    navButton: {
      backgroundColor: 'rgb(53, 0, 109)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#7a1a3d'
      }
    },
    searchContainer: {
      backgroundColor: isDarkMode ? 'rgb(80, 80, 80)' : '#fff',
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      boxSizing: 'border-box',
      width: '100%',
      margin: '0 0 20px 0',
      position: 'relative'
    },
    searchInputContainer: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: '8px',
      marginTop: '10px'
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      fontSize: '16px',
      '&:focus': {
        outline: 'none',
        borderColor: '#9A2250',
        boxShadow: '0 0 0 0.2rem rgba(154, 34, 80, 0.25)'
      }
    },
    searchButton: {
      padding: '12px 24px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(6.8px)',
      WebkitBackdropFilter: 'blur(6.8px)',
      border: '1px solid rgba(255, 255, 255, 0.49)',
      color: 'white',
      cursor: 'pointer',
      width: isMobile ? '100%' : 'auto',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.25)',
      }
    },
    categoryDropdown: {
      position: 'relative',
      display: 'inline-block',
      minWidth: isMobile ? '100%' : '120px',
      width: isMobile ? '100%' : '120px'
    },
    categoryButton: {
      padding: '12px 16px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      '&:hover': {
        backgroundColor: '#e9ecef'
      }
    },
    categoryList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      width: '100%',
      padding: '8px 8px',
      margin: '4px 0 0',
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,.15)',
      borderRadius: '6px',
      boxShadow: '0 6px 12px rgba(0,0,0,.175)',
      listStyle: 'none',
      '& li': {
        padding: '8px 16px',
        cursor: 'pointer',
        textAlign: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        ':hover': {
          backgroundColor: '#f8f9fa',
          cursor: 'pointer !important'
        }
      }
    },

  };


  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Admin Dashboard</h1>

      <div style={styles.content}>
        {/* User Profile Section */}
        <div style={{
          backgroundImage: `url("${ProfileBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px',
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: "clamp(20px, 3vw, 30px)",
          border: isDarkMode ? '1px solid #2a2a4a' : '1px solid #f0f0f0',
          width: '100%',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glass Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(200, 200, 200, 0.49)',
            borderRadius: '16px',
            zIndex: 1
          }}></div>

          {/* Content */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: "clamp(20px, 3vw, 40px)",
            padding: "clamp(20px, 3vw, 30px)",
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: user ? '#f0f7ff' : '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                overflow: 'hidden',
                border: `2px solid ${user ? '#d0e3ff' : '#e9ecef'}`
              }}>
                {user?.firstName && user?.lastName ? (
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '600',
                    color: '#9A2250',
                    textTransform: 'uppercase'
                  }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                ) : (
                  <i className="fas fa-user" style={{
                    fontSize: '36px',
                    color: '#9A2250',
                    opacity: 0.7
                  }}></i>
                )}
              </div>

              <h3 style={{
                margin: '8px 0 6px',
                color: isDarkMode ? '#e6e6e6' : (user ? '#2c3e50' : '#6c757d'),
                fontSize: '1.5rem',
                textAlign: 'center',
                fontWeight: user ? '600' : '500',
                transition: 'all 0.3s ease'
              }}>
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Welcome User' : 'Welcome to Gator Tutor'}
              </h3>

              <div style={{
                backgroundColor: '#9A2250',
                color: 'white',
                padding: '6px 18px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginTop: '8px',
                letterSpacing: '0.3px',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Administrator
              </div>
            </div>
          </div>
        </div>


        {/* Admin Tools Sections */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '30px' }}>

          {/* Management Section */}
          <div>
            <h2 style={{
              fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
              color: isDarkMode ? '#e0e0e0' : '#444',
              marginBottom: '15px',
              borderLeft: isDarkMode ? '4px solid rgb(255, 220, 112)' : '4px solid rgb(53, 0, 109)',
              paddingLeft: '10px'
            }}>
              User & Course Management
            </h2>
            <div style={styles.gridContainer}>
              {[
                {
                  title: 'Registered Tutors',
                  icon: 'chalkboard-teacher',
                  path: '/search',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                },
                {
                  title: 'Registered Students',
                  icon: 'user-graduate',
                  path: '/admin/registered-students',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                },
                {
                  title: 'Course Catalog',
                  icon: 'book',
                  path: '/admin/course-catalog',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                }
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  style={styles.card}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{ ...styles.iconWrapper, backgroundColor: isDarkMode ? 'rgba(255, 220, 112, 0.15)' : 'rgba(53, 0, 109, 0.15)', color: item.color }}>
                    <i className={`fas fa-${item.icon}`}></i>
                  </div>
                  <span style={styles.cardTitle}>{item.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Applications Section */}
          <div>
            <h2 style={{
              fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
              color: isDarkMode ? '#e0e0e0' : '#444',
              marginBottom: '15px',
              borderLeft: isDarkMode ? '4px solid rgb(255, 220, 112)' : '4px solid rgb(53, 0, 109)',
              paddingLeft: '10px'
            }}>
              Applications & Requests
            </h2>
            <div style={styles.gridContainer}>
              {[
                {
                  title: 'Tutor Applications',
                  icon: 'file-signature',
                  path: '/admin/tutor-applications',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                },
                {
                  title: 'Tutor Course Addition Requests',
                  icon: null,
                  customIcon: 'TCA',
                  path: '/admin/tutor-course-applications',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                },
                {
                  title: 'Course Coverage Requests',
                  icon: 'clipboard-list',
                  path: '/admin/coverage-requests',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                }
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  style={styles.card}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{ ...styles.iconWrapper, backgroundColor: isDarkMode ? 'rgba(255, 220, 112, 0.15)' : 'rgba(53, 0, 109, 0.15)', color: item.color }}>
                    {item.customIcon ? (
                      <span style={{ fontFamily: 'inherit', fontWeight: '700', fontSize: 'inherit' }}>{item.customIcon}</span>
                    ) : (
                      <i className={`fas fa-${item.icon}`}></i>
                    )}
                  </div>
                  <span style={styles.cardTitle}>{item.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Reports & Communication Section */}
          <div>
            <h2 style={{
              fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
              color: isDarkMode ? '#e0e0e0' : '#444',
              marginBottom: '15px',
              borderLeft: isDarkMode ? '4px solid rgb(255, 220, 112)' : '4px solid rgb(53, 0, 109)',
              paddingLeft: '10px'
            }}>
              Reports & Communication
            </h2>
            <div style={styles.gridContainer}>
              {[
                {
                  title: 'Submitted Reports',
                  icon: 'chart-bar',
                  path: '/reports',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                },
                {
                  title: 'Messages',
                  icon: 'envelope',
                  path: '/messages',
                  color: isDarkMode ? 'rgb(255, 220, 112)' : 'rgb(53, 0, 109)'
                }
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  style={styles.card}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{ ...styles.iconWrapper, backgroundColor: isDarkMode ? 'rgba(255, 220, 112, 0.15)' : 'rgba(53, 0, 109, 0.15)', color: item.color }}>
                    <i className={`fas fa-${item.icon}`}></i>
                  </div>
                  <span style={styles.cardTitle}>{item.title}</span>
                </a>
              ))}
            </div>
          </div>

        </div>


        {/* Search Section - Now full width - Hidden for admin users */}
        {user?.role !== 'admin' && <div style={{
          width: '100%',
          maxWidth: '1000px',
          margin: '20px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            ...styles.searchContainer,
            width: '100%',
            margin: 0,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
            border: isDarkMode ? '1px solid #2a2a4a' : '1px solid #f0f0f0',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              margin: "0 0 15px 0",
              color: isDarkMode ? '#e6e6e6' : '#2c3e50',
              transition: 'all 0.3s ease'
            }}>Find Tutors & Courses</h3>
            <div style={styles.searchInputContainer}>
              <div style={styles.categoryDropdown}>
                <button
                  style={{
                    ...styles.categoryButton,
                    backgroundColor: isDarkMode ? '#1f4068' : '#f8f9fa',
                    borderColor: isDarkMode ? '#2a2a4a' : '#ddd',
                    color: isDarkMode ? '#e6e6e6' : '#2c3e50',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={toggleCategory}
                >
                  {searchCategory === 'default' ? 'All' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)} ▼
                </button>
                {isCategoryOpen && (
                  <ul style={{
                    ...styles.categoryList,
                    backgroundColor: isDarkMode ? '#1f4068' : 'white',
                    color: isDarkMode ? '#e6e6e6' : '#2c3e50',
                    border: isDarkMode ? '1px solid #2a2a4a' : '1px solid rgba(0,0,0,.15)',
                    boxShadow: isDarkMode ? '0 6px 12px rgba(0,0,0,0.3)' : '0 6px 12px rgba(0,0,0,.175)',
                    transition: 'all 0.3s ease'
                  }}>
                    <li
                      onClick={() => selectCategory('default')}
                      style={{ cursor: 'pointer' }}
                    >All</li>
                    <li
                      onClick={() => selectCategory('tutor')}
                      style={{ cursor: 'pointer' }}
                    >Tutors</li>
                    <li
                      onClick={() => selectCategory('course')}
                      style={{ cursor: 'pointer' }}
                    >Courses</li>
                  </ul>
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder={searchCategory === 'default' ? 'Search for tutors or courses...' : `Search ${searchCategory}s...`}
                style={{
                  ...styles.searchInput,
                  backgroundColor: isDarkMode ? '#1a1a2e' : '#fff',
                  borderColor: isDarkMode ? '#2a2a4a' : '#ddd',
                  color: isDarkMode ? '#e6e6e6' : '#2c3e50',
                  transition: 'all 0.3s ease'
                }}
              />
              <button
                style={{
                  backgroundColor: '#35006D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b1a80';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#35006D';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(1px)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={handleSearch}
              >
                <i className="fas fa-search"></i>
                Search
              </button>
            </div>
          </div>
        </div>}
      </div>
      <Footer />
    </div >
  );
};

export default AdminHome;
