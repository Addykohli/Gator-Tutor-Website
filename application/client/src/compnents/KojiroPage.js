import React from 'react';
import Header from './Header';

function KojiroPage() {
  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.heading}>Kojiro Miura</h1>
      </div>
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
};

export default KojiroPage;
