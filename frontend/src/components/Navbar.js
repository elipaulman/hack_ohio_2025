import React from 'react';

function Navbar({ currentPage, onNavigate }) {
  return (
    <header style={{ background: 'linear-gradient(to right, #BB0000, #CC0000)' }} className="shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/way.png"
            alt="ACE Logo"
            className="h-10 w-10"
          />
          <div className="text-2xl font-bold text-white">ACE</div>
          <nav className="hidden md:flex space-x-6 ml-8">
            <button
              style={currentPage === 'home' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'home'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
            <button
              style={currentPage === 'indoor-nav' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'indoor-nav'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('indoor-nav')}
            >
              Indoor Nav
            </button>
            <button
              style={currentPage === 'outdoor-map' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'outdoor-map'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('outdoor-map')}
            >
              Outdoor Map
            </button>
            <button
              style={currentPage === 'about' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'about'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('about')}
            >
              About
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav style={{ backgroundColor: '#BB0000', borderTopColor: '#990000' }} className="md:hidden flex justify-around border-t py-2 text-sm">
        <button
          style={currentPage === 'home' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'home'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          style={currentPage === 'indoor-nav' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'indoor-nav'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('indoor-nav')}
        >
          Indoor
        </button>
        <button
          style={currentPage === 'outdoor-map' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'outdoor-map'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('outdoor-map')}
        >
          Outdoor
        </button>
        <button
          style={currentPage === 'about' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'about'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('about')}
        >
          About
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
