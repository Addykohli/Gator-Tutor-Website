import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

function PeoplePage() {
  const navigate = useNavigate();

  const images = {
    Kojiro: require('../assets/Kojiro_profile_image.png'),
    Atharva: require('../assets/Atharva_profile_image.png'),
    Addy: require('../assets/Addy_profile_image.png'),
    Krinjal: require('../assets/Krinjal_profile_image.png'),
    Sonam: require('../assets/Sonam_profile_image.png'),
    Aketzali: require('../assets/Aketzali_profile_image.png')
  };

  const teamMembers = [
    {
      id: 1,
      firstName: 'Kojiro',
      lastName: 'Miura',
      role: 'Team Lead',
      imageKey: 'Kojiro'
    },
    {
      id: 2,
      firstName: 'Atharva',
      lastName: 'Walawalkar',
      role: 'Backend Lead',
      imageKey: 'Atharva'
    },
    {
      id: 3,
      firstName: 'Addy',
      lastName: 'Kohli',
      role: 'Frontend Lead',
      imageKey: 'Addy'
    },
    {
      id: 4,
      firstName: 'Krinjal',
      lastName: 'Basnet',
      role: 'Frontwnd Developer',
      imageKey: 'Krinjal'
    },
    {
      id: 5,
      firstName: 'Sonam',
      lastName: 'Tobgyal',
      role: 'Github Master',
      imageKey: 'Sonam'
    },
    {
      id: 6,
      firstName: 'Aketzali',
      lastName: 'Zeledon',
      role: 'Backend Developer',
      imageKey: 'Aketzali'
    }
  ];

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>People</h1>
        <div style={styles.teamContainer}>
          {teamMembers.map((member) => (
            <div 
              key={member.id} 
              style={styles.teamMember}
              onClick={() => {
                const name = member.firstName.toLowerCase();
                const routes = {
                  'addy': '/addy',
                  'kojiro': '/kojiro',
                  'atharva': '/atharva',
                  'krinjal': '/krinjal',
                  'sonam': '/sonam',
                  'aketzali': '/aketzali'
                };
                const route = routes[name] || `/${name}`;
                navigate(route);
              }}
            >
              <div style={styles.imageContainer}>
                <img 
                  src={images[member.imageKey]} 
                  alt={`${member.firstName} ${member.lastName}`}
                  style={styles.profileImage}

                />
              </div>
              <h3 style={styles.memberName}>{member.firstName} {member.lastName}</h3>
              <p style={styles.memberRole}>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 300px)',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  teamContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    width: '100%',
    padding: '0 10px',
    boxSizing: 'border-box',
  },
  teamMember: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
    }
  },
  imageContainer: {
    width: '150px',
    height: '150px',

    overflow: 'hidden',
    marginBottom: '15px',
    border: '1px solid #f0f0f0'
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  memberName: {
    margin: '10px 0 5px',
    color: '#330033',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center'
  },
  memberRole: {
    margin: '0',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center'
  },
  buttonHover: {
    backgroundColor: '#e9e9e9',
  },
  heading: {
    color: '#464666',
    textAlign: 'center',
    paddingBottom: '3px',
    borderBottom: '4px solid #9A2250',
    display: 'inline-block',
    margin: '20px auto',
    width: '100%',
    maxWidth: '300px',
    fontWeight: 'bold',
    fontSize: '45px',
  },
};

export default PeoplePage;
