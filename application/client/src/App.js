import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './compnents/HomePage';
import AddyPage from './compnents/AddyPage';
import KojiroPage from './compnents/KojiroPage';
import AtharvaPage from './compnents/AtharvaPage';
import KrinjalPage from './compnents/KrinjalPage';
import SonamPage from './compnents/SonamPage';
import AketzaliPage from './compnents/AketzaliPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/addy" element={<AddyPage />} />
          <Route path="/kojiro" element={<KojiroPage />} />
          <Route path="/atharva" element={<AtharvaPage />} />
          <Route path="/krinjal" element={<KrinjalPage />} />
          <Route path="/sonam" element={<SonamPage />} />
          <Route path="/aketzali" element={<AketzaliPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
