import React from 'react';

function Navbar({ currentPage, onNavigate }) {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold">MySite</div>
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
              className={`hover:text-gray-900 ${currentPage === 'about' ? 'text-blue-600 font-semibold' : ''}`}
              onClick={() => onNavigate('about')}
            >
              About
            </button>
          </nav>
        </div>
        <div className="flex items-center">
          <img
            className="rounded-full w-8 h-8 border border-gray-300"
            src="https://media-exp1.licdn.com/dms/image/C5603AQGEQ6ydraNeww/profile-displayphoto-shrink_200_200/0/1623517758261?e=1629331200&v=beta&t=mhUiw4p21E9okkvInvM0ry8lmLsT6s5ppWMKo6kFs2M"
            alt="avatar"
          />
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
