import { getAccessToken } from './auth';

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 */
export const apiRequest = async (url, options = {}) => {
  const token = getAccessToken();

  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }

  return data;
};

/**
 * GET request
 */
export const get = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const post = (url, body, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * PUT request
 */
export const put = (url, body, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request
 */
export const del = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'DELETE' });
};

