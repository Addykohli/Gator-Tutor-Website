import React from 'react';

const Header = () => {
  const headerStyle = {
    backgroundColor: '#231161',
    color: 'white',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    width: '100%',
  };

  const navBarStyle = {
    backgroundColor: '#FFDC70',
    height: '50px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
  };

  const menuButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#231161',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  };

  const handleMenuClick = () => {
    console.log('Menu button clicked');
  };

  return (
    <>
      <header style={headerStyle}>
        <h1 style={{ margin: '10px 0' }}>Software Engineering class SFSU</h1>
        <h2 style={{ margin: '5px 0' }}>Fall 2025</h2>
        <h3 style={{ margin: '5px 0' }}>Section 01</h3>
        <h3 style={{ margin: '5px 0' }}>Team 8</h3>
      </header>
      <div style={navBarStyle}>
        <button style={menuButtonStyle} onClick={handleMenuClick}>
          Menu
        </button>
      </div>
    </>
  );
};

export default Header;
