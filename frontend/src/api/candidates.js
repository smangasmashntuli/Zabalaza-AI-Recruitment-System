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
  const res = await get(`${API_ENDPOINTS.CANDIDATES}/me/matches?top_k=${topK}`);
  // Backwards compatible: if API returns wrapper { items, insights } return items by default
  if (res && typeof res === 'object' && Array.isArray(res.items)) {
    return res.items;
  }
  return res;
};

/**
 * Get job matches and conversational insights (newer API wrapper)
 */
export const getJobMatchesWithInsights = async (topK = 10) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/matches?top_k=${topK}`);
};

/**
 * Get AI-powered career path recommendations
 */
export const getCareerPath = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/career-path`);
};

/**
 * Get interview tips for a specific job
 */
export const getInterviewTips = async (jobId) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/interview-tips?job_id=${encodeURIComponent(jobId)}`, {});
};

/**
 * Optimize a CV section using Gemini
 */
export const optimizeCvSection = async (section) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/cv-optimization?section=${encodeURIComponent(section)}`, {});
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


/**
 * Upload a certificate file and attach it to the candidate profile
 */
export const uploadCertificate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_ENDPOINTS.UPLOADS}/certificate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload certificate');
  }

  return response.json();
};


