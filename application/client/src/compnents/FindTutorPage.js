import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

const FindTutorPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
    },
    heading: {
      color: "#333",
      textAlign: "center",
      padding: "0px",
      borderBottom: "4px solid #9A2250",
      display: "inline-block",
      margin: "20px auto",
      fontSize: "45px",
      fontWeight: "600",
      lineHeight: "1.2",
      position: "relative"
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      width: '100%',
    },
    searchSection: {
      display: 'flex',
      gap: '16px',
      marginBottom: '32px',
      maxWidth: '600px',
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '16px',
      fontFamily: 'inherit',
    },
    searchButton: {
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      padding: '12px 32px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    },
    resultsTitle: {
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '24px',
      color: '#2c3e50',
    },
    tutorsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px',
    },
    tutorCard: {
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '24px',
      transition: 'box-shadow 0.2s',
    },
    tutorHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    tutorAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: '#35006D',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    tutorName: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '4px',
      color: '#2c3e50',
    },
    tutorRating: {
      color: '#FFCF01',
      fontSize: '14px',
    },
    sectionLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px',
      fontWeight: '500',
    },
    courseBadge: {
      display: 'inline-block',
      backgroundColor: '#FFCF01',
      color: '#35006D',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      margin: '4px',
    },
    availabilityBadge: {
      display: 'inline-block',
      border: '1px solid #35006D',
      color: '#35006D',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      margin: '4px',
    },
    tutorActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
    },
    contactButton: {
      flex: 1,
      backgroundColor: '#35006D',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    },
    bookButton: {
      flex: 1,
      backgroundColor: '#FFCF01',
      color: '#35006D',
      border: 'none',
      padding: '10px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    },
    noResults: {
      textAlign: 'center',
      padding: '48px',
      backgroundColor: '#fafafa',
      borderRadius: '8px',
      maxWidth: '600px',
    },
    noResultsTitle: {
      fontSize: '20px',
      marginBottom: '16px',
      color: '#2c3e50',
    },
    requestButton: {
      backgroundColor: '#FFCF01',
      color: '#35006D',
      border: 'none',
      padding: '12px 32px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      marginTop: '16px',
    },
  };

  // Mock tutor data
  const mockTutors = [
    {
      id: "1",
      name: "John Doe",
      email: "john@sfsu.edu",
      courses: ["CSC 415", "CSC 510"],
      rating: 5,
      availability: ["Mon 10:00-12:00", "Wed 14:00-16:00", "Fri 10:00-12:00"]
    },
    {
      id: "2",
      name: "John Smith",
      email: "smith@sfsu.edu",
      courses: ["CSC 415", "CSC 600"],
      rating: 4,
      availability: ["Tue 09:00-11:00", "Thu 13:00-15:00"]
    },
    {
      id: "3",
      name: "Jane Wilson",
      email: "jane@sfsu.edu",
      courses: ["BIOL 101", "BIOL 202"],
      rating: 5,
      availability: ["Mon 14:00-16:00", "Wed 10:00-12:00"]
    }
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const searchTutors = () => {
    console.log('Searching for:', searchQuery);
    
    if (!searchQuery.trim()) {
      setSearchResults(mockTutors);
    } else {
      const searchTerm = searchQuery.toLowerCase().trim();
      const results = mockTutors.filter(tutor =>
        tutor.courses.some(course =>
          course.toLowerCase().includes(searchTerm)
        )
      );
      setSearchResults(results);
    }
    setHasSearched(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchTutors();
    }
  };

  const handleContact = (tutor) => {
    alert(`Contact ${tutor.name} at ${tutor.email}`);
  };

  const handleBook = (tutor) => {
    console.log('Book session with:', tutor.name);
    alert(`Booking feature coming soon for ${tutor.name}!`);
  };

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={styles.heading}>Find A Tutor</h1>
      
      <div style={styles.content}>
        <div style={styles.searchSection}>
          <input
            type="text"
            placeholder="Enter course code (e.g., CSC 415)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.searchInput}
          />
          <button 
            onClick={searchTutors}
            style={styles.searchButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#52247F'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#35006D'}
          >
            Search
          </button>
        </div>

        {hasSearched && (
          <h2 style={styles.resultsTitle}>
            Search Results: {searchQuery || 'All Tutors'}
          </h2>
        )}

        {hasSearched && searchResults.length === 0 ? (
          <div style={styles.noResults}>
            <h3 style={styles.noResultsTitle}>
              No Tutors Found {searchQuery}
            </h3>
            <p>Tip: We will notify tutors for coverage</p>
            <button 
              style={styles.requestButton}
              onClick={() => window.location.href = '/coverage-request'}
            >
              Request course coverage
            </button>
          </div>
        ) : hasSearched ? (
          <div style={styles.tutorsGrid}>
            {searchResults.map((tutor) => (
              <div key={tutor.id} style={styles.tutorCard}>
                <div style={styles.tutorHeader}>
                  <div style={styles.tutorAvatar}>
                    {getInitials(tutor.name)}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={styles.tutorName}>{tutor.name}</div>
                    <div style={styles.tutorRating}>
                      {renderStars(tutor.rating)} ({tutor.rating}/5)
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <div style={styles.sectionLabel}>Courses</div>
                  <div>
                    {tutor.courses.map((course, idx) => (
                      <span key={idx} style={styles.courseBadge}>{course}</span>
                    ))}
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <div style={styles.sectionLabel}>Availability</div>
                  <div>
                    {tutor.availability.slice(0, 3).map((slot, idx) => (
                      <span key={idx} style={styles.availabilityBadge}>{slot}</span>
                    ))}
                    {tutor.availability.length > 3 && (
                      <span style={styles.availabilityBadge}>
                        +{tutor.availability.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.tutorActions}>
                  <button
                    style={styles.contactButton}
                    onClick={() => handleContact(tutor)}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#52247F'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#35006D'}
                  >
                    Contact
                  </button>
                  <button
                    style={styles.bookButton}
                    onClick={() => handleBook(tutor)}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#FFCF01'}
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
};

export default FindTutorPage;
