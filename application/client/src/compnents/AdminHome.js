import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/Context';
import Footer from './Footer';
import Header from './Header';

const AdminHome = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(darkMode);

  useEffect(() => {
    setIsDarkMode(darkMode);
  }, [darkMode]);
  
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

    const apiBaseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : '/api';
    
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
          `${apiBaseUrl}/search/tutors?${params.toString()}`
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
          `${apiBaseUrl}/search/courses?${params.toString()}`
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
      backgroundColor: isDarkMode ? 'rgb(30, 30, 30)' : '#f8f9fa',
      color: isDarkMode ? '#e6e6e6' : '#2c3e50',
      transition: 'all 0.3s ease'
    },
    content: {
      flex: 1,
      padding: '5px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
      backgroundColor: isDarkMode ? 'rgb(30, 30, 30)' : '#f8f9fa',
    },
    primaryButton: {
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
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: '#4b1a80',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      },
      ':active': {
        transform: 'translateY(1px)',
      }
    },
    heading: {
      color: isDarkMode ? '#e6e6e6' : '#2c3e50',
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
      alignItems: 'center',
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
      backgroundColor: 'rgb(53, 0, 109)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#7a1a3d'
      }
    },
    categoryDropdown: {
      position: 'relative',
      display: 'inline-block',
      minWidth: '120px',
      width: '120px'
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
          backgroundColor: isDarkMode ? 'rgb(80, 80, 80)' : '#fff',
          borderRadius: '12px',
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
          padding: '24px',
          marginBottom: '20px',
          border: isDarkMode ? '1px solid #2a2a4a' : '1px solid #f0f0f0',
          width: '100%',
          maxWidth: '1000px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: '20px',
            marginBottom: '20px',
            borderBottom: '1px solid #f0f0f0',
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
          
          {/* Admin Tools Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px',
            width: '100%',
            marginTop: '20px'
          }}>
            {[
              { 
                title: 'Registered Tutors', 
                icon: 'chalkboard-teacher',
                path: '/admin/registered-tutors',
                color: '#4e73df'
              },
              { 
                title: 'Registered Students', 
                icon: 'user-graduate',
                path: '/admin/registered-students',
                color: '#1cc88a'
              },
              { 
                title: 'Tutor Applications', 
                icon: 'file-signature',
                path: '/admin/tutor-applications',
                color: '#f6c23e'
              },
              { 
                title: 'Reports', 
                icon: 'chart-bar',
                path: '/admin/reports',
                color: '#e74a3b'
              },
              { 
                title: 'Tutor Course Addition Applications', 
                icon: 'plus-circle',
                path: '/admin/tutor-course-applications',
                color: '#36b9cc'
              },
              { 
                title: 'Course Coverage Requests', 
                icon: 'book-reader',
                path: '/admin/course-coverage-requests',
                color: '#6f42c1'
              },
              { 
                title: 'Messages', 
                icon: 'envelope',
                path: '/messages',
                color: '#fd7e14'
              }
            ].map((item, index) => (
              <a 
                key={index}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: isDarkMode ? '#1f4068' : 'white',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isDarkMode ? '#e6e6e6' : '#2c3e50',
                  transition: 'all 0.3s ease',
                  border: isDarkMode ? '1px solid #2a2a4a' : '1px solid #f0f0f0'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.backgroundColor = `${item.color}08`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = isDarkMode ? '#2a2a4a' : '#f0f0f0';
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#1f4068' : 'white';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0,
                  color: item.color,
                  fontSize: '1.1rem'
                }}>
                  <i className={`fas fa-${item.icon}`}></i>
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Search Section - Now full width */}
        <div style={{ 
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminHome;
