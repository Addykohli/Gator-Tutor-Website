import React from 'react';

const Header = () => {
  const headerContent = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    height: '100%',
  };

  const classTitle = {
    margin: 0,
    fontSize: '45px',
    fontWeight: '500',
  };

  const divider = {
    height: '40px',
    width: '2px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    margin: '0 20px',
  };

  const infoSection = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const infoItem = {
    margin: 0,
    fontSize: '20px',
    fontWeight: '500',
  };
  const headerStyle = {
    backgroundColor: '#231161',
    color: 'white',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    width: '100%',
  };

  const navBarStyle = {
    backgroundColor: '#FFDC70',
    height: '60px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
  };

  const menuButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#FFDC70',
    color: 'black',
    border: '2px solid black',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '20px',
    position: 'absolute',
    right: '20px'
  };

  const handleMenuClick = () => {

    console.log('Menu button clicked');
  };

  return (
    <>
      <header style={headerStyle}>
        <div style={headerContent}>
          <h1 style={classTitle}>SOFTWARE ENGINEERING CLASS SFSU</h1>
          <div style={divider}></div>
          <div style={infoSection}>
            <h2 style={infoItem}>Fall 2025</h2>
            <h3 style={infoItem}>Section 01</h3>
            <h3 style={infoItem}>Team 8</h3>
          </div>
        </div>
      </header>
      <div style={navBarStyle}>
        <button style={menuButtonStyle} onClick={handleMenuClick}>
          <i className="fas fa-bars" style={{ marginRight: '8px' }}></i>
          Menu
        </button>
      </div>
    </>
  );
};

export default Header;
