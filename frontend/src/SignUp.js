// signup.js
import React, { useState } from 'react';
import './SignUp.css';
import { registerUser } from './api/auth';
import logo from './image-logo/zabalaza_logo_full_lockup.png'

const SignUp = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        if (apiError) {
            setApiError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.length < 3) {
            newErrors.fullName = 'Name must be at least 3 characters';
        }

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            setApiError('');

            try {
                const userData = {
                    email: formData.email,
                    username: formData.username,
                    full_name: formData.fullName,
                    password: formData.password
                };

                const response = await registerUser(userData);
                console.log('Sign up successful:', response);
                alert('Account created successfully! Please login.');

                setFormData({
                    fullName: '',
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });

                if (onSwitchToLogin) {
                    onSwitchToLogin();
                }
            } catch (error) {
                console.error('Sign up error:', error);
                setApiError(error.message || 'Registration failed. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setErrors(newErrors);
        }
    };

    return (
        <div className="signup-wrapper">
            {/* LOGO + SLOGAN (outside, on top of the signup container) */}
            <div className="brand-top">
                {/* Replace src with your actual logo path */}
                <img
                    src={logo}
                    alt="Zabalaza Logo"
                    className="brand-logo"
                />
                <div className="brand-text">
                    <span className="brand-slogan">Where talent meets opportunity, instantly.</span>
                </div>
            </div>

            {/* Signup container */}
            <div className="signup-card">
                <h2 className="welcome">Create Account</h2>

                <form onSubmit={handleSubmit} className="signup-form">
                    {apiError && <div className="api-error-message">{apiError}</div>}

                    <div className="input-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={errors.fullName ? 'error' : ''}
                            placeholder="Enter your full name"
                            autoComplete="name"
                        />
                        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={errors.username ? 'error' : ''}
                            placeholder="Choose a username"
                            autoComplete="username"
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
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

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    <div className="terms-checkbox">
                        <label>
                            <input type="checkbox" required />
                            <span>I agree to the <span className="terms-link">Terms & Conditions</span></span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="signup-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>Already have an account?
                        <button
                            type="button"
                            className="terms-link"
                            onClick={onSwitchToLogin}
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;