// CompanyRegistration.js - Updated with retro styling
import { useState } from 'react';
import './CompanyRegistration.css';
import { registerUser, loginUser, setCurrentUser, getCurrentUser, getMyId } from './api/auth';
import { getCandidateProfile } from './api/candidates';
import { getJobs } from './api/jobs';
import logo from './image-logo/zabalaza_logo_full_lockup.png'

export default function CompanyRegistration({ onRegistrationComplete, onBack }) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [registering, setRegistering] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isLogin, setIsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    showMessage('', 'info');

    if (formData.password !== formData.confirmPassword) {
      showMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showMessage('Password must be at least 6 characters');
      return;
    }

    try {
      setRegistering(true);
      showMessage('Creating your company account...', 'info');

      const username = formData.companyEmail.split('@')[0] + '_recruiter';
      const userData = {
        email: formData.companyEmail,
        username: username,
        full_name: formData.companyName,
        password: formData.password,
        role: 'recruiter',
      };

      console.log('Registering recruiter:', userData.email, 'role:', userData.role);
      const registeredUser = await registerUser(userData);
      console.log('Registration successful:', registeredUser);

      showMessage('Account created! Logging you in...', 'info');

      const loginResult = await loginUser(formData.companyEmail, formData.password);
      console.log('Login result:', loginResult);

      if (loginResult?.access_token) {
        let userId = registeredUser?.id;
        try {
          const idInfo = await getMyId();
          if (idInfo?.id) {
            userId = idInfo.id;
            console.log('Fetched user ID from backend:', userId);
          }
        } catch (err) {
          console.warn('Could not fetch user ID from backend:', err);
        }

        const userInfo = {
          id: userId,
          email: formData.companyEmail,
          username: username,
          full_name: formData.companyName,
          role: 'recruiter',
          company_name: formData.companyName,
        };
        setCurrentUser(userInfo);

        localStorage.setItem('recruiter_user_id', userInfo.id);
        localStorage.setItem('user_data', JSON.stringify(userInfo));

        showMessage('Company account created! Redirecting to dashboard...', 'success');

        setTimeout(() => {
          onRegistrationComplete?.();
        }, 800);
      } else {
        showMessage('Account created but auto-login failed. Please go to Login tab and sign in.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showMessage(err.message || 'Failed to create company account');
      setRegistering(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    showMessage('', 'info');

    try {
      setLoggingIn(true);
      showMessage('Logging in...', 'info');

      const result = await loginUser(loginEmail, loginPassword);

      if (result?.access_token) {
        let userId = null;
        try {
          const idInfo = await getMyId();
          userId = idInfo?.id;
          console.log('Fetched user ID on login:', userId);
        } catch (err) {
          console.warn('Could not fetch user ID on login:', err);
        }

        const userInfo = {
          id: userId,
          email: loginEmail,
          role: 'recruiter',
          company_name: loginEmail.split('@')[0],
        };
        setCurrentUser(userInfo);

        if (userId) {
          localStorage.setItem('recruiter_user_id', userId);
          localStorage.setItem('user_data', JSON.stringify(userInfo));
        }

        showMessage('Logged in successfully! Redirecting...', 'success');

        setTimeout(() => {
          onRegistrationComplete?.();
        }, 800);
      } else {
        showMessage('Login failed - no token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessage(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const getMessageClassName = () => {
    return `registration-message ${messageType}`;
  };

  return (
    <div className="company-registration-page">
      <div className="registration-card">
        <div className="registration-header">
          <span className="registration-icon">
            <img
              src={logo}
              alt="Zabalaza Logo"
              className="registration-logo"
            />
          </span>
          <h1 className="registration-title">
            {isLogin ? 'Company Login' : 'Register Your Company'}
          </h1>
          <p className="registration-subtitle">
            {isLogin
              ? 'Log in to manage your job postings and applicants'
              : 'Create a recruiter account to post jobs and manage hiring'}
          </p>
        </div>

        {message && (
          <div className={getMessageClassName()}>
            {message}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="registration-form">
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="company@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="registration-submit-button"
            >
              {loggingIn ? 'Logging in...' : 'Login to Company Account'}
            </button>

            <div className="switch-link">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); showMessage('', 'info'); }}
              >
                Register here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="registration-form">
            <div className="form-group">
              <label className="form-label">
                Company Name <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g., Acme Corp"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Company Email / Domain <span className="required">*</span>
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="company@example.com"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
              />
              <p className="form-hint">This will be your login email</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={registering}
              className="registration-submit-button recruiter"
            >
              {registering ? 'Creating Account...' : 'Create Company Account'}
            </button>

            <div className="switch-link">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); showMessage('', 'info'); }}
              >
                Login here
              </button>
            </div>
          </form>
        )}

        <div className="back-to-dashboard">
          <button
            type="button"
            className="retro-ghost-button"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}