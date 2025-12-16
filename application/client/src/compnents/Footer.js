import React from 'react';

const Footer = () => {
  const styles = {
    footer: {
      marginTop: '0px',
      backgroundColor: '#666666',
      color: 'white',
      padding: '20px 0px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 'clamp(10px, 2vw, 30px)',
    },
    footerSection: {
      flex: '1',
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
      marginBottom: '10px',
      fontSize: 'clamp(0.6rem, 1.5vw, 1.5rem)',
      fontWeight: '500',
    },
    addressContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    logo: {
      height: 'clamp(40px, 10vw, 120px)',
      width: 'auto',
    },
    address: {
      fontSize: 'clamp(0.5rem, 1.2vw, 1rem)',
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
      fontSize: 'clamp(0.8rem, 2vw, 1.8rem)',
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
      <div style={{ ...styles.footerSection, textAlign: 'center' }}>
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
