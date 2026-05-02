import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import { AUTH_CHANGED_EVENT, isAuthenticated as hasValidSession, logoutUser } from './api/auth';
import ChatBot from './ChatBot';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        <Dashboard onLogout={handleLogout} />
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
