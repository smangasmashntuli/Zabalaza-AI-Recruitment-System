import { get, post, put } from './client';
import { API_ENDPOINTS } from './config';

/**
 * Get current candidate profile
 */
export const getCandidateProfile = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me`);
};

/**
 * Update current candidate profile
 * @param {Object} profileData - Profile data including skills, experience, education, etc.
 */
export const updateCandidateProfile = async (profileData) => {
  return put(`${API_ENDPOINTS.CANDIDATES}/me`, profileData);
};

/**
 * Get job matches for current candidate
 */
export const getJobMatches = async (topK = 10) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/matches?top_k=${topK}`);
};

/**
 * Apply for a job
 */
export const applyForJob = async (applicationData) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/applications`, applicationData);
};

/**
 * Get all applications for current candidate
 */
export const getMyApplications = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/applications`);
};

/**
 * Upload resume
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_ENDPOINTS.UPLOADS}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload resume');
  }

  return response.json();
};

