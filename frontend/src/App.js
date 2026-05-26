import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import { AUTH_CHANGED_EVENT, isAuthenticated as hasValidSession, logoutUser } from './api/auth';
import ChatBot from './ChatBot';

const THEME_STORAGE_KEY = 'app_theme';

const getInitialTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);

  // Check if user is authenticated on mount
  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(hasValidSession());
      setIsLoading(false);
    };

    syncAuthState();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the in-memory theme.
    }
  }, [theme]);

  // Handle logout
  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="App app-loading">
        <div className="app-loading-card">Loading...</div>
      </div>
    );
  }

  // Show Dashboard if authenticated, otherwise show Login/SignUp
  return (
    <div className="App">
      {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} theme={theme} onThemeChange={setTheme} />
      ) : showLogin ? (
        <Login onSwitchToSignUp={() => setShowLogin(false)} />
      ) : (
        <SignUp onSwitchToLogin={() => setShowLogin(true)} />
      )}
      {isAuthenticated && <ChatBot />}
    </div>
  );
}

export default App;
