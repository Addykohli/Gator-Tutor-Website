import React from 'react';
import Header from './Header';

function AketzaliPage() {
  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>Aketzali Zeledon</h1>
        <div style={styles.content}>
          <div style={styles.imageContainer}>
            <img
              src={require("../assets/Aketzali_profile_image.png")}
              alt="Aketzali Zeledon"
              style={styles.profileImage}
            />
          </div>

          <div style={styles.details}>
            <div style={styles.detailItem}>
              <i className="fas fa-phone" style={styles.icon}></i>
              <span>(123) 456-7890</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-envelope" style={styles.icon}></i>
              <span>azeledon@mail.sfsu.edu</span>
            </div>

            <div style={styles.aboutSection}>
              <h2 style={styles.sectionTitle}>About Me</h2>
              <p style={styles.aboutText}>
                I have experience in Java, C, C++, HTML, CSS, JavaScript, and some Python. 
                I am hope to expand my problem-solving skills across different areas of 
                computer science and gain hands-on experience through team projects. 
                I aim to build my confidence as a developer while contributing to meaningful 
                projects, with the long-term goal of using my skills to make a positive impact 
                on the communities I grew up in.
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
      gap: "30px",
    },
  },
  imageContainer: {
    flex: "0 0 250px",
    display: "flex",
    justifyContent: "center",
    height: "fit-content",
    "@media (max-width: 768px)": {
      width: "100%",
      maxWidth: "300px",
    }
  },
  profileImage: {
    width: "100%",
    height: "auto",
    maxHeight: "400px",
    objectFit: "contain",
    aspectRatio: "auto",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  details: {
    flex: 1,
    minWidth: "250px",
    "@media (max-width: 768px)": {
      width: "100%",
      textAlign: "center",
    }
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "20px",
    "@media (max-width: 768px)": {
      justifyContent: "center",
      flexWrap: "wrap",
      textAlign: "center",
    }
  },
  icon: {
    width: "28px",
    marginRight: "15px",
    color: "#9A2250",
    fontSize: "24px",
  },
  aboutSection: {
    margin: "30px 0",
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
    textAlign: "left",
    "@media (max-width: 768px)": {
      textAlign: "center",
    }
  },
  skillsSection: {
    margin: "30px 0",
  },
  skillsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  skillTag: {
    backgroundColor: "#f0f0f0",
    color: "#333",
    padding: "5px 15px",
    borderRadius: "20px",
    fontSize: "14px",
  },
};

export default AketzaliPage;
