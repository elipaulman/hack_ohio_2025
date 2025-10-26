import React, { useCallback, useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'indoor-nav', label: 'Indoor Nav' },
  { id: 'outdoor-map', label: 'Outdoor Map' },
  { id: 'garages', label: 'Garages' },
  { id: 'schedule', label: 'Room Schedules' },
  { id: 'settings', label: 'Settings' },
  { id: 'about', label: 'About' },
];

function Navbar({ currentPage, onNavigate }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const innerRef = useRef(null);
  const navRef = useRef(null);
  const titleRef = useRef(null);

  const handleNavigate = (page) => () => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
    setIsMobileOpen(false);
  };

  const evaluateLayout = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !innerRef.current ||
      !navRef.current ||
      !titleRef.current
    ) {
      return;
    }

    const navElement = navRef.current;
    const wasCollapsed = navElement.classList.contains('navbar__links--collapsed');

    if (wasCollapsed) {
      navElement.classList.remove('navbar__links--collapsed');
    }
    navElement.classList.add('navbar__links--measuring');

    const navWidth = navElement.scrollWidth;
    const brandWidth = titleRef.current.getBoundingClientRect().width;
    const innerWidth = innerRef.current.clientWidth;
    const spacingAllowance = 72; // padding + gap between brand and nav
    const needCollapse = brandWidth + navWidth + spacingAllowance > innerWidth;

    navElement.classList.remove('navbar__links--measuring');
    if (wasCollapsed) {
      navElement.classList.add('navbar__links--collapsed');
    }

    setShouldCollapse(needCollapse);
  }, []);

  const renderLink = (link, variant) => {
    const isActive = currentPage === link.id;
    const baseClasses =
      variant === 'desktop'
        ? 'nav-link nav-link--desktop'
        : 'nav-link nav-link--mobile';
    const buttonClasses = isActive
      ? `${baseClasses} nav-link--active`
      : baseClasses;

    return (
      <button
        key={link.id}
        type="button"
        onClick={handleNavigate(link.id)}
        className={buttonClasses}
        aria-current={isActive ? 'page' : undefined}
      >
        {link.label}
      </button>
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      evaluateLayout();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [evaluateLayout]);

  useEffect(() => {
    evaluateLayout();
  }, [evaluateLayout]);

  useEffect(() => {
    if (!shouldCollapse) {
      setIsMobileOpen(false);
    }
  }, [shouldCollapse]);

  return (
    <header className="shadow navbar">
      <div
        ref={innerRef}
        className="container mx-auto px-4 py-4 flex items-center justify-between navbar__inner"
      >
        <div className="flex items-center space-x-6 flex-shrink">
          <div ref={titleRef} className="text-2xl font-bold navbar__title">
            Buckeye ACE
          </div>
          <nav
            ref={navRef}
            className={`navbar__links ${shouldCollapse ? 'navbar__links--collapsed' : ''}`}
          >
            {NAV_LINKS.map((link) => renderLink(link, 'desktop'))}
          </nav>
        </div>
        {shouldCollapse && (
          <button
            type="button"
            className={`navbar__toggle ${isMobileOpen ? 'navbar__toggle--open' : ''}`}
            onClick={() => setIsMobileOpen((open) => !open)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? (
              <svg
                className="navbar__toggle-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="navbar__toggle-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {shouldCollapse && (
        <nav
          id="mobile-nav"
          className={`navbar__mobile ${isMobileOpen ? 'navbar__mobile--open' : ''}`}
        >
          {NAV_LINKS.map((link) => renderLink(link, 'mobile'))}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
