import React from 'react';
import Header from './Header';

function SonamPage() {
  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>Sonam Tobgyal</h1>

        <div style={styles.content}>
          <div style={styles.imageContainer}>
            <img
              src={require("../assets/Sonam_profile_image.png")}
              alt="Sonam Tobgyal"
              style={styles.profileImage}
            />
          </div>

          <div style={styles.details}>
            <div style={styles.detailItem}>
              <i className="fas fa-briefcase" style={styles.icon}></i>
              <span>Github Master</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-phone" style={styles.icon}></i>
              <span>(510) 375-1236</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-envelope" style={styles.icon}></i>
              <span>stobgyal@sfsu.edu</span>
            </div>

            <div style={styles.aboutSection}>
              <h2 style={styles.sectionTitle}>About Me</h2>
              <p style={styles.aboutText}>
                I am a Computer Science student and the Github Master of our team. 
                I am passionate about game design and development and working on my own projects. 
                My goal is to become a software engineer and contribute and work on projects that can help people.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    color: "#333",
    textAlign: "center",
    paddingBottom: "3px",
    borderBottom: "4px solid #9A2250",
    display: "block",
    margin: "20px auto",
    fontSize: "45px",
    fontWeight: "600",
    width: "fit-content",
  },
  content: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "40px",
    marginTop: "20px",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    },
  },
  imageContainer: {
    flex: "0 0 250px",
    display: "flex",
    justifyContent: "center",
    "@media (max-width: 768px)": {
      width: "100%",
      maxWidth: "300px",
    },
  },
  profileImage: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "contain",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  details: {
    flex: 1,
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "20px",
    "@media (max-width: 768px)": {
      justifyContent: "center",
      textAlign: "center",
      flexDirection: "column",
      gap: "5px",
    },
  },
  icon: {
    width: "28px",
    marginRight: "15px",
    color: "#9A2250",
    fontSize: "24px",
  },
  aboutSection: {
    margin: "30px 0",
    "@media (max-width: 768px)": {
      textAlign: "center",
    },
  },
  sectionTitle: {
    color: "#333",
    fontSize: "28px",
    marginBottom: "20px",
    paddingBottom: "8px",
    borderBottom: "2px solid #f0f0f0",
  },
  aboutText: {
    lineHeight: "1.8",
    color: "#555",
    fontSize: "18px",
    marginTop: "10px",
    "@media (max-width: 480px)": {
      fontSize: "16px",
    },
  },
  skillsSection: {
    margin: "30px 0",
    "@media (max-width: 768px)": {
      textAlign: "center",
    },
  },
  skillsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    "@media (max-width: 480px)": {
      gap: "8px",
    },
  },
  skillTag: {
    backgroundColor: "#f0f0f0",
    color: "#333",
    padding: "5px 15px",
    borderRadius: "20px",
    fontSize: "14px",
  },
};

export default SonamPage;
