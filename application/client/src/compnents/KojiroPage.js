import React from "react";
import Header from "./Header";

function KojiroPage() {
  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>Kojiro Miura</h1>

        <div style={styles.content}>
          <div style={styles.imageContainer}>
            <img
              src={require("../assets/Kojiro_profile_image.png")}
              alt="Kojiro Miura"
              style={styles.profileImage}
            />
          </div>

          <div style={styles.details}>
            <div style={styles.detailItem}>
              <i className="fas fa-briefcase" style={styles.icon}></i>
              <span>Team Lead</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-phone" style={styles.icon}></i>
              <span>(123) 456-7890</span>
            </div>

            <div style={styles.detailItem}>
              <i className="fas fa-envelope" style={styles.icon}></i>
              <span>kmiura@sfsu.edu</span>
            </div>

            <div style={styles.aboutSection}>
              <h2 style={styles.sectionTitle}>About Me</h2>
              <p style={styles.aboutText}>
                I am an advid solo Game Designer/Developer that also wants to get into Software develepment to make both my own Animation software and game engines.
                I'm the team lead because I already have experience managing groups to work, just not particularly for programming So this felt like it would be a good experience. 
                My goal here is to simply learn what it is I need to do to manage a project without having complete control over it like I would normally do.
                Everyone on my team will have their own goals and ways of doing things and I need to learn how best to manage it. 
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
    gap: "40px",
    marginTop: "20px",
    "@media (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  imageContainer: {
    flex: "0 0 250px",
  },
  profileImage: {
    width: "100%",
    height: "auto",
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

export default KojiroPage;