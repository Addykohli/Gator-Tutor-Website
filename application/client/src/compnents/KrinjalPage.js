
import React from 'react';
import Footer from './Footer';
import Header from './Header';

function KrinjalPage() {
  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>Krinjal Basnet</h1>

        <div style={styles.content}>
          <div style={styles.imageContainer}>
            <img
              src={require('../assets/Krinjal_profile_image.png')}
              alt="Krinjal Basnet"
              style={styles.profileImage}
            />
          </div>

          <div style={styles.details}>
            <div style={styles.detailItem}>
              <i className="fas fa-briefcase" style={styles.icon}></i>
              <span>Frontend Developer</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-phone" style={styles.icon}></i>
              <span>(555) 123-4567</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-envelope" style={styles.icon}></i>
              <span>kbasnet1@sfsu.edu</span>
            </div>

            <div style={styles.aboutSection}>
              <h2 style={styles.sectionTitle}>About Me</h2>
              <p style={styles.aboutText}>
                I am a Computer Science student with a deep passion for cybersecurity, and real-world problem solving. I enjoy building practical solutions and working on diverse projects — from web development to backend architecture. I’m always looking to collaborate, learn, and grow as a future technologist and entrepreneur.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    color: '#333',
    textAlign: 'center',
    paddingBottom: '3px',
    borderBottom: '4px solid #9A2250',
    display: 'block',
    margin: '20px auto',
    fontSize: '45px',
    fontWeight: '600',
    width: 'fit-content',
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '40px',
    marginTop: '20px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    },
  },
  imageContainer: {
    flex: '0 0 250px',
    display: 'flex',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '100%',
      maxWidth: '300px',
    },
  },
  profileImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  details: {
    flex: 1,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    fontSize: '20px',
    '@media (max-width: 768px)': {
      justifyContent: 'center',
      textAlign: 'center',
      flexDirection: 'column',
      gap: '5px',
    },
  },
  icon: {
    width: '28px',
    marginRight: '15px',
    color: '#9A2250',
    fontSize: '24px',
  },
  aboutSection: {
    margin: '30px 0',
    '@media (max-width: 768px)': {
      textAlign: 'center',
    },
  },
  sectionTitle: {
    color: '#333',
    fontSize: '28px',
    marginBottom: '20px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f0f0f0',
  },
  aboutText: {
    lineHeight: '1.8',
    color: '#555',
    fontSize: '18px',
    marginTop: '10px',
    '@media (max-width: 480px)': {
      fontSize: '16px',
    },
  },
};

export default KrinjalPage;
