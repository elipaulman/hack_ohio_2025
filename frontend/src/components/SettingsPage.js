import React, { useState, useEffect } from 'react';
import './SettingsPage.css';

const SettingsPage = ({ onNavigate }) => {
  const [adaCompliance, setAdaCompliance] = useState(false);

  // Load setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adaCompliance');
    if (saved !== null) {
      setAdaCompliance(saved === 'true');
    }
  }, []);

  // Save setting to localStorage when changed
  const handleToggle = () => {
    const newValue = !adaCompliance;
    setAdaCompliance(newValue);
    localStorage.setItem('adaCompliance', newValue.toString());
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p className="settings-subtitle">
            Configure your navigation preferences
          </p>
        </div>

        <div className="settings-section">
          <div className="setting-item">
            <div className="setting-info">
              <h2 className="setting-title">ADA Compliance</h2>
              <p className="setting-description">
                When enabled, navigation will use elevators instead of stairs for floor changes.
                This ensures accessible routes for individuals with mobility needs.
              </p>
            </div>
            <button
              className={`toggle-button ${adaCompliance ? 'toggle-button--on' : 'toggle-button--off'}`}
              onClick={handleToggle}
              role="switch"
              aria-checked={adaCompliance}
              aria-label="Toggle ADA Compliance"
            >
              <span className="toggle-slider">
                <span className="toggle-label">
                  {adaCompliance ? 'ON' : 'OFF'}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="settings-footer">
          <button 
            className="btn btn-back"
            onClick={() => onNavigate && onNavigate('home')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

