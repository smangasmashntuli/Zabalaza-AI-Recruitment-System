import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="App" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
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
    </div>
  );
}

export default App;
