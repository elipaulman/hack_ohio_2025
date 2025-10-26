import React from 'react';

function Navbar({ currentPage, onNavigate }) {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold">Buckeye ACE</div>
          <nav className="hidden md:flex space-x-4 text-gray-600">
            <button
              className={`hover:text-gray-900 ${currentPage === 'home' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
            <button
              className={`hover:text-gray-900 ${currentPage === 'indoor-nav' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('indoor-nav')}
            >
              Indoor Nav
            </button>
            <button
              className={`hover:text-gray-900 ${currentPage === 'outdoor-map' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('outdoor-map')}
            >
              Outdoor Map
            </button>
            <button
              style={currentPage === 'garages' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'garages'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('garages')}
            >
              Garages
            </button>
            <button
              style={currentPage === 'garages' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === 'garages'
                  ? 'font-semibold'
                  : 'text-white hover:bg-opacity-80'
              }`}
              onClick={() => onNavigate('garages')}
            >
              Garages
            </button>
            <button
              className={`hover:text-gray-900 ${currentPage === 'schedule' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('schedule')}
            >
              Scott Lab Schedule
            </button>
            <button
              className={`hover:text-gray-900 ${currentPage === 'about' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('about')}
            >
              About
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex justify-around border-t border-gray-200 py-2 text-sm">
        <button
          className={`px-4 py-2 ${currentPage === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          className={`px-4 py-2 ${currentPage === 'indoor-nav' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
          onClick={() => onNavigate('indoor-nav')}
        >
          Indoor Nav
        </button>
        <button
          className={`px-4 py-2 ${currentPage === 'outdoor-map' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
          onClick={() => onNavigate('outdoor-map')}
        >
          Outdoor Map
        </button>
        <button
          className={`px-4 py-2 ${currentPage === 'schedule' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
          onClick={() => onNavigate('schedule')}
        >
          Schedule
        </button>
        <button
          style={currentPage === 'garages' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'garages'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('garages')}
        >
          Garages
        </button>
        <button
          style={currentPage === 'garages' ? { backgroundColor: 'white', color: '#BB0000' } : {}}
          className={`px-3 py-2 rounded transition-colors ${
            currentPage === 'garages'
              ? 'font-semibold'
              : 'text-white hover:bg-opacity-80'
          }`}
          onClick={() => onNavigate('garages')}
        >
          Garages
        </button>
        <button
          className={`px-4 py-2 ${currentPage === 'about' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
          onClick={() => onNavigate('about')}
        >
          About
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
