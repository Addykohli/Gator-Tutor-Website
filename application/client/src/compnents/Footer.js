import React from 'react';

const Footer = () => {
  const styles = {
    footer: {
      marginTop: '20px',
      backgroundColor: '#666666',
      color: 'white',
      padding: '40px 0px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '30px',
    },
    footerSection: {
      flex: '1',
      minWidth: '200px',
      padding: '0px',
      textAlign: 'center',
    },
    logoContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
    },
    sectionTitle: {
      color: 'white',
      marginBottom: '15px',
      fontSize: '1.2rem',
      fontWeight: '500',
    },
    addressContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    logo: {
      height: '90px',
      width: 'auto',
    },
    address: {
      fontSize: '14px',
      lineHeight: '1.5',
      margin: 0,
    },
    socialIcons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '10px',
    },
    icon: {
      fontSize: '24px',
      color: 'white',
      transition: 'color 0.3s ease',
      '&:hover': {
        color: '#9A2250',
      },
    },
  };

  return (
    <footer style={styles.footer}>
      {/* Logo Section */}
      <div style={styles.footerSection}>
        <div style={styles.logoContainer}>
          <img 
            src={require('../assets/logo bw.png')} 
            alt="TutorMe Logo" 
            style={styles.logo}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = ''; // Fallback if image fails to load
            }}
          />
        </div>
      </div>

      {/* Address Section */}
      <div style={styles.footerSection}>
        <div style={styles.addressContainer}>
          <h3 style={styles.sectionTitle}>Contact Us</h3>
          <p style={styles.address}>
            123 Education Street<br />
            San Francisco, CA 94132<br />
            (555) 123-4567
          </p>
        </div>
      </div>

      {/* Social Icons Section */}
      <div style={{...styles.footerSection, textAlign: 'center'}}>
        <h3 style={styles.sectionTitle}>Follow Us</h3>
        <div style={styles.socialIcons}>
          <a 
            href="https://www.facebook.com/people/Software-Engineering-Team08/61583430222270/?mibextid=wwXIfr" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.icon}
            aria-label="Facebook"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a 
            href="https://www.instagram.com/thegatortutor/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.icon}
            aria-label="Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a 
            href="https://x.com/GatorTutor" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.icon}
            aria-label="Twitter"
          >
            <i className="fab fa-twitter"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
