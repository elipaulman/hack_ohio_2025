import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import IndoorNavPage from './components/IndoorNav/IndoorNavPage';
import OutdoorMapPage from './components/OutdoorMapPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === 'home' && <HomePage />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'indoor-nav' && <IndoorNavPage onNavigate={handleNavigate} />}
      {currentPage === 'outdoor-map' && <OutdoorMapPage />}
    </div>
  );
}

export default App;
