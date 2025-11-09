import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  // Load search state from localStorage on component mount
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('searchQuery');
    return saved || '';
  });
  
  // Update search query in state and localStorage
  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    localStorage.setItem('searchQuery', value);
  };
  
  const [searchCategory, setSearchCategory] = useState(() => {
    const saved = localStorage.getItem('searchCategory');
    return saved || 'default';
  });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const navigate = useNavigate();
  const categoryRef = useRef(null);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Save search query to localStorage
    localStorage.setItem('searchQuery', searchQuery);
    
    // Determine API base URL
    const apiBaseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : '/api';
    
    // Map searchCategory to API type parameter
    const typeMap = {
      'tutor': 'tutor',
      'course': 'course',
      'default': 'all'
    };
    
    const searchType = typeMap[searchCategory] || 'all';
    
    try {
      let results = [];
      
      if (searchType === 'tutor') {
        // Call /api/search/tutors
        const response = await fetch(
          `${apiBaseUrl}/search/tutors?q=${encodeURIComponent(searchQuery)}&limit=20&offset=0`
        );
        const data = await response.json();
        results = data.items.map(item => ({ _kind: 'tutor', ...item }));
      } 
      else if (searchType === 'course') {
        // Call /api/search/courses
        const response = await fetch(
          `${apiBaseUrl}/search/courses?q=${encodeURIComponent(searchQuery)}&limit=20&offset=0`
        );
        const data = await response.json();
        results = data.items.map(item => ({ _kind: 'course', ...item }));
      } 
      else {
        // type === 'all' - Call /api/search/all
        const response = await fetch(
          `${apiBaseUrl}/search/all?q=${encodeURIComponent(searchQuery)}&limit=20&offset=0`
        );
        const data = await response.json();
        
        // Merge tutors and courses
        results = [
          ...(data.tutors || []).map(item => ({ _kind: 'tutor', ...item })),
          ...(data.courses || []).map(item => ({ _kind: 'course', ...item }))
        ];
        
        // Log result counts for debugging
        console.log(`Found ${data.tutor_total || 0} tutors and ${data.course_total || 0} courses`);
      }
      
      // Navigate to SearchPage with query parameters and results
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`, {
        state: { results }
      });
      
    } catch (error) {
      console.error('Search error:', error);
      // Navigate with error state
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`, {
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


  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Handle window resize and load saved search state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // Load saved search state if it exists
    const savedQuery = localStorage.getItem('searchQuery');
    const savedCategory = localStorage.getItem('searchCategory');
    
    if (savedQuery) setSearchQuery(savedQuery);
    if (savedCategory) setSearchCategory(savedCategory);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerContent = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    maxWidth: '1200px',
    width: '100%',
    margin: '0px',
    gap: isMobile ? '15px' : '20px',
    padding: isMobile ? '50px 0px 20px 0px' : '0px 0px 20px 0px',
    textAlign: isMobile ? 'center' : 'left',
  };

  // Search container style
  const searchContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '20px',
    flex: isMobile ? '1 1 100%' : '0 1 auto',
    maxWidth: isMobile ? '100%' : '400px',
  };

  // Category dropdown styles
  const categoryDropdownStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  const categoryButtonStyle = {
    padding: '0 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ced4da',
    borderRight: 'none',
    borderRadius: isCategoryOpen ? '10px 10px 0px 0px' : '10px',
    cursor: 'pointer',
    minWidth: '90px',
    height: '38px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:hover': {
      backgroundColor: '#e9ecef',
    },
  };

  const categoryListStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ced4da',
    borderRadius: ' 0px 0px 4px 4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: isCategoryOpen ? 'block' : 'none',
    width: '100%',
    boxSizing: 'border-box',
    listStyle: 'none',
    margin: 0,
    padding: 0,

  };

  const categoryItemStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: 'white',
    color: 'black',
    textAlign: 'left',
    width: '100%',
    border: 'none',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  };

  // Search input style
  const searchInputStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px 0px 0px 10px',
    minWidth: '100px',
    height: '38px',
    boxSizing: 'border-box',
    fontSize: '16px',
    '&:focus': {
      outline: 'none',
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  };

  // Search button style
  const searchButtonStyle = {
    padding: '0 20px',
    backgroundColor: 'rgb(255, 255, 255)',
    border: 'none',
    color: 'gray',
    borderRadius: '0px 10px 10px 0px',
    cursor: 'pointer',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
    '& i': {
      fontSize: '18px',
    }
  };

  const loginLinkStyle = {
    position: 'absolute',
    top: '20px',
    right: '40px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    zIndex: 1,
    display: isMobile ? 'block' : 'inline-block',
    margin: isMobile ? '10px auto' : '0',
    textAlign: isMobile ? 'center' : 'left',
    width: isMobile ? 'fit-content' : 'auto',
    '&:hover': {
      textDecoration: 'underline',
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
  };

  const classTitle = {
    margin: 0,
    fontSize: 'clamp(20px, 3vw, 40px)',
    fontWeight: '500',
    padding: '0px 0px 0px 20px',
    whiteSpace: 'normal',
    textAlign: isMobile ? 'center' : 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    '&:hover': {
      color: '#9A2250',
      textDecoration: 'underline'
    }
  };

  const infoSection = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '500px',
    margin: isMobile ? '8px auto 0px' : '8px 0px 0px 10%',
    padding: '0 20px',
    color: 'rgba(255, 255, 255, 0.9)'
  };

  const headerStyle = {
    backgroundColor: '#231161',
    color: 'white',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '20px 10px' : '20px',
    boxSizing: 'border-box',
    width: '100%',
    position: 'relative',
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
    justifyContent: 'space-between',
  };

  const menuButtonStyle = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'black',
    border: '1px solid black',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    zIndex: 1001,
    whiteSpace: 'nowrap',
  };

  const dropdownMenuStyle = {
    position: 'relative',
    backgroundColor: '#FFDC70',
    borderTop: isMenuOpen ? '1px solid black' : 'none',
    borderBottom: isMenuOpen ? '10px solid #FFDC70' : 'none',
    width: '100%',
    zIndex: 10,
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
        <a 
          href="/login" 
          style={loginLinkStyle}
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
          Login
        </a>
        <div style={headerContent}>
          <button 
            onClick={() => navigate('/')}
            style={classTitle}
          >
            SOFTWARE ENGINEERING CLASS SFSU
          </button>

          <div style={infoSection}>
            <span>Fall 2025</span>
            <span style={{ opacity: 0.7 }}>|</span>
            <span>Section 01</span>
            <span style={{ opacity: 0.7 }}>|</span>
            <span>Team 8</span>
          </div>
        </div>
      </header>
      <div style={navBarStyle}>
        <div style={searchContainerStyle}>
          <div style={categoryDropdownStyle} ref={categoryRef}>
            <button 
              style={categoryButtonStyle}
              onClick={toggleCategory}
            >
              {searchCategory === 'default' ? 'Filter' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)} ▼
            </button>
            <ul style={categoryListStyle}>
              <li>
                <button 
                  style={categoryItemStyle}
                  onClick={() => selectCategory('default')}
                >
                  Default
                </button>
              </li>
              <li>
                <button 
                  style={categoryItemStyle}
                  onClick={() => selectCategory('course')}
                >
                  Course
                </button>
              </li>
              <li>
                <button 
                  style={categoryItemStyle}
                  onClick={() => selectCategory('tutor')}
                >
                  Tutor
                </button>
              </li>
            </ul>
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder={searchCategory === 'default' ? 'Search...' : `Search ${searchCategory}...`}
              style={{ ...searchInputStyle, flex: 1 }}
            />
            <button 
              type="button" 
              style={searchButtonStyle}
              onClick={handleSearch}
            >
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
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
