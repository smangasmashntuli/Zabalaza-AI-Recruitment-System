import { API_BASE_URL, API_ENDPOINTS } from './config';

/**
 * Save user data to localStorage
 * @param {Object} userData - User data to store
 */
export const setCurrentUser = (userData) => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

/**
 * Login user
 * @param {string} email - User email or username
 * @param {string} password - User password
 * @returns {Promise<Object>} - Token response
 */
export const loginUser = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // Try to parse the response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Server error: Unable to parse response');
    }

    if (!response.ok) {
      const errorMessage = data.detail || data.message || 'Login failed';
      throw new Error(errorMessage);
    }

    // Store tokens in localStorage
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_type', data.token_type);

      // Store user data if provided
      if (data.user) {
        setCurrentUser(data.user);
      }
    }

    return data;
  } catch (error) {
    // Check if it's a network error
    if (error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend is running and reachable.`);
    }
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Created user
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Try to parse the response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Server error: Unable to parse response');
    }

    if (!response.ok) {
      // Extract error message from response
      const errorMessage = data.detail || data.message || 'Registration failed';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Check if it's a network error
    if (error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend is running and reachable.`);
    }
    throw error;
  }
};

/**
 * Logout user
 */
export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user_data');
};

/**
 * Get stored access token
 * @returns {string|null} - Access token
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} - Is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Get current user from token or localStorage
 * @returns {Object|null} - Current user data
 */
export const getCurrentUser = () => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    // Try to get user data from localStorage first
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData);
    }

    // Decode JWT token to get user info
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Return user data from token
    return {
      id: payload.sub || payload.user_id,
      email: payload.email,
      username: payload.username || payload.email?.split('@')[0],
      full_name: payload.full_name || payload.name || payload.username,
      role: payload.role || 'candidate'
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
