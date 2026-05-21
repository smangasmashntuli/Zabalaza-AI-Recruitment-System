import React, { useState } from "react";
import './Login.css';
import { loginUser } from './api/auth';

const Login = ({onSwitchToSignUp}) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleChange = (e) => {
        const {name, value } = e.target;
        setFormData({...formData, [name]: value});
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        // Clear API error when user types
        if (apiError) {
            setApiError('');
        }
    };

    const validatForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validatForm();

        if(Object.keys(newErrors).length === 0){
            setIsSubmitting(true);
            setApiError('');

            try {
                const response = await loginUser(formData.email, formData.password);
                console.log('Login successful:', response);

                // Store tokens in localStorage
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);

                // Reload the page to trigger auth check in App.js
                window.location.reload();
            } catch (error) {
                console.error('Login error:', error);
                setApiError(error.message || 'Login failed. Please check your credentials.');
            } finally {
                setIsSubmitting(false);
            }
        } else{
            setErrors(newErrors);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Welcome Back</h2>
                    <p>Please login to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {apiError && <div className="api-error-message">{apiError}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Enter your email"
                            autoComplete="email"
                            />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <button type="button" className="forgot-password" style={{ background: 'none', border: 'none', padding: 0 }}>
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isSubmitting}
                    >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="login-footer">
          <p>Don't have an account? <button type="button" className="forgot-password" style={{ background: 'none', border: 'none', padding: 0 }} onClick={onSwitchToSignUp}>Sign up</button></p>
        </div>
      </div>
    </div>
  );
};

export default Login;